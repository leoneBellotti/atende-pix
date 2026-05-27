import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(tenantId: string) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      paidOrders,
      pendingOrders,
      sentQuotes,
      convertedQuotes,
      openAttendances,
      ordersByStatus
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          tenantId,
          status: 'PAID',
          paidAt: {
            gte: monthStart
          }
        },
        _sum: {
          total: true
        }
      }),
      this.prisma.order.aggregate({
        where: {
          tenantId,
          status: {
            in: ['OPEN', 'WAITING_PAYMENT']
          }
        },
        _sum: {
          total: true
        },
        _count: true
      }),
      this.prisma.quote.count({
        where: {
          tenantId,
          status: {
            in: ['SENT', 'APPROVED', 'CONVERTED']
          }
        }
      }),
      this.prisma.quote.count({
        where: {
          tenantId,
          status: 'CONVERTED'
        }
      }),
      this.prisma.attendance.count({
        where: {
          tenantId,
          status: {
            in: ['NEW', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_PAYMENT']
          }
        }
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true
      })
    ]);

    const quoteConversionRate =
      sentQuotes === 0 ? 0 : Math.round((convertedQuotes / sentQuotes) * 100);

    return {
      revenueThisMonth: this.decimalToNumber(paidOrders._sum.total),
      pendingAmount: this.decimalToNumber(pendingOrders._sum.total),
      pendingOrders: pendingOrders._count,
      sentQuotes,
      quoteConversionRate,
      openAttendances,
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count
      }))
    };
  }

  private decimalToNumber(value: Prisma.Decimal | null | undefined) {
    return value?.toNumber() ?? 0;
  }
}
