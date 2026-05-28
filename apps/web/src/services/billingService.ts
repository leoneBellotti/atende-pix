import { apiClient } from './apiClient';
import type { BillingUsage, Subscription, SubscriptionCheckout, SubscriptionPlan } from '../types/billing';

export async function listPlans() {
  const { data } = await apiClient.get<SubscriptionPlan[]>('/billing/plans');
  return data;
}

export async function getSubscription() {
  const { data } = await apiClient.get<Subscription | null>('/billing/subscription');
  return data;
}

export async function getBillingUsage() {
  const { data } = await apiClient.get<BillingUsage>('/billing/usage');
  return data;
}

export async function selectPlan(planCode: string) {
  const { data } = await apiClient.post<Subscription>('/billing/subscription', { planCode });
  return data;
}

export async function startSubscriptionCheckout(planCode: string) {
  const { data } = await apiClient.post<SubscriptionCheckout>('/billing/subscription/checkout', { planCode });
  return data;
}

export async function confirmSubscriptionCheckout(checkoutId: string) {
  const { data } = await apiClient.post<Subscription>(`/billing/subscription/checkout/${checkoutId}/confirm`);
  return data;
}

export async function cancelSubscription(reason?: string) {
  const { data } = await apiClient.post<Subscription>('/billing/subscription/cancel', { reason });
  return data;
}

export async function reactivateSubscription() {
  const { data } = await apiClient.post<Subscription>('/billing/subscription/reactivate');
  return data;
}
