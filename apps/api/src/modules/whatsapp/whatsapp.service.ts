import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

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
      };
    }>;
  }>;
};

@Injectable()
export class WhatsAppService {
  constructor(private readonly prisma: PrismaService) {}

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

  private normalizePhone(phone?: string) {
    if (!phone) {
      return null;
    }

    const digits = phone.replace(/\D/g, '');
    return digits || null;
  }
}
