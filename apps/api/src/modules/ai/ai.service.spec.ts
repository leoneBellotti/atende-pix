import { AiService } from './ai.service';

describe('AiService', () => {
  it('summarizes a whatsapp conversation from recent messages', async () => {
    const prisma = {
      message: {
        findMany: vi.fn().mockResolvedValue([
          {
            direction: 'INBOUND',
            body: 'Preciso de um orcamento para manutencao.',
            fromPhone: '5511999990000',
            contactName: 'Ana',
            customer: {
              name: 'Ana Cliente'
            }
          },
          {
            direction: 'OUTBOUND',
            body: 'Claro, vou preparar.',
            fromPhone: null,
            contactName: null,
            customer: {
              name: 'Ana Cliente'
            }
          }
        ])
      }
    };
    const service = new AiService(prisma as never);

    await expect(service.summarizeConversation('tenant-1', 'customer-1')).resolves.toEqual({
      conversationId: 'customer-1',
      provider: 'LOCAL',
      summary: expect.stringContaining('Preciso de um orcamento')
    });

    expect(prisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          channel: 'WHATSAPP'
        }),
        take: 30
      })
    );
  });
});
