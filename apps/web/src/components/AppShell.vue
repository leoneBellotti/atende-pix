<script setup lang="ts">
const navigation = [
  { label: 'Dashboard', href: '/' },
  { label: 'Atendimentos', href: '/attendances' },
  { label: 'Clientes', href: '/customers' },
  { label: 'Catalogo', href: '/catalog' },
  { label: 'Orcamentos', href: '/quotes' }
];
</script>

<template>
  <div class="min-h-screen bg-[#f7f8f5] text-ink">
    <aside class="fixed inset-y-0 left-0 hidden w-64 border-r border-[#dfe4da] bg-white lg:block">
      <div class="border-b border-[#dfe4da] px-5 py-5">
        <p class="text-xl font-semibold">AtendePix</p>
        <p class="mt-1 text-sm text-[#667067]">Operacao comercial</p>
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
          <p class="text-sm font-semibold text-[#11644f]">Assistencia tecnica Modelo</p>
          <p class="text-xs text-[#667067]">Ambiente inicial</p>
        </div>
        <button
          class="rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#176d58]"
          type="button"
        >
          Novo orcamento
        </button>
      </header>

      <main class="px-4 py-5 lg:px-6">
        <slot />
      </main>
    </div>
  </div>
</template>
