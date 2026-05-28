import { apiClient } from './apiClient';
import type { AutomationLog, AutomationRule, CreateAutomationRuleInput } from '../types/automation';

export async function listAutomationRules() {
  const { data } = await apiClient.get<AutomationRule[]>('/automations/rules');
  return data;
}

export async function createAutomationRule(input: CreateAutomationRuleInput) {
  const { data } = await apiClient.post<AutomationRule>('/automations/rules', input);
  return data;
}

export async function updateAutomationRule(id: string, input: Partial<CreateAutomationRuleInput>) {
  const { data } = await apiClient.patch<AutomationRule>(`/automations/rules/${id}`, input);
  return data;
}

export async function listAutomationLogs() {
  const { data } = await apiClient.get<AutomationLog[]>('/automations/logs');
  return data;
}

export async function processExpiringQuoteReminders() {
  const { data } = await apiClient.post<{ scheduled: number }>('/automations/process/quote-expiring');
  return data;
}
