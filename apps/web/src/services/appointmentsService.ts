import type { Customer } from '../types/customer';
import type { Order } from '../types/order';
import { apiClient } from './apiClient';
import type { LocationRecord } from './locationsService';

export type AppointmentStatus = 'SCHEDULED' | 'DONE' | 'CANCELED' | 'NO_SHOW';

export type Appointment = {
  id: string;
  customerId: string;
  locationId?: string | null;
  orderId?: string | null;
  title: string;
  notes?: string | null;
  responsibleName?: string | null;
  status: AppointmentStatus;
  startsAt: string;
  endsAt?: string | null;
  customer: Customer;
  location?: LocationRecord | null;
  order?: Order | null;
};

export async function listAppointments(params: { status?: string; from?: string; to?: string } = {}) {
  const response = await apiClient.get<Appointment[]>('/appointments', { params });
  return response.data;
}

export async function createAppointment(input: {
  customerId: string;
  locationId?: string;
  orderId?: string;
  title: string;
  notes?: string;
  responsibleName?: string;
  startsAt: string;
  endsAt?: string;
}) {
  const response = await apiClient.post<Appointment>('/appointments', input);
  return response.data;
}

export async function updateAppointment(id: string, input: Partial<Appointment>) {
  const response = await apiClient.patch<Appointment>(`/appointments/${id}`, input);
  return response.data;
}
