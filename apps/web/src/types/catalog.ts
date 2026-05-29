export type CatalogItemType = 'PRODUCT' | 'SERVICE';

export type CatalogItem = {
  id: string;
  type: CatalogItemType;
  name: string;
  description?: string | null;
  price: string;
  active: boolean;
  trackStock: boolean;
  stockQuantity: string;
  lowStockThreshold?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCatalogItemInput = {
  type: CatalogItemType;
  name: string;
  description?: string;
  price: number;
  trackStock?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
};
