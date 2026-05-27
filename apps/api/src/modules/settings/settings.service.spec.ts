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
});
