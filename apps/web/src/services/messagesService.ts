import { apiClient } from './apiClient';
import type { ConversationSummary } from '../types/message';

export async function listConversations() {
  const { data } = await apiClient.get<ConversationSummary[]>('/messages');
  return data;
}
