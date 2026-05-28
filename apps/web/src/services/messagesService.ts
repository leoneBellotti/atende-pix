import { apiClient } from './apiClient';
import type { ConversationSummary } from '../types/message';

export async function listConversations() {
  const { data } = await apiClient.get<ConversationSummary[]>('/messages');
  return data;
}

export async function linkConversationToCustomer(conversationId: string, customerId: string) {
  const { data } = await apiClient.patch<{ linked: boolean; updatedMessages: number }>(
    `/messages/conversations/${conversationId}/customer`,
    { customerId }
  );

  return data;
}
