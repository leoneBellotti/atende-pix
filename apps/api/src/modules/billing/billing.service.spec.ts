import { BillingService } from './billing.service';

describe('BillingService', () => {
  it('ensures default plans before listing active plans', async () => {
    const prisma = {
      subscriptionPlan: {
        upsert: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([])
      }
    };
    const service = new BillingService(prisma as never);

    await service.listPlans();

    expect(prisma.subscriptionPlan.upsert).toHaveBeenCalled();
    expect(prisma.subscriptionPlan.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: {
        monthlyPrice: 'asc'
      }
    });
  });

  it('selects a plan and syncs the tenant ai limit', async () => {
    const plan = {
      id: 'plan-1',
      code: 'pro',
      active: true,
      aiMonthlyLimit: 100
    };
    const tx = {
      subscription: {
        upsert: vi.fn().mockResolvedValue({ id: 'subscription-1', plan })
      },
      tenant: {
        update: vi.fn().mockResolvedValue({})
      }
    };
    const prisma = {
      subscriptionPlan: {
        upsert: vi.fn().mockResolvedValue({}),
        findUnique: vi.fn().mockResolvedValue(plan)
      },
      $transaction: vi.fn((callback) => callback(tx))
    };
    const service = new BillingService(prisma as never);

    await expect(service.selectPlan('tenant-1', 'pro')).resolves.toEqual({
      id: 'subscription-1',
      plan
    });

    expect(tx.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: {
        aiMonthlyLimit: 100
      }
    });
  });
});
