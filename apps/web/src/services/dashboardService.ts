import { apiClient } from './apiClient';
import type { DashboardSummary } from '../types/dashboard';

export async function getDashboardSummary() {
  const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary');
  return data;
}
