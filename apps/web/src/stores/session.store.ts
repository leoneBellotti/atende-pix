import { defineStore } from 'pinia';
import { apiClient } from '../services/apiClient';
import type { AuthResponse, AuthTenant, AuthUser } from '../types/auth';

export const useSessionStore = defineStore('session', {
  state: () => ({
    accessToken: localStorage.getItem('atende-pix:access-token'),
    user: readJson<AuthUser>('atende-pix:user'),
    tenant: readJson<AuthTenant>('atende-pix:tenant')
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken),
    tenantName: (state) => state.tenant?.name ?? 'AtendePix',
    userName: (state) => state.user?.name ?? 'Usuario'
  },
  actions: {
    async login(input: { email: string; password: string }) {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', input);
      this.setSession(data);
    },
    async register(input: {
      tenantName: string;
      tenantPhone?: string;
      userName: string;
      email: string;
      password: string;
    }) {
      const { data } = await apiClient.post<AuthResponse>('/auth/register', input);
      this.setSession(data);
    },
    logout() {
      this.accessToken = null;
      this.user = null;
      this.tenant = null;
      localStorage.removeItem('atende-pix:access-token');
      localStorage.removeItem('atende-pix:user');
      localStorage.removeItem('atende-pix:tenant');
    },
    updateTenant(tenant: AuthTenant) {
      this.tenant = tenant;
      localStorage.setItem('atende-pix:tenant', JSON.stringify(tenant));
    },
    setSession(auth: AuthResponse) {
      this.accessToken = auth.accessToken;
      this.user = auth.user;
      this.tenant = auth.tenant;
      localStorage.setItem('atende-pix:access-token', auth.accessToken);
      localStorage.setItem('atende-pix:user', JSON.stringify(auth.user));
      localStorage.setItem('atende-pix:tenant', JSON.stringify(auth.tenant));
    }
  }
});

function readJson<T>(key: string): T | null {
  const value = localStorage.getItem(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}
