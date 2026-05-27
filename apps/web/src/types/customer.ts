export type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  document?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerInput = {
  name: string;
  phone?: string;
  email?: string;
  document?: string;
  notes?: string;
};
