<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { createAppointment, listAppointments, updateAppointment, type Appointment } from '../services/appointmentsService';
import { listCustomers } from '../services/customersService';
import { listLocations, type LocationRecord } from '../services/locationsService';
import type { Customer } from '../types/customer';

const appointments = ref<Appointment[]>([]);
const customers = ref<Customer[]>([]);
const locations = ref<LocationRecord[]>([]);
const errorMessage = ref('');
const isSaving = ref(false);

const form = reactive({
  customerId: '',
  locationId: '',
  title: '',
  startsAt: '',
  endsAt: '',
  responsibleName: '',
  notes: ''
});

onMounted(async () => {
  await Promise.all([loadAppointments(), loadCustomers(), loadLocations()]);
});

async function loadAppointments() {
  appointments.value = await listAppointments();
}

async function loadCustomers() {
  customers.value = await listCustomers();
  form.customerId = customers.value[0]?.id ?? '';
}

async function loadLocations() {
  locations.value = await listLocations();
}

async function submit() {
  errorMessage.value = '';
  isSaving.value = true;

  try {
    await createAppointment({
      customerId: form.customerId,
      locationId: form.locationId || undefined,
      title: form.title,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      responsibleName: form.responsibleName || undefined,
      notes: form.notes || undefined
    });
    form.title = '';
    form.startsAt = '';
    form.endsAt = '';
    form.responsibleName = '';
    form.notes = '';
    await loadAppointments();
  } catch {
    errorMessage.value = 'Não foi possível criar o agendamento.';
  } finally {
    isSaving.value = false;
  }
}

async function setStatus(appointment: Appointment, status: Appointment['status']) {
  await updateAppointment(appointment.id, { status });
  await loadAppointments();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold text-ink">Agenda</h1>
      <p class="mt-1 text-sm text-[#667067]">Serviços, visitas e entregas com cliente, unidade e responsável.</p>
    </div>

    <p v-if="errorMessage" class="rounded-md border border-[#efc8bd] bg-[#fff7f4] px-3 py-2 text-sm text-coral">
      {{ errorMessage }}
    </p>

    <div class="grid gap-4 xl:grid-cols-[420px_1fr]">
      <form class="rounded-md border border-[#dfe4da] bg-white p-4" @submit.prevent="submit">
        <h2 class="text-base font-semibold">Novo agendamento</h2>
        <label class="mt-4 block text-sm font-medium">
          Cliente
          <select v-model="form.customerId" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" required>
            <option v-for="customer in customers" :key="customer.id" :value="customer.id">{{ customer.name }}</option>
          </select>
        </label>
        <label class="mt-4 block text-sm font-medium">
          Unidade
          <select v-model="form.locationId" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm">
            <option value="">Sem unidade</option>
            <option v-for="location in locations" :key="location.id" :value="location.id">{{ location.name }}</option>
          </select>
        </label>
        <label class="mt-4 block text-sm font-medium">
          Título
          <input v-model="form.title" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" required />
        </label>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <label class="block text-sm font-medium">
            Início
            <input v-model="form.startsAt" type="datetime-local" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" required />
          </label>
          <label class="block text-sm font-medium">
            Fim
            <input v-model="form.endsAt" type="datetime-local" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" />
          </label>
        </div>
        <label class="mt-4 block text-sm font-medium">
          Responsável
          <input v-model="form.responsibleName" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" />
        </label>
        <label class="mt-4 block text-sm font-medium">
          Observações
          <textarea v-model="form.notes" rows="3" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm"></textarea>
        </label>
        <button class="mt-5 w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white" type="submit" :disabled="isSaving">
          {{ isSaving ? 'Salvando...' : 'Criar agendamento' }}
        </button>
      </form>

      <section class="rounded-md border border-[#dfe4da] bg-white">
        <div class="border-b border-[#edf0ea] px-4 py-3">
          <h2 class="text-base font-semibold">Próximos agendamentos</h2>
        </div>
        <div v-if="!appointments.length" class="px-4 py-8 text-sm text-[#667067]">Nenhum agendamento criado.</div>
        <article v-for="appointment in appointments" :key="appointment.id" class="border-b border-[#edf0ea] px-4 py-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-ink">{{ appointment.title }}</p>
              <p class="mt-1 text-sm text-[#667067]">
                {{ appointment.customer.name }} - {{ appointment.location?.name || 'Sem unidade' }}
              </p>
              <p class="mt-1 text-sm text-[#465047]">{{ formatDate(appointment.startsAt) }}</p>
            </div>
            <select :value="appointment.status" class="rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" @change="setStatus(appointment, ($event.target as HTMLSelectElement).value as Appointment['status'])">
              <option value="SCHEDULED">Agendado</option>
              <option value="DONE">Concluído</option>
              <option value="CANCELED">Cancelado</option>
              <option value="NO_SHOW">Não compareceu</option>
            </select>
          </div>
        </article>
      </section>
    </div>
  </section>
</template>
