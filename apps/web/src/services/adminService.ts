import type { AdminErrorLog, AdminStatus, AdminSummary, AdminTenant } from '../types/admin';
import { apiClient } from './apiClient';

export async function getAdminSummary() {
  const { data } = await apiClient.get<AdminSummary>('/admin/summary');
  return data;
}

export async function getAdminStatus() {
  const { data } = await apiClient.get<AdminStatus>('/admin/me');
  return data;
}

export async function listAdminErrorLogs(limit = 100) {
  const { data } = await apiClient.get<AdminErrorLog[]>('/admin/error-logs', {
    params: { limit }
  });
  return data;
}

export async function listAdminTenants() {
  const { data } = await apiClient.get<AdminTenant[]>('/admin/tenants');
  return data;
}

export async function markTenantPastDue(tenantId: string) {
  const { data } = await apiClient.post(`/admin/tenants/${tenantId}/past-due`);
  return data;
}

export async function suspendTenant(tenantId: string) {
  const { data } = await apiClient.post(`/admin/tenants/${tenantId}/suspend`);
  return data;
}

export async function regularizeTenant(tenantId: string) {
  const { data } = await apiClient.post(`/admin/tenants/${tenantId}/regularize`);
  return data;
}
