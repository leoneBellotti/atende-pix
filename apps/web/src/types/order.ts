import type { Customer } from './customer';
import type { Quote } from './quote';

export type OrderStatus =
  | 'OPEN'
  | 'WAITING_PAYMENT'
  | 'PAID'
  | 'IN_PROGRESS'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELED';

export type OrderItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  total: string;
};

export type Payment = {
  id: string;
  status: 'PENDING' | 'PAID' | 'CANCELED' | 'FAILED';
  provider: 'MANUAL' | 'MERCADO_PAGO';
  amount: string;
  paidAt?: string | null;
};

export type Order = {
  id: string;
  customerId: string;
  quoteId?: string | null;
  number: number;
  status: OrderStatus;
  total: string;
  dueDate?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  quote?: Quote | null;
  items: OrderItem[];
  payments: Payment[];
};
