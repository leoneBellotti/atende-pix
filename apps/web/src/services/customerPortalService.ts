import type { Appointment } from './appointmentsService';
import { apiClient } from './apiClient';

export type CustomerPortalRecord = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  document?: string | null;
  tenant: {
    name: string;
    phone?: string | null;
    logoUrl?: string | null;
  };
  quotes: Array<{
    id: string;
    number: number;
    status: string;
    total: string;
    publicToken: string;
    validUntil?: string | null;
    createdAt: string;
  }>;
  orders: Array<{
    id: string;
    number: number;
    status: string;
    total: string;
    paidAt?: string | null;
    createdAt: string;
    payments: Array<{
      id: string;
      status: string;
      amount: string;
      publicToken?: string | null;
    }>;
  }>;
  appointments: Appointment[];
};

export async function lookupCustomerPortal(params: { tenantSlug?: string; document?: string; phone?: string }) {
  const response = await apiClient.get<CustomerPortalRecord>('/public/customer-portal', { params });
  return response.data;
}
