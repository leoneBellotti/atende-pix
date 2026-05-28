import { readFile } from 'node:fs/promises';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async summary(userId: string) {
    await this.ensureAdmin(userId);

    const monthStart = this.monthStart();
    const [
      totalTenants,
      activeSubscriptions,
      trialSubscriptions,
      expiredTrials,
      paidCheckouts,
      quotesThisMonth,
      pixPaymentsThisMonth
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count({ where: { status: 'TRIAL' } }),
      this.prisma.subscription.count({ where: { status: 'TRIAL_EXPIRED' } }),
      this.prisma.subscriptionCheckout.aggregate({
        where: {
          status: 'PAID',
          paidAt: {
            gte: monthStart
          }
        },
        _sum: {
          amount: true
        },
        _count: true
      }),
      this.prisma.quote.count({
        where: {
          createdAt: {
            gte: monthStart
          }
        }
      }),
      this.prisma.payment.count({
        where: {
          provider: 'MERCADO_PAGO',
          createdAt: {
            gte: monthStart
          }
        }
      })
    ]);

    return {
      totalTenants,
      activeSubscriptions,
      trialSubscriptions,
      expiredTrials,
      subscriptionRevenueThisMonth: this.decimalToNumber(paidCheckouts._sum.amount),
      paidCheckoutsThisMonth: paidCheckouts._count,
      quotesThisMonth,
      pixPaymentsThisMonth
    };
  }

  async me(userId: string) {
    return {
      isAdmin: await this.isAdmin(userId)
    };
  }

  async errorLogs(userId: string, limitInput?: string) {
    await this.ensureAdmin(userId);

    const limit = this.normalizeLimit(limitInput);
    const logPath = this.configService.get<string>('ERROR_LOG_PATH', '.logs/api-errors.log');
    const content = await this.readLogFile(logPath);
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(-limit)
      .reverse();

    return lines.map((line) => this.parseErrorLogLine(line));
  }

  async tenants(userId: string) {
    await this.ensureAdmin(userId);

    const tenants = await this.prisma.tenant.findMany({
      include: {
        subscription: {
          include: {
            plan: true
          }
        },
        _count: {
          select: {
            memberships: true,
            customers: true,
            quotes: true,
            orders: true,
            payments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      phone: tenant.phone,
      createdAt: tenant.createdAt,
      subscriptionStatus: tenant.subscription?.status ?? 'NONE',
      planName: tenant.subscription?.plan.name ?? 'Sem plano',
      renewsAt: tenant.subscription?.renewsAt ?? null,
      currentPeriodEnd: tenant.subscription?.currentPeriodEnd ?? null,
      pastDueAt: tenant.subscription?.pastDueAt ?? null,
      suspendedAt: tenant.subscription?.suspendedAt ?? null,
      usage: {
        users: tenant._count.memberships,
        customers: tenant._count.customers,
        quotes: tenant._count.quotes,
        orders: tenant._count.orders,
        payments: tenant._count.payments
      }
    }));
  }

  async markTenantPastDue(userId: string, tenantId: string) {
    await this.ensureAdmin(userId);

    const subscription = await this.findSubscription(tenantId);
    const now = new Date();

    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        status: 'PAST_DUE',
        pastDueAt: now,
        suspendedAt: null,
        currentPeriodEnd: subscription.currentPeriodEnd ?? now,
        renewsAt: subscription.renewsAt ?? now
      },
      include: {
        plan: true
      }
    });
  }

  async suspendTenant(userId: string, tenantId: string) {
    await this.ensureAdmin(userId);

    await this.findSubscription(tenantId);
    const now = new Date();

    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        status: 'SUSPENDED',
        pastDueAt: now,
        suspendedAt: now
      },
      include: {
        plan: true
      }
    });
  }

  async regularizeTenant(userId: string, tenantId: string) {
    await this.ensureAdmin(userId);

    await this.findSubscription(tenantId);
    const now = new Date();
    const renewsAt = this.addMonths(now, 1);

    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: renewsAt,
        renewsAt,
        pastDueAt: null,
        suspendedAt: null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        cancellationReason: null
      },
      include: {
        plan: true
      }
    });
  }

  private async ensureAdmin(userId: string) {
    const isAdmin = await this.isAdmin(userId);

    if (!this.getAdminEmails().length) {
      throw new ForbiddenException('Acesso administrativo nao configurado.');
    }

    if (!isAdmin) {
      throw new ForbiddenException('Acesso administrativo restrito.');
    }
  }

  private async isAdmin(userId: string) {
    const adminEmails = this.getAdminEmails();

    if (!adminEmails.length) {
      return false;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    return !!user && adminEmails.includes(user.email.toLowerCase());
  }

  private getAdminEmails() {
    return this.configService
      .get<string>('ADMIN_EMAILS', '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }

  private monthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private normalizeLimit(limitInput?: string) {
    const parsed = Number(limitInput ?? 100);

    if (!Number.isFinite(parsed)) {
      return 100;
    }

    return Math.min(Math.max(Math.trunc(parsed), 1), 500);
  }

  private async readLogFile(logPath: string) {
    try {
      return await readFile(logPath, 'utf8');
    } catch (error: unknown) {
      if ((error as { code?: string }).code === 'ENOENT') {
        return '';
      }

      throw error;
    }
  }

  private parseErrorLogLine(line: string) {
    try {
      return JSON.parse(line) as Record<string, unknown>;
    } catch {
      return {
        timestamp: null,
        message: line,
        raw: true
      };
    }
  }

  private async findSubscription(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId }
    });

    if (!subscription) {
      throw new NotFoundException('Assinatura da empresa nao encontrada.');
    }

    return subscription;
  }

  private addMonths(date: Date, months: number) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
  }

  private decimalToNumber(value: Prisma.Decimal | null | undefined) {
    return value?.toNumber() ?? 0;
  }
}
