<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { getTenantSettings, updateTenantSettings } from '../services/settingsService';
import { useSessionStore } from '../stores/session.store';

const sessionStore = useSessionStore();
const form = reactive({
  name: '',
  document: '',
  phone: '',
  logoUrl: ''
});
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const isSaving = ref(false);

onMounted(() => {
  loadSettings();
});

async function loadSettings() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const settings = await getTenantSettings();
    form.name = settings.name;
    form.document = settings.document ?? '';
    form.phone = settings.phone ?? '';
    form.logoUrl = settings.logoUrl ?? '';
    sessionStore.updateTenant(settings);
  } catch {
    errorMessage.value = 'Nao foi possivel carregar as configuracoes.';
  } finally {
    isLoading.value = false;
  }
}

async function submit() {
  errorMessage.value = '';
  successMessage.value = '';
  isSaving.value = true;

  try {
    const settings = await updateTenantSettings({
      name: form.name,
      document: form.document,
      phone: form.phone,
      logoUrl: form.logoUrl
    });
    sessionStore.updateTenant(settings);
    successMessage.value = 'Configuracoes salvas.';
  } catch {
    errorMessage.value = 'Nao foi possivel salvar as configuracoes.';
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold text-ink">Configuracoes</h1>
      <p class="mt-1 text-sm text-[#667067]">
        Dados da empresa usados no painel, nos orcamentos publicos e no PDF.
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

    <form class="rounded-md border border-[#dfe4da] bg-white p-5" @submit.prevent="submit">
      <div v-if="isLoading" class="text-sm text-[#667067]">Carregando configuracoes...</div>
      <div v-else class="grid gap-4 lg:grid-cols-2">
        <label class="block text-sm font-medium">
          Nome da empresa
          <input
            v-model="form.name"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            minlength="2"
            required
          />
        </label>
        <label class="block text-sm font-medium">
          Documento
          <input
            v-model="form.document"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            placeholder="CNPJ ou CPF"
          />
        </label>
        <label class="block text-sm font-medium">
          Telefone comercial
          <input
            v-model="form.phone"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
          />
        </label>
        <label class="block text-sm font-medium">
          URL do logo
          <input
            v-model="form.logoUrl"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            placeholder="https://..."
            type="url"
          />
        </label>
      </div>

      <div class="mt-5 flex justify-end">
        <button
          class="rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:opacity-60"
          type="submit"
          :disabled="isLoading || isSaving"
        >
          {{ isSaving ? 'Salvando...' : 'Salvar configuracoes' }}
        </button>
      </div>
    </form>
  </section>
</template>
