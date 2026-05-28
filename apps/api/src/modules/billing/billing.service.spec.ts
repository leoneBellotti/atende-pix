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
      name: 'Pro',
      monthlyPrice: 79,
      quoteLimit: 500,
      userLimit: 3,
      aiMonthlyLimit: 100
    };
    const checkout = {
      id: 'checkout-1',
      tenantId: 'tenant-1',
      planId: 'plan-1',
      status: 'PENDING',
      provider: 'LOCAL',
      expiresAt: new Date(Date.now() + 60_000),
      plan
    };
    const tx = {
      subscription: {
        upsert: vi.fn().mockResolvedValue({ id: 'subscription-1', plan })
      },
      tenant: {
        update: vi.fn().mockResolvedValue({})
      },
      subscriptionCheckout: {
        update: vi.fn().mockResolvedValue({})
      }
    };
    const prisma = {
      subscriptionPlan: {
        upsert: vi.fn().mockResolvedValue({}),
        findUnique: vi.fn().mockResolvedValue(plan)
      },
      subscription: {
        findUnique: vi.fn().mockResolvedValue(null)
      },
      subscriptionCheckout: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue(checkout),
        findFirst: vi.fn().mockResolvedValue(checkout)
      },
      quote: {
        count: vi.fn().mockResolvedValue(2)
      },
      membership: {
        count: vi.fn().mockResolvedValue(1)
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

  it('blocks quote creation when the monthly quote limit is reached', async () => {
    const prisma = {
      subscriptionPlan: {
        upsert: vi.fn().mockResolvedValue({})
      },
      subscription: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'subscription-1',
          tenantId: 'tenant-1',
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 60_000),
          plan: {
            name: 'Demo',
            quoteLimit: 20
          }
        })
      },
      quote: {
        count: vi.fn().mockResolvedValue(20)
      }
    };
    const service = new BillingService(prisma as never);

    await expect(service.ensureQuoteLimit('tenant-1')).rejects.toThrow(
      'Limite mensal de 20 orcamentos atingido para o plano Demo.'
    );
  });

  it('blocks product usage after trial expiration', async () => {
    const prisma = {
      subscriptionPlan: {
        upsert: vi.fn().mockResolvedValue({})
      },
      subscription: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'subscription-1',
          tenantId: 'tenant-1',
          status: 'TRIAL',
          currentPeriodEnd: new Date(Date.now() - 60_000),
          plan: {
            name: 'Demo',
            quoteLimit: 20
          }
        }),
        update: vi.fn().mockResolvedValue({
          id: 'subscription-1',
          tenantId: 'tenant-1',
          status: 'TRIAL_EXPIRED',
          currentPeriodEnd: new Date(Date.now() - 60_000),
          plan: {
            name: 'Demo',
            quoteLimit: 20
          }
        })
      }
    };
    const service = new BillingService(prisma as never);

    await expect(service.ensureQuoteLimit('tenant-1')).rejects.toThrow(
      'Trial expirado. Escolha um plano pago para continuar.'
    );
  });

  it('stores the cancellation reason and schedules cancellation at period end', async () => {
    const prisma = {
      subscriptionPlan: {
        upsert: vi.fn().mockResolvedValue({})
      },
      subscription: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'subscription-1',
          tenantId: 'tenant-1',
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 60_000),
          plan: {
            name: 'Pro'
          }
        }),
        update: vi.fn().mockResolvedValue({
          id: 'subscription-1',
          status: 'CANCELING',
          cancellationReason: 'Pausando por enquanto'
        })
      }
    };
    const service = new BillingService(prisma as never);

    await service.cancelSubscription('tenant-1', 'Pausando por enquanto');

    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      data: {
        status: 'CANCELING',
        cancelAtPeriodEnd: true,
        canceledAt: expect.any(Date),
        cancellationReason: 'Pausando por enquanto'
      },
      include: {
        plan: true
      }
    });
  });
});
