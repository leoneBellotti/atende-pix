import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SendWhatsAppMessageDto } from './dto/send-whatsapp-message.dto';

type WhatsAppWebhookMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: {
    body?: string;
  };
  image?: {
    caption?: string;
  };
  document?: {
    caption?: string;
    filename?: string;
  };
  button?: {
    text?: string;
  };
  interactive?: {
    button_reply?: {
      title?: string;
    };
    list_reply?: {
      title?: string;
    };
  };
};

type WhatsAppWebhookStatus = {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
  errors?: Array<{
    title?: string;
    message?: string;
    error_data?: {
      details?: string;
    };
  }>;
};

type WhatsAppWebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: {
          phone_number_id?: string;
          display_phone_number?: string;
        };
        contacts?: Array<{
          wa_id?: string;
          profile?: {
            name?: string;
          };
        }>;
        messages?: WhatsAppWebhookMessage[];
        statuses?: WhatsAppWebhookStatus[];
      };
    }>;
  }>;
};

const defaultMessageTemplates = [
  {
    name: 'Confirmar orcamento',
    category: 'UTILITY',
    body: 'Ola! Seu orcamento esta pronto. Posso te enviar o link para conferir?'
  },
  {
    name: 'Pagamento pendente',
    category: 'UTILITY',
    body: 'Ola! Identifiquei que o pagamento ainda esta pendente. Posso reenviar o Pix?'
  },
  {
    name: 'Pedido pronto',
    category: 'UTILITY',
    body: 'Ola! Seu pedido esta pronto. Podemos combinar a retirada ou entrega?'
  }
];

@Injectable()
export class WhatsAppService {
  constructor(private readonly prisma: PrismaService) {}

