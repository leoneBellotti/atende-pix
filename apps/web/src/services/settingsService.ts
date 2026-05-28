import { apiClient } from './apiClient';
import type { AuthTenant } from '../types/auth';

export type UpdateTenantSettingsInput = {
  name?: string;
  document?: string;
  phone?: string;
  logoUrl?: string;
  aiEnabled?: boolean;
  aiMonthlyLimit?: number;
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

export type WhatsAppConfig = {
  active: boolean;
  phoneNumberId?: string | null;
  businessAccountId?: string | null;
  hasAccessToken: boolean;
  hasVerifyToken: boolean;
  hasAppSecret: boolean;
  updatedAt?: string;
};

export type UpdateWhatsAppConfigInput = {
  active?: boolean;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
  verifyToken?: string;
  appSecret?: string;
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

export async function getWhatsAppConfig() {
  const { data } = await apiClient.get<WhatsAppConfig>('/tenant/settings/whatsapp');
  return data;
}

export async function updateWhatsAppConfig(input: UpdateWhatsAppConfigInput) {
  const { data } = await apiClient.patch<WhatsAppConfig>('/tenant/settings/whatsapp', input);
  return data;
}
