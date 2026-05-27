<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getPublicPayment } from '../services/paymentsService';
import type { PublicPayment } from '../types/payment';

const route = useRoute();
const payment = ref<PublicPayment | null>(null);
const errorMessage = ref('');
const isLoading = ref(false);
const copied = ref(false);

const token = computed(() => String(route.params.token));

onMounted(() => {
  loadPayment();
});

async function loadPayment() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    payment.value = await getPublicPayment(token.value);
  } catch {
    errorMessage.value = 'Pagamento nao encontrado ou indisponivel.';
  } finally {
    isLoading.value = false;
  }
}

async function copyPix() {
  if (!payment.value?.qrCodeText) {
    return;
  }

  await navigator.clipboard.writeText(payment.value.qrCodeText);
  copied.value = true;
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value));
}

function statusLabel(status: PublicPayment['status']) {
  const labels = {
    PENDING: 'Aguardando pagamento',
    PAID: 'Pago',
    CANCELED: 'Cancelado',
    FAILED: 'Falhou'
  };

  return labels[status];
}
</script>

<template>
  <main class="min-h-screen bg-[#f7f8f5] px-4 py-8 text-ink">
    <section class="mx-auto max-w-3xl">
      <div
        v-if="isLoading"
        class="rounded-md border border-[#dfe4da] bg-white p-6 text-sm text-[#667067]"
      >
        Carregando pagamento...
      </div>
      <div
        v-else-if="errorMessage"
        class="rounded-md border border-[#efc8bd] bg-[#fff7f4] p-6 text-sm text-coral"
      >
        {{ errorMessage }}
      </div>
      <article v-else-if="payment" class="rounded-md border border-[#dfe4da] bg-white">
        <header class="border-b border-[#edf0ea] p-6">
          <p class="text-sm font-semibold text-[#11644f]">{{ payment.tenant.name }}</p>
          <h1 class="mt-2 text-2xl font-semibold">
            Pagamento do pedido #{{ payment.order.number }}
          </h1>
          <p class="mt-1 text-sm text-[#667067]">{{ statusLabel(payment.status) }}</p>
        </header>

        <section class="grid gap-5 p-6 md:grid-cols-[1fr_220px]">
          <div>
            <h2 class="text-sm font-semibold text-[#667067]">Cliente</h2>
            <p class="mt-2 font-semibold">{{ payment.order.customer.name }}</p>
            <p class="mt-1 text-sm text-[#667067]">
              {{ payment.order.customer.phone || payment.order.customer.email || '' }}
            </p>

            <div class="mt-6 rounded-md bg-[#f7f8f5] p-4">
              <p class="text-sm text-[#667067]">Valor</p>
              <p class="mt-1 text-3xl font-semibold">{{ formatCurrency(payment.amount) }}</p>
            </div>

            <button
              v-if="payment.qrCodeText"
              class="mt-5 rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-[#176d58]"
              type="button"
              @click="copyPix"
            >
              {{ copied ? 'Pix copiado' : 'Copiar Pix copia e cola' }}
            </button>
            <a
              v-if="payment.paymentUrl"
              class="ml-0 mt-3 inline-block rounded-md border border-[#cfd7ce] px-4 py-2 text-sm font-semibold text-[#465047] hover:bg-[#edf3ee] sm:ml-2"
              :href="payment.paymentUrl"
              rel="noreferrer"
              target="_blank"
            >
              Abrir no Mercado Pago
            </a>
          </div>

          <div
            class="flex items-center justify-center rounded-md border border-[#edf0ea] bg-[#f7f8f5] p-4"
          >
            <img
              v-if="payment.qrCode"
              alt="QR Code Pix"
              class="h-48 w-48"
              :src="`data:image/png;base64,${payment.qrCode}`"
            />
            <p v-else class="text-center text-sm text-[#667067]">
              QR Code indisponivel. Use o link ou copia e cola.
            </p>
          </div>
        </section>
      </article>
    </section>
  </main>
</template>
