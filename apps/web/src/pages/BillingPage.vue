<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getSubscription, listPlans, selectPlan } from '../services/billingService';
import type { Subscription, SubscriptionPlan } from '../types/billing';

const plans = ref<SubscriptionPlan[]>([]);
const subscription = ref<Subscription | null>(null);
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const selectingPlanCode = ref('');

onMounted(() => {
  loadBilling();
});

async function loadBilling() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const [plansData, subscriptionData] = await Promise.all([listPlans(), getSubscription()]);
    plans.value = plansData;
    subscription.value = subscriptionData;
  } catch {
    errorMessage.value = 'Nao foi possivel carregar os planos.';
  } finally {
    isLoading.value = false;
  }
}

async function choosePlan(plan: SubscriptionPlan) {
  errorMessage.value = '';
  successMessage.value = '';
  selectingPlanCode.value = plan.code;

  try {
    subscription.value = await selectPlan(plan.code);
    successMessage.value = 'Plano selecionado.';
  } catch {
    errorMessage.value = 'Nao foi possivel selecionar o plano.';
  } finally {
    selectingPlanCode.value = '';
  }
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value));
}

function limitLabel(value?: number | null) {
  return value ? String(value) : 'Ilimitado';
}
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold text-ink">Plano e assinatura</h1>
      <p class="mt-1 text-sm text-[#667067]">
        Escolha o plano operacional da empresa.
      </p>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-md border border-[#efc8bd] bg-[#fff7f4] px-3 py-2 text-sm text-coral"
    >
      {{ errorMessage }}
    </p>
    <p
      v-if="successMessage"
      class="rounded-md border border-[#cbded7] bg-[#edf3ee] px-3 py-2 text-sm text-[#11644f]"
    >
      {{ successMessage }}
    </p>

    <section v-if="subscription" class="rounded-md border border-[#dfe4da] bg-white p-4">
      <p class="text-xs font-semibold uppercase text-[#667067]">Plano atual</p>
      <h2 class="mt-2 text-xl font-semibold text-ink">{{ subscription.plan.name }}</h2>
      <p class="mt-1 text-sm text-[#667067]">Status: {{ subscription.status }}</p>
    </section>

    <section class="grid gap-4 lg:grid-cols-4">
      <div v-if="isLoading" class="rounded-md border border-[#dfe4da] bg-white p-4 text-sm text-[#667067]">
        Carregando planos...
      </div>
      <article
        v-for="plan in plans"
        v-else
        :key="plan.id"
        class="rounded-md border border-[#dfe4da] bg-white p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-ink">{{ plan.name }}</h2>
            <p class="mt-1 text-2xl font-semibold text-[#11644f]">
              {{ formatCurrency(plan.monthlyPrice) }}
            </p>
          </div>
          <span
            v-if="subscription?.plan.code === plan.code"
            class="rounded-md bg-[#dcebe3] px-2 py-1 text-xs font-semibold text-[#11644f]"
          >
            Atual
          </span>
        </div>
        <dl class="mt-4 space-y-2 text-sm text-[#465047]">
          <div class="flex justify-between gap-3">
            <dt>Orcamentos</dt>
            <dd class="font-semibold">{{ limitLabel(plan.quoteLimit) }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt>Usuarios</dt>
            <dd class="font-semibold">{{ limitLabel(plan.userLimit) }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt>IA/mes</dt>
            <dd class="font-semibold">{{ plan.aiMonthlyLimit }}</dd>
          </div>
        </dl>
        <button
          class="mt-4 w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="subscription?.plan.code === plan.code || selectingPlanCode === plan.code"
          @click="choosePlan(plan)"
        >
          {{ subscription?.plan.code === plan.code ? 'Selecionado' : 'Selecionar' }}
        </button>
      </article>
    </section>
  </section>
</template>
