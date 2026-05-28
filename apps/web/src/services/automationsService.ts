import { apiClient } from './apiClient';
import type { AutomationRule, CreateAutomationRuleInput } from '../types/automation';

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
