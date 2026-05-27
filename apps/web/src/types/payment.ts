import type { Customer } from './customer';
import type { OrderStatus } from './order';

export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELED' | 'FAILED';
export type PaymentProvider = 'MANUAL' | 'MERCADO_PAGO';

export type PaymentOrder = {
  id: string;
  number: number;
  status: OrderStatus;
  total: string;
  customer: Customer;
};

export type PaymentRecord = {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  order: PaymentOrder;
};