  async listMessageTemplates(tenantId: string) {
    const existingTemplates = await this.prisma.messageTemplate.findMany({
      where: {
        tenantId,
        active: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    if (existingTemplates.length) {
      return existingTemplates;
    }

    await this.prisma.messageTemplate.createMany({
      data: defaultMessageTemplates.map((template) => ({
        tenantId,
        ...template
      })),
      skipDuplicates: true
    });

    return this.prisma.messageTemplate.findMany({
      where: {
        tenantId,
        active: true
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async listConversations(tenantId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        tenantId,
        channel: 'WHATSAPP'
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    const conversations = new Map<string, (typeof messages)[number]>();

    for (const message of messages) {
      const key = message.customerId ?? message.fromPhone ?? message.toPhone ?? message.id;

      if (!conversations.has(key)) {
        conversations.set(key, message);
      }
    }

    return Array.from(conversations.entries()).map(([conversationKey, message]) => ({
      id: conversationKey,
      customer: message.customer,
      contactName: message.contactName,
      phone: message.fromPhone ?? message.toPhone,
      lastMessage: {
        id: message.id,
        direction: message.direction,
        type: message.type,
        status: message.status,
        statusAt: message.statusAt,
        failureReason: message.failureReason,
        body: message.body,
        sentAt: message.sentAt,
        createdAt: message.createdAt
      }
    }));
  }

  async linkConversationToCustomer(tenantId: string, conversationId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId
      },
      select: {
        id: true
      }
    });

    if (!customer) {
      throw new NotFoundException('Cliente nao encontrado para vincular conversa.');
    }

    const result = await this.prisma.message.updateMany({
      where: {
        tenantId,
        channel: 'WHATSAPP',
        OR: [
          { customerId: conversationId },
          { fromPhone: conversationId },
          { toPhone: conversationId }
        ]
      },
      data: {
        customerId: customer.id
      }
    });

    if (!result.count) {
      throw new NotFoundException('Conversa nao encontrada.');
    }

    return {
      linked: true,
      updatedMessages: result.count
    };
  }

  async sendTextMessage(tenantId: string, input: SendWhatsAppMessageDto) {
    const body = input.body.trim();

    if (!body) {
      throw new BadRequestException('Informe a mensagem para envio.');
    }

    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { tenantId }
    });

    if (!config?.active || !config.phoneNumberId || !config.accessToken) {
      throw new BadRequestException('Configure o WhatsApp Cloud API antes de enviar mensagens.');
    }

    const conversationMessages = await this.prisma.message.findMany({
      where: {
        tenantId,
        channel: 'WHATSAPP',
        OR: [
          { customerId: input.conversationId },
          { fromPhone: input.conversationId },
          { toPhone: input.conversationId }
        ]
      },
      include: {
        customer: {
          select: {
            id: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    if (!conversationMessages.length) {
      throw new NotFoundException('Conversa nao encontrada para envio.');
    }

    const lastInboundMessage = conversationMessages.find((message) => message.direction === 'INBOUND');

    if (!lastInboundMessage?.createdAt || !this.isInsideServiceWindow(lastInboundMessage.createdAt)) {
      throw new BadRequestException('A conversa esta fora da janela de atendimento do WhatsApp.');
    }

    const lastMessage = conversationMessages[0];
    const rawRecipientPhone =
      lastInboundMessage.fromPhone ??
      lastMessage.fromPhone ??
      lastMessage.toPhone ??
      lastMessage.customer?.phone ??
      undefined;
    const recipientPhone = this.normalizePhone(rawRecipientPhone);

    if (!recipientPhone) {
      throw new BadRequestException('A conversa nao possui telefone valido para envio.');
    }

    const sentMessage = await this.sendCloudApiTextMessage({
      accessToken: config.accessToken,
      phoneNumberId: config.phoneNumberId,
      to: recipientPhone,
      body
    });

    return this.prisma.message.create({
      data: {
        tenantId,
        customerId: lastMessage.customerId,
        attendanceId: lastMessage.attendanceId,
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        externalMessageId: sentMessage.id,
        phoneNumberId: config.phoneNumberId,
        fromPhone: config.phoneNumberId,
        toPhone: recipientPhone,
        type: 'text',
        status: 'sent',
        statusAt: new Date(),
        body,
        sentAt: new Date(),
        rawPayload: sentMessage.rawPayload as Prisma.InputJsonValue
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });
  }

  async verifyWebhook(input: { mode?: string; token?: string; challenge?: string }) {
    if (input.mode !== 'subscribe' || !input.token || !input.challenge) {
      throw new ForbiddenException('Verificacao invalida.');
    }

    const config = await this.prisma.whatsAppConfig.findFirst({
      where: {
        active: true,
        verifyToken: input.token
      }
    });

    if (!config) {
      throw new ForbiddenException('Token de verificacao invalido.');
    }

    return input.challenge;
  }

  async handleWebhook(input: { body: Record<string, unknown>; signature?: string }) {
    const body = input.body as WhatsAppWebhookBody;
    let storedMessages = 0;

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;

        if (!value || !phoneNumberId) {
          continue;
        }

        const config = await this.prisma.whatsAppConfig.findFirst({
          where: {
            active: true,
            phoneNumberId
          }
        });

        if (!config) {
          continue;
        }

        for (const message of value.messages ?? []) {
          const externalMessageId = message.id;

          if (!externalMessageId) {
            continue;
          }

          const contact = value.contacts?.find((item) => item.wa_id === message.from);
          const fromPhone = this.normalizePhone(message.from);
          const customer = fromPhone
            ? await this.findCustomerByPhone(config.tenantId, fromPhone)
            : null;

          await this.prisma.message.upsert({
            where: {
              channel_externalMessageId: {
                channel: 'WHATSAPP',
                externalMessageId
              }
            },
            create: {
              tenantId: config.tenantId,
              customerId: customer?.id,
              channel: 'WHATSAPP',
              direction: 'INBOUND',
              externalMessageId,
              phoneNumberId,
              fromPhone,
              toPhone: this.normalizePhone(value.metadata?.display_phone_number),
              contactName: contact?.profile?.name,
              type: message.type,
              body: this.extractMessageBody(message),
              sentAt: this.parseWhatsAppTimestamp(message.timestamp),
              rawPayload: message as Prisma.InputJsonValue
            },
            update: {
              customerId: customer?.id,
              contactName: contact?.profile?.name,
              rawPayload: message as Prisma.InputJsonValue
            }
          });

          storedMessages += 1;
        }

        for (const status of value.statuses ?? []) {
          if (!status.id) {
            continue;
          }

          await this.prisma.message.updateMany({
            where: {
              tenantId: config.tenantId,
              channel: 'WHATSAPP',
              externalMessageId: status.id
            },
            data: {
              status: status.status,
              statusAt: this.parseWhatsAppTimestamp(status.timestamp),
              failureReason: this.extractStatusFailureReason(status)
            }
          });
        }
      }
    }

    return { received: true, storedMessages };
  }

  private findCustomerByPhone(tenantId: string, phone: string) {
    return this.prisma.customer.findFirst({
      where: {
        tenantId,
        OR: [{ phone }, { phone: `+${phone}` }]
      },
      select: {
        id: true
      }
    });
  }

  private extractMessageBody(message: WhatsAppWebhookMessage) {
    return (
      message.text?.body ??
      message.image?.caption ??
      message.document?.caption ??
      message.document?.filename ??
      message.button?.text ??
      message.interactive?.button_reply?.title ??
      message.interactive?.list_reply?.title ??
      null
    );
  }

  private parseWhatsAppTimestamp(timestamp?: string) {
    if (!timestamp) {
      return null;
    }

    const timestampNumber = Number(timestamp);

    if (!Number.isFinite(timestampNumber)) {
      return null;
    }

    return new Date(timestampNumber * 1000);
  }

  private extractStatusFailureReason(status: WhatsAppWebhookStatus) {
    const error = status.errors?.[0];

    return error?.error_data?.details ?? error?.message ?? error?.title ?? null;
  }

  private normalizePhone(phone?: string) {
    if (!phone) {
      return null;
    }

    const digits = phone.replace(/\D/g, '');
    return digits || null;
  }

  private isInsideServiceWindow(date: Date) {
    const serviceWindowMs = 24 * 60 * 60 * 1000;
    return Date.now() - date.getTime() <= serviceWindowMs;
  }

  private async sendCloudApiTextMessage(input: {
    accessToken: string;
    phoneNumberId: string;
    to: string;
    body: string;
  }) {
    const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION ?? 'v20.0';
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${input.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: input.to,
          type: 'text',
          text: {
            preview_url: false,
            body: input.body
          }
        })
      }
    );

    const data = (await response.json().catch(() => ({}))) as {
      messages?: Array<{ id?: string }>;
      error?: {
        message?: string;
      };
    };
    const messageId = data.messages?.[0]?.id;

    if (!response.ok || !messageId) {
      throw new BadRequestException(data.error?.message ?? 'WhatsApp recusou o envio da mensagem.');
    }

    return {
      id: messageId,
      rawPayload: data
    };
  }
}
