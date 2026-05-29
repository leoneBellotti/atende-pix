import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: {
        tenantId,
        status
      },
      include: {
        customer: true,
        quote: true,
        items: true,
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async create(tenantId: string, input: CreateOrderDto) {
    await this.ensureCustomerBelongsToTenant(tenantId, input.customerId);
    const number = await this.nextOrderNumber(tenantId);
    const total = this.calculateTotal(input.items);

    return this.prisma.order.create({
      data: {
        tenantId,
        customerId: input.customerId,
        number,
        status: 'OPEN',
        total,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        items: {
          create: input.items.map((item) => this.toOrderItemCreate(item))
        }
      },
      include: this.includeRelations()
    });
  }

  async convertQuoteToOrder(tenantId: string, quoteId: string) {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id: quoteId,
        tenantId
      },
      include: {
        items: true,
        order: true
      }
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado para conversão.');
    }

    if (quote.order) {
      throw new ConflictException('Este orçamento já foi convertido em pedido.');
    }

    const number = await this.nextOrderNumber(tenantId);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          tenantId,
          customerId: quote.customerId,
          quoteId: quote.id,
          number,
          status: 'WAITING_PAYMENT',
          total: quote.total,
          items: {
            create: quote.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              total: item.total,
              notes: item.notes
            }))
          }
        },
        include: this.includeRelations()
      });

      await tx.quote.update({
        where: { id: quote.id },
        data: { status: 'CONVERTED' }
      });

      return order;
    });
  }

  async getById(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        tenantId
      },
      include: this.includeRelations()
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    return order;
  }

  async updateStatus(tenantId: string, id: string, status: OrderStatus) {
    await this.getById(tenantId, id);

    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : undefined
      },
      include: this.includeRelations()
    });
  }

  calculateTotal(items: CreateOrderDto['items']) {
    return items.reduce((total, item) => {
      const quantity = new Prisma.Decimal(item.quantity);
      const unitPrice = new Prisma.Decimal(item.unitPrice);
      const discount = new Prisma.Decimal(item.discount ?? 0);

      return total.plus(quantity.mul(unitPrice).minus(discount));
    }, new Prisma.Decimal(0));
  }

  private toOrderItemCreate(item: CreateOrderDto['items'][number]) {
    const quantity = new Prisma.Decimal(item.quantity);
    const unitPrice = new Prisma.Decimal(item.unitPrice);
    const discount = new Prisma.Decimal(item.discount ?? 0);

    return {
      description: item.description,
      quantity,
      unitPrice,
      discount,
      total: quantity.mul(unitPrice).minus(discount),
      notes: item.notes
    };
  }

  private async ensureCustomerBelongsToTenant(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId
      }
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado para este pedido.');
    }
  }

  private async nextOrderNumber(tenantId: string) {
    const result = await this.prisma.order.aggregate({
      where: { tenantId },
      _max: {
        number: true
      }
    });

    return (result._max.number ?? 0) + 1;
  }

  private includeRelations() {
    return {
      customer: true,
      quote: true,
      items: true,
      payments: true
    } satisfies Prisma.OrderInclude;
  }
}
