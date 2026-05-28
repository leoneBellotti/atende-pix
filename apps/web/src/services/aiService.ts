import { apiClient } from './apiClient';

export type ConversationSummaryResult = {
  conversationId: string;
  provider: string;
  summary: string;
};

export type ReplySuggestionResult = {
  conversationId: string;
  provider: string;
  suggestion: string;
};

export type GeneratedQuoteItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
};

export type AiUsage = {
  enabled: boolean;
  limit: number;
  used: number;
  remaining: number;
  periodStart: string;
};

export async function getAiUsage() {
  const { data } = await apiClient.get<AiUsage>('/ai/usage');
  return data;
}

export async function summarizeConversation(conversationId: string) {
  const { data } = await apiClient.post<ConversationSummaryResult>(
    `/ai/conversations/${conversationId}/summary`
  );

  return data;
}

export async function suggestConversationReply(conversationId: string) {
  const { data } = await apiClient.post<ReplySuggestionResult>(
    `/ai/conversations/${conversationId}/reply-suggestion`
  );

  return data;
}

export async function suggestConversationFollowUp(conversationId: string) {
  const { data } = await apiClient.post<ReplySuggestionResult>(
    `/ai/conversations/${conversationId}/follow-up-suggestion`
  );

  return data;
}

export async function generateQuoteItemsFromText(text: string) {
  const { data } = await apiClient.post<{ provider: string; items: GeneratedQuoteItem[] }>(
    '/ai/quote-items',
    { text }
  );

  return data;
}
