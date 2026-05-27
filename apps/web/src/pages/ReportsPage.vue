<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { listOrders } from '../services/ordersService';
import { listPayments } from '../services/paymentsService';
import type { Order, OrderStatus } from '../types/order';
import type { PaymentRecord, PaymentStatus } from '../types/payment';

const orders = ref<Order[]>([]);
const payments = ref<PaymentRecord[]>([]);
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const errorMessage = ref('');
const isLoading = ref(false);

const orderStatusLabels: Record<OrderStatus, string> = {
  OPEN: 'Aberto',
  WAITING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Pago',
  IN_PROGRESS: 'Em execucao',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado'
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  CANCELED: 'Cancelado',
  FAILED: 'Falhou'
};

const filteredOrders = computed(() =>
  orders.value.filter((order) => isInSelectedMonth(order.createdAt))
);

const filteredPayments = computed(() =>
  payments.value.filter((payment) => isInSelectedMonth(payment.paidAt ?? payment.createdAt))
);

const paidPayments = computed(() =>
  filteredPayments.value.filter((payment) => payment.status === 'PAID')
);

const revenue = computed(() =>
  paidPayments.value.reduce((total, payment) => total + Number(payment.amount), 0)
);

const pendingOrdersTotal = computed(() =>
  filteredOrders.value
    .filter((order) => order.status === 'OPEN' || order.status === 'WAITING_PAYMENT')
    .reduce((total, order) => total + Number(order.total), 0)
);

const averageTicket = computed(() => {
  if (!paidPayments.value.length) {
    return 0;
  }

  return revenue.value / paidPayments.value.length;
});

onMounted(() => {
  loadReports();
});

async function loadReports() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const [ordersData, paymentsData] = await Promise.all([listOrders(), listPayments()]);
    orders.value = ordersData;
    payments.value = paymentsData;
  } catch {
    errorMessage.value = 'Nao foi possivel carregar os relatorios.';
  } finally {
    isLoading.value = false;
  }
}

function isInSelectedMonth(value?: string | null) {
  if (!value) {
    return false;
  }

  return value.slice(0, 7) === selectedMonth.value;
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value));
}

function formatDate(value?: string | null) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function exportOrdersCsv() {
  const rows = filteredOrders.value.map((order) => ({
    numero: order.number,
    cliente: order.customer.name,
    status: orderStatusLabels[order.status],
    total: order.total,
    criado_em: formatDate(order.createdAt),
    pago_em: formatDate(order.paidAt)
  }));

  downloadCsv(`pedidos-${selectedMonth.value}.csv`, rows);
}

function exportPaymentsCsv() {
  const rows = filteredPayments.value.map((payment) => ({
    pedido: payment.order.number,
    cliente: payment.order.customer.name,
    status: paymentStatusLabels[payment.status],
    provedor: payment.provider === 'MANUAL' ? 'Manual' : 'Mercado Pago',
    valor: payment.amount,
    criado_em: formatDate(payment.createdAt),
    pago_em: formatDate(payment.paidAt)
  }));

  downloadCsv(`pagamentos-${selectedMonth.value}.csv`, rows);
}

