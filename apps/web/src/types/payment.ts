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
  publicToken?: string | null;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: string;
  qrCode?: string | null;
  qrCodeText?: string | null;
  paymentUrl?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  order: PaymentOrder;
};

export type PublicPayment = PaymentRecord & {
  tenant: {
    name: string;
    document?: string | null;
    phone?: string | null;
    logoUrl?: string | null;
  };
};

export type PaymentWebhookEvent = {
  id: string;
  provider: PaymentProvider;
  providerPaymentId?: string | null;
  eventType?: string | null;
  requestId?: string | null;
  status: string;
  errorMessage?: string | null;
  createdAt: string;
  payment?: PaymentRecord | null;
};
