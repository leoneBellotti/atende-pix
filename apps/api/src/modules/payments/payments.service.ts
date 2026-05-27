import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
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
}
