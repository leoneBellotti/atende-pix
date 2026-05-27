export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthTenant = {
  id: string;
  name: string;
  slug: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
  tenant: AuthTenant;
};
