import { apiClient } from './apiClient';
import type { PaymentRecord, PaymentWebhookEvent, PublicPayment } from '../types/payment';

export async function listPayments() {
  const { data } = await apiClient.get<PaymentRecord[]>('/payments');
  return data;
}

export async function listPaymentWebhookEvents() {
  const { data } = await apiClient.get<PaymentWebhookEvent[]>('/payments/webhook-events');
  return data;
}

export async function createPixPayment(orderId: string) {
  const { data } = await apiClient.post<PaymentRecord>(`/orders/${orderId}/payments/pix`);
  return data;
}

export async function getPublicPayment(token: string) {
  const { data } = await apiClient.get<PublicPayment>(`/public/payments/${token}`);
  return data;
}
