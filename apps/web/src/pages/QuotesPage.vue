<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { listAttendances } from '../services/attendancesService';
import { generateQuoteItemsFromText } from '../services/aiService';
import { listCatalogItems } from '../services/catalogService';
import { listCustomers } from '../services/customersService';
import { convertQuoteToOrder, createQuote, listQuotes } from '../services/quotesService';
import type { Attendance } from '../types/attendance';
import type { CatalogItem } from '../types/catalog';
import type { Customer } from '../types/customer';
import type { Quote } from '../types/quote';

const quotes = ref<Quote[]>([]);
const route = useRoute();
const customers = ref<Customer[]>([]);
const attendances = ref<Attendance[]>([]);
const catalogItems = ref<CatalogItem[]>([]);
const selectedCatalogItemId = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const isSaving = ref(false);
const isGeneratingItems = ref(false);
const itemPrompt = ref('');
const newQuoteFormRef = ref<HTMLFormElement | null>(null);

const form = reactive({
  customerId: '',
  attendanceId: '',
  validUntil: '',
  items: [
    {
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0
    }
  ]
});

const hasQuotes = computed(() => quotes.value.length > 0);
const availableAttendances = computed(() =>
  attendances.value.filter((attendance) => attendance.customerId === form.customerId)
);

onMounted(async () => {
  await Promise.all([loadCustomers(), loadAttendances(), loadCatalogItems(), loadQuotes()]);
  await focusNewQuoteFromRoute();
});

watch(
  () => [route.query.new, route.hash],
  () => {
    focusNewQuoteFromRoute();
  }
);

async function loadCustomers() {
  customers.value = await listCustomers();

  if (!form.customerId && customers.value[0]) {
    form.customerId = customers.value[0].id;
  }
}

async function loadAttendances() {
  attendances.value = await listAttendances({});
}

async function loadCatalogItems() {
  catalogItems.value = await listCatalogItems({ active: 'true' });
}

async function loadQuotes() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    quotes.value = await listQuotes();
  } catch {
    errorMessage.value = 'Não foi possível carregar os orçamentos.';
  } finally {
    isLoading.value = false;
  }
}

async function submit() {
  errorMessage.value = '';
  isSaving.value = true;

  try {
    await createQuote({
      customerId: form.customerId,
      attendanceId: form.attendanceId || undefined,
      validUntil: form.validUntil || undefined,
      items: form.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount || 0)
      }))
    });
    resetForm();
    await loadQuotes();
  } catch {
    errorMessage.value = 'Não foi possível criar o orçamento.';
  } finally {
    isSaving.value = false;
  }
}

async function convertToOrder(quote: Quote) {
  errorMessage.value = '';

  try {
    await convertQuoteToOrder(quote.id);
    await loadQuotes();
  } catch {
    errorMessage.value = 'Não foi possível converter o orçamento em pedido.';
  }
}

function addItem() {
  form.items.push({
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0
  });
}

function addCatalogItemToQuote() {
  const catalogItem = catalogItems.value.find((item) => item.id === selectedCatalogItemId.value);

  if (!catalogItem) {
    return;
  }

  const emptyItemIndex = form.items.findIndex(
    (item) => !item.description && Number(item.unitPrice) === 0
  );
  const nextItem = {
    description: catalogItem.name,
    quantity: 1,
    unitPrice: Number(catalogItem.price),
    discount: 0
  };

  if (emptyItemIndex >= 0) {
    form.items.splice(emptyItemIndex, 1, nextItem);
  } else {
    form.items.push(nextItem);
  }

  selectedCatalogItemId.value = '';
}

async function generateItems() {
  const text = itemPrompt.value.trim();

  if (!text) {
    return;
  }

  errorMessage.value = '';
  isGeneratingItems.value = true;

  try {
    const result = await generateQuoteItemsFromText(text);
    form.items = result.items.length
      ? result.items
      : [
          {
            description: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0
          }
        ];
  } catch {
    errorMessage.value = 'Não foi possível gerar itens a partir do texto.';
  } finally {
    isGeneratingItems.value = false;
  }
}

function removeItem(index: number) {
  if (form.items.length > 1) {
    form.items.splice(index, 1);
  }
}

function resetForm() {
  form.customerId = customers.value[0]?.id ?? '';
  form.attendanceId = '';
  form.validUntil = '';
  form.items = [
    {
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0
    }
  ];
  selectedCatalogItemId.value = '';
}

async function focusNewQuoteFromRoute() {
  if (route.query.new !== '1' && route.hash !== '#novo-orçamento') {
    return;
  }

  await nextTick();
  newQuoteFormRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const firstField = newQuoteFormRef.value?.querySelector<HTMLSelectElement | HTMLInputElement>(
    'select, input, textarea'
  );
  firstField?.focus({ preventScroll: true });
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value));
}

function publicQuoteUrl(quote: Quote) {
  return `${window.location.origin}/public/quotes/${quote.publicToken}`;
}

