<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session.store';

const router = useRouter();
const sessionStore = useSessionStore();

const tenantName = ref('');
const tenantPhone = ref('');
const userName = ref('');
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

async function submit() {
  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    await sessionStore.register({
      tenantName: tenantName.value,
      tenantPhone: tenantPhone.value || undefined,
      userName: userName.value,
      email: email.value,
      password: password.value
    });
    await router.push('/');
  } catch {
    errorMessage.value = 'Não foi possível criar a conta com esses dados.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="min-h-screen bg-[#f7f8f5] px-4 py-8 text-ink">
    <section
      class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 lg:grid-cols-2"
    >
      <div>
        <p class="text-sm font-semibold text-[#11644f]">AtendePix</p>
        <h1 class="mt-3 text-3xl font-semibold">Crie a empresa e entre no painel.</h1>
        <p class="mt-3 max-w-md text-sm leading-6 text-[#667067]">
          O primeiro usuário entra como dono da empresa e já pode iniciar o cadastro de clientes e
          orçamentos.
        </p>
      </div>

      <form class="rounded-md border border-[#dfe4da] bg-white p-5" @submit.prevent="submit">
        <h2 class="text-lg font-semibold">Cadastro</h2>
        <label class="mt-5 block text-sm font-medium">
          Empresa
          <input
            v-model="tenantName"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            required
          />
        </label>
        <label class="mt-4 block text-sm font-medium">
          Telefone comercial
          <input
            v-model="tenantPhone"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
          />
        </label>
        <label class="mt-4 block text-sm font-medium">
          Seu nome
          <input
            v-model="userName"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            required
          />
        </label>
        <label class="mt-4 block text-sm font-medium">
          E-mail
          <input
            v-model="email"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            type="email"
            required
          />
        </label>
        <label class="mt-4 block text-sm font-medium">
          Senha
          <input
            v-model="password"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            type="password"
            minlength="6"
            required
          />
        </label>
        <p v-if="errorMessage" class="mt-4 text-sm text-coral">{{ errorMessage }}</p>
        <button
          class="mt-5 w-full rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:opacity-60"
          type="submit"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Criando...' : 'Criar conta' }}
        </button>
        <p class="mt-3 text-center text-xs leading-5 text-[#667067]">
          Ao criar a conta, você concorda com os
          <RouterLink class="font-semibold text-[#11644f]" to="/terms">Termos</RouterLink>
          e a
          <RouterLink class="font-semibold text-[#11644f]" to="/privacy">Politica de privacidade</RouterLink>.
        </p>
        <p class="mt-4 text-center text-sm text-[#667067]">
          Já tem conta?
          <RouterLink class="font-semibold text-[#11644f]" to="/login">Entrar</RouterLink>
        </p>
      </form>
    </section>
  </main>
</template>
