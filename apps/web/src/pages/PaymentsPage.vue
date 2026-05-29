<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { listPayments, listPaymentWebhookEvents } from '../services/paymentsService';
import type {
  PaymentProvider,
  PaymentRecord,
  PaymentStatus,
  PaymentWebhookEvent
} from '../types/payment';

const payments = ref<PaymentRecord[]>([]);
const webhookEvents = ref<PaymentWebhookEvent[]>([]);
const status = ref<PaymentStatus | ''>('');
const provider = ref<PaymentProvider | ''>('');
const errorMessage = ref('');
const isLoading = ref(false);

const statusOptions: Array<{ value: PaymentStatus; label: string }> = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'PAID', label: 'Pago' },
  { value: 'CANCELED', label: 'Cancelado' },
  { value: 'FAILED', label: 'Falhou' }
];

const providerOptions: Array<{ value: PaymentProvider; label: string }> = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'MERCADO_PAGO', label: 'Mercado Pago' }
];

const filteredPayments = computed(() =>
  payments.value.filter((payment) => {
    const matchesStatus = !status.value || payment.status === status.value;
    const matchesProvider = !provider.value || payment.provider === provider.value;

    return matchesStatus && matchesProvider;
  })
);

const paidTotal = computed(() =>
  filteredPayments.value
    .filter((payment) => payment.status === 'PAID')
    .reduce((total, payment) => total + Number(payment.amount), 0)
);

onMounted(() => {
  loadPayments();
});

