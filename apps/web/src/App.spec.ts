import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { describe, expect, it } from 'vitest';
import App from './App.vue';
import DashboardPage from './pages/DashboardPage.vue';
import PlaceholderPage from './pages/PlaceholderPage.vue';

describe('App', () => {
  it('renders the dashboard shell', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: DashboardPage },
        { path: '/attendances', component: PlaceholderPage },
        { path: '/customers', component: PlaceholderPage },
        { path: '/catalog', component: PlaceholderPage },
        { path: '/quotes', component: PlaceholderPage }
      ]
    });
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
