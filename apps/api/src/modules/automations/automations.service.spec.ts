import { AutomationsService } from './automations.service';

describe('AutomationsService', () => {
  it('lists tenant automation rules newest first', async () => {
    const prisma = {
      automationRule: {
        findMany: vi.fn().mockResolvedValue([])
      }
    };
    const service = new AutomationsService(prisma as never);

    await service.listRules('tenant-1');

    expect(prisma.automationRule.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      orderBy: {
        createdAt: 'desc'
      }
    });
  });

  it('creates automation rules disabled by default', async () => {
    const prisma = {
      automationRule: {
        create: vi.fn().mockResolvedValue({ id: 'rule-1' })
      }
    };
    const service = new AutomationsService(prisma as never);

    await service.createRule('tenant-1', {
      name: 'Follow-up',
      trigger: 'QUOTE_SENT',
      delayHours: 24,
      messageBody: 'Mensagem'
    });

    expect(prisma.automationRule.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        active: false
      })
    });
  });
});
