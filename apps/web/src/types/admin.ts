export type AdminSummary = {
  totalTenants: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  expiredTrials: number;
  subscriptionRevenueThisMonth: number;
  paidCheckoutsThisMonth: number;
  quotesThisMonth: number;
  pixPaymentsThisMonth: number;
};

export type AdminTenant = {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  createdAt: string;
  subscriptionStatus: string;
  planName: string;
  renewsAt?: string | null;
  currentPeriodEnd?: string | null;
  pastDueAt?: string | null;
  suspendedAt?: string | null;
  usage: {
    users: number;
    customers: number;
    quotes: number;
    orders: number;
    payments: number;
  };
};

export type AdminStatus = {
  isAdmin: boolean;
};

export type AdminErrorLog = {
  timestamp?: string | null;
  environment?: string;
  statusCode?: number;
  method?: string;
  path?: string;
  userId?: string;
  tenantId?: string;
  message?: string;
  stack?: string;
  raw?: boolean;
};
