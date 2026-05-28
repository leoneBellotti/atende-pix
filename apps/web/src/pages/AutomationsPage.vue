<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import {
  createAutomationRule,
  listAutomationLogs,
  listAutomationRules,
  processExpiringQuoteReminders,
  processPendingPaymentReminders,
  processReadyOrderMessages,
  updateAutomationRule
} from '../services/automationsService';
import type { AutomationLog, AutomationRule, AutomationTrigger } from '../types/automation';

const rules = ref<AutomationRule[]>([]);
const logs = ref<AutomationLog[]>([]);
const errorMessage = ref('');
const isLoading = ref(false);
const isSaving = ref(false);
const isProcessing = ref(false);
const isProcessingPayments = ref(false);
const isProcessingOrders = ref(false);

const form = reactive({
  name: 'Follow-up de orcamento',
  trigger: 'QUOTE_SENT' as AutomationTrigger,
  delayHours: 24,
  messageBody: 'Ola! Passando para saber se ficou alguma duvida sobre o orcamento.'
});

const triggerOptions: Array<{ value: AutomationTrigger; label: string }> = [
  { value: 'QUOTE_SENT', label: 'Orcamento enviado' },
  { value: 'QUOTE_EXPIRING', label: 'Orcamento vencendo' },
  { value: 'PAYMENT_PENDING', label: 'Pagamento pendente' },
  { value: 'ORDER_READY', label: 'Pedido pronto' }
];

onMounted(() => {
  loadRules();
});

async function loadRules() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const [rulesData, logsData] = await Promise.all([listAutomationRules(), listAutomationLogs()]);
    rules.value = rulesData;
    logs.value = logsData;
  } catch {
    errorMessage.value = 'Nao foi possivel carregar as automacoes.';
  } finally {
    isLoading.value = false;
  }
}

async function submitRule() {
  errorMessage.value = '';
  isSaving.value = true;

  try {
    await createAutomationRule({
      name: form.name,
      trigger: form.trigger,
      delayHours: Number(form.delayHours),
      messageBody: form.messageBody
    });
    await loadRules();
  } catch {
    errorMessage.value = 'Nao foi possivel criar a regra.';
  } finally {
    isSaving.value = false;
  }
}

async function toggleRule(rule: AutomationRule) {
  errorMessage.value = '';

  try {
    await updateAutomationRule(rule.id, { active: !rule.active });
    await loadRules();
  } catch {
    errorMessage.value = 'Nao foi possivel atualizar a regra.';
  }
}

async function processExpiringQuotes() {
  errorMessage.value = '';
  isProcessing.value = true;

  try {
    await processExpiringQuoteReminders();
    await loadRules();
  } catch {
    errorMessage.value = 'Nao foi possivel processar os lembretes de orcamento.';
  } finally {
    isProcessing.value = false;
  }
}

async function processPendingPayments() {
  errorMessage.value = '';
  isProcessingPayments.value = true;

  try {
    await processPendingPaymentReminders();
    await loadRules();
  } catch {
    errorMessage.value = 'Nao foi possivel processar os lembretes de pagamento.';
  } finally {
    isProcessingPayments.value = false;
  }
}

async function processReadyOrders() {
  errorMessage.value = '';
  isProcessingOrders.value = true;

  try {
    await processReadyOrderMessages();
    await loadRules();
  } catch {
    errorMessage.value = 'Nao foi possivel processar as mensagens de pedido pronto.';
  } finally {
    isProcessingOrders.value = false;
  }
}

