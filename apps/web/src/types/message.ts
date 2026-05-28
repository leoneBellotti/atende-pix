import type { Customer } from './customer';

export type MessageDirection = 'INBOUND' | 'OUTBOUND';

export type ConversationSummary = {
  id: string;
  customer?: Pick<Customer, 'id' | 'name' | 'phone'> | null;
  contactName?: string | null;
  phone?: string | null;
  lastMessage: {
    id: string;
    direction: MessageDirection;
    type?: string | null;
    status?: string | null;
    statusAt?: string | null;
    failureReason?: string | null;
    body?: string | null;
    sentAt?: string | null;
    createdAt: string;
  };
};

export type MessageTemplate = {
  id: string;
  name: string;
  category: string;
  body: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
