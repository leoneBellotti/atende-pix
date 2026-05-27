import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  it('lists payments ordered by newest first', async () => {
    const prisma = {
      payment: {
        findMany: vi.fn().mockResolvedValue([])
      }
    };
    const service = new PaymentsService(prisma as never);

    await service.list('tenant-1');

    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-1' },
        orderBy: { createdAt: 'desc' }
      })
    );
  });
});
