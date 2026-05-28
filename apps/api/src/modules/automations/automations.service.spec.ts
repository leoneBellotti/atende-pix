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

  it('schedules reminders for sent quotes expiring within 24 hours', async () => {
    const prisma = {
      automationRule: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'rule-1',
            delayHours: 2,
            messageBody: 'Ola {{customerName}}, orcamento #{{quoteNumber}} vence em breve.'
          }
        ])
      },
      quote: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'quote-1',
            number: 10,
            customer: {
              name: 'Ana'
            }
          }
        ])
      },
      automationLog: {
        upsert: vi.fn().mockResolvedValue({})
      }
    };
    const service = new AutomationsService(prisma as never);

    await expect(service.scheduleExpiringQuoteReminders('tenant-1')).resolves.toEqual({
      scheduled: 1
    });

    expect(prisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          status: 'SENT'
        })
      })
    );
    expect(prisma.automationLog.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          tenantId: 'tenant-1',
          ruleId: 'rule-1',
          targetType: 'QUOTE',
          targetId: 'quote-1',
          status: 'SCHEDULED',
          message: 'Ola Ana, orcamento #10 vence em breve.'
        })
      })
    );
  });
});
