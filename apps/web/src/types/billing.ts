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
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  renewsAt?: string | null;
  pastDueAt?: string | null;
  suspendedAt?: string | null;
  canceledAt?: string | null;
  cancellationReason?: string | null;
  cancelAtPeriodEnd?: boolean;
  paymentProvider?: string | null;
  paymentMethod?: string | null;
  plan: SubscriptionPlan;
};

export type SubscriptionCheckout = {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  provider: string;
  amount: string;
  publicToken: string;
  checkoutUrl?: string | null;
  paidAt?: string | null;
  expiresAt: string;
  plan: SubscriptionPlan;
};

export type BillingUsageLimit = {
  used: number;
  limit?: number | null;
  remaining?: number | null;
};

export type BillingUsage = {
  subscription: Subscription;
  pendingCheckout?: SubscriptionCheckout | null;
  trial?: {
    status: string;
    startedAt: string;
    endsAt: string;
    daysTotal: number;
    daysRemaining: number;
    expired: boolean;
  } | null;
  delinquency?: {
    status: string;
    pastDueAt?: string | null;
    suspendedAt?: string | null;
    graceEndsAt?: string | null;
    graceDays: number;
    daysRemaining: number;
    suspended: boolean;
  } | null;
  limits: {
    quotes: BillingUsageLimit;
    users: BillingUsageLimit;
    ai: {
      limit: number;
    };
  };
};
