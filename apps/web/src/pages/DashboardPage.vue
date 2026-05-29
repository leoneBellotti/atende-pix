<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getDashboardSummary } from '../services/dashboardService';
import type { DashboardSummary } from '../types/dashboard';
import type { OrderStatus } from '../types/order';

const summary = ref<DashboardSummary | null>(null);
const isLoading = ref(false);
const errorMessage = ref('');

const statusLabels: Record<OrderStatus, string> = {
  OPEN: 'Aberto',
  WAITING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Pago',
  IN_PROGRESS: 'Em execucao',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado'
};

const statusColors: Record<OrderStatus, string> = {
  OPEN: 'bg-[#cbded7]',
  WAITING_PAYMENT: 'bg-amber',
  PAID: 'bg-mint',
  IN_PROGRESS: 'bg-coral',
  READY: 'bg-[#6f8fc2]',
  DELIVERED: 'bg-[#465047]',
  CANCELED: 'bg-[#9b9f9a]'
};

const statusTrackColors: Record<OrderStatus, string> = {
  OPEN: 'bg-[#edf3ee]',
  WAITING_PAYMENT: 'bg-[#f4ead1]',
  PAID: 'bg-[#dcebe3]',
  IN_PROGRESS: 'bg-[#f3ddd6]',
  READY: 'bg-[#e1e9f5]',
  DELIVERED: 'bg-[#e5e8e3]',
  CANCELED: 'bg-[#eceeed]'
};

const metrics = computed(() => [
  {
    label: 'Vendido no mês',
    value: formatCurrency(summary.value?.revenueThisMonth ?? 0),
    hint: 'Pedidos pagos no mês atual'
  },
  {
    label: 'A receber',
    value: formatCurrency(summary.value?.pendingAmount ?? 0),
    hint: `${summary.value?.pendingOrders ?? 0} pedidos pendentes`
  },
  {
    label: 'Orçamentos enviados',
    value: String(summary.value?.sentQuotes ?? 0),
    hint: `${summary.value?.quoteConversionRate ?? 0}% convertidos`
  },
  {
    label: 'Atendimentos abertos',
    value: String(summary.value?.openAttendances ?? 0),
    hint: 'Conversas ainda em andamento'
  }
]);

const pendingActions = computed(() => [
  `${summary.value?.openAttendances ?? 0} atendimentos precisam de acompanhamento`,
  `${summary.value?.pendingOrders ?? 0} pedidos aguardam pagamento`,
  `${summary.value?.quoteConversionRate ?? 0}% dos orçamentos enviados viraram pedido`
]);

onMounted(() => {
  if (import.meta.env.MODE !== 'test') {
    loadSummary();
  }
});

async function loadSummary() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    summary.value = await getDashboardSummary();
  } catch {
    errorMessage.value = 'Não foi possível carregar o dashboard.';
  } finally {
    isLoading.value = false;
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function statusWidth(count: number) {
  const max = Math.max(...(summary.value?.ordersByStatus.map((item) => item.count) ?? [1]), 1);
  return `${Math.max((count / max) * 100, 6)}%`;
}

function statusLabel(status: OrderStatus) {
  return statusLabels[status];
}
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-normal text-ink">Dashboard</h1>
        <p class="mt-1 text-sm text-[#667067]">Vendas, pendências e próximas ações de hoje.</p>
      </div>
      <div class="flex rounded-md border border-[#dfe4da] bg-white p-1 text-sm">
        <button class="rounded bg-[#dcebe3] px-3 py-1.5 font-medium text-[#11644f]" type="button">
          Mes
        </button>
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-md border border-[#efc8bd] bg-[#fff7f4] px-3 py-2 text-sm text-coral"
    >
      {{ errorMessage }}
    </p>

    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="rounded-md border border-[#dfe4da] bg-white p-4"
      >
        <p class="text-sm text-[#667067]">{{ metric.label }}</p>
        <p class="mt-2 text-2xl font-semibold text-ink">
          {{ isLoading ? '...' : metric.value }}
        </p>
        <p class="mt-2 text-xs text-[#11644f]">{{ metric.hint }}</p>
      </article>
    </div>

    <div class="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      <section class="rounded-md border border-[#dfe4da] bg-white p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold">Pedidos por status</h2>
          <span class="text-xs text-[#667067]">Atualizado agora</span>
        </div>
        <div v-if="summary?.ordersByStatus.length" class="mt-4 space-y-3">
          <div
            v-for="item in summary.ordersByStatus"
            :key="item.status"
            class="grid grid-cols-[160px_1fr_48px] items-center gap-3 text-sm"
          >
            <span>{{ statusLabel(item.status) }}</span>
            <span class="h-2 rounded" :class="statusTrackColors[item.status]">
              <span
                class="block h-2 rounded"
                :class="statusColors[item.status]"
                :style="{ width: statusWidth(item.count) }"
              ></span>
            </span>
            <strong>{{ item.count }}</strong>
          </div>
        </div>
        <div v-else class="mt-4 text-sm text-[#667067]">Nenhum pedido criado ainda.</div>
      </section>

      <section class="rounded-md border border-[#dfe4da] bg-white p-4">
        <h2 class="text-base font-semibold">Resolver hoje</h2>
        <ul class="mt-4 divide-y divide-[#edf0ea]">
          <li v-for="action in pendingActions" :key="action" class="py-3 text-sm">
            {{ action }}
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
