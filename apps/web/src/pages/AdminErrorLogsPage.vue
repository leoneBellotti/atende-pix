<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { listAdminErrorLogs } from '../services/adminService';
import type { AdminErrorLog } from '../types/admin';

const logs = ref<AdminErrorLog[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');

onMounted(() => {
  loadLogs();
});

async function loadLogs() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    logs.value = await listAdminErrorLogs(200);
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } }).response?.status;
    errorMessage.value =
      status === 403
        ? 'Acesso administrativo restrito. Configure ADMIN_EMAILS para liberar este usuário.'
        : 'Não foi possível carregar os erros monitorados.';
  } finally {
    isLoading.value = false;
  }
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Sem data';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(new Date(value));
}

function severityClass(statusCode?: number) {
  if (!statusCode || statusCode >= 500) {
    return 'bg-[#fff7f4] text-coral';
  }

  return 'bg-[#fffaf4] text-[#7a4b33]';
}
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-ink">Monitoramento de erros</h1>
        <p class="mt-1 text-sm text-[#667067]">Eventos recentes registrados em .logs/api-errors.log.</p>
      </div>
      <button
        class="rounded-md border border-[#dfe4da] px-3 py-2 text-sm font-semibold text-[#465047] hover:bg-[#edf3ee]"
        type="button"
        @click="loadLogs"
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

    <section class="rounded-md border border-[#dfe4da] bg-white">
      <div class="border-b border-[#dfe4da] px-4 py-3">
        <h2 class="text-base font-semibold text-ink">Erros capturados</h2>
        <p class="text-sm text-[#667067]">{{ isLoading ? 'Carregando...' : `${logs.length} registros` }}</p>
      </div>

      <div class="divide-y divide-[#edf0ea]">
        <article v-for="log in logs" :key="`${log.timestamp}-${log.path}-${log.message}`" class="p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="rounded-md px-2 py-1 text-xs font-semibold"
                  :class="severityClass(log.statusCode)"
                >
                  {{ log.statusCode ?? 'LOG' }}
                </span>
                <span class="text-xs font-semibold uppercase text-[#667067]">{{ log.method ?? 'APP' }}</span>
                <span class="break-all text-sm font-semibold text-ink">{{ log.path ?? 'Sem rota' }}</span>
              </div>
              <p class="mt-3 text-sm text-[#465047]">{{ log.message ?? 'Sem mensagem' }}</p>
              <p v-if="log.userId || log.tenantId" class="mt-2 text-xs text-[#667067]">
                Usuário: {{ log.userId ?? 'n/a' }} - Empresa: {{ log.tenantId ?? 'n/a' }}
              </p>
            </div>
            <p class="shrink-0 text-xs text-[#667067]">{{ formatDate(log.timestamp) }}</p>
          </div>
          <details v-if="log.stack" class="mt-3">
            <summary class="cursor-pointer text-xs font-semibold text-[#11644f]">Stack trace</summary>
            <pre class="mt-2 max-h-64 overflow-auto rounded-md bg-[#f8faf6] p-3 text-xs text-[#465047]">{{ log.stack }}</pre>
          </details>
        </article>

        <div v-if="!logs.length && !isLoading" class="px-4 py-10 text-center text-sm text-[#667067]">
          Nenhum erro registrado no arquivo de monitoramento.
        </div>
      </div>
    </section>
  </section>
</template>
