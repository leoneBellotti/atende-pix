import axios from 'axios';

const sessionStorageKeys = ['atende-pix:access-token', 'atende-pix:user', 'atende-pix:tenant'];

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('atende-pix:access-token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthRequest) {
      sessionStorageKeys.forEach((key) => localStorage.removeItem(key));

      if (import.meta.env.MODE !== 'test' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);
