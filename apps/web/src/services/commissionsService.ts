import type { Order } from '../types/order';
import { apiClient } from './apiClient';

export type SalesCommission = {
  id: string;
  orderId: string;
  salespersonName: string;
  rate: string;
  amount: string;
  paid: boolean;
  paidAt?: string | null;
  createdAt: string;
  order: Order;
};

export async function listCommissions() {
  const response = await apiClient.get<SalesCommission[]>('/commissions');
  return response.data;
}

export async function createCommission(input: {
  orderId: string;
  salespersonName: string;
  rate: number;
  paid?: boolean;
}) {
  const response = await apiClient.post<SalesCommission>('/commissions', input);
  return response.data;
}

export async function markCommissionPaid(id: string) {
  const response = await apiClient.patch<SalesCommission>(`/commissions/${id}/paid`);
  return response.data;
}
