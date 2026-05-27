import { apiClient } from './apiClient';
import type { Order, OrderStatus } from '../types/order';

export async function listOrders(status?: OrderStatus | '') {
  const { data } = await apiClient.get<Order[]>('/orders', {
    params: {
      status: status || undefined
    }
  });

  return data;
}

export async function convertQuoteToOrder(quoteId: string) {
  const { data } = await apiClient.post<Order>(`/orders/from-quote/${quoteId}`);
  return data;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { data } = await apiClient.patch<Order>(`/orders/${id}/status`, { status });
  return data;
}

export async function manualConfirmPayment(orderId: string, amount?: number) {
  const { data } = await apiClient.post(`/orders/${orderId}/payments/manual-confirm`, {
    amount
  });
  return data;
}
