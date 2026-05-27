import { apiClient } from './apiClient';
import type { CreateCustomerInput, Customer, CustomerDetail } from '../types/customer';

export async function listCustomers(search?: string) {
  const { data } = await apiClient.get<Customer[]>('/customers', {
    params: {
      search: search || undefined
    }
  });

  return data;
}

export async function createCustomer(input: CreateCustomerInput) {
  const { data } = await apiClient.post<Customer>('/customers', input);
  return data;
}

export async function getCustomer(id: string) {
  const { data } = await apiClient.get<CustomerDetail>(`/customers/${id}`);
  return data;
}
