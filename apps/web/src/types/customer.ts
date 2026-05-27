import type { Attendance } from './attendance';
import type { Order } from './order';
import type { Quote } from './quote';

export type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  document?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerDetail = Customer & {
  attendances: Array<Omit<Attendance, 'customer'>>;
  quotes: Array<Omit<Quote, 'customer' | 'attendance'> & { attendance?: null }>;
  orders: Array<Omit<Order, 'customer' | 'quote'> & { quote?: null }>;
};

export type CreateCustomerInput = {
  name: string;
  phone?: string;
  email?: string;
  document?: string;
  notes?: string;
};
