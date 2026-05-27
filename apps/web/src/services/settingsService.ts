import { apiClient } from './apiClient';
import type { AuthTenant } from '../types/auth';

export type UpdateTenantSettingsInput = {
  name?: string;
  document?: string;
  phone?: string;
  logoUrl?: string;
};

export type PaymentProviderConfig = {
  provider: 'MERCADO_PAGO';
  active: boolean;
  sandbox: boolean;
  hasAccessToken: boolean;
  hasPublicKey: boolean;
  hasWebhookSecret: boolean;
  updatedAt?: string;
};

export type UpdatePaymentProviderConfigInput = {
  provider?: 'MERCADO_PAGO';
  active?: boolean;
  sandbox?: boolean;
  accessToken?: string;
  publicKey?: string;
  webhookSecret?: string;
};

export async function getTenantSettings() {
  const { data } = await apiClient.get<AuthTenant>('/tenant/settings');
  return data;
}

export async function updateTenantSettings(input: UpdateTenantSettingsInput) {
  const { data } = await apiClient.patch<AuthTenant>('/tenant/settings', input);
  return data;
}

export async function getPaymentProviderConfig() {
  const { data } = await apiClient.get<PaymentProviderConfig>('/tenant/settings/payment-provider');
  return data;
}

export async function updatePaymentProviderConfig(input: UpdatePaymentProviderConfigInput) {
  const { data } = await apiClient.patch<PaymentProviderConfig>(
    '/tenant/settings/payment-provider',
    input
  );
  return data;
}
