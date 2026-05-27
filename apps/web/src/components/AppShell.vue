<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session.store';

const router = useRouter();
const sessionStore = useSessionStore();

const navigation = [
  { label: 'Dashboard', href: '/' },
  { label: 'Atendimentos', href: '/attendances' },
  { label: 'Clientes', href: '/customers' },
  { label: 'Catalogo', href: '/catalog' },
  { label: 'Orcamentos', href: '/quotes' },
  { label: 'Pedidos', href: '/orders' },
  { label: 'Pagamentos', href: '/payments' }
];

function logout() {
  sessionStore.logout();
  router.push('/login');
}
</script>

<template>
  <div class="min-h-screen bg-[#f7f8f5] text-ink">
    <aside class="fixed inset-y-0 left-0 hidden w-64 border-r border-[#dfe4da] bg-white lg:block">
      <div class="border-b border-[#dfe4da] px-5 py-5">
        <p class="text-xl font-semibold">AtendePix</p>
        <p class="mt-1 text-sm text-[#667067]">{{ sessionStore.tenantName }}</p>
      </div>
      <nav class="space-y-1 px-3 py-4">
        <RouterLink
          v-for="item in navigation"
          :key="item.href"
          :to="item.href"
          class="block rounded-md px-3 py-2 text-sm font-medium text-[#465047] hover:bg-[#edf3ee]"
          active-class="bg-[#dcebe3] text-[#11644f]"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <div class="lg:pl-64">
      <header
        class="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#dfe4da] bg-white px-4 lg:px-6"
      >
        <div>
          <p class="text-sm font-semibold text-[#11644f]">{{ sessionStore.tenantName }}</p>
          <p class="text-xs text-[#667067]">{{ sessionStore.userName }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#176d58]"
            type="button"
          >
            Novo orcamento
          </button>
          <button
            class="rounded-md border border-[#dfe4da] px-3 py-2 text-sm font-semibold text-[#465047] hover:bg-[#edf3ee]"
            type="button"
            @click="logout"
          >
            Sair
          </button>
        </div>
      </header>

      <main class="px-4 py-5 lg:px-6">
        <slot />
      </main>
    </div>
  </div>
</template>
