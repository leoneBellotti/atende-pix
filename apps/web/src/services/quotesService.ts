import { apiClient } from './apiClient';
import type { CreateQuoteInput, Quote } from '../types/quote';
import type { Order } from '../types/order';

export async function listQuotes() {
  const { data } = await apiClient.get<Quote[]>('/quotes');
  return data;
}

export async function createQuote(input: CreateQuoteInput) {
  const { data } = await apiClient.post<Quote>('/quotes', input);
  return data;
}

export async function convertQuoteToOrder(quoteId: string) {
  const { data } = await apiClient.post<Order>(`/orders/from-quote/${quoteId}`);
  return data;
}
