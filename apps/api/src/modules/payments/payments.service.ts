import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
}
