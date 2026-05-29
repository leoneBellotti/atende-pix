import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

    await expect(service.createPix('tenant-1', 'user-1', 'order-1')).resolves.toBe(existingPayment);
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

  it('processes approved Mercado Pago webhooks and marks the order as paid', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        status: 'approved',
        date_approved: '2026-05-29T10:00:00.000Z'
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    const tx = {
      payment: {
        update: vi.fn().mockResolvedValue({})
      },
      order: {
        update: vi.fn().mockResolvedValue({})
      },
      paymentWebhookEvent: {
        create: vi.fn().mockResolvedValue({})
      }
    };
    const prisma = {
      paymentWebhookEvent: {
        findUnique: vi.fn().mockResolvedValue(null)
      },
      payment: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'payment-1',
          tenantId: 'tenant-1',
          orderId: 'order-1',
          paidAt: null,
          order: {
            id: 'order-1'
          }
        })
      },
      paymentProviderConfig: {
        findUnique: vi.fn().mockResolvedValue({
          accessToken: 'mp-token',
          webhookSecret: null
        })
      },
      $transaction: vi.fn((callback) => callback(tx))
    };
    const service = new PaymentsService(prisma as never);

    await expect(
      service.handleMercadoPagoWebhook({
        body: {
          type: 'payment',
          data: {
            id: 'mp-payment-1'
          }
        },
        query: {},
        requestId: 'request-1'
      })
    ).resolves.toEqual({ received: true });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.mercadopago.com/v1/payments/mp-payment-1',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer mp-token'
        }
      })
    );
    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: {
        status: 'PAID',
        paidAt: new Date('2026-05-29T10:00:00.000Z')
      }
    });
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        status: 'PAID',
        paidAt: new Date('2026-05-29T10:00:00.000Z')
      }
    });
    expect(tx.paymentWebhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          paymentId: 'payment-1',
          providerPaymentId: 'mp-payment-1',
          requestId: 'request-1',
          status: 'PROCESSED'
        })
      })
    );
  });

  it('ignores duplicate Mercado Pago webhook request ids', async () => {
    const prisma = {
      paymentWebhookEvent: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'event-1'
        })
      }
    };
    const service = new PaymentsService(prisma as never);

    await expect(
      service.handleMercadoPagoWebhook({
        body: {
          data: {
            id: 'mp-payment-1'
          }
        },
        query: {},
        requestId: 'request-1'
      })
    ).resolves.toEqual({ received: true, duplicate: true });
  });
});