function quotePdfUrl(quote: Quote) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
  return `${apiBaseUrl}/public/quotes/${quote.publicToken}/pdf`;
}
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold text-ink">Orçamentos</h1>
      <p class="mt-1 text-sm text-[#667067]">
        Monte uma primeira versão de orçamento com itens livres e link público.
      </p>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-md border border-[#efc8bd] bg-[#fff7f4] px-3 py-2 text-sm text-coral"
    >
      {{ errorMessage }}
    </p>

    <div class="grid gap-4 xl:grid-cols-[460px_1fr]">
      <form
        id="novo-orçamento"
        ref="newQuoteFormRef"
        class="rounded-md border border-[#dfe4da] bg-white p-4"
        @submit.prevent="submit"
      >
        <h2 class="text-base font-semibold">Novo orçamento</h2>
        <label class="mt-4 block text-sm font-medium">
          Cliente
          <select
            v-model="form.customerId"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            required
            @change="form.attendanceId = ''"
          >
            <option value="" disabled>Selecione um cliente</option>
            <option v-for="customer in customers" :key="customer.id" :value="customer.id">
              {{ customer.name }}
            </option>
          </select>
        </label>
        <label class="mt-4 block text-sm font-medium">
          Atendimento
          <select
            v-model="form.attendanceId"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
          >
            <option value="">Sem vínculo</option>
            <option
              v-for="attendance in availableAttendances"
              :key="attendance.id"
              :value="attendance.id"
            >
              {{ attendance.summary || attendance.origin }}
            </option>
          </select>
        </label>
        <label class="mt-4 block text-sm font-medium">
          Validade
          <input
            v-model="form.validUntil"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            type="date"
          />
        </label>

        <div class="mt-5 space-y-3">
          <div class="flex flex-col gap-3">
            <h3 class="text-sm font-semibold">Itens</h3>
            <div class="grid gap-2 sm:grid-cols-[1fr_auto]">
              <select
                v-model="selectedCatalogItemId"
                class="rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
              >
                <option value="">Adicionar produto/serviço do catálogo</option>
                <option
                  v-for="catalogItem in catalogItems"
                  :key="catalogItem.id"
                  :value="catalogItem.id"
                >
                  {{ catalogItem.name }} - {{ formatCurrency(catalogItem.price) }}
                </option>
              </select>
              <button
                class="rounded-md border border-[#dfe4da] px-3 py-2 text-sm font-semibold text-[#11644f] hover:bg-[#edf3ee] disabled:opacity-50"
                type="button"
                :disabled="!selectedCatalogItemId"
                @click="addCatalogItemToQuote"
              >
                Adicionar
              </button>
            </div>
            <button
              class="self-start text-sm font-semibold text-[#11644f]"
              type="button"
              @click="addItem"
            >
              Adicionar item livre
            </button>
            <div class="rounded-md border border-[#edf0ea] bg-[#fbfcf9] p-3">
              <textarea
                v-model="itemPrompt"
                class="min-h-24 w-full resize-none rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
                placeholder="Cole pedidos do cliente, um item por linha"
              />
              <button
                class="mt-2 rounded-md border border-[#dfe4da] px-3 py-2 text-sm font-semibold text-[#11644f] hover:bg-[#edf3ee] disabled:opacity-50"
                type="button"
                :disabled="!itemPrompt.trim() || isGeneratingItems"
                @click="generateItems"
              >
                Gerar itens
              </button>
            </div>
          </div>
          <div
            v-for="(item, index) in form.items"
            :key="index"
            class="rounded-md border border-[#edf0ea] p-3"
          >
            <input
              v-model="item.description"
              class="w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
              placeholder="Descricao"
              required
            />
            <div class="mt-2 grid grid-cols-3 gap-2">
              <input
                v-model.number="item.quantity"
                class="rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
                min="0.01"
                step="0.01"
                type="number"
                placeholder="Qtd"
                required
              />
              <input
                v-model.number="item.unitPrice"
                class="rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
                min="0"
                step="0.01"
                type="number"
                placeholder="Preco"
                required
              />
              <input
                v-model.number="item.discount"
                class="rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
                min="0"
                step="0.01"
                type="number"
                placeholder="Desc."
              />
            </div>
            <button
              class="mt-2 text-xs font-semibold text-coral"
              type="button"
              @click="removeItem(index)"
            >
              Remover
            </button>
          </div>
        </div>

        <button
          class="mt-5 w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:opacity-60"
          type="submit"
          :disabled="isSaving || !customers.length"
        >
          {{ isSaving ? 'Salvando...' : 'Criar orçamento' }}
        </button>
      </form>

      <section class="overflow-hidden rounded-md border border-[#dfe4da] bg-white">
        <div class="flex items-center justify-between border-b border-[#edf0ea] px-4 py-3">
          <h2 class="text-base font-semibold">Orçamentos criados</h2>
          <span class="text-xs text-[#667067]">{{ quotes.length }} cadastrados</span>
        </div>
        <div v-if="isLoading" class="px-4 py-8 text-sm text-[#667067]">Carregando...</div>
        <div v-else-if="!hasQuotes" class="px-4 py-8 text-sm text-[#667067]">
          Nenhum orçamento criado.
        </div>
        <div v-else class="divide-y divide-[#edf0ea]">
          <article v-for="quote in quotes" :key="quote.id" class="px-4 py-4">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p class="text-xs font-semibold text-[#667067]">#{{ quote.number }}</p>
                <h3 class="mt-1 font-semibold text-ink">{{ quote.customer.name }}</h3>
                <p class="mt-1 text-sm text-[#465047]">
                  {{ quote.items.length }} itens - {{ formatCurrency(quote.total) }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <a
                  class="rounded-md border border-[#dfe4da] px-3 py-2 text-sm font-semibold text-[#11644f] hover:bg-[#edf3ee]"
                  :href="publicQuoteUrl(quote)"
                  target="_blank"
                >
                  Link público
                </a>
                <a
                  class="rounded-md border border-[#dfe4da] px-3 py-2 text-sm font-semibold text-[#11644f] hover:bg-[#edf3ee]"
                  :href="quotePdfUrl(quote)"
                  target="_blank"
                >
                  PDF
                </a>
                <button
                  v-if="quote.status !== 'CONVERTED'"
                  class="rounded-md bg-mint px-3 py-2 text-sm font-semibold text-white hover:bg-[#176d58]"
                  type="button"
                  @click="convertToOrder(quote)"
                >
                  Virar pedido
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>
