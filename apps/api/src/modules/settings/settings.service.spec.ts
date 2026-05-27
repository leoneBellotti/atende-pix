import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  it('updates tenant public settings', async () => {
    const prisma = {
      tenant: {
        update: vi.fn().mockResolvedValue({
          id: 'tenant-1',
          name: 'Empresa Demo',
          slug: 'empresa-demo',
          document: '123',
          phone: null,
          logoUrl: null
        })
      }
    };
    const service = new SettingsService(prisma as never);

    await service.updateTenantSettings('tenant-1', {
      name: 'Empresa Demo',
      document: '123',
      phone: '',
      logoUrl: ''
    });

    expect(prisma.tenant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tenant-1' },
        data: expect.objectContaining({
          name: 'Empresa Demo',
          document: '123',
          phone: null,
          logoUrl: null
        })
      })
    );
  });

  it('stores payment provider credentials without returning secrets', async () => {
    const prisma = {
      paymentProviderConfig: {
        upsert: vi.fn().mockResolvedValue({
          provider: 'MERCADO_PAGO',
          active: true,
          sandbox: true,
          accessToken: 'secret-token',
          publicKey: 'public-key',
          webhookSecret: 'webhook-secret'
        })
      }
    };
    const service = new SettingsService(prisma as never);

    const config = await service.updatePaymentProviderConfig('tenant-1', {
      active: true,
      sandbox: true,
      accessToken: 'secret-token',
      publicKey: 'public-key',
      webhookSecret: 'webhook-secret'
    });

    expect(prisma.paymentProviderConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId_provider: {
            tenantId: 'tenant-1',
            provider: 'MERCADO_PAGO'
          }
        }
      })
    );
    expect(config).toEqual(
      expect.objectContaining({
        provider: 'MERCADO_PAGO',
        active: true,
        sandbox: true,
        hasAccessToken: true,
        hasPublicKey: true,
        hasWebhookSecret: true
      })
    );
    expect(config).not.toHaveProperty('accessToken');
  });
});
