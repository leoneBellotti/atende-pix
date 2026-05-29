import { AuditService } from './audit.service';

describe('AuditService', () => {
  it('records an audit event with tenant, actor and metadata', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'audit-1' });
    const service = new AuditService({
      auditLog: {
        create
      }
    } as never);

    await service.record({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      action: 'PAYMENT_MANUALLY_CONFIRMED',
      entityType: 'Payment',
      entityId: 'payment-1',
      metadata: {
        orderId: 'order-1'
      }
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        actorUserId: 'user-1',
        action: 'PAYMENT_MANUALLY_CONFIRMED',
        entityType: 'Payment',
        entityId: 'payment-1',
        metadata: {
          orderId: 'order-1'
        }
      }
    });
  });
});
