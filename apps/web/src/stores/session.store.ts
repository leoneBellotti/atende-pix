import { defineStore } from 'pinia';

export const useSessionStore = defineStore('session', {
  state: () => ({
    tenantName: 'Assistencia tecnica Modelo',
    userName: 'Dono'
  })
});
