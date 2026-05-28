import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  it('blocks access when ADMIN_EMAILS is empty', async () => {
    const service = new AdminService({} as never, { get: vi.fn().mockReturnValue('') } as never);

    await expect(service.summary('user-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns SaaS summary for configured admin emails', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ email: 'admin@atendepix.test' })
      },
      tenant: { count: vi.fn().mockResolvedValue(3) },
      subscription: { count: vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(1).mockResolvedValueOnce(0) },
      subscriptionCheckout: {
        aggregate: vi.fn().mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(79) },
          _count: 1
        })
      },
      quote: { count: vi.fn().mockResolvedValue(12) },
      payment: { count: vi.fn().mockResolvedValue(4) }
    };
    const service = new AdminService(
      prisma as never,
      { get: vi.fn().mockReturnValue('admin@atendepix.test') } as never
    );

    await expect(service.summary('user-1')).resolves.toMatchObject({
      totalTenants: 3,
      activeSubscriptions: 2,
      subscriptionRevenueThisMonth: 79,
      quotesThisMonth: 12
    });
  });

  it('marks tenant subscription as past due for admins', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ email: 'admin@atendepix.test' })
      },
      subscription: {
        findUnique: vi.fn().mockResolvedValue({
          tenantId: 'tenant-1',
          currentPeriodEnd: null,
          renewsAt: null
        }),
        update: vi.fn().mockResolvedValue({ status: 'PAST_DUE' })
      }
    };
    const service = new AdminService(
      prisma as never,
      { get: vi.fn().mockReturnValue('admin@atendepix.test') } as never
    );

    await expect(service.markTenantPastDue('user-1', 'tenant-1')).resolves.toMatchObject({
      status: 'PAST_DUE'
    });
    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-1' },
        data: expect.objectContaining({
          status: 'PAST_DUE',
          suspendedAt: null
        })
      })
    );
  });
});
