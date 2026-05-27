import { apiClient } from './apiClient';
import type { PaymentRecord } from '../types/payment';

export async function listPayments() {
  const { data } = await apiClient.get<PaymentRecord[]>('/payments');
  return data;
}
