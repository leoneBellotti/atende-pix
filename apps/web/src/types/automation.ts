export type AutomationTrigger = 'QUOTE_SENT' | 'PAYMENT_PENDING' | 'ORDER_READY';

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
