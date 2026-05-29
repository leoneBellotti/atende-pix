import { randomBytes } from 'node:crypto';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
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
    name: 'Básico',
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService?: AuditService
  ) {}

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

  async selectPlan(tenantId: string, actorUserId: string | null, planCode: string) {
    const checkout = await this.startCheckout(tenantId, actorUserId, planCode);
    return this.confirmCheckout(tenantId, actorUserId, checkout.id);
  }

  async startCheckout(tenantId: string, actorUserId: string | null, planCode: string) {
    await this.ensureDefaultPlans();

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: planCode }
    });

    if (!plan?.active) {
      throw new NotFoundException('Plano não encontrado.');
    }

    await this.ensureCurrentUsageFitsPlan(tenantId, plan);

    const activeSubscription = await this.getCurrentSubscription(tenantId);
    if (activeSubscription?.plan.code === plan.code && activeSubscription.status === 'ACTIVE') {
      throw new ForbiddenException('Este plano já está ativo.');
    }

    const expiresAt = this.addHours(new Date(), 24);
    const publicToken = this.createPublicToken();

    return this.prisma.$transaction(async (tx) => {
      await tx.subscriptionCheckout.updateMany({
        where: {
          tenantId,
          status: 'PENDING'
        },
        data: {
          status: 'CANCELED'
        }
      });

      const checkout = await tx.subscriptionCheckout.create({
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

      await this.auditService?.record(
        {
          tenantId,
          actorUserId,
          action: 'SUBSCRIPTION_CHECKOUT_STARTED',
          entityType: 'SubscriptionCheckout',
          entityId: checkout.id,
          metadata: {
            planCode: plan.code,
            planName: plan.name,
            amount: plan.monthlyPrice.toString(),
            expiresAt: expiresAt.toISOString()
          }
        },
        tx
      );

      return checkout;
    });
  }

  async confirmCheckout(tenantId: string, actorUserId: string | null, checkoutId: string) {
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
      throw new NotFoundException('Checkout de assinatura não encontrado.');
    }

    if (checkout.status !== 'PENDING') {
      throw new ForbiddenException('Checkout de assinatura já processado.');
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

      await this.auditService?.record(
        {
          tenantId,
          actorUserId,
          action: 'SUBSCRIPTION_CHECKOUT_CONFIRMED',
          entityType: 'Subscription',
          entityId: subscription.id,
          metadata: {
            checkoutId: checkout.id,
            planCode: checkout.plan.code,
            planName: checkout.plan.name,
            amount: checkout.amount.toString(),
            renewsAt: renewsAt.toISOString()
          }
        },
        tx
      );

      return subscription;
    });
  }

  async cancelSubscription(tenantId: string, actorUserId: string | null, reason?: string) {
    const subscription = await this.ensureSubscription(tenantId);

    if (subscription.status === 'CANCELED') {
      return subscription;
    }

    if (subscription.status === 'TRIAL' || subscription.status === 'TRIAL_EXPIRED') {
      throw new ForbiddenException(
        'Trial não exige cancelamento. Basta não assinar um plano pago.'
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
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

      await this.auditService?.record(
        {
          tenantId,
          actorUserId,
          action: 'SUBSCRIPTION_CANCELLATION_SCHEDULED',
          entityType: 'Subscription',
          entityId: updated.id,
          metadata: {
            planCode: updated.plan.code,
            planName: updated.plan.name,
            currentPeriodEnd: updated.currentPeriodEnd?.toISOString() ?? null,
            reasonProvided: !!reason?.trim()
          } as Prisma.InputJsonValue
        },
        tx
      );

      return updated;
    });
  }

  async reactivateSubscription(tenantId: string, actorUserId: string | null) {
    const subscription = await this.ensureSubscription(tenantId);

    if (subscription.status === 'TRIAL' || subscription.status === 'TRIAL_EXPIRED') {
      return subscription;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
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

      await this.auditService?.record(
        {
          tenantId,
          actorUserId,
          action: 'SUBSCRIPTION_REACTIVATED',
          entityType: 'Subscription',
          entityId: updated.id,
          metadata: {
            planCode: updated.plan.code,
            planName: updated.plan.name
          }
        },
        tx
      );

      return updated;
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
        `Limite mensal de ${limit} orçamentos atingido para o plano ${subscription.plan.name}.`
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
      throw new NotFoundException('Plano demo não encontrado.');
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
        `Uso atual de ${quoteUsage} orçamentos no mês excede o limite do plano ${plan.name}.`
      );
    }

    if (plan.userLimit !== null && userUsage > plan.userLimit) {
      throw new ForbiddenException(
        `Uso atual de ${userUsage} usuários excede o limite do plano ${plan.name}.`
      );
    }
  }

  private async normalizeSubscriptionState<
    T extends { status: string; currentPeriodEnd: Date | null; tenantId: string }
  >(subscription: T) {
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
      throw new ForbiddenException(
        'Assinatura cancelada. Reative ou escolha um plano para continuar.'
      );
    }

    if (subscription.status === 'SUSPENDED') {
      throw new ForbiddenException(
        'Assinatura suspensa por inadimplencia. Regularize o plano para continuar.'
      );
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
