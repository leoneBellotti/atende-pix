import { createRouter, createWebHistory } from 'vue-router';
import DashboardPage from '../pages/DashboardPage.vue';
import PlaceholderPage from '../pages/PlaceholderPage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: DashboardPage },
    {
      path: '/attendances',
      component: PlaceholderPage,
      props: { title: 'Atendimentos' }
    },
    { path: '/customers', component: PlaceholderPage, props: { title: 'Clientes' } },
    { path: '/catalog', component: PlaceholderPage, props: { title: 'Catalogo' } },
    { path: '/quotes', component: PlaceholderPage, props: { title: 'Orcamentos' } }
  ]
});
