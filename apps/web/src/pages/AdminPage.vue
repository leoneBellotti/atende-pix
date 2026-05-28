<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  getAdminSummary,
  listAdminTenants,
  markTenantPastDue,
  regularizeTenant,
  suspendTenant
} from '../services/adminService';
import type { AdminSummary, AdminTenant } from '../types/admin';

const summary = ref<AdminSummary | null>(null);
const tenants = ref<AdminTenant[]>([]);
const isLoading = ref(false);
const actionTenantId = ref('');
const errorMessage = ref('');

onMounted(() => {
  loadAdmin();
});

async function loadAdmin() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const [summaryData, tenantsData] = await Promise.all([getAdminSummary(), listAdminTenants()]);
    summary.value = summaryData;
    tenants.value = tenantsData;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } }).response?.status;
    errorMessage.value =
      status === 403
        ? 'Acesso administrativo restrito. Configure ADMIN_EMAILS para liberar este usuario.'
        : 'Nao foi possivel carregar o painel admin.';
  } finally {
    isLoading.value = false;
  }
}

async function runTenantAction(tenantId: string, action: 'past-due' | 'suspend' | 'regularize') {
  actionTenantId.value = tenantId;
  errorMessage.value = '';

  try {
    if (action === 'past-due') {
      await markTenantPastDue(tenantId);
    }

    if (action === 'suspend') {
      await suspendTenant(tenantId);
    }

    if (action === 'regularize') {
      await regularizeTenant(tenantId);
    }

    await loadAdmin();
  } catch {
    errorMessage.value = 'Nao foi possivel atualizar a assinatura da empresa.';
  } finally {
    actionTenantId.value = '';
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Sem data';
  }

  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

function canMarkPastDue(tenant: AdminTenant) {
  return ['ACTIVE', 'CANCELING'].includes(tenant.subscriptionStatus);
}

function canSuspend(tenant: AdminTenant) {
  return tenant.subscriptionStatus === 'PAST_DUE';
}

function canRegularize(tenant: AdminTenant) {
  return ['PAST_DUE', 'SUSPENDED', 'CANCELED'].includes(tenant.subscriptionStatus);
}
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-ink">Admin SaaS</h1>
        <p class="mt-1 text-sm text-[#667067]">Acompanhamento interno de empresas, planos e uso.</p>
      </div>
      <button
        class="rounded-md border border-[#dfe4da] px-3 py-2 text-sm font-semibold text-[#465047] hover:bg-[#edf3ee]"
        type="button"
        @click="loadAdmin"
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

    <section v-if="summary" class="grid gap-4 md:grid-cols-4">
      <div class="rounded-md border border-[#dfe4da] bg-white p-4">
        <p class="text-xs font-semibold uppercase text-[#667067]">Empresas</p>
        <p class="mt-2 text-2xl font-semibold text-ink">{{ summary.totalTenants }}</p>
      </div>
      <div class="rounded-md border border-[#dfe4da] bg-white p-4">
        <p class="text-xs font-semibold uppercase text-[#667067]">Assinaturas ativas</p>
        <p class="mt-2 text-2xl font-semibold text-[#11644f]">{{ summary.activeSubscriptions }}</p>
      </div>
      <div class="rounded-md border border-[#dfe4da] bg-white p-4">
        <p class="text-xs font-semibold uppercase text-[#667067]">Trials</p>
        <p class="mt-2 text-2xl font-semibold text-ink">{{ summary.trialSubscriptions }}</p>
        <p class="mt-1 text-xs text-coral">{{ summary.expiredTrials }} expirados</p>
      </div>
      <div class="rounded-md border border-[#dfe4da] bg-white p-4">
        <p class="text-xs font-semibold uppercase text-[#667067]">MRR simulado</p>
        <p class="mt-2 text-2xl font-semibold text-ink">{{ formatCurrency(summary.subscriptionRevenueThisMonth) }}</p>
      </div>
    </section>

    <section class="rounded-md border border-[#dfe4da] bg-white">
      <div class="border-b border-[#dfe4da] px-4 py-3">
        <h2 class="text-base font-semibold text-ink">Empresas cadastradas</h2>
        <p class="text-sm text-[#667067]">{{ isLoading ? 'Carregando...' : `${tenants.length} registros` }}</p>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[#edf0ea] text-sm">
          <thead class="bg-[#f8faf6] text-left text-xs font-semibold uppercase text-[#667067]">
            <tr>
              <th class="px-4 py-3">Empresa</th>
              <th class="px-4 py-3">Plano</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Renovacao</th>
              <th class="px-4 py-3">Uso</th>
              <th class="px-4 py-3">Criada em</th>
              <th class="px-4 py-3">Acoes</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#edf0ea]">
            <tr v-for="tenant in tenants" :key="tenant.id" class="align-top">
              <td class="px-4 py-3">
                <p class="font-semibold text-ink">{{ tenant.name }}</p>
                <p class="text-xs text-[#667067]">{{ tenant.slug }}</p>
              </td>
              <td class="px-4 py-3 font-semibold text-[#465047]">{{ tenant.planName }}</td>
              <td class="px-4 py-3">
                <p class="font-semibold text-ink">{{ tenant.subscriptionStatus }}</p>
                <p v-if="tenant.pastDueAt" class="text-xs text-[#7a4b33]">
                  Desde {{ formatDate(tenant.pastDueAt) }}
                </p>
                <p v-if="tenant.suspendedAt" class="text-xs text-coral">
                  Suspensa em {{ formatDate(tenant.suspendedAt) }}
                </p>
              </td>
              <td class="px-4 py-3">{{ formatDate(tenant.renewsAt) }}</td>
              <td class="px-4 py-3 text-xs text-[#667067]">
                {{ tenant.usage.users }} usuarios · {{ tenant.usage.customers }} clientes ·
                {{ tenant.usage.quotes }} orcamentos · {{ tenant.usage.payments }} pagamentos
              </td>
              <td class="px-4 py-3">{{ formatDate(tenant.createdAt) }}</td>
              <td class="px-4 py-3">
                <div class="flex min-w-36 flex-wrap gap-2">
                  <button
                    v-if="canMarkPastDue(tenant)"
                    class="rounded-md border border-[#d9d0c6] px-2 py-1 text-xs font-semibold text-[#7a4b33] hover:bg-[#fff7f0] disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    :disabled="actionTenantId === tenant.id"
                    @click="runTenantAction(tenant.id, 'past-due')"
                  >
                    Inadimplente
                  </button>
                  <button
                    v-if="canSuspend(tenant)"
                    class="rounded-md border border-[#efc8bd] px-2 py-1 text-xs font-semibold text-coral hover:bg-[#fff7f4] disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    :disabled="actionTenantId === tenant.id"
                    @click="runTenantAction(tenant.id, 'suspend')"
                  >
                    Suspender
                  </button>
                  <button
                    v-if="canRegularize(tenant)"
                    class="rounded-md bg-mint px-2 py-1 text-xs font-semibold text-white hover:bg-[#176d58] disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    :disabled="actionTenantId === tenant.id"
                    @click="runTenantAction(tenant.id, 'regularize')"
                  >
                    Regularizar
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!tenants.length && !isLoading">
              <td class="px-4 py-8 text-center text-sm text-[#667067]" colspan="7">
                Nenhuma empresa para exibir.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
