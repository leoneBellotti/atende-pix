<script setup lang="ts">
import { reactive, ref } from 'vue';
import { lookupCustomerPortal, type CustomerPortalRecord } from '../services/customerPortalService';

const portal = ref<CustomerPortalRecord | null>(null);
const errorMessage = ref('');
const isLoading = ref(false);

const form = reactive({
  tenantSlug: '',
  phone: '',
  document: ''
});

async function lookup() {
  errorMessage.value = '';
  portal.value = null;
  isLoading.value = true;

  try {
    portal.value = await lookupCustomerPortal({
      tenantSlug: form.tenantSlug || undefined,
      phone: form.phone || undefined,
      document: form.document || undefined
    });
  } catch {
    errorMessage.value = 'Não encontramos dados para essa consulta.';
  } finally {
    isLoading.value = false;
  }
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '-';
}
</script>

<template>
  <main class="min-h-screen bg-[#f7f8f5] px-4 py-8 text-ink">
    <section class="mx-auto max-w-5xl space-y-6">
      <div>
        <p class="text-sm font-semibold text-[#11644f]">AtendePix</p>
        <h1 class="mt-2 text-3xl font-semibold">Portal do cliente</h1>
        <p class="mt-2 text-sm text-[#667067]">Consulte orçamentos, pedidos, pagamentos e próximos agendamentos.</p>
      </div>

      <form class="grid gap-3 rounded-md border border-[#dfe4da] bg-white p-4 md:grid-cols-[1fr_1fr_1fr_auto]" @submit.prevent="lookup">
        <label class="text-sm font-medium">
          Empresa
          <input v-model="form.tenantSlug" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" placeholder="slug-da-empresa" required />
        </label>
        <label class="text-sm font-medium">
          Telefone
          <input v-model="form.phone" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" />
        </label>
        <label class="text-sm font-medium">
          Documento
          <input v-model="form.document" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" />
        </label>
        <button class="self-end rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white" type="submit" :disabled="isLoading">
          {{ isLoading ? 'Consultando...' : 'Consultar' }}
        </button>
      </form>

      <p v-if="errorMessage" class="rounded-md border border-[#efc8bd] bg-[#fff7f4] px-3 py-2 text-sm text-coral">
        {{ errorMessage }}
      </p>

      <template v-if="portal">
        <section class="rounded-md border border-[#dfe4da] bg-white p-4">
          <p class="text-sm text-[#667067]">{{ portal.tenant.name }}</p>
          <h2 class="mt-1 text-xl font-semibold">{{ portal.name }}</h2>
          <p class="mt-1 text-sm text-[#667067]">{{ portal.phone || portal.email || 'Contato não informado' }}</p>
        </section>

        <div class="grid gap-4 lg:grid-cols-3">
          <section class="rounded-md border border-[#dfe4da] bg-white">
            <h2 class="border-b border-[#edf0ea] px-4 py-3 font-semibold">Orçamentos</h2>
            <div v-if="!portal.quotes.length" class="px-4 py-6 text-sm text-[#667067]">Nenhum orçamento encontrado.</div>
            <article v-for="quote in portal.quotes" :key="quote.id" class="border-b border-[#edf0ea] px-4 py-3 text-sm">
              <p class="font-semibold">#{{ quote.number }} - {{ formatCurrency(quote.total) }}</p>
              <p class="mt-1 text-[#667067]">{{ quote.status }} - validade {{ formatDate(quote.validUntil) }}</p>
              <a class="mt-2 inline-block font-semibold text-[#11644f]" :href="`/public/quotes/${quote.publicToken}`">Abrir orçamento</a>
            </article>
          </section>

          <section class="rounded-md border border-[#dfe4da] bg-white">
            <h2 class="border-b border-[#edf0ea] px-4 py-3 font-semibold">Pedidos</h2>
            <div v-if="!portal.orders.length" class="px-4 py-6 text-sm text-[#667067]">Nenhum pedido encontrado.</div>
            <article v-for="order in portal.orders" :key="order.id" class="border-b border-[#edf0ea] px-4 py-3 text-sm">
              <p class="font-semibold">#{{ order.number }} - {{ formatCurrency(order.total) }}</p>
              <p class="mt-1 text-[#667067]">{{ order.status }} - criado em {{ formatDate(order.createdAt) }}</p>
              <a v-for="payment in order.payments.filter((item) => item.publicToken)" :key="payment.id" class="mt-2 block font-semibold text-[#11644f]" :href="`/public/payments/${payment.publicToken}`">
                Abrir pagamento
              </a>
            </article>
          </section>

          <section class="rounded-md border border-[#dfe4da] bg-white">
            <h2 class="border-b border-[#edf0ea] px-4 py-3 font-semibold">Agenda</h2>
            <div v-if="!portal.appointments.length" class="px-4 py-6 text-sm text-[#667067]">Nenhum agendamento futuro.</div>
            <article v-for="appointment in portal.appointments" :key="appointment.id" class="border-b border-[#edf0ea] px-4 py-3 text-sm">
              <p class="font-semibold">{{ appointment.title }}</p>
              <p class="mt-1 text-[#667067]">{{ formatDate(appointment.startsAt) }} - {{ appointment.status }}</p>
            </article>
          </section>
        </div>
      </template>
    </section>
  </main>
</template>
