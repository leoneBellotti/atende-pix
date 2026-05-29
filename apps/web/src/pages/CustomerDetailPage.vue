<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { getCustomer } from '../services/customersService';
import type { AttendanceOrigin, AttendanceStatus } from '../types/attendance';
import type { CustomerDetail } from '../types/customer';
import type { OrderStatus } from '../types/order';
import type { QuoteStatus } from '../types/quote';

type TimelineItem = {
  id: string;
  date: string;
  title: string;
  description: string;
  amount?: string;
};

const route = useRoute();
const customer = ref<CustomerDetail | null>(null);
const errorMessage = ref('');
const isLoading = ref(false);

const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  NEW: 'Novo',
  IN_PROGRESS: 'Em atendimento',
  WAITING_CUSTOMER: 'Aguardando cliente',
  WAITING_PAYMENT: 'Aguardando pagamento',
  DONE: 'Concluido',
  CANCELED: 'Cancelado'
};

const attendanceOriginLabels: Record<AttendanceOrigin, string> = {
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  PHONE: 'Telefone',
  IN_PERSON: 'Presencial',
  OTHER: 'Outro'
};

const quoteStatusLabels: Record<QuoteStatus, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
  EXPIRED: 'Expirado',
  CONVERTED: 'Convertido'
};

const orderStatusLabels: Record<OrderStatus, string> = {
  OPEN: 'Aberto',
  WAITING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Pago',
  IN_PROGRESS: 'Em execucao',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado'
};

const timeline = computed<TimelineItem[]>(() => {
  if (!customer.value) {
    return [];
  }

  const attendances = customer.value.attendances.map((attendance) => ({
    id: `attendance-${attendance.id}`,
    date: attendance.createdAt,
    title: `Atendimento - ${attendanceOriginLabels[attendance.origin]}`,
    description: `${attendanceStatusLabels[attendance.status]}${attendance.summary ? `: ${attendance.summary}` : ''}`
  }));

  const quotes = customer.value.quotes.map((quote) => ({
    id: `quote-${quote.id}`,
    date: quote.createdAt,
    title: `Orçamento #${quote.number}`,
    description: quoteStatusLabels[quote.status],
    amount: quote.total
  }));

  const orders = customer.value.orders.map((order) => ({
    id: `order-${order.id}`,
    date: order.createdAt,
    title: `Pedido #${order.number}`,
    description: orderStatusLabels[order.status],
    amount: order.total
  }));

  return [...attendances, ...quotes, ...orders].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
});

const totalOrdered = computed(() =>
  (customer.value?.orders ?? []).reduce((total, order) => total + Number(order.total), 0)
);

const totalPaid = computed(() =>
  (customer.value?.orders ?? [])
    .flatMap((order) => order.payments)
    .filter((payment) => payment.status === 'PAID')
    .reduce((total, payment) => total + Number(payment.amount), 0)
);

onMounted(() => {
  loadCustomer();
});

async function loadCustomer() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    customer.value = await getCustomer(String(route.params.id));
  } catch {
    errorMessage.value = 'Não foi possível carregar o cliente.';
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <RouterLink class="text-sm font-semibold text-[#11644f]" to="/customers">
          Voltar para clientes
        </RouterLink>
        <h1 class="mt-2 text-2xl font-semibold text-ink">
          {{ customer?.name ?? 'Cliente' }}
        </h1>
        <p class="mt-1 text-sm text-[#667067]">
          Histórico comercial, contatos e movimentação do cliente.
        </p>
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-md border border-[#efc8bd] bg-[#fff7f4] px-3 py-2 text-sm text-coral"
    >
      {{ errorMessage }}
    </p>

    <div v-if="isLoading" class="rounded-md border border-[#dfe4da] bg-white px-4 py-8 text-sm">
      Carregando cliente...
    </div>

    <template v-else-if="customer">
      <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-md border border-[#dfe4da] bg-white px-4 py-3">
          <p class="text-xs font-semibold uppercase text-[#667067]">Telefone</p>
          <p class="mt-2 text-sm font-semibold text-ink">{{ customer.phone || '-' }}</p>
        </div>
        <div class="rounded-md border border-[#dfe4da] bg-white px-4 py-3">
          <p class="text-xs font-semibold uppercase text-[#667067]">E-mail</p>
          <p class="mt-2 text-sm font-semibold text-ink">{{ customer.email || '-' }}</p>
        </div>
        <div class="rounded-md border border-[#dfe4da] bg-white px-4 py-3">
          <p class="text-xs font-semibold uppercase text-[#667067]">Total em pedidos</p>
          <p class="mt-2 text-sm font-semibold text-ink">{{ formatCurrency(totalOrdered) }}</p>
        </div>
        <div class="rounded-md border border-[#dfe4da] bg-white px-4 py-3">
          <p class="text-xs font-semibold uppercase text-[#667067]">Total pago</p>
          <p class="mt-2 text-sm font-semibold text-ink">{{ formatCurrency(totalPaid) }}</p>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <article class="rounded-md border border-[#dfe4da] bg-white p-4">
          <h2 class="text-base font-semibold">Cadastro</h2>
          <dl class="mt-4 space-y-3 text-sm">
            <div>
              <dt class="font-semibold text-[#667067]">Documento</dt>
              <dd class="mt-1 text-[#465047]">{{ customer.document || '-' }}</dd>
            </div>
            <div>
              <dt class="font-semibold text-[#667067]">Observações</dt>
              <dd class="mt-1 whitespace-pre-line text-[#465047]">{{ customer.notes || '-' }}</dd>
            </div>
            <div>
              <dt class="font-semibold text-[#667067]">Criado em</dt>
              <dd class="mt-1 text-[#465047]">{{ formatDate(customer.createdAt) }}</dd>
            </div>
          </dl>
        </article>

        <article class="rounded-md border border-[#dfe4da] bg-white">
          <div class="border-b border-[#edf0ea] px-4 py-3">
            <h2 class="text-base font-semibold">Timeline</h2>
            <p class="mt-1 text-xs text-[#667067]">{{ timeline.length }} eventos</p>
          </div>
          <div v-if="!timeline.length" class="px-4 py-8 text-sm text-[#667067]">
            Nenhum evento registrado para este cliente.
          </div>
          <ol v-else class="divide-y divide-[#edf0ea]">
            <li v-for="item in timeline" :key="item.id" class="px-4 py-3">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p class="font-semibold text-ink">{{ item.title }}</p>
                  <p class="mt-1 text-sm text-[#465047]">{{ item.description }}</p>
                  <p class="mt-1 text-xs text-[#667067]">{{ formatDate(item.date) }}</p>
                </div>
                <p v-if="item.amount" class="text-sm font-semibold text-ink">
                  {{ formatCurrency(item.amount) }}
                </p>
              </div>
            </li>
          </ol>
        </article>
      </section>
    </template>
  </section>
</template>