function triggerLabel(trigger: AutomationTrigger) {
  return triggerOptions.find((option) => option.value === trigger)?.label ?? trigger;
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
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold text-ink">Automacoes</h1>
      <p class="mt-1 text-sm text-[#667067]">
        Configure follow-ups simples para reduzir tarefas repetitivas.
      </p>
    </div>
    <div class="flex flex-col gap-2 sm:flex-row">
      <button
        class="rounded-md border border-[#cfd7ce] bg-white px-4 py-2 text-sm font-semibold text-[#465047] hover:bg-[#edf3ee] disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        :disabled="isProcessing"
        @click="processExpiringQuotes"
      >
        Processar orcamentos vencendo
      </button>
      <button
        class="rounded-md border border-[#cfd7ce] bg-white px-4 py-2 text-sm font-semibold text-[#465047] hover:bg-[#edf3ee] disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        :disabled="isProcessingPayments"
        @click="processPendingPayments"
      >
        Processar pagamentos pendentes
      </button>
      <button
        class="rounded-md border border-[#cfd7ce] bg-white px-4 py-2 text-sm font-semibold text-[#465047] hover:bg-[#edf3ee] disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        :disabled="isProcessingOrders"
        @click="processReadyOrders"
      >
        Processar pedidos prontos
      </button>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-md border border-[#efc8bd] bg-[#fff7f4] px-3 py-2 text-sm text-coral"
    >
      {{ errorMessage }}
    </p>

    <section class="grid gap-5 lg:grid-cols-[380px_1fr]">
      <form class="rounded-md border border-[#dfe4da] bg-white p-4" @submit.prevent="submitRule">
        <h2 class="text-base font-semibold">Nova regra</h2>
        <div class="mt-4 space-y-3">
          <label class="block">
            <span class="text-xs font-semibold text-[#667067]">Nome</span>
            <input
              v-model="form.name"
              class="mt-1 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
              required
            />
          </label>
          <label class="block">
            <span class="text-xs font-semibold text-[#667067]">Gatilho</span>
            <select
              v-model="form.trigger"
              class="mt-1 w-full rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
            >
              <option v-for="option in triggerOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="block">
            <span class="text-xs font-semibold text-[#667067]">Espera em horas</span>
            <input
              v-model.number="form.delayHours"
              class="mt-1 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
              min="1"
              required
              type="number"
            />
          </label>
          <label class="block">
            <span class="text-xs font-semibold text-[#667067]">Mensagem</span>
            <textarea
              v-model="form.messageBody"
              class="mt-1 min-h-28 w-full resize-none rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
              required
            />
          </label>
        </div>
        <button
          class="mt-4 w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          :disabled="isSaving"
        >
          Criar regra
        </button>
      </form>

      <section class="overflow-hidden rounded-md border border-[#dfe4da] bg-white">
        <div class="border-b border-[#edf0ea] px-4 py-3">
          <h2 class="text-base font-semibold">Regras configuradas</h2>
          <p class="mt-1 text-xs text-[#667067]">{{ rules.length }} regras</p>
        </div>
        <div v-if="isLoading" class="px-4 py-8 text-sm text-[#667067]">
          Carregando automacoes...
        </div>
        <div v-else-if="!rules.length" class="px-4 py-8 text-sm text-[#667067]">
          Nenhuma regra criada ainda.
        </div>
        <div v-else class="divide-y divide-[#edf0ea]">
          <article v-for="rule in rules" :key="rule.id" class="px-4 py-4">
            <div class="grid gap-3 lg:grid-cols-[1fr_140px_120px] lg:items-center">
              <div>
                <h3 class="font-semibold text-ink">{{ rule.name }}</h3>
                <p class="mt-1 text-sm text-[#465047]">{{ rule.messageBody }}</p>
                <p class="mt-2 text-xs text-[#667067]">
                  {{ triggerLabel(rule.trigger) }} apos {{ rule.delayHours }}h
                </p>
              </div>
              <p class="text-sm font-semibold" :class="rule.active ? 'text-[#11644f]' : 'text-[#667067]'">
                {{ rule.active ? 'Ativa' : 'Pausada' }}
              </p>
              <button
                class="rounded-md border border-[#cfd7ce] px-3 py-2 text-sm font-semibold text-[#465047] hover:bg-[#edf3ee]"
                type="button"
                @click="toggleRule(rule)"
              >
                {{ rule.active ? 'Pausar' : 'Ativar' }}
              </button>
            </div>
          </article>
        </div>
      </section>
    </section>

    <section class="overflow-hidden rounded-md border border-[#dfe4da] bg-white">
      <div class="border-b border-[#edf0ea] px-4 py-3">
        <h2 class="text-base font-semibold">Logs de automacao</h2>
        <p class="mt-1 text-xs text-[#667067]">{{ logs.length }} eventos recentes</p>
      </div>
      <div v-if="!logs.length" class="px-4 py-8 text-sm text-[#667067]">
        Nenhum log registrado ainda.
      </div>
      <div v-else class="divide-y divide-[#edf0ea]">
        <article v-for="log in logs" :key="log.id" class="px-4 py-3">
          <div class="grid gap-2 lg:grid-cols-[1fr_160px_180px] lg:items-center">
            <div>
              <p class="text-sm font-semibold text-ink">
                {{ log.rule?.name || log.targetType }} - {{ log.status }}
              </p>
              <p class="mt-1 text-xs text-[#667067]">{{ log.message || 'Sem mensagem' }}</p>
              <p v-if="log.errorMessage" class="mt-1 text-xs text-coral">
                {{ log.errorMessage }}
              </p>
            </div>
            <p class="text-xs text-[#667067]">Agendado: {{ formatDate(log.scheduledFor) }}</p>
            <p class="text-xs text-[#667067] lg:text-right">{{ formatDate(log.createdAt) }}</p>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