async function loadPayments() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const [paymentsData, webhookEventsData] = await Promise.all([
      listPayments(),
      listPaymentWebhookEvents()
    ]);
    payments.value = paymentsData;
    webhookEvents.value = webhookEventsData;
  } catch {
    errorMessage.value = 'Não foi possível carregar os pagamentos.';
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
    return 'Sem data';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function statusLabel(value: PaymentStatus) {
  return statusOptions.find((option) => option.value === value)?.label ?? value;
}

function providerLabel(value: PaymentProvider) {
  return providerOptions.find((option) => option.value === value)?.label ?? value;
}

function publicPaymentUrl(payment: PaymentRecord) {
  if (!payment.publicToken) {
    return '';
  }

  return `${window.location.origin}/public/payments/${payment.publicToken}`;
}

async function copyPix(payment: PaymentRecord) {
  if (!payment.qrCodeText) {
    return;
  }

  await navigator.clipboard.writeText(payment.qrCodeText);
}
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-ink">Pagamentos</h1>
        <p class="mt-1 text-sm text-[#667067]">
          Consulte os pagamentos registrados e acompanhe o recebimento por pedido.
        </p>
      </div>
      <button
        class="rounded-md border border-[#cfd7ce] bg-white px-4 py-2 text-sm font-semibold text-[#465047] hover:bg-[#edf3ee]"
        type="button"
        @click="loadPayments"
      >
        Atualizar
      </button>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-md border border-[#efc8bd] bg-[#fff7f4] px-3 py-2 text-sm text-coral"
    >
      {{ errorMessage }}
    </p>

    <section class="grid gap-3 md:grid-cols-3">
      <div class="rounded-md border border-[#dfe4da] bg-white px-4 py-3">
        <p class="text-xs font-semibold uppercase text-[#667067]">Pagamentos</p>
        <p class="mt-2 text-2xl font-semibold text-ink">{{ filteredPayments.length }}</p>
      </div>
      <div class="rounded-md border border-[#dfe4da] bg-white px-4 py-3">
        <p class="text-xs font-semibold uppercase text-[#667067]">Recebido</p>
        <p class="mt-2 text-2xl font-semibold text-ink">{{ formatCurrency(paidTotal) }}</p>
      </div>
      <div class="rounded-md border border-[#dfe4da] bg-white px-4 py-3">
        <p class="text-xs font-semibold uppercase text-[#667067]">Pendentes</p>
        <p class="mt-2 text-2xl font-semibold text-ink">
          {{ filteredPayments.filter((payment) => payment.status === 'PENDING').length }}
        </p>
      </div>
    </section>

    <section class="overflow-hidden rounded-md border border-[#dfe4da] bg-white">
      <div
        class="flex flex-col gap-3 border-b border-[#edf0ea] px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h2 class="text-base font-semibold">Histórico de pagamentos</h2>
          <p class="mt-1 text-xs text-[#667067]">{{ filteredPayments.length }} encontrados</p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row">
          <select
            v-model="status"
            class="rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
          >
            <option value="">Todos os status</option>
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <select
            v-model="provider"
            class="rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
          >
            <option value="">Todos os provedores</option>
            <option v-for="option in providerOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="isLoading" class="px-4 py-8 text-sm text-[#667067]">Carregando pagamentos...</div>
      <div v-else-if="!filteredPayments.length" class="px-4 py-8 text-sm text-[#667067]">
        Nenhum pagamento encontrado.
      </div>
      <div v-else class="divide-y divide-[#edf0ea]">
        <article v-for="payment in filteredPayments" :key="payment.id" class="px-4 py-4">
          <div class="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center">
            <div>
              <p class="text-xs font-semibold text-[#667067]">Pedido #{{ payment.order.number }}</p>
              <h3 class="mt-1 font-semibold text-ink">{{ payment.order.customer.name }}</h3>
              <p class="mt-1 text-xs text-[#667067]">
                Criado em {{ formatDate(payment.createdAt) }}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold text-[#667067]">Origem</p>
              <p class="mt-1 text-sm text-[#465047]">{{ providerLabel(payment.provider) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-[#667067]">Status</p>
              <p class="mt-1 text-sm text-[#465047]">{{ statusLabel(payment.status) }}</p>
              <p class="mt-1 text-xs text-[#667067]">Pago em {{ formatDate(payment.paidAt) }}</p>
            </div>
            <div class="flex flex-col gap-2 lg:items-end">
              <p class="text-lg font-semibold text-ink lg:text-right">
                {{ formatCurrency(payment.amount) }}
              </p>
              <button
                v-if="payment.qrCodeText"
                class="rounded-md border border-[#cfd7ce] px-3 py-1.5 text-xs font-semibold text-[#465047] hover:bg-[#edf3ee]"
                type="button"
                @click="copyPix(payment)"
              >
                Copiar Pix
              </button>
              <a
                v-if="payment.paymentUrl"
                class="text-xs font-semibold text-[#11644f]"
                :href="payment.paymentUrl"
                rel="noreferrer"
                target="_blank"
              >
                Abrir link
              </a>
              <a
                v-if="payment.publicToken"
                class="text-xs font-semibold text-[#11644f]"
                :href="publicPaymentUrl(payment)"
                target="_blank"
              >
                Link público
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="overflow-hidden rounded-md border border-[#dfe4da] bg-white">
      <div class="border-b border-[#edf0ea] px-4 py-3">
        <h2 class="text-base font-semibold">Logs de pagamento</h2>
        <p class="mt-1 text-xs text-[#667067]">{{ webhookEvents.length }} eventos recentes</p>
      </div>
      <div v-if="!webhookEvents.length" class="px-4 py-8 text-sm text-[#667067]">
        Nenhum webhook recebido ainda.
      </div>
      <div v-else class="divide-y divide-[#edf0ea]">
        <article v-for="event in webhookEvents" :key="event.id" class="px-4 py-3">
          <div class="grid gap-2 lg:grid-cols-[1fr_160px_180px] lg:items-center">
            <div>
              <p class="text-sm font-semibold text-ink">
                {{ event.eventType || 'payment' }} - {{ event.status }}
              </p>
              <p class="mt-1 text-xs text-[#667067]">
                {{ event.payment?.order.customer.name || 'Pagamento não vinculado' }}
              </p>
              <p v-if="event.errorMessage" class="mt-1 text-xs text-coral">
                {{ event.errorMessage }}
              </p>
            </div>
            <p class="text-xs text-[#667067]">MP: {{ event.providerPaymentId || '-' }}</p>
            <p class="text-xs text-[#667067] lg:text-right">
              {{ formatDate(event.createdAt) }}
            </p>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
