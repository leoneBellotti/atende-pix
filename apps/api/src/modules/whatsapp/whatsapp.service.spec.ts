import { ForbiddenException } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';

describe('WhatsAppService', () => {
  it('creates default utility templates when none exist', async () => {
    const prisma = {
      messageTemplate: {
        findMany: vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'template-1' }]),
        createMany: vi.fn().mockResolvedValue({ count: 3 })
      }
    };
    const service = new WhatsAppService(prisma as never);

    await expect(service.listMessageTemplates('tenant-1')).resolves.toEqual([{ id: 'template-1' }]);

    expect(prisma.messageTemplate.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          tenantId: 'tenant-1',
          category: 'UTILITY'
        })
      ]),
      skipDuplicates: true
    });
  });

  it('groups recent whatsapp messages as conversations', async () => {
    const prisma = {
      message: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'message-2',
            customerId: 'customer-1',
            customer: {
              id: 'customer-1',
              name: 'Cliente',
              phone: '5511999990000'
            },
            contactName: 'Cliente',
            fromPhone: '5511999990000',
            toPhone: null,
            direction: 'INBOUND',
            type: 'text',
            body: 'Mensagem mais recente',
            sentAt: new Date('2026-05-28T10:00:00.000Z'),
            createdAt: new Date('2026-05-28T10:00:01.000Z')
          },
          {
            id: 'message-1',
            customerId: 'customer-1',
            customer: {
              id: 'customer-1',
              name: 'Cliente',
              phone: '5511999990000'
            },
            contactName: 'Cliente',
            fromPhone: '5511999990000',
            toPhone: null,
            direction: 'INBOUND',
            type: 'text',
            body: 'Mensagem antiga',
            sentAt: new Date('2026-05-28T09:00:00.000Z'),
            createdAt: new Date('2026-05-28T09:00:01.000Z')
          }
        ])
      }
    };
    const service = new WhatsAppService(prisma as never);

    await expect(service.listConversations('tenant-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'customer-1',
        phone: '5511999990000',
        lastMessage: expect.objectContaining({
          id: 'message-2',
          body: 'Mensagem mais recente'
        })
      })
    ]);
  });

  it('links all messages from a conversation to a customer', async () => {
    const prisma = {
      customer: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'customer-1'
        })
      },
      message: {
        updateMany: vi.fn().mockResolvedValue({
          count: 2
        })
      }
    };
    const service = new WhatsAppService(prisma as never);

    await expect(
      service.linkConversationToCustomer('tenant-1', '5511999990000', 'customer-1')
    ).resolves.toEqual({
      linked: true,
      updatedMessages: 2
    });

    expect(prisma.message.updateMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        channel: 'WHATSAPP',
        OR: [
          { customerId: '5511999990000' },
          { fromPhone: '5511999990000' },
          { toPhone: '5511999990000' }
        ]
      },
      data: {
        customerId: 'customer-1'
      }
    });
  });

  it('sends text messages inside the whatsapp service window', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        messages: [{ id: 'wamid.outbound-1' }]
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    const prisma = {
      whatsAppConfig: {
        findUnique: vi.fn().mockResolvedValue({
          active: true,
          phoneNumberId: 'phone-number-1',
          accessToken: 'access-token'
        })
      },
      message: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'message-1',
            customerId: 'customer-1',
            attendanceId: null,
            direction: 'INBOUND',
            fromPhone: '5511999990000',
            toPhone: '5511888880000',
            createdAt: new Date(),
            customer: {
              id: 'customer-1',
              phone: '5511999990000'
            }
          }
        ]),
        create: vi.fn().mockResolvedValue({
          id: 'message-outbound-1'
        })
      }
    };
    const service = new WhatsAppService(prisma as never);

    await expect(
      service.sendTextMessage('tenant-1', {
        conversationId: 'customer-1',
        body: 'Ola, tudo certo?'
      })
    ).resolves.toEqual({ id: 'message-outbound-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://graph.facebook.com/v20.0/phone-number-1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token'
        })
      })
    );
    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          customerId: 'customer-1',
          direction: 'OUTBOUND',
          externalMessageId: 'wamid.outbound-1',
          toPhone: '5511999990000',
          body: 'Ola, tudo certo?'
        })
      })
    );

    vi.unstubAllGlobals();
  });

  it('blocks text messages outside the whatsapp service window', async () => {
    const prisma = {
      whatsAppConfig: {
        findUnique: vi.fn().mockResolvedValue({
          active: true,
          phoneNumberId: 'phone-number-1',
          accessToken: 'access-token'
        })
      },
      message: {
        findMany: vi.fn().mockResolvedValue([
          {
            direction: 'INBOUND',
            fromPhone: '5511999990000',
            createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
            customer: null
          }
        ])
      }
    };
    const service = new WhatsAppService(prisma as never);

    await expect(
      service.sendTextMessage('tenant-1', {
        conversationId: '5511999990000',
        body: 'Ola'
      })
    ).rejects.toThrow('janela de atendimento');
  });

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
