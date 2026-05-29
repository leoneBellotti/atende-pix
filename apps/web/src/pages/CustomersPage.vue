<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { createCustomer, listCustomers } from '../services/customersService';
import type { Customer } from '../types/customer';

const customers = ref<Customer[]>([]);
const search = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const isSaving = ref(false);

const form = reactive({
  name: '',
  phone: '',
  email: '',
  document: '',
  notes: ''
});

const hasCustomers = computed(() => customers.value.length > 0);

onMounted(() => {
  loadCustomers();
});

async function loadCustomers() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    customers.value = await listCustomers(search.value);
  } catch {
    errorMessage.value = 'Não foi possível carregar os clientes.';
  } finally {
    isLoading.value = false;
  }
}

async function submit() {
  errorMessage.value = '';
  isSaving.value = true;

  try {
    await createCustomer({
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      document: form.document || undefined,
      notes: form.notes || undefined
    });
    resetForm();
    await loadCustomers();
  } catch {
    errorMessage.value = 'Não foi possível salvar. Verifique duplicidade de telefone ou documento.';
  } finally {
    isSaving.value = false;
  }
}

function resetForm() {
  form.name = '';
  form.phone = '';
  form.email = '';
  form.document = '';
  form.notes = '';
}
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-ink">Clientes</h1>
        <p class="mt-1 text-sm text-[#667067]">
          Cadastro rápido para transformar conversas em histórico comercial.
        </p>
      </div>
      <form class="flex w-full gap-2 sm:max-w-md" @submit.prevent="loadCustomers">
        <input
          v-model="search"
          class="min-w-0 flex-1 rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
          placeholder="Buscar por nome, telefone ou documento"
        />
        <button
          class="rounded-md border border-[#cfd7ce] bg-white px-4 py-2 text-sm font-semibold text-[#465047] hover:bg-[#edf3ee]"
          type="submit"
        >
          Buscar
        </button>
      </form>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-md border border-[#efc8bd] bg-[#fff7f4] px-3 py-2 text-sm text-coral"
    >
      {{ errorMessage }}
    </p>

    <div class="grid gap-4 xl:grid-cols-[360px_1fr]">
      <form class="rounded-md border border-[#dfe4da] bg-white p-4" @submit.prevent="submit">
        <h2 class="text-base font-semibold">Novo cliente</h2>
        <label class="mt-4 block text-sm font-medium">
          Nome
          <input
            v-model="form.name"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            required
          />
        </label>
        <label class="mt-4 block text-sm font-medium">
          Telefone
          <input
            v-model="form.phone"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
          />
        </label>
        <label class="mt-4 block text-sm font-medium">
          E-mail
          <input
            v-model="form.email"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            type="email"
          />
        </label>
        <label class="mt-4 block text-sm font-medium">
          Documento
          <input
            v-model="form.document"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
          />
        </label>
        <label class="mt-4 block text-sm font-medium">
          Observações
          <textarea
            v-model="form.notes"
            class="mt-2 min-h-20 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
          />
        </label>
        <button
          class="mt-5 w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:opacity-60"
          type="submit"
          :disabled="isSaving"
        >
          {{ isSaving ? 'Salvando...' : 'Salvar cliente' }}
        </button>
      </form>

      <section class="overflow-hidden rounded-md border border-[#dfe4da] bg-white">
        <div class="flex items-center justify-between border-b border-[#edf0ea] px-4 py-3">
          <h2 class="text-base font-semibold">Base de clientes</h2>
          <span class="text-xs text-[#667067]">{{ customers.length }} cadastrados</span>
        </div>

        <div v-if="isLoading" class="px-4 py-8 text-sm text-[#667067]">Carregando clientes...</div>
        <div v-else-if="!hasCustomers" class="px-4 py-8 text-sm text-[#667067]">
          Nenhum cliente encontrado.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[720px] text-left text-sm">
            <thead class="bg-[#f7f8f5] text-xs uppercase text-[#667067]">
              <tr>
                <th class="px-4 py-3 font-semibold">Nome</th>
                <th class="px-4 py-3 font-semibold">Telefone</th>
                <th class="px-4 py-3 font-semibold">E-mail</th>
                <th class="px-4 py-3 font-semibold">Documento</th>
                <th class="px-4 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#edf0ea]">
              <tr v-for="customer in customers" :key="customer.id">
                <td class="px-4 py-3 font-medium text-ink">{{ customer.name }}</td>
                <td class="px-4 py-3 text-[#465047]">{{ customer.phone || '-' }}</td>
                <td class="px-4 py-3 text-[#465047]">{{ customer.email || '-' }}</td>
                <td class="px-4 py-3 text-[#465047]">{{ customer.document || '-' }}</td>
                <td class="px-4 py-3">
                  <RouterLink
                    class="font-semibold text-[#11644f]"
                    :to="`/customers/${customer.id}`"
                  >
                    Ver
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </section>
</template>
