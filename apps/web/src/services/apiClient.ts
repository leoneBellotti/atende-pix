import axios from 'axios';

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
