export type SubscriptionPlan = {
  id: string;
  code: string;
  name: string;
  monthlyPrice: string;
  quoteLimit?: number | null;
  userLimit?: number | null;
  aiMonthlyLimit: number;
  active: boolean;
};

export type Subscription = {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  startedAt: string;
  renewsAt?: string | null;
  plan: SubscriptionPlan;
};
