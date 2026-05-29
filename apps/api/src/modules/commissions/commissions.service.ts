import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCommissionDto } from './dto/create-commission.dto';

@Injectable()
export class CommissionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.salesCommission.findMany({
      where: { tenantId },
      include: {
        order: {
          include: {
            customer: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(tenantId: string, input: CreateCommissionDto) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: input.orderId,
        tenantId
      }
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado para comissão.');
    }

    const rate = new Prisma.Decimal(input.rate);
    const amount = new Prisma.Decimal(order.total).mul(rate).div(100);

    return this.prisma.salesCommission.create({
      data: {
        tenantId,
        orderId: order.id,
        salespersonName: input.salespersonName,
        rate,
        amount,
        paid: input.paid ?? false,
        paidAt: input.paid ? new Date() : null
      }
    });
  }

  async markPaid(tenantId: string, id: string) {
    const commission = await this.prisma.salesCommission.findFirst({ where: { id, tenantId } });

    if (!commission) {
      throw new NotFoundException('Comissão não encontrada.');
    }

    return this.prisma.salesCommission.update({
      where: { id },
      data: {
        paid: true,
        paidAt: new Date()
      }
    });
  }
}
