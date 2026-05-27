import { createRouter, createWebHistory } from 'vue-router';
import AttendancesPage from '../pages/AttendancesPage.vue';
import CatalogPage from '../pages/CatalogPage.vue';
import CustomersPage from '../pages/CustomersPage.vue';
import DashboardPage from '../pages/DashboardPage.vue';
import LoginPage from '../pages/LoginPage.vue';
import PlaceholderPage from '../pages/PlaceholderPage.vue';
import RegisterPage from '../pages/RegisterPage.vue';
import { useSessionStore } from '../stores/session.store';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginPage },
    { path: '/register', component: RegisterPage },
    { path: '/', component: DashboardPage, meta: { requiresAuth: true } },
    {
      path: '/attendances',
      component: AttendancesPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/customers',
      component: CustomersPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/catalog',
      component: CatalogPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/quotes',
      component: PlaceholderPage,
      props: { title: 'Orcamentos' },
      meta: { requiresAuth: true }
    }
  ]
});

router.beforeEach((to) => {
  const sessionStore = useSessionStore();

  if (to.meta.requiresAuth && !sessionStore.isAuthenticated) {
    return '/login';
  }

  if ((to.path === '/login' || to.path === '/register') && sessionStore.isAuthenticated) {
    return '/';
  }

  return true;
});
