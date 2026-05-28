import { apiClient } from './apiClient';
import type { Subscription, SubscriptionPlan } from '../types/billing';

export async function listPlans() {
  const { data } = await apiClient.get<SubscriptionPlan[]>('/billing/plans');
  return data;
}

export async function getSubscription() {
  const { data } = await apiClient.get<Subscription | null>('/billing/subscription');
  return data;
}

export async function selectPlan(planCode: string) {
  const { data } = await apiClient.post<Subscription>('/billing/subscription', { planCode });
  return data;
}
