<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { listOrders, manualConfirmPayment, updateOrderStatus } from '../services/ordersService';
import type { Order, OrderStatus } from '../types/order';

const orders = ref<Order[]>([]);
const status = ref<OrderStatus | ''>('');
const errorMessage = ref('');
const isLoading = ref(false);

const statusOptions: Array<{ value: OrderStatus; label: string }> = [
  { value: 'OPEN', label: 'Aberto' },
  { value: 'WAITING_PAYMENT', label: 'Aguardando pagamento' },
  { value: 'PAID', label: 'Pago' },
  { value: 'IN_PROGRESS', label: 'Em execucao' },
  { value: 'READY', label: 'Pronto' },
  { value: 'DELIVERED', label: 'Entregue' },
  { value: 'CANCELED', label: 'Cancelado' }
];

onMounted(() => {
  loadOrders();
});

async function loadOrders() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    orders.value = await listOrders(status.value);
  } catch {
    errorMessage.value = 'Nao foi possivel carregar os pedidos.';
  } finally {
    isLoading.value = false;
  }
}

async function changeStatus(order: Order, nextStatus: OrderStatus) {
  errorMessage.value = '';

  try {
    await updateOrderStatus(order.id, nextStatus);
    await loadOrders();
  } catch {
    errorMessage.value = 'Nao foi possivel atualizar o pedido.';
  }
}

async function confirmPayment(order: Order) {
  errorMessage.value = '';

  try {
    await manualConfirmPayment(order.id, Number(order.total));
    await loadOrders();
  } catch {
    errorMessage.value = 'Nao foi possivel confirmar o pagamento.';
  }
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value));
}

function statusLabel(value: OrderStatus) {
  return statusOptions.find((option) => option.value === value)?.label ?? value;
}
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-ink">Pedidos</h1>
        <p class="mt-1 text-sm text-[#667067]">
          Acompanhe pedidos gerados de orcamentos e confirme pagamentos manuais.
        </p>
      </div>
      <form class="flex gap-2" @submit.prevent="loadOrders">
        <select
          v-model="status"
          class="rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
        >
          <option value="">Todos</option>
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
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

    <section class="overflow-hidden rounded-md border border-[#dfe4da] bg-white">
      <div class="flex items-center justify-between border-b border-[#edf0ea] px-4 py-3">
        <h2 class="text-base font-semibold">Fila de pedidos</h2>
        <span class="text-xs text-[#667067]">{{ orders.length }} encontrados</span>
      </div>

      <div v-if="isLoading" class="px-4 py-8 text-sm text-[#667067]">Carregando pedidos...</div>
      <div v-else-if="!orders.length" class="px-4 py-8 text-sm text-[#667067]">
        Nenhum pedido encontrado.
      </div>
      <div v-else class="divide-y divide-[#edf0ea]">
        <article v-for="order in orders" :key="order.id" class="px-4 py-4">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p class="text-xs font-semibold text-[#667067]">Pedido #{{ order.number }}</p>
              <h3 class="mt-1 font-semibold text-ink">{{ order.customer.name }}</h3>
              <p class="mt-1 text-sm text-[#465047]">
                {{ order.items.length }} itens · {{ formatCurrency(order.total) }}
              </p>
              <p class="mt-2 text-xs text-[#667067]">Status: {{ statusLabel(order.status) }}</p>
            </div>
            <div class="flex flex-col gap-2 sm:flex-row">
              <select
                class="rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
                :value="order.status"
                @change="
                  changeStatus(order, ($event.target as HTMLSelectElement).value as OrderStatus)
                "
              >
                <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <button
                v-if="order.status !== 'PAID'"
                class="rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-[#176d58]"
                type="button"
                @click="confirmPayment(order)"
              >
                Marcar pago
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
