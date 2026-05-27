import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { describe, expect, it } from 'vitest';
import App from './App.vue';
import DashboardPage from './pages/DashboardPage.vue';
import LoginPage from './pages/LoginPage.vue';
import PlaceholderPage from './pages/PlaceholderPage.vue';

describe('App', () => {
  it('renders the dashboard shell', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/login', component: LoginPage },
        { path: '/', component: DashboardPage, meta: { requiresAuth: true } },
        { path: '/attendances', component: PlaceholderPage, meta: { requiresAuth: true } },
        { path: '/customers', component: PlaceholderPage, meta: { requiresAuth: true } },
        { path: '/catalog', component: PlaceholderPage, meta: { requiresAuth: true } },
        { path: '/orders', component: PlaceholderPage, meta: { requiresAuth: true } },
        { path: '/payments', component: PlaceholderPage, meta: { requiresAuth: true } },
        { path: '/reports', component: PlaceholderPage, meta: { requiresAuth: true } },
        { path: '/settings', component: PlaceholderPage, meta: { requiresAuth: true } },
        { path: '/quotes', component: PlaceholderPage, meta: { requiresAuth: true } }
      ]
    });
    localStorage.setItem('atende-pix:access-token', 'test-token');
    router.push('/');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router]
      }
    });

    expect(wrapper.text()).toContain('AtendePix');
    expect(wrapper.text()).toContain('Dashboard');
  });
});
