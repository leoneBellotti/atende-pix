import { apiClient } from './apiClient';
import type { CatalogItem, CatalogItemType, CreateCatalogItemInput } from '../types/catalog';

export async function listCatalogItems(filters: {
  search?: string;
  type?: CatalogItemType | '';
  active?: string;
}) {
  const { data } = await apiClient.get<CatalogItem[]>('/catalog/items', {
    params: {
      search: filters.search || undefined,
      type: filters.type || undefined,
      active: filters.active || undefined
    }
  });

  return data;
}

export async function createCatalogItem(input: CreateCatalogItemInput) {
  const { data } = await apiClient.post<CatalogItem>('/catalog/items', input);
  return data;
}

export async function disableCatalogItem(id: string) {
  const { data } = await apiClient.delete<{ deleted: boolean }>(`/catalog/items/${id}`);
  return data;
}

export async function setCatalogItemActive(id: string, active: boolean) {
  const { data } = await apiClient.patch<CatalogItem>(`/catalog/items/${id}`, { active });
  return data;
}
