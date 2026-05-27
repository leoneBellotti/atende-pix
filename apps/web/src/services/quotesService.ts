import { apiClient } from './apiClient';
import type { CreateQuoteInput, PublicQuote, Quote } from '../types/quote';
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

export async function getPublicQuote(token: string) {
  const { data } = await apiClient.get<PublicQuote>(`/public/quotes/${token}`);
  return data;
}
