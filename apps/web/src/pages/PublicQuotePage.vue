<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getPublicQuote } from '../services/quotesService';
import type { PublicQuote } from '../types/quote';

const route = useRoute();
const quote = ref<PublicQuote | null>(null);
const isLoading = ref(false);
const errorMessage = ref('');

const token = computed(() => String(route.params.token));

onMounted(() => {
  loadQuote();
});

async function loadQuote() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    quote.value = await getPublicQuote(token.value);
  } catch {
    errorMessage.value = 'Orçamento não encontrado ou indisponível.';
  } finally {
    isLoading.value = false;
  }
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value));
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Sem validade definida';
  }

  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

function publicPdfUrl() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
  return `${apiBaseUrl}/public/quotes/${token.value}/pdf`;
}
</script>

<template>
  <main class="min-h-screen bg-[#f7f8f5] px-4 py-8 text-ink">
    <section class="mx-auto max-w-4xl">
      <div
        v-if="isLoading"
        class="rounded-md border border-[#dfe4da] bg-white p-6 text-sm text-[#667067]"
      >
        Carregando orçamento...
      </div>
      <div
        v-else-if="errorMessage"
        class="rounded-md border border-[#efc8bd] bg-[#fff7f4] p-6 text-sm text-coral"
      >
        {{ errorMessage }}
      </div>
      <article v-else-if="quote" class="rounded-md border border-[#dfe4da] bg-white">
        <header class="border-b border-[#edf0ea] p-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-sm font-semibold text-[#11644f]">{{ quote.tenant.name }}</p>
              <h1 class="mt-2 text-2xl font-semibold">Orçamento #{{ quote.number }}</h1>
              <p class="mt-1 text-sm text-[#667067]">
                Validade: {{ formatDate(quote.validUntil) }}
              </p>
            </div>
            <a
              class="rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-[#176d58]"
              :href="publicPdfUrl()"
              target="_blank"
            >
              Baixar PDF
            </a>
          </div>
        </header>

        <section class="grid gap-4 border-b border-[#edf0ea] p-6 sm:grid-cols-2">
          <div>
            <h2 class="text-sm font-semibold text-[#667067]">Cliente</h2>
            <p class="mt-2 font-semibold">{{ quote.customer.name }}</p>
            <p class="mt-1 text-sm text-[#667067]">
              {{ quote.customer.phone || quote.customer.email || '' }}
            </p>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-[#667067]">Empresa</h2>
            <p class="mt-2 font-semibold">{{ quote.tenant.name }}</p>
            <p class="mt-1 text-sm text-[#667067]">
              {{ quote.tenant.phone || quote.tenant.document || '' }}
            </p>
          </div>
        </section>

        <section class="p-6">
          <h2 class="text-base font-semibold">Itens</h2>
          <div class="mt-4 overflow-x-auto">
            <table class="w-full min-w-[640px] text-left text-sm">
              <thead class="bg-[#f7f8f5] text-xs uppercase text-[#667067]">
                <tr>
                  <th class="px-3 py-3 font-semibold">Descricao</th>
                  <th class="px-3 py-3 font-semibold">Qtd</th>
                  <th class="px-3 py-3 font-semibold">Unitario</th>
                  <th class="px-3 py-3 font-semibold">Desconto</th>
                  <th class="px-3 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#edf0ea]">
                <tr v-for="item in quote.items" :key="item.id">
                  <td class="px-3 py-3 font-medium">{{ item.description }}</td>
                  <td class="px-3 py-3">{{ Number(item.quantity).toLocaleString('pt-BR') }}</td>
                  <td class="px-3 py-3">{{ formatCurrency(item.unitPrice) }}</td>
                  <td class="px-3 py-3">{{ formatCurrency(item.discount) }}</td>
                  <td class="px-3 py-3 text-right font-semibold">
                    {{ formatCurrency(item.total) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <footer class="border-t border-[#edf0ea] p-6">
          <div class="ml-auto max-w-sm space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-[#667067]">Subtotal</span>
              <strong>{{ formatCurrency(quote.subtotal) }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-[#667067]">Desconto</span>
              <strong>{{ formatCurrency(quote.discount) }}</strong>
            </div>
            <div class="flex justify-between border-t border-[#edf0ea] pt-3 text-lg">
              <span>Total</span>
              <strong>{{ formatCurrency(quote.total) }}</strong>
            </div>
          </div>
        </footer>
      </article>
    </section>
  </main>
</template>
