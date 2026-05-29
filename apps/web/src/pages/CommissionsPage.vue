<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { createCommission, listCommissions, markCommissionPaid, type SalesCommission } from '../services/commissionsService';
import { listOrders } from '../services/ordersService';
import type { Order } from '../types/order';

const commissions = ref<SalesCommission[]>([]);
const orders = ref<Order[]>([]);
const errorMessage = ref('');
const isSaving = ref(false);

const form = reactive({
  orderId: '',
  salespersonName: '',
  rate: 5
});

const pendingTotal = computed(() =>
  commissions.value.filter((item) => !item.paid).reduce((total, item) => total + Number(item.amount), 0)
);

onMounted(async () => {
  await Promise.all([loadCommissions(), loadOrders()]);
});

async function loadCommissions() {
  commissions.value = await listCommissions();
}

async function loadOrders() {
  orders.value = await listOrders();
  form.orderId = orders.value[0]?.id ?? '';
}

async function submit() {
  errorMessage.value = '';
  isSaving.value = true;

  try {
    await createCommission({
      orderId: form.orderId,
      salespersonName: form.salespersonName,
      rate: Number(form.rate)
    });
    form.salespersonName = '';
    form.rate = 5;
    await loadCommissions();
  } catch {
    errorMessage.value = 'Não foi possível registrar a comissão.';
  } finally {
    isSaving.value = false;
  }
}

async function pay(commission: SalesCommission) {
  await markCommissionPaid(commission.id);
  await loadCommissions();
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold text-ink">Comissões</h1>
      <p class="mt-1 text-sm text-[#667067]">Acompanhe comissões de vendedores por pedido.</p>
    </div>

    <div class="rounded-md border border-[#dfe4da] bg-white px-4 py-3">
      <p class="text-sm text-[#667067]">Comissões pendentes</p>
      <p class="mt-1 text-xl font-semibold text-ink">{{ formatCurrency(pendingTotal) }}</p>
    </div>

    <p v-if="errorMessage" class="rounded-md border border-[#efc8bd] bg-[#fff7f4] px-3 py-2 text-sm text-coral">
      {{ errorMessage }}
    </p>

    <div class="grid gap-4 xl:grid-cols-[420px_1fr]">
      <form class="rounded-md border border-[#dfe4da] bg-white p-4" @submit.prevent="submit">
        <h2 class="text-base font-semibold">Nova comissão</h2>
        <label class="mt-4 block text-sm font-medium">
          Pedido
          <select v-model="form.orderId" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" required>
            <option v-for="order in orders" :key="order.id" :value="order.id">
              #{{ order.number }} - {{ order.customer.name }} - {{ formatCurrency(order.total) }}
            </option>
          </select>
        </label>
        <label class="mt-4 block text-sm font-medium">
          Vendedor
          <input v-model="form.salespersonName" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" required />
        </label>
        <label class="mt-4 block text-sm font-medium">
          Percentual
          <input v-model.number="form.rate" type="number" min="0" step="0.01" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" required />
        </label>
        <button class="mt-5 w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white" type="submit" :disabled="isSaving || !orders.length">
          {{ isSaving ? 'Salvando...' : 'Registrar comissão' }}
        </button>
      </form>

      <section class="rounded-md border border-[#dfe4da] bg-white">
        <div class="border-b border-[#edf0ea] px-4 py-3">
          <h2 class="text-base font-semibold">Comissões registradas</h2>
        </div>
        <div v-if="!commissions.length" class="px-4 py-8 text-sm text-[#667067]">Nenhuma comissão registrada.</div>
        <article v-for="commission in commissions" :key="commission.id" class="flex items-center justify-between gap-3 border-b border-[#edf0ea] px-4 py-4">
          <div>
            <p class="font-semibold text-ink">{{ commission.salespersonName }}</p>
            <p class="mt-1 text-sm text-[#667067]">
              Pedido #{{ commission.order.number }} - {{ commission.rate }}% - {{ formatCurrency(commission.amount) }}
            </p>
          </div>
          <button v-if="!commission.paid" class="rounded-md bg-mint px-3 py-2 text-sm font-semibold text-white" type="button" @click="pay(commission)">
            Marcar paga
          </button>
          <span v-else class="text-sm font-semibold text-[#11644f]">Paga</span>
        </article>
      </section>
    </div>
  </section>
</template>
