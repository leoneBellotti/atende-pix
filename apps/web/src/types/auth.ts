export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthTenant = {
  id: string;
  name: string;
  slug: string;
  document?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  aiEnabled?: boolean;
  aiMonthlyLimit?: number;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
  tenant: AuthTenant;
};
