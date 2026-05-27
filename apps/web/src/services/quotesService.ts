import { apiClient } from './apiClient';
import type { CreateQuoteInput, Quote } from '../types/quote';

export async function listQuotes() {
  const { data } = await apiClient.get<Quote[]>('/quotes');
  return data;
}

export async function createQuote(input: CreateQuoteInput) {
  const { data } = await apiClient.post<Quote>('/quotes', input);
  return data;
}