function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  const headers = Object.keys(rows[0] ?? { vazio: '' });
  const csvRows = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header] ?? '')).join(','))
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-ink">Relatorios</h1>
        <p class="mt-1 text-sm text-[#667067]">
          Fechamento mensal simples para pedidos, recebimentos e exportacoes.
        </p>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row">
        <input
          v-model="selectedMonth"
          class="rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
          type="month"
        />
        <button
          class="rounded-md border border-[#cfd7ce] bg-white px-4 py-2 text-sm font-semibold text-[#465047] hover:bg-[#edf3ee]"
          type="button"
          @click="loadReports"
        >
          Atualizar
        </button>
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-md border border-[#efc8bd] bg-[#fff7f4] px-3 py-2 text-sm text-coral"
    >
      {{ errorMessage }}
    </p>

    <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-md border border-[#dfe4da] bg-white px-4 py-3">
        <p class="text-xs font-semibold uppercase text-[#667067]">Recebido</p>
        <p class="mt-2 text-2xl font-semibold text-ink">
          {{ isLoading ? '...' : formatCurrency(revenue) }}
        </p>
      </div>
      <div class="rounded-md border border-[#dfe4da] bg-white px-4 py-3">
        <p class="text-xs font-semibold uppercase text-[#667067]">A receber</p>
        <p class="mt-2 text-2xl font-semibold text-ink">
          {{ isLoading ? '...' : formatCurrency(pendingOrdersTotal) }}
        </p>
      </div>
      <div class="rounded-md border border-[#dfe4da] bg-white px-4 py-3">
        <p class="text-xs font-semibold uppercase text-[#667067]">Ticket medio</p>
        <p class="mt-2 text-2xl font-semibold text-ink">
          {{ isLoading ? '...' : formatCurrency(averageTicket) }}
        </p>
      </div>
      <div class="rounded-md border border-[#dfe4da] bg-white px-4 py-3">
        <p class="text-xs font-semibold uppercase text-[#667067]">Pedidos</p>
        <p class="mt-2 text-2xl font-semibold text-ink">
          {{ isLoading ? '...' : filteredOrders.length }}
        </p>
      </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-2">
      <article class="rounded-md border border-[#dfe4da] bg-white">
        <div class="flex items-center justify-between border-b border-[#edf0ea] px-4 py-3">
          <div>
            <h2 class="text-base font-semibold">Pedidos do periodo</h2>
            <p class="mt-1 text-xs text-[#667067]">{{ filteredOrders.length }} encontrados</p>
          </div>
          <button
            class="rounded-md bg-mint px-3 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:opacity-50"
            type="button"
            :disabled="!filteredOrders.length"
            @click="exportOrdersCsv"
          >
            Exportar CSV
          </button>
        </div>
        <div v-if="!filteredOrders.length" class="px-4 py-8 text-sm text-[#667067]">
          Nenhum pedido no periodo.
        </div>
        <ul v-else class="divide-y divide-[#edf0ea]">
          <li v-for="order in filteredOrders" :key="order.id" class="px-4 py-3 text-sm">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-ink">
                  #{{ order.number }} - {{ order.customer.name }}
                </p>
                <p class="mt-1 text-xs text-[#667067]">{{ orderStatusLabels[order.status] }}</p>
              </div>
              <p class="font-semibold text-ink">{{ formatCurrency(order.total) }}</p>
            </div>
          </li>
        </ul>
      </article>

      <article class="rounded-md border border-[#dfe4da] bg-white">
        <div class="flex items-center justify-between border-b border-[#edf0ea] px-4 py-3">
          <div>
            <h2 class="text-base font-semibold">Pagamentos do periodo</h2>
            <p class="mt-1 text-xs text-[#667067]">{{ filteredPayments.length }} encontrados</p>
          </div>
          <button
            class="rounded-md bg-mint px-3 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:opacity-50"
            type="button"
            :disabled="!filteredPayments.length"
            @click="exportPaymentsCsv"
          >
            Exportar CSV
          </button>
        </div>
        <div v-if="!filteredPayments.length" class="px-4 py-8 text-sm text-[#667067]">
          Nenhum pagamento no periodo.
        </div>
        <ul v-else class="divide-y divide-[#edf0ea]">
          <li v-for="payment in filteredPayments" :key="payment.id" class="px-4 py-3 text-sm">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-ink">
                  #{{ payment.order.number }} - {{ payment.order.customer.name }}
                </p>
                <p class="mt-1 text-xs text-[#667067]">
                  {{ paymentStatusLabels[payment.status] }} - {{ formatDate(payment.paidAt) }}
                </p>
              </div>
              <p class="font-semibold text-ink">{{ formatCurrency(payment.amount) }}</p>
            </div>
          </li>
        </ul>
      </article>
    </section>
  </section>
</template>
