import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

const defaultPlans = [
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

  async selectPlan(tenantId: string, planCode: string) {
    await this.ensureDefaultPlans();

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: planCode }
    });

    if (!plan?.active) {
      throw new NotFoundException('Plano nao encontrado.');
    }

    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.upsert({
        where: { tenantId },
        create: {
          tenantId,
          planId: plan.id,
          status: 'ACTIVE'
        },
        update: {
          planId: plan.id,
          status: 'ACTIVE'
        },
        include: {
          plan: true
        }
      });

      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          aiMonthlyLimit: plan.aiMonthlyLimit
        }
      });

      return subscription;
    });
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
