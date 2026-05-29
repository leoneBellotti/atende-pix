import { apiClient } from './apiClient';

export type LocationRecord = {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  active: boolean;
};

export async function listLocations() {
  const response = await apiClient.get<LocationRecord[]>('/locations');
  return response.data;
}

export async function createLocation(input: {
  name: string;
  phone?: string;
  address?: string;
  active?: boolean;
}) {
  const response = await apiClient.post<LocationRecord>('/locations', input);
  return response.data;
}

export async function updateLocation(id: string, input: Partial<LocationRecord>) {
  const response = await apiClient.patch<LocationRecord>(`/locations/${id}`, input);
  return response.data;
}
