export type AutomationTrigger = 'QUOTE_SENT' | 'QUOTE_EXPIRING' | 'PAYMENT_PENDING' | 'ORDER_READY';

export type AutomationRule = {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  delayHours: number;
  messageBody: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAutomationRuleInput = {
  name: string;
  trigger: AutomationTrigger;
  delayHours: number;
  messageBody: string;
  active?: boolean;
};

export type AutomationLog = {
  id: string;
  ruleId?: string | null;
  targetType: string;
  targetId: string;
  status: string;
  scheduledFor?: string | null;
  executedAt?: string | null;
  message?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  rule?: AutomationRule | null;
};
