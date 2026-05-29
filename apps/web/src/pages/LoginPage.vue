<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session.store';

const router = useRouter();
const sessionStore = useSessionStore();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

async function submit() {
  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    await sessionStore.login({
      email: email.value,
      password: password.value
    });
    await router.push('/');
  } catch {
    errorMessage.value = 'Confira o e-mail e a senha para entrar.';
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
        <h1 class="mt-3 text-3xl font-semibold">Entre para organizar atendimentos e Pix.</h1>
        <p class="mt-3 max-w-md text-sm leading-6 text-[#667067]">
          Acesse o painel para acompanhar clientes, orçamentos, pedidos e pagamentos em um fluxo
          simples.
        </p>
      </div>

      <form class="rounded-md border border-[#dfe4da] bg-white p-5" @submit.prevent="submit">
        <h2 class="text-lg font-semibold">Login</h2>
        <label class="mt-5 block text-sm font-medium">
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
          {{ isSubmitting ? 'Entrando...' : 'Entrar' }}
        </button>
        <p class="mt-4 text-center text-sm text-[#667067]">
          Ainda não tem conta?
          <RouterLink class="font-semibold text-[#11644f]" to="/register">Criar empresa</RouterLink>
        </p>
      </form>
    </section>
  </main>
</template>
