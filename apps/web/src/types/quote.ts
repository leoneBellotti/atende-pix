import type { Attendance } from './attendance';
import type { Customer } from './customer';

export type QuoteStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';

export type QuoteItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  total: string;
  notes?: string | null;
};

export type Quote = {
  id: string;
  customerId: string;
  attendanceId?: string | null;
  number: number;
  status: QuoteStatus;
  subtotal: string;
  discount: string;
  total: string;
  validUntil?: string | null;
  publicToken: string;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  attendance?: Attendance | null;
  items: QuoteItem[];
};

export type CreateQuoteInput = {
  customerId: string;
  attendanceId?: string;
  validUntil?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    notes?: string;
  }>;
};
