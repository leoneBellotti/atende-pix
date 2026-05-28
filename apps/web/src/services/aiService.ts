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
