import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual, randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ManualConfirmPaymentDto } from './dto/manual-confirm-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.payment.findMany({
      where: { tenantId },
      include: {
        order: {
          include: {
            customer: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  listWebhookEvents(tenantId: string) {
    return this.prisma.paymentWebhookEvent.findMany({
      where: { tenantId },
      include: {
        payment: {
          include: {
            order: {
              include: {
                customer: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 30
    });
  }

  async getPublicByToken(token: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { publicToken: token },
      include: {
        tenant: {
          select: {
            name: true,
            document: true,
            phone: true,
            logoUrl: true
          }
        },
        order: {
          include: {
            customer: true
          }
        }
      }
    });

    if (!payment) {
      throw new NotFoundException('Pagamento nao encontrado.');
    }

    return payment;
  }

  async manualConfirm(tenantId: string, orderId: string, input: ManualConfirmPaymentDto) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId
      }
    });

    if (!order) {
      throw new NotFoundException('Pedido nao encontrado para pagamento.');
    }

    const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
    const amount = new Prisma.Decimal(input.amount ?? order.total);

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          orderId: order.id,
          provider: 'MANUAL',
          status: 'PAID',
          amount,
          paidAt
        },
        include: {
          order: {
            include: {
              customer: true
            }
          }
        }
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paidAt
        }
      });

      return payment;
    });
  }

  async createPix(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId
      },
      include: {
        customer: true
      }
    });

    if (!order) {
      throw new NotFoundException('Pedido nao encontrado para gerar Pix.');
    }

    if (order.status === 'PAID') {
      throw new BadRequestException('Pedido ja esta pago.');
    }

    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        tenantId,
        orderId: order.id,
        provider: 'MERCADO_PAGO',
        status: 'PENDING'
      },
      include: {
        order: {
          include: {
            customer: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existingPayment) {
      return existingPayment;
    }

    const providerConfig = await this.prisma.paymentProviderConfig.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider: 'MERCADO_PAGO'
        }
      }
    });

    if (!providerConfig?.active || !providerConfig.accessToken) {
      throw new BadRequestException('Configure o Mercado Pago antes de gerar Pix.');
    }

    const mercadoPagoPayment = await this.createMercadoPagoPixPayment({
      accessToken: providerConfig.accessToken,
      amount: Number(order.total),
      description: `Pedido #${order.number}`,
      payerEmail: order.customer.email ?? `cliente-${order.customerId}@atendepix.local`,
      payerName: order.customer.name,
      idempotencyKey: `order-${order.id}-pix`
    });

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          orderId: order.id,
          provider: 'MERCADO_PAGO',
          providerPaymentId: String(mercadoPagoPayment.id),
          publicToken: randomUUID(),
          status: 'PENDING',
          amount: order.total,
          qrCode: mercadoPagoPayment.qrCodeBase64,
          qrCodeText: mercadoPagoPayment.qrCode,
          paymentUrl: mercadoPagoPayment.ticketUrl
        },
        include: {
          order: {
            include: {
              customer: true
            }
          }
        }
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'WAITING_PAYMENT'
        }
      });

      return payment;
    });
  }

  async handleMercadoPagoWebhook(input: {
    body: Record<string, unknown>;
    query: Record<string, string>;
    requestId?: string;
    signature?: string;
  }) {
    const providerPaymentId = this.extractMercadoPagoPaymentId(input.body, input.query);
    const eventType = this.extractString(input.body.type) ?? input.query.type ?? input.query.topic;

    if (!providerPaymentId) {
      await this.createWebhookEvent({
        status: 'IGNORED',
        providerPaymentId: null,
        eventType,
        requestId: input.requestId,
        payload: input.body,
        errorMessage: 'Notificacao sem id de pagamento.'
      });

      return { received: true };
    }

    const existingEvent = input.requestId
      ? await this.prisma.paymentWebhookEvent.findUnique({
          where: {
            provider_requestId: {
              provider: 'MERCADO_PAGO',
              requestId: input.requestId
            }
          }
        })
      : null;

    if (existingEvent) {
      return { received: true, duplicate: true };
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        provider: 'MERCADO_PAGO',
        providerPaymentId
      },
      include: {
        order: true
      }
    });

    if (!payment) {
      await this.createWebhookEvent({
        status: 'IGNORED',
        providerPaymentId,
        eventType,
        requestId: input.requestId,
        payload: input.body,
        errorMessage: 'Pagamento local nao encontrado.'
      });

      return { received: true };
    }

    const providerConfig = await this.prisma.paymentProviderConfig.findUnique({
      where: {
        tenantId_provider: {
          tenantId: payment.tenantId,
          provider: 'MERCADO_PAGO'
        }
      }
    });

    if (!providerConfig?.accessToken) {
      await this.createWebhookEvent({
        tenantId: payment.tenantId,
        paymentId: payment.id,
        status: 'FAILED',
        providerPaymentId,
        eventType,
        requestId: input.requestId,
        payload: input.body,
        errorMessage: 'Credenciais do Mercado Pago ausentes.'
      });

      return { received: true };
    }

    if (
      providerConfig.webhookSecret &&
      !this.isValidMercadoPagoSignature({
        dataId: providerPaymentId,
        requestId: input.requestId,
        signature: input.signature,
        secret: providerConfig.webhookSecret
      })
    ) {
      await this.createWebhookEvent({
        tenantId: payment.tenantId,
        paymentId: payment.id,
        status: 'FAILED',
        providerPaymentId,
        eventType,
        requestId: input.requestId,
        payload: input.body,
        errorMessage: 'Assinatura invalida.'
      });

      return { received: true };
    }

    const mercadoPagoPayment = await this.getMercadoPagoPayment(
      providerConfig.accessToken,
      providerPaymentId
    );
    const nextStatus = this.mapMercadoPagoStatus(mercadoPagoPayment.status);
    const paidAt = mercadoPagoPayment.date_approved
      ? new Date(mercadoPagoPayment.date_approved)
      : new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: nextStatus,
          paidAt: nextStatus === 'PAID' ? paidAt : payment.paidAt
        }
      });

      if (nextStatus === 'PAID') {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'PAID',
            paidAt
          }
        });
      }

      await tx.paymentWebhookEvent.create({
        data: {
          tenantId: payment.tenantId,
          paymentId: payment.id,
          provider: 'MERCADO_PAGO',
          providerPaymentId,
          eventType,
          requestId: input.requestId,
          status: 'PROCESSED',
          payload: input.body as Prisma.InputJsonValue
        }
      });
    });

    return { received: true };
  }

  private async createMercadoPagoPixPayment(input: {
    accessToken: string;
    amount: number;
    description: string;
    payerEmail: string;
    payerName: string;
    idempotencyKey: string;
  }) {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': input.idempotencyKey
      },
      body: JSON.stringify({
        transaction_amount: input.amount,
        description: input.description,
        payment_method_id: 'pix',
        payer: {
          email: input.payerEmail,
          first_name: input.payerName
        }
      })
    });

    const data = (await response.json().catch(() => ({}))) as {
      id?: string | number;
      message?: string;
      point_of_interaction?: {
        transaction_data?: {
          qr_code?: string;
          qr_code_base64?: string;
          ticket_url?: string;
        };
      };
    };

    if (!response.ok || !data.id) {
      throw new BadRequestException(data.message ?? 'Mercado Pago recusou a geracao do Pix.');
    }

    const transactionData = data.point_of_interaction?.transaction_data;

    return {
      id: data.id,
      qrCode: transactionData?.qr_code,
      qrCodeBase64: transactionData?.qr_code_base64,
      ticketUrl: transactionData?.ticket_url
    };
  }

  private async getMercadoPagoPayment(accessToken: string, providerPaymentId: string) {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${providerPaymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const data = (await response.json().catch(() => ({}))) as {
      status?: string;
      date_approved?: string;
      message?: string;
    };

    if (!response.ok || !data.status) {
      throw new BadRequestException(data.message ?? 'Nao foi possivel consultar o pagamento.');
    }

    return data;
  }

  private extractMercadoPagoPaymentId(
    body: Record<string, unknown>,
    query: Record<string, string>
  ) {
    const data = body.data as { id?: unknown } | undefined;

    return (
      this.extractString(data?.id) ??
      this.extractString(body.id) ??
      query['data.id'] ??
      query.id ??
      null
    );
  }

  private extractString(value: unknown) {
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    return null;
  }

  private mapMercadoPagoStatus(status?: string) {
    if (status === 'approved') {
      return 'PAID';
    }

    if (status === 'cancelled') {
      return 'CANCELED';
    }

    if (status === 'rejected' || status === 'refunded' || status === 'charged_back') {
      return 'FAILED';
    }

    return 'PENDING';
  }

  private isValidMercadoPagoSignature(input: {
    dataId: string;
    requestId?: string;
    signature?: string;
    secret: string;
  }) {
    if (!input.requestId || !input.signature) {
      return false;
    }

    const signatureParts = Object.fromEntries(
      input.signature.split(',').map((part) => {
        const [key, value] = part.split('=').map((item) => item.trim());
        return [key, value];
      })
    );
    const timestamp = signatureParts.ts;
    const expectedSignature = signatureParts.v1;

    if (!timestamp || !expectedSignature) {
      return false;
    }

    const manifest = `id:${input.dataId};request-id:${input.requestId};ts:${timestamp};`;
    const calculatedSignature = createHmac('sha256', input.secret).update(manifest).digest('hex');

    return this.safeEqual(calculatedSignature, expectedSignature);
  }

  private safeEqual(left: string, right: string) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }

  private createWebhookEvent(input: {
    tenantId?: string;
    paymentId?: string;
    status: string;
    providerPaymentId: string | null;
    eventType?: string;
    requestId?: string;
    payload: Record<string, unknown>;
    errorMessage: string;
  }) {
    return this.prisma.paymentWebhookEvent.create({
      data: {
        tenantId: input.tenantId,
        paymentId: input.paymentId,
        provider: 'MERCADO_PAGO',
        providerPaymentId: input.providerPaymentId,
        eventType: input.eventType,
        requestId: input.requestId,
        status: input.status,
        payload: input.payload as Prisma.InputJsonValue,
        errorMessage: input.errorMessage
      }
    });
  }
}
