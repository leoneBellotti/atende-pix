import { randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, QuoteStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.quote.findMany({
      where: { tenantId },
      include: {
        customer: true,
        tenant: true,
        attendance: true,
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async create(tenantId: string, input: CreateQuoteDto) {
    await this.ensureCustomerBelongsToTenant(tenantId, input.customerId);

    if (input.attendanceId) {
      await this.ensureAttendanceBelongsToTenant(tenantId, input.attendanceId);
    }

    const nextNumber = await this.nextQuoteNumber(tenantId);
    const totals = this.calculateTotals(input.items);

    return this.prisma.quote.create({
      data: {
        tenantId,
        customerId: input.customerId,
        attendanceId: input.attendanceId,
        number: nextNumber,
        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,
        validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
        publicToken: this.createPublicToken(),
        items: {
          create: input.items.map((item) => {
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
          })
        }
      },
      include: {
        customer: true,
        tenant: true,
        attendance: true,
        items: true
      }
    });
  }

  async getById(tenantId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        customer: true,
        tenant: true,
        attendance: true,
        items: true
      }
    });

    if (!quote) {
      throw new NotFoundException('Orcamento nao encontrado.');
    }

    return quote;
  }

  async updateStatus(tenantId: string, id: string, status: QuoteStatus) {
    await this.getById(tenantId, id);

    return this.prisma.quote.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        tenant: true,
        attendance: true,
        items: true
      }
    });
  }

  async getPublicByToken(publicToken: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { publicToken },
      include: {
        customer: true,
        tenant: true,
        items: true
      }
    });

    if (!quote) {
      throw new NotFoundException('Orcamento publico nao encontrado.');
    }

    return quote;
  }

  calculateTotals(items: CreateQuoteDto['items']) {
    return items.reduce(
      (totals, item) => {
        const quantity = new Prisma.Decimal(item.quantity);
        const unitPrice = new Prisma.Decimal(item.unitPrice);
        const discount = new Prisma.Decimal(item.discount ?? 0);
        const lineSubtotal = quantity.mul(unitPrice);

        return {
          subtotal: totals.subtotal.plus(lineSubtotal),
          discount: totals.discount.plus(discount),
          total: totals.total.plus(lineSubtotal.minus(discount))
        };
      },
      {
        subtotal: new Prisma.Decimal(0),
        discount: new Prisma.Decimal(0),
        total: new Prisma.Decimal(0)
      }
    );
  }

  private async nextQuoteNumber(tenantId: string) {
    const result = await this.prisma.quote.aggregate({
      where: { tenantId },
      _max: {
        number: true
      }
    });

    return (result._max.number ?? 0) + 1;
  }

  private async ensureCustomerBelongsToTenant(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId
      }
    });

    if (!customer) {
      throw new NotFoundException('Cliente nao encontrado para este orcamento.');
    }
  }

  private async ensureAttendanceBelongsToTenant(tenantId: string, attendanceId: string) {
    const attendance = await this.prisma.attendance.findFirst({
      where: {
        id: attendanceId,
        tenantId
      }
    });

    if (!attendance) {
      throw new NotFoundException('Atendimento nao encontrado para este orcamento.');
    }
  }

  private createPublicToken() {
    return randomBytes(24).toString('hex');
  }
}
