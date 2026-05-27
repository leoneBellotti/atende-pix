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

  it('returns an existing pending pix payment for an order', async () => {
    const existingPayment = { id: 'payment-1' };
    const prisma = {
      order: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'order-1',
          tenantId: 'tenant-1',
          customerId: 'customer-1',
          status: 'OPEN',
          total: '10',
          customer: {
            name: 'Cliente',
            email: 'cliente@example.com'
          }
        })
      },
      payment: {
        findFirst: vi.fn().mockResolvedValue(existingPayment)
      }
    };
    const service = new PaymentsService(prisma as never);

    await expect(service.createPix('tenant-1', 'order-1')).resolves.toBe(existingPayment);
  });

  it('lists webhook events newest first', async () => {
    const prisma = {
      paymentWebhookEvent: {
        findMany: vi.fn().mockResolvedValue([])
      }
    };
    const service = new PaymentsService(prisma as never);

    await service.listWebhookEvents('tenant-1');

    expect(prisma.paymentWebhookEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-1' },
        orderBy: { createdAt: 'desc' },
        take: 30
      })
    );
  });
});
