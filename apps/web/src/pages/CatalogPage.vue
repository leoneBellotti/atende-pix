<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  createCatalogItem,
  disableCatalogItem,
  listCatalogItems,
  setCatalogItemActive
} from '../services/catalogService';
import type { CatalogItem, CatalogItemType } from '../types/catalog';

const items = ref<CatalogItem[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');

const filters = reactive({
  search: '',
  type: '' as CatalogItemType | '',
  active: 'true'
});

const form = reactive({
  type: 'SERVICE' as CatalogItemType,
  name: '',
  description: '',
  price: 0
});

const hasItems = computed(() => items.value.length > 0);

onMounted(() => {
  loadItems();
});

async function loadItems() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    items.value = await listCatalogItems(filters);
  } catch {
    errorMessage.value = 'Não foi possível carregar o catálogo.';
  } finally {
    isLoading.value = false;
  }
}

async function submit() {
  errorMessage.value = '';
  isSaving.value = true;

  try {
    await createCatalogItem({
      type: form.type,
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price)
    });
    resetForm();
    await loadItems();
  } catch {
    errorMessage.value = 'Não foi possível salvar. Verifique se já existe item com esse nome.';
  } finally {
    isSaving.value = false;
  }
}

async function disableItem(item: CatalogItem) {
  errorMessage.value = '';

  try {
    await disableCatalogItem(item.id);
    await loadItems();
  } catch {
    errorMessage.value = 'Não foi possível desativar o item.';
  }
}

async function activateItem(item: CatalogItem) {
  errorMessage.value = '';

  try {
    await setCatalogItemActive(item.id, true);
    await loadItems();
  } catch {
    errorMessage.value = 'Não foi possível ativar o item.';
  }
}

function resetForm() {
  form.type = 'SERVICE';
  form.name = '';
  form.description = '';
  form.price = 0;
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value));
}

function typeLabel(type: CatalogItemType) {
  return type === 'SERVICE' ? 'Serviço' : 'Produto';
}
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-ink">Catálogo</h1>
        <p class="mt-1 text-sm text-[#667067]">
          Produtos e serviços reutilizaveis para montar orçamentos com rapidez.
        </p>
      </div>
      <form class="grid gap-2 sm:grid-cols-[1fr_140px_120px_auto]" @submit.prevent="loadItems">
        <input
          v-model="filters.search"
          class="rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
          placeholder="Buscar no catálogo"
        />
        <select
          v-model="filters.type"
          class="rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
        >
          <option value="">Todos</option>
          <option value="SERVICE">Serviços</option>
          <option value="PRODUCT">Produtos</option>
        </select>
        <select
          v-model="filters.active"
          class="rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
        >
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
          <option value="">Todos</option>
        </select>
        <button
          class="rounded-md border border-[#cfd7ce] bg-white px-4 py-2 text-sm font-semibold text-[#465047] hover:bg-[#edf3ee]"
          type="submit"
        >
          Filtrar
        </button>
      </form>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-md border border-[#efc8bd] bg-[#fff7f4] px-3 py-2 text-sm text-coral"
    >
      {{ errorMessage }}
    </p>

    <div class="grid gap-4 xl:grid-cols-[360px_1fr]">
      <form class="rounded-md border border-[#dfe4da] bg-white p-4" @submit.prevent="submit">
        <h2 class="text-base font-semibold">Novo item</h2>
        <div class="mt-4 grid grid-cols-2 rounded-md border border-[#cfd7ce] bg-[#f7f8f5] p-1">
          <button
            class="rounded px-3 py-2 text-sm font-semibold"
            :class="
              form.type === 'SERVICE' ? 'bg-white text-[#11644f] shadow-sm' : 'text-[#667067]'
            "
            type="button"
            @click="form.type = 'SERVICE'"
          >
            Serviço
          </button>
          <button
            class="rounded px-3 py-2 text-sm font-semibold"
            :class="
              form.type === 'PRODUCT' ? 'bg-white text-[#11644f] shadow-sm' : 'text-[#667067]'
            "
            type="button"
            @click="form.type = 'PRODUCT'"
          >
            Produto
          </button>
        </div>
        <label class="mt-4 block text-sm font-medium">
          Nome
          <input
            v-model="form.name"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            required
          />
        </label>
        <label class="mt-4 block text-sm font-medium">
          Preco
          <input
            v-model.number="form.price"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            min="0"
            step="0.01"
            type="number"
            required
          />
        </label>
        <label class="mt-4 block text-sm font-medium">
          Descricao
          <textarea
            v-model="form.description"
            class="mt-2 min-h-24 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
          />
        </label>
        <button
          class="mt-5 w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:opacity-60"
          type="submit"
          :disabled="isSaving"
        >
          {{ isSaving ? 'Salvando...' : 'Salvar item' }}
        </button>
      </form>

      <section class="overflow-hidden rounded-md border border-[#dfe4da] bg-white">
        <div class="flex items-center justify-between border-b border-[#edf0ea] px-4 py-3">
          <h2 class="text-base font-semibold">Itens cadastrados</h2>
          <span class="text-xs text-[#667067]">{{ items.length }} encontrados</span>
        </div>

        <div v-if="isLoading" class="px-4 py-8 text-sm text-[#667067]">Carregando catálogo...</div>
        <div v-else-if="!hasItems" class="px-4 py-8 text-sm text-[#667067]">
          Nenhum item encontrado.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[760px] text-left text-sm">
            <thead class="bg-[#f7f8f5] text-xs uppercase text-[#667067]">
              <tr>
                <th class="px-4 py-3 font-semibold">Item</th>
                <th class="px-4 py-3 font-semibold">Tipo</th>
                <th class="px-4 py-3 font-semibold">Preco</th>
                <th class="px-4 py-3 font-semibold">Status</th>
                <th class="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#edf0ea]">
              <tr v-for="item in items" :key="item.id">
                <td class="px-4 py-3">
                  <p class="font-medium text-ink">{{ item.name }}</p>
                  <p class="mt-1 max-w-md truncate text-xs text-[#667067]">
                    {{ item.description || 'Sem descricao' }}
                  </p>
                </td>
                <td class="px-4 py-3 text-[#465047]">{{ typeLabel(item.type) }}</td>
                <td class="px-4 py-3 font-medium text-[#465047]">
                  {{ formatCurrency(item.price) }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="rounded px-2 py-1 text-xs font-semibold"
                    :class="
                      item.active ? 'bg-[#dcebe3] text-[#11644f]' : 'bg-[#edf0ea] text-[#667067]'
                    "
                  >
                    {{ item.active ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    v-if="item.active"
                    class="rounded-md border border-[#dfe4da] px-3 py-1.5 text-xs font-semibold text-[#465047] hover:bg-[#edf3ee]"
                    type="button"
                    @click="disableItem(item)"
                  >
                    Desativar
                  </button>
                  <button
                    v-else
                    class="rounded-md bg-mint px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#176d58]"
                    type="button"
                    @click="activateItem(item)"
                  >
                    Ativar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </section>
</template>
