<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  cancelSubscription,
  confirmSubscriptionCheckout,
  getBillingUsage,
  listPlans,
  reactivateSubscription,
  startSubscriptionCheckout
} from '../services/billingService';
import type { BillingUsage, Subscription, SubscriptionCheckout, SubscriptionPlan } from '../types/billing';

const plans = ref<SubscriptionPlan[]>([]);
const subscription = ref<Subscription | null>(null);
const usage = ref<BillingUsage | null>(null);
const pendingCheckout = ref<SubscriptionCheckout | null>(null);
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const selectingPlanCode = ref('');
const isConfirmingCheckout = ref(false);
const isUpdatingSubscription = ref(false);
const isCanceling = ref(false);
const showCancelForm = ref(false);
const cancellationReason = ref('');

onMounted(() => {
  loadBilling();
});

async function loadBilling() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const [plansData, usageData] = await Promise.all([listPlans(), getBillingUsage()]);
    plans.value = plansData;
    usage.value = usageData;
    subscription.value = usageData.subscription;
    pendingCheckout.value = usageData.pendingCheckout ?? null;
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
    pendingCheckout.value = await startSubscriptionCheckout(plan.code);
    successMessage.value = 'Checkout de assinatura criado.';
  } catch (error: unknown) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    errorMessage.value = message ?? 'Nao foi possivel iniciar a assinatura.';
  } finally {
    selectingPlanCode.value = '';
  }
}

async function confirmCheckout() {
  if (!pendingCheckout.value) {
    return;
  }

  errorMessage.value = '';
  successMessage.value = '';
  isConfirmingCheckout.value = true;

  try {
    subscription.value = await confirmSubscriptionCheckout(pendingCheckout.value.id);
    usage.value = await getBillingUsage();
    pendingCheckout.value = usage.value.pendingCheckout ?? null;
    successMessage.value = 'Assinatura ativada.';
  } catch (error: unknown) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    errorMessage.value = message ?? 'Nao foi possivel confirmar o checkout.';
  } finally {
    isConfirmingCheckout.value = false;
  }
}

async function cancelCurrentSubscription() {
  errorMessage.value = '';
  successMessage.value = '';
  isUpdatingSubscription.value = true;

  try {
    subscription.value = await cancelSubscription(cancellationReason.value || undefined);
    usage.value = await getBillingUsage();
    showCancelForm.value = false;
    cancellationReason.value = '';
    successMessage.value = 'Cancelamento agendado.';
  } catch (error: unknown) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    errorMessage.value = message ?? 'Nao foi possivel cancelar a assinatura.';
  } finally {
    isUpdatingSubscription.value = false;
  }
}

