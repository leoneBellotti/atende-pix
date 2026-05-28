import { randomBytes } from 'node:crypto';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export const defaultPlans = [
  {
    code: 'demo',
    name: 'Demo',
    monthlyPrice: 0,
    quoteLimit: 20,
    userLimit: 1,
    aiMonthlyLimit: 10
  },
  {
    code: 'basic',
    name: 'Basico',
    monthlyPrice: 39,
    quoteLimit: 100,
    userLimit: 1,
    aiMonthlyLimit: 25
  },
  {
    code: 'pro',
    name: 'Pro',
    monthlyPrice: 79,
    quoteLimit: 500,
    userLimit: 3,
    aiMonthlyLimit: 100
  },
  {
    code: 'premium',
    name: 'Premium',
    monthlyPrice: 149,
    quoteLimit: null,
    userLimit: 10,
    aiMonthlyLimit: 300
  }
];

const trialDays = 14;
const pastDueGraceDays = 7;

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async listPlans() {
    await this.ensureDefaultPlans();

    return this.prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: {
        monthlyPrice: 'asc'
      }
    });
  }

  getCurrentSubscription(tenantId: string) {
    return this.prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        plan: true
      }
    });
  }

  async getUsage(tenantId: string) {
    const subscription = await this.ensureSubscription(tenantId);
    const [quoteUsage, userUsage, pendingCheckout] = await Promise.all([
      this.getQuoteUsage(tenantId),
      this.getUserUsage(tenantId),
      this.getPendingCheckout(tenantId)
    ]);

    return {
      subscription,
      pendingCheckout,
      trial: this.toTrialState(subscription),
      delinquency: this.toDelinquencyState(subscription),
      limits: {
        quotes: this.toUsageLimit(quoteUsage, subscription.plan.quoteLimit),
        users: this.toUsageLimit(userUsage, subscription.plan.userLimit),
        ai: {
          limit: subscription.plan.aiMonthlyLimit
        }
      }
    };
  }

  async selectPlan(tenantId: string, planCode: string) {
    const checkout = await this.startCheckout(tenantId, planCode);
    return this.confirmCheckout(tenantId, checkout.id);
  }

  async startCheckout(tenantId: string, planCode: string) {
    await this.ensureDefaultPlans();

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: planCode }
    });

    if (!plan?.active) {
      throw new NotFoundException('Plano nao encontrado.');
    }

    await this.ensureCurrentUsageFitsPlan(tenantId, plan);

    const activeSubscription = await this.getCurrentSubscription(tenantId);
    if (activeSubscription?.plan.code === plan.code && activeSubscription.status === 'ACTIVE') {
      throw new ForbiddenException('Este plano ja esta ativo.');
    }

    await this.prisma.subscriptionCheckout.updateMany({
      where: {
        tenantId,
        status: 'PENDING'
      },
      data: {
        status: 'CANCELED'
      }
    });

    const expiresAt = this.addHours(new Date(), 24);
    const publicToken = this.createPublicToken();

    return this.prisma.subscriptionCheckout.create({
      data: {
        tenantId,
        planId: plan.id,
        amount: plan.monthlyPrice,
        publicToken,
        checkoutUrl: `/billing/checkout/${publicToken}`,
        expiresAt
      },
      include: {
        plan: true
      }
    });
  }

  async confirmCheckout(tenantId: string, checkoutId: string) {
    const checkout = await this.prisma.subscriptionCheckout.findFirst({
      where: {
        id: checkoutId,
        tenantId
      },
      include: {
        plan: true
      }
    });

    if (!checkout) {
      throw new NotFoundException('Checkout de assinatura nao encontrado.');
    }

    if (checkout.status !== 'PENDING') {
      throw new ForbiddenException('Checkout de assinatura ja processado.');
    }

    if (checkout.expiresAt < new Date()) {
      await this.prisma.subscriptionCheckout.update({
        where: { id: checkout.id },
        data: {
          status: 'EXPIRED'
        }
      });
      throw new ForbiddenException('Checkout de assinatura expirado.');
    }

    await this.ensureCurrentUsageFitsPlan(tenantId, checkout.plan);

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const renewsAt = this.addMonths(now, 1);
      const subscription = await tx.subscription.upsert({
        where: { tenantId },
        create: {
          tenantId,
          planId: checkout.planId,
          status: 'ACTIVE',
          startedAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: renewsAt,
          renewsAt,
          pastDueAt: null,
          suspendedAt: null,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          cancellationReason: null,
          paymentProvider: checkout.provider,
          paymentMethod: 'SIMULATED_CARD',
          externalSubscriptionId: checkout.id
        },
        update: {
          planId: checkout.planId,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: renewsAt,
          renewsAt,
          pastDueAt: null,
          suspendedAt: null,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          cancellationReason: null,
          paymentProvider: checkout.provider,
          paymentMethod: 'SIMULATED_CARD',
          externalSubscriptionId: checkout.id
        },
        include: {
          plan: true
        }
      });

      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          aiMonthlyLimit: checkout.plan.aiMonthlyLimit
        }
      });

      await tx.subscriptionCheckout.update({
        where: { id: checkout.id },
        data: {
          status: 'PAID',
          paidAt: now
        }
      });

      return subscription;
    });
  }

  async cancelSubscription(tenantId: string, reason?: string) {
    const subscription = await this.ensureSubscription(tenantId);

    if (subscription.status === 'CANCELED') {
      return subscription;
    }

    if (subscription.status === 'TRIAL' || subscription.status === 'TRIAL_EXPIRED') {
      throw new ForbiddenException('Trial nao exige cancelamento. Basta nao assinar um plano pago.');
    }

    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        status: 'CANCELING',
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        cancellationReason: reason?.trim() || null
      },
      include: {
        plan: true
      }
    });
  }

  async reactivateSubscription(tenantId: string) {
    const subscription = await this.ensureSubscription(tenantId);

    if (subscription.status === 'TRIAL' || subscription.status === 'TRIAL_EXPIRED') {
      return subscription;
    }

    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        status: 'ACTIVE',
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

  async ensureQuoteLimit(tenantId: string) {
    const subscription = await this.ensureSubscription(tenantId);
    this.ensureSubscriptionCanUseProduct(subscription);

    const limit = subscription.plan.quoteLimit;

    if (limit === null) {
      return;
    }

    const used = await this.getQuoteUsage(tenantId);

    if (used >= limit) {
      throw new ForbiddenException(
        `Limite mensal de ${limit} orcamentos atingido para o plano ${subscription.plan.name}.`
      );
    }
  }

  async ensureSubscription(tenantId: string) {
    await this.ensureDefaultPlans();

    const current = await this.getCurrentSubscription(tenantId);
    if (current) {
      return this.normalizeSubscriptionState(current);
    }

    const demoPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: 'demo' }
    });

    if (!demoPlan) {
      throw new NotFoundException('Plano demo nao encontrado.');
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const trialEndsAt = this.addDays(now, trialDays);
      const subscription = await tx.subscription.create({
        data: {
          tenantId,
          planId: demoPlan.id,
          status: 'TRIAL',
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt,
          renewsAt: trialEndsAt
        },
        include: {
          plan: true
        }
      });

      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          aiMonthlyLimit: demoPlan.aiMonthlyLimit
        }
      });

      return subscription;
    });
  }

  private async ensureCurrentUsageFitsPlan(
    tenantId: string,
    plan: { name: string; quoteLimit: number | null; userLimit: number | null }
  ) {
    const [quoteUsage, userUsage] = await Promise.all([
      this.getQuoteUsage(tenantId),
      this.getUserUsage(tenantId)
    ]);

    if (plan.quoteLimit !== null && quoteUsage > plan.quoteLimit) {
      throw new ForbiddenException(
        `Uso atual de ${quoteUsage} orcamentos no mes excede o limite do plano ${plan.name}.`
      );
    }

    if (plan.userLimit !== null && userUsage > plan.userLimit) {
      throw new ForbiddenException(
        `Uso atual de ${userUsage} usuarios excede o limite do plano ${plan.name}.`
      );
    }
  }

  private async normalizeSubscriptionState<T extends { status: string; currentPeriodEnd: Date | null; tenantId: string }>(
    subscription: T
  ) {
    if (subscription.status === 'TRIAL' && this.isPast(subscription.currentPeriodEnd)) {
      return this.prisma.subscription.update({
        where: { tenantId: subscription.tenantId },
        data: {
          status: 'TRIAL_EXPIRED'
        },
        include: {
          plan: true
        }
      });
    }

    if (subscription.status === 'ACTIVE' && this.isPast(subscription.currentPeriodEnd)) {
      const pastDueAt = new Date();
      return this.prisma.subscription.update({
        where: { tenantId: subscription.tenantId },
        data: {
          status: 'PAST_DUE',
          pastDueAt
        },
        include: {
          plan: true
        }
      });
    }

    const graceEndsAt = subscription.currentPeriodEnd
      ? this.addDays(subscription.currentPeriodEnd, pastDueGraceDays)
      : null;

    if (subscription.status === 'PAST_DUE' && this.isPast(graceEndsAt)) {
      return this.prisma.subscription.update({
        where: { tenantId: subscription.tenantId },
        data: {
          status: 'SUSPENDED',
          suspendedAt: new Date()
        },
        include: {
          plan: true
        }
      });
    }

    if (subscription.status === 'CANCELING' && this.isPast(subscription.currentPeriodEnd)) {
      return this.prisma.subscription.update({
        where: { tenantId: subscription.tenantId },
        data: {
          status: 'CANCELED',
          cancelAtPeriodEnd: false
        },
        include: {
          plan: true
        }
      });
    }

    return subscription;
  }

  private ensureSubscriptionCanUseProduct(subscription: { status: string }) {
    if (subscription.status === 'TRIAL_EXPIRED') {
      throw new ForbiddenException('Trial expirado. Escolha um plano pago para continuar.');
    }

    if (subscription.status === 'CANCELED') {
      throw new ForbiddenException('Assinatura cancelada. Reative ou escolha um plano para continuar.');
    }

    if (subscription.status === 'SUSPENDED') {
      throw new ForbiddenException('Assinatura suspensa por inadimplencia. Regularize o plano para continuar.');
    }
  }

  private toTrialState(subscription: {
    status: string;
    startedAt: Date;
    currentPeriodEnd: Date | null;
  }) {
    const isTrial = subscription.status === 'TRIAL' || subscription.status === 'TRIAL_EXPIRED';
    const endsAt = subscription.currentPeriodEnd;

    if (!isTrial || !endsAt) {
      return null;
    }

    const remainingMs = endsAt.getTime() - Date.now();

    return {
      status: subscription.status,
      startedAt: subscription.startedAt,
      endsAt,
      daysTotal: trialDays,
      daysRemaining: Math.max(Math.ceil(remainingMs / (24 * 60 * 60 * 1000)), 0),
      expired: subscription.status === 'TRIAL_EXPIRED' || remainingMs <= 0
    };
  }

  private toDelinquencyState(subscription: {
    status: string;
    currentPeriodEnd: Date | null;
    pastDueAt: Date | null;
    suspendedAt: Date | null;
  }) {
    const isDelinquent = subscription.status === 'PAST_DUE' || subscription.status === 'SUSPENDED';

    if (!isDelinquent) {
      return null;
    }

    const graceEndsAt = subscription.currentPeriodEnd
      ? this.addDays(subscription.currentPeriodEnd, pastDueGraceDays)
      : null;
    const remainingMs = graceEndsAt ? graceEndsAt.getTime() - Date.now() : 0;

    return {
      status: subscription.status,
      pastDueAt: subscription.pastDueAt,
      suspendedAt: subscription.suspendedAt,
      graceEndsAt,
      graceDays: pastDueGraceDays,
      daysRemaining: Math.max(Math.ceil(remainingMs / (24 * 60 * 60 * 1000)), 0),
      suspended: subscription.status === 'SUSPENDED'
    };
  }

  private getQuoteUsage(tenantId: string) {
    return this.prisma.quote.count({
      where: {
        tenantId,
        createdAt: {
          gte: this.monthStart()
        }
      }
    });
  }

  private getUserUsage(tenantId: string) {
    return this.prisma.membership.count({
      where: {
        tenantId
      }
    });
  }

  private toUsageLimit(used: number, limit: number | null) {
    return {
      used,
      limit,
      remaining: limit === null ? null : Math.max(limit - used, 0)
    };
  }

  private getPendingCheckout(tenantId: string) {
    return this.prisma.subscriptionCheckout.findFirst({
      where: {
        tenantId,
        status: 'PENDING',
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        plan: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  private monthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private addHours(date: Date, hours: number) {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
  }

  private addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private addMonths(date: Date, months: number) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
  }

  private isPast(date: Date | null) {
    return !!date && date.getTime() < Date.now();
  }

  private createPublicToken() {
    return randomBytes(24).toString('hex');
  }

  private async ensureDefaultPlans() {
    await Promise.all(
      defaultPlans.map((plan) =>
        this.prisma.subscriptionPlan.upsert({
          where: { code: plan.code },
          create: plan,
          update: plan
        })
      )
    );
  }
}
