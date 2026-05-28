import { apiClient } from './apiClient';

export type ConversationSummaryResult = {
  conversationId: string;
  provider: string;
  summary: string;
};

export async function summarizeConversation(conversationId: string) {
  const { data } = await apiClient.post<ConversationSummaryResult>(
    `/ai/conversations/${conversationId}/summary`
  );

  return data;
}
