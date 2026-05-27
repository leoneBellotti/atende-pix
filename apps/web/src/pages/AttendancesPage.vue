<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  createAttendance,
  listAttendances,
  updateAttendanceStatus
} from '../services/attendancesService';
import { listCustomers } from '../services/customersService';
import type { Attendance, AttendanceOrigin, AttendanceStatus } from '../types/attendance';
import type { Customer } from '../types/customer';

const attendances = ref<Attendance[]>([]);
const customers = ref<Customer[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');

const filters = reactive({
  search: '',
  origin: '' as AttendanceOrigin | '',
  status: '' as AttendanceStatus | ''
});

const form = reactive({
  customerId: '',
  origin: 'WHATSAPP' as AttendanceOrigin,
  summary: '',
  internalNotes: '',
  responsibleName: ''
});

const hasAttendances = computed(() => attendances.value.length > 0);

const originOptions: Array<{ value: AttendanceOrigin; label: string }> = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'PHONE', label: 'Telefone' },
  { value: 'IN_PERSON', label: 'Presencial' },
  { value: 'OTHER', label: 'Outro' }
];

const statusOptions: Array<{ value: AttendanceStatus; label: string }> = [
  { value: 'NEW', label: 'Novo' },
  { value: 'IN_PROGRESS', label: 'Em atendimento' },
  { value: 'WAITING_CUSTOMER', label: 'Aguardando cliente' },
  { value: 'WAITING_PAYMENT', label: 'Aguardando pagamento' },
  { value: 'DONE', label: 'Concluido' },
  { value: 'CANCELED', label: 'Cancelado' }
];

onMounted(async () => {
  await Promise.all([loadCustomers(), loadAttendances()]);
});

async function loadCustomers() {
  customers.value = await listCustomers();

  if (!form.customerId && customers.value[0]) {
    form.customerId = customers.value[0].id;
  }
}

async function loadAttendances() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    attendances.value = await listAttendances(filters);
  } catch {
    errorMessage.value = 'Nao foi possivel carregar os atendimentos.';
  } finally {
    isLoading.value = false;
  }
}

async function submit() {
  errorMessage.value = '';
  isSaving.value = true;

  try {
    await createAttendance({
      customerId: form.customerId,
      origin: form.origin,
      summary: form.summary || undefined,
      internalNotes: form.internalNotes || undefined,
      responsibleName: form.responsibleName || undefined
    });
    resetForm();
    await loadAttendances();
  } catch {
    errorMessage.value = 'Nao foi possivel criar o atendimento.';
  } finally {
    isSaving.value = false;
  }
}

async function changeStatus(attendance: Attendance, status: AttendanceStatus) {
  errorMessage.value = '';

  try {
    await updateAttendanceStatus(attendance.id, status);
    await loadAttendances();
  } catch {
    errorMessage.value = 'Nao foi possivel atualizar o status.';
  }
}

function resetForm() {
  form.customerId = customers.value[0]?.id ?? '';
  form.origin = 'WHATSAPP';
  form.summary = '';
  form.internalNotes = '';
  form.responsibleName = '';
}

function optionLabel<T extends string>(options: Array<{ value: T; label: string }>, value: T) {
  return options.find((option) => option.value === value)?.label ?? value;
}
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-ink">Atendimentos</h1>
        <p class="mt-1 text-sm text-[#667067]">
          Registre a origem da conversa, acompanhe status e puxe o proximo passo.
        </p>
      </div>
      <form
        class="grid gap-2 sm:grid-cols-[1fr_150px_190px_auto]"
        @submit.prevent="loadAttendances"
      >
        <input
          v-model="filters.search"
          class="rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
          placeholder="Buscar por cliente ou nota"
        />
        <select
          v-model="filters.origin"
          class="rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
        >
          <option value="">Origem</option>
          <option v-for="origin in originOptions" :key="origin.value" :value="origin.value">
            {{ origin.label }}
          </option>
        </select>
        <select
          v-model="filters.status"
          class="rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
        >
          <option value="">Status</option>
          <option v-for="status in statusOptions" :key="status.value" :value="status.value">
            {{ status.label }}
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

    <div class="grid gap-4 xl:grid-cols-[380px_1fr]">
      <form class="rounded-md border border-[#dfe4da] bg-white p-4" @submit.prevent="submit">
        <h2 class="text-base font-semibold">Novo atendimento</h2>
        <label class="mt-4 block text-sm font-medium">
          Cliente
          <select
            v-model="form.customerId"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            required
          >
            <option value="" disabled>Selecione um cliente</option>
            <option v-for="customer in customers" :key="customer.id" :value="customer.id">
              {{ customer.name }}
            </option>
          </select>
        </label>
        <label class="mt-4 block text-sm font-medium">
          Origem
          <select
            v-model="form.origin"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
          >
            <option v-for="origin in originOptions" :key="origin.value" :value="origin.value">
              {{ origin.label }}
            </option>
          </select>
        </label>
        <label class="mt-4 block text-sm font-medium">
          Responsavel
          <input
            v-model="form.responsibleName"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
          />
        </label>
        <label class="mt-4 block text-sm font-medium">
          Resumo da conversa
          <textarea
            v-model="form.summary"
            class="mt-2 min-h-20 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
          />
        </label>
        <label class="mt-4 block text-sm font-medium">
          Notas internas
          <textarea
            v-model="form.internalNotes"
            class="mt-2 min-h-20 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
          />
        </label>
        <button
          class="mt-5 w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:opacity-60"
          type="submit"
          :disabled="isSaving || !customers.length"
        >
          {{ isSaving ? 'Salvando...' : 'Abrir atendimento' }}
        </button>
      </form>

      <section class="overflow-hidden rounded-md border border-[#dfe4da] bg-white">
        <div class="flex items-center justify-between border-b border-[#edf0ea] px-4 py-3">
          <h2 class="text-base font-semibold">Fila de atendimento</h2>
          <span class="text-xs text-[#667067]">{{ attendances.length }} encontrados</span>
        </div>

        <div v-if="isLoading" class="px-4 py-8 text-sm text-[#667067]">
          Carregando atendimentos...
        </div>
        <div v-else-if="!hasAttendances" class="px-4 py-8 text-sm text-[#667067]">
          Nenhum atendimento encontrado.
        </div>
        <div v-else class="divide-y divide-[#edf0ea]">
          <article v-for="attendance in attendances" :key="attendance.id" class="px-4 py-4">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-semibold text-ink">{{ attendance.customer.name }}</h3>
                  <span class="rounded bg-[#dcebe3] px-2 py-1 text-xs font-semibold text-[#11644f]">
                    {{ optionLabel(originOptions, attendance.origin) }}
                  </span>
                  <span class="rounded bg-[#f4ead1] px-2 py-1 text-xs font-semibold text-[#7a5b12]">
                    {{ optionLabel(statusOptions, attendance.status) }}
                  </span>
                </div>
                <p class="mt-2 text-sm text-[#465047]">
                  {{ attendance.summary || 'Sem resumo informado.' }}
                </p>
                <p class="mt-2 text-xs text-[#667067]">
                  Responsavel: {{ attendance.responsibleName || 'Nao definido' }}
                </p>
              </div>
              <select
                class="rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
                :value="attendance.status"
                @change="
                  changeStatus(
                    attendance,
                    ($event.target as HTMLSelectElement).value as AttendanceStatus
                  )
                "
              >
                <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                  {{ status.label }}
                </option>
              </select>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>
