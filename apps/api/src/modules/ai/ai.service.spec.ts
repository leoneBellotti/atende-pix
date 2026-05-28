import { AiService } from './ai.service';

describe('AiService', () => {
  it('generates quote items from free text lines', async () => {
    const prisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue({
          aiEnabled: true
        })
      }
    };
    const service = new AiService(prisma as never);

    await expect(
      service.generateQuoteItemsFromText('tenant-1', 'Troca de tela 1x 250\nPelicula 2x 30')
    ).resolves.toEqual({
      provider: 'LOCAL',
      items: [
        {
          description: 'Troca de tela',
          quantity: 1,
          unitPrice: 250,
          discount: 0
        },
        {
          description: 'Pelicula',
          quantity: 2,
          unitPrice: 30,
          discount: 0
        }
      ]
    });
  });

  it('blocks ai actions when ai is disabled for the tenant', async () => {
    const prisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue({
          aiEnabled: false
        })
      }
    };
    const service = new AiService(prisma as never);

    await expect(service.summarizeConversation('tenant-1', 'customer-1')).rejects.toThrow(
      'IA desativada'
    );
  });

  it('summarizes a whatsapp conversation from recent messages', async () => {
    const prisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue({
          aiEnabled: true
        })
      },
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

  it('suggests an editable reply from the last inbound message', async () => {
    const prisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue({
          aiEnabled: true
        })
      },
      message: {
        findMany: vi.fn().mockResolvedValue([
          {
            direction: 'INBOUND',
            body: 'Voce consegue me mandar o Pix?',
            contactName: 'Ana',
            customer: {
              name: 'Ana Cliente'
            }
          }
        ])
      }
    };
    const service = new AiService(prisma as never);

    await expect(service.suggestReply('tenant-1', 'customer-1')).resolves.toEqual({
      conversationId: 'customer-1',
      provider: 'LOCAL',
      suggestion: expect.stringContaining('Ola, Ana Cliente')
    });
  });

  it('suggests an editable follow-up message', async () => {
    const prisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue({
          aiEnabled: true
        })
      },
      message: {
        findMany: vi.fn().mockResolvedValue([
          {
            direction: 'OUTBOUND',
            body: 'Enviei o orcamento.',
            contactName: null,
            customer: {
              name: 'Bruno Cliente'
            }
          }
        ])
      }
    };
    const service = new AiService(prisma as never);

    await expect(service.suggestFollowUp('tenant-1', 'customer-1')).resolves.toEqual({
      conversationId: 'customer-1',
      provider: 'LOCAL',
      suggestion: expect.stringContaining('Passando para saber')
    });
  });
});
