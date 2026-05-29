<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { createLocation, listLocations, updateLocation, type LocationRecord } from '../services/locationsService';

const locations = ref<LocationRecord[]>([]);
const errorMessage = ref('');
const isSaving = ref(false);

const form = reactive({
  name: '',
  phone: '',
  address: ''
});

onMounted(loadLocations);

async function loadLocations() {
  locations.value = await listLocations();
}

async function submit() {
  errorMessage.value = '';
  isSaving.value = true;

  try {
    await createLocation({ name: form.name, phone: form.phone || undefined, address: form.address || undefined });
    form.name = '';
    form.phone = '';
    form.address = '';
    await loadLocations();
  } catch {
    errorMessage.value = 'Não foi possível salvar a unidade.';
  } finally {
    isSaving.value = false;
  }
}

async function toggle(location: LocationRecord) {
  await updateLocation(location.id, { active: !location.active });
  await loadLocations();
}
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold text-ink">Unidades</h1>
      <p class="mt-1 text-sm text-[#667067]">Cadastre filiais, pontos de atendimento ou equipes externas.</p>
    </div>

    <p v-if="errorMessage" class="rounded-md border border-[#efc8bd] bg-[#fff7f4] px-3 py-2 text-sm text-coral">
      {{ errorMessage }}
    </p>

    <div class="grid gap-4 xl:grid-cols-[380px_1fr]">
      <form class="rounded-md border border-[#dfe4da] bg-white p-4" @submit.prevent="submit">
        <h2 class="text-base font-semibold">Nova unidade</h2>
        <label class="mt-4 block text-sm font-medium">
          Nome
          <input v-model="form.name" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" required />
        </label>
        <label class="mt-4 block text-sm font-medium">
          Telefone
          <input v-model="form.phone" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm" />
        </label>
        <label class="mt-4 block text-sm font-medium">
          Endereço
          <textarea v-model="form.address" rows="3" class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm"></textarea>
        </label>
        <button class="mt-5 w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white" type="submit" :disabled="isSaving">
          {{ isSaving ? 'Salvando...' : 'Criar unidade' }}
        </button>
      </form>

      <section class="rounded-md border border-[#dfe4da] bg-white">
        <div class="border-b border-[#edf0ea] px-4 py-3">
          <h2 class="text-base font-semibold">Unidades cadastradas</h2>
        </div>
        <div v-if="!locations.length" class="px-4 py-8 text-sm text-[#667067]">Nenhuma unidade cadastrada.</div>
        <article v-for="location in locations" :key="location.id" class="flex items-center justify-between gap-3 border-b border-[#edf0ea] px-4 py-4">
          <div>
            <p class="font-semibold text-ink">{{ location.name }}</p>
            <p class="mt-1 text-sm text-[#667067]">{{ location.phone || 'Sem telefone' }}</p>
            <p class="mt-1 text-sm text-[#465047]">{{ location.address || 'Sem endereço' }}</p>
          </div>
          <button class="rounded-md border border-[#dfe4da] px-3 py-2 text-sm font-semibold text-[#11644f]" type="button" @click="toggle(location)">
            {{ location.active ? 'Desativar' : 'Ativar' }}
          </button>
        </article>
      </section>
    </div>
  </section>
</template>
