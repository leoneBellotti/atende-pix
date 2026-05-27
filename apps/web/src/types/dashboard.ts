import type { OrderStatus } from './order';

export type DashboardSummary = {
  revenueThisMonth: number;
  pendingAmount: number;
  pendingOrders: number;
  sentQuotes: number;
  quoteConversionRate: number;
  openAttendances: number;
  ordersByStatus: Array<{
    status: OrderStatus;
    count: number;
  }>;
};
