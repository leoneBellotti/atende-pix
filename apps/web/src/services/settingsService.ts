import { apiClient } from './apiClient';
import type { AuthTenant } from '../types/auth';

export type UpdateTenantSettingsInput = {
  name?: string;
  document?: string;
  phone?: string;
  logoUrl?: string;
};

export async function getTenantSettings() {
  const { data } = await apiClient.get<AuthTenant>('/tenant/settings');
  return data;
}

export async function updateTenantSettings(input: UpdateTenantSettingsInput) {
  const { data } = await apiClient.patch<AuthTenant>('/tenant/settings', input);
  return data;
}
