import { ForbiddenException } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';

describe('WhatsAppService', () => {
  it('returns the challenge when the verify token matches an active config', async () => {
    const prisma = {
      whatsAppConfig: {
        findFirst: vi.fn().mockResolvedValue({ id: 'config-1' })
      }
    };
    const service = new WhatsAppService(prisma as never);

    await expect(
      service.verifyWebhook({
        mode: 'subscribe',
        token: 'verify-token',
        challenge: 'challenge-123'
      })
    ).resolves.toBe('challenge-123');

    expect(prisma.whatsAppConfig.findFirst).toHaveBeenCalledWith({
      where: {
        active: true,
        verifyToken: 'verify-token'
      }
    });
  });

  it('rejects invalid webhook verification requests', async () => {
    const service = new WhatsAppService({} as never);

    await expect(
      service.verifyWebhook({
        mode: 'subscribe',
        token: '',
        challenge: 'challenge-123'
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('stores inbound messages for the tenant that owns the phone number id', async () => {
    const prisma = {
      whatsAppConfig: {
        findFirst: vi.fn().mockResolvedValue({
          tenantId: 'tenant-1'
        })
      },
      customer: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'customer-1'
        })
      },
      message: {
        upsert: vi.fn().mockResolvedValue({})
      }
    };
    const service = new WhatsAppService(prisma as never);

    await expect(
      service.handleWebhook({
        body: {
          entry: [
            {
              changes: [
                {
                  value: {
                    metadata: {
                      phone_number_id: 'phone-number-1',
                      display_phone_number: '+55 11 99999-0000'
                    },
                    contacts: [
                      {
                        wa_id: '5511988887777',
                        profile: {
                          name: 'Cliente Teste'
                        }
                      }
                    ],
                    messages: [
                      {
                        id: 'wamid.1',
                        from: '5511988887777',
                        timestamp: '1780000000',
                        type: 'text',
                        text: {
                          body: 'Ola, quero um orcamento.'
                        }
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      })
    ).resolves.toEqual({ received: true, storedMessages: 1 });

    expect(prisma.message.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          channel_externalMessageId: {
            channel: 'WHATSAPP',
            externalMessageId: 'wamid.1'
          }
        },
        create: expect.objectContaining({
          tenantId: 'tenant-1',
          customerId: 'customer-1',
          direction: 'INBOUND',
          fromPhone: '5511988887777',
          body: 'Ola, quero um orcamento.'
        })
      })
    );
  });
});
