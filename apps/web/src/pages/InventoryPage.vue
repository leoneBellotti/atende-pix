<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { listCatalogItems, updateCatalogItem } from '../services/catalogService';
import type { CatalogItem } from '../types/catalog';

const items = ref<CatalogItem[]>([]);
const errorMessage = ref('');

const trackedItems = computed(() => items.value.filter((item) => item.type === 'PRODUCT'));

onMounted(loadItems);

async function loadItems() {
  items.value = await listCatalogItems({ active: 'true' });
}

async function saveStock(item: CatalogItem, event: Event) {
  const form = new FormData(event.target as HTMLFormElement);

  try {
    await updateCatalogItem(item.id, {
      trackStock: form.get('trackStock') === 'on',
      stockQuantity: Number(form.get('stockQuantity') || 0),
      lowStockThreshold: Number(form.get('lowStockThreshold') || 0)
    });
    await loadItems();
  } catch {
    errorMessage.value = 'Não foi possível atualizar o estoque.';
  }
}

function isLow(item: CatalogItem) {
  return item.trackStock && Number(item.stockQuantity) <= Number(item.lowStockThreshold ?? 0);
}
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold text-ink">Estoque</h1>
      <p class="mt-1 text-sm text-[#667067]">Controle simples de saldo e alerta mínimo para produtos do catálogo.</p>
    </div>

    <p v-if="errorMessage" class="rounded-md border border-[#efc8bd] bg-[#fff7f4] px-3 py-2 text-sm text-coral">
      {{ errorMessage }}
    </p>

    <section class="rounded-md border border-[#dfe4da] bg-white">
      <div class="border-b border-[#edf0ea] px-4 py-3">
        <h2 class="text-base font-semibold">Produtos</h2>
      </div>
      <div v-if="!trackedItems.length" class="px-4 py-8 text-sm text-[#667067]">Cadastre produtos no catálogo para controlar estoque.</div>
      <form v-for="item in trackedItems" :key="item.id" class="grid gap-3 border-b border-[#edf0ea] px-4 py-4 lg:grid-cols-[1fr_140px_140px_120px]" @submit.prevent="saveStock(item, $event)">
        <div>
          <p class="font-semibold text-ink">{{ item.name }}</p>
          <p class="mt-1 text-sm" :class="isLow(item) ? 'text-coral' : 'text-[#667067]'">
            {{ item.trackStock ? `${item.stockQuantity} em estoque` : 'Sem controle ativo' }}
          </p>
        </div>
        <label class="text-sm font-medium">
          Saldo
          <input name="stockQuantity" type="number" min="0" step="0.01" :value="item.stockQuantity" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" />
        </label>
        <label class="text-sm font-medium">
          Mínimo
          <input name="lowStockThreshold" type="number" min="0" step="0.01" :value="item.lowStockThreshold ?? 0" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" />
        </label>
        <div class="flex items-end gap-3">
          <label class="flex items-center gap-2 text-sm">
            <input name="trackStock" type="checkbox" :checked="item.trackStock" />
            Ativo
          </label>
          <button class="rounded-md bg-mint px-3 py-2 text-sm font-semibold text-white" type="submit">Salvar</button>
        </div>
      </form>
    </section>
  </section>
</template>