async function reactivateCurrentSubscription() {
  errorMessage.value = '';
  successMessage.value = '';
  isUpdatingSubscription.value = true;

  try {
    subscription.value = await reactivateSubscription();
    usage.value = await getBillingUsage();
    successMessage.value = 'Assinatura reativada.';
  } catch {
    errorMessage.value = 'Nao foi possivel reativar a assinatura.';
  } finally {
    isUpdatingSubscription.value = false;
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

function usageText(used?: number, limit?: number | null) {
  if (used === undefined) {
    return 'Sem uso registrado';
  }

  return limit === null || limit === undefined ? `${used} usados` : `${used} de ${limit} usados`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Sem data';
  }

  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

function canCancelSubscription() {
  return subscription.value?.status === 'ACTIVE' && !subscription.value.cancelAtPeriodEnd;
}

function canReactivateSubscription() {
  return subscription.value?.cancelAtPeriodEnd === true;
}

function trialMessage() {
  const trial = usage.value?.trial;

  if (!trial) {
    return '';
  }

  if (trial.expired) {
    return 'Seu trial terminou. Assine um plano para continuar criando orcamentos.';
  }

  return `Restam ${trial.daysRemaining} dias do trial.`;
}

function delinquencyMessage() {
  const delinquency = usage.value?.delinquency;

  if (!delinquency) {
    return '';
  }

  if (delinquency.suspended) {
    return 'Assinatura suspensa por inadimplencia. Regularize o plano para continuar usando recursos pagos.';
  }

  return `Pagamento pendente. Restam ${delinquency.daysRemaining} dias de tolerancia antes da suspensao.`;
}

function openCancelForm() {
  showCancelForm.value = true;
  isCanceling.value = false;
  cancellationReason.value = '';
}

function closeCancelForm() {
  showCancelForm.value = false;
  isCanceling.value = false;
  cancellationReason.value = '';
}

async function confirmCancellation() {
  isCanceling.value = true;
  await cancelCurrentSubscription();
  isCanceling.value = false;
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
      <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase text-[#667067]">Plano atual</p>
          <h2 class="mt-2 text-xl font-semibold text-ink">{{ subscription.plan.name }}</h2>
          <p class="mt-1 text-sm text-[#667067]">
            Status: {{ subscription.status }} - Renovacao: {{ formatDate(subscription.renewsAt) }}
          </p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="canCancelSubscription()"
            class="rounded-md border border-[#d9d0c6] px-3 py-2 text-sm font-semibold text-[#7a4b33] hover:bg-[#fff7f0] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            :disabled="isUpdatingSubscription"
            @click="openCancelForm"
          >
            Cancelar
          </button>
          <button
            v-if="canReactivateSubscription()"
            class="rounded-md bg-mint px-3 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            :disabled="isUpdatingSubscription"
            @click="reactivateCurrentSubscription"
          >
            Reativar
          </button>
        </div>
      </div>
      <div
        v-if="usage?.trial"
        class="mt-4 rounded-md border px-3 py-2 text-sm"
        :class="usage.trial.expired ? 'border-[#efc8bd] bg-[#fff7f4] text-coral' : 'border-[#cbded7] bg-[#edf3ee] text-[#11644f]'"
      >
        <p class="font-semibold">{{ trialMessage() }}</p>
        <p class="mt-1 text-xs">
          Inicio: {{ formatDate(usage.trial.startedAt) }} - Fim: {{ formatDate(usage.trial.endsAt) }}
        </p>
      </div>
      <div
        v-if="usage?.delinquency"
        class="mt-4 rounded-md border px-3 py-2 text-sm"
        :class="usage.delinquency.suspended ? 'border-[#efc8bd] bg-[#fff7f4] text-coral' : 'border-[#d9d0c6] bg-[#fffaf4] text-[#7a4b33]'"
      >
        <p class="font-semibold">{{ delinquencyMessage() }}</p>
        <p class="mt-1 text-xs">
          Vencimento: {{ formatDate(subscription.currentPeriodEnd) }} - Tolerancia: {{ formatDate(usage.delinquency.graceEndsAt) }}
        </p>
      </div>
      <dl class="mt-4 grid gap-3 text-sm text-[#465047] md:grid-cols-3">
        <div class="rounded-md border border-[#edf0ea] bg-[#f8faf6] p-3">
          <dt class="text-xs font-semibold uppercase text-[#667067]">Orcamentos do mes</dt>
          <dd class="mt-1 font-semibold">{{ usageText(usage?.limits.quotes.used, usage?.limits.quotes.limit) }}</dd>
        </div>
        <div class="rounded-md border border-[#edf0ea] bg-[#f8faf6] p-3">
          <dt class="text-xs font-semibold uppercase text-[#667067]">Usuarios</dt>
          <dd class="mt-1 font-semibold">{{ usageText(usage?.limits.users.used, usage?.limits.users.limit) }}</dd>
        </div>
        <div class="rounded-md border border-[#edf0ea] bg-[#f8faf6] p-3">
          <dt class="text-xs font-semibold uppercase text-[#667067]">IA/mes</dt>
          <dd class="mt-1 font-semibold">{{ subscription.plan.aiMonthlyLimit }} chamadas</dd>
        </div>
      </dl>
      <div
        v-if="subscription.cancelAtPeriodEnd"
        class="mt-4 rounded-md border border-[#d9d0c6] bg-[#fffaf4] px-3 py-2 text-sm text-[#7a4b33]"
      >
        <p class="font-semibold">Cancelamento agendado para {{ formatDate(subscription.currentPeriodEnd) }}.</p>
        <p v-if="subscription.cancellationReason" class="mt-1 text-xs">
          Motivo registrado: {{ subscription.cancellationReason }}
        </p>
      </div>
    </section>

    <section v-if="showCancelForm" class="rounded-md border border-[#d9d0c6] bg-white p-4">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase text-[#7a4b33]">Confirmar cancelamento</p>
          <h2 class="mt-2 text-lg font-semibold text-ink">A assinatura fica ativa ate {{ formatDate(subscription?.currentPeriodEnd) }}.</h2>
          <p class="mt-1 text-sm leading-6 text-[#667067]">
            Depois dessa data, recursos pagos podem ser bloqueados ate que uma assinatura seja reativada.
          </p>
        </div>
        <button
          class="rounded-md border border-[#dfe4da] px-3 py-2 text-sm font-semibold text-[#465047] hover:bg-[#edf3ee]"
          type="button"
          @click="closeCancelForm"
        >
          Manter plano
        </button>
      </div>
      <label class="mt-4 block text-sm font-medium text-[#465047]">
        Motivo opcional
        <textarea
          v-model="cancellationReason"
          class="mt-2 min-h-24 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
          maxlength="500"
        />
      </label>
      <button
        class="mt-4 rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-[#b85b45] disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        :disabled="isCanceling || isUpdatingSubscription"
        @click="confirmCancellation"
      >
        {{ isCanceling ? 'Cancelando...' : 'Confirmar cancelamento' }}
      </button>
    </section>

    <section v-if="pendingCheckout" class="rounded-md border border-[#d9d0c6] bg-[#fffaf4] p-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase text-[#7a4b33]">Checkout pendente</p>
          <h2 class="mt-1 text-lg font-semibold text-ink">
            {{ pendingCheckout.plan.name }} - {{ formatCurrency(pendingCheckout.amount) }}
          </h2>
          <p class="mt-1 text-sm text-[#667067]">
            Expira em {{ formatDate(pendingCheckout.expiresAt) }} - Provedor {{ pendingCheckout.provider }}
          </p>
        </div>
        <button
          class="rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="isConfirmingCheckout"
          @click="confirmCheckout"
        >
          {{ isConfirmingCheckout ? 'Confirmando...' : 'Confirmar pagamento' }}
        </button>
      </div>
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
          {{ subscription?.plan.code === plan.code ? 'Selecionado' : plan.monthlyPrice === '0' ? 'Usar demo' : 'Assinar' }}
        </button>
      </article>
    </section>
  </section>
</template>
