<script setup lang="ts">
import heroImage from '../assets/commercial-hero.png';

const steps = [
  'Conversa organizada',
  'Orçamento aprovado',
  'Pix confirmado',
  'Pedido acompanhado'
];

const plans = [
  { name: 'Básico', price: 'R$ 39', detail: '1 usuário e orçamentos essenciais' },
  { name: 'Pro', price: 'R$ 79', detail: 'Pix automatico e dashboard completo' },
  { name: 'Premium', price: 'R$ 149', detail: 'WhatsApp oficial, automações e IA' }
];
</script>

<template>
  <main class="min-h-screen bg-[#f7f8f5] text-ink">
    <section
      class="relative min-h-[88vh] overflow-hidden bg-[#17211d] text-white"
      :style="{ backgroundImage: `linear-gradient(90deg, rgba(12, 20, 17, 0.88), rgba(12, 20, 17, 0.58) 44%, rgba(12, 20, 17, 0.12)), url(${heroImage})` }"
    >
      <div class="absolute inset-0 bg-cover bg-center" aria-hidden="true"></div>
      <div class="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col px-5 py-5 md:px-8">
        <header class="flex items-center justify-between">
          <RouterLink class="text-xl font-semibold tracking-normal" to="/site">AtendePix</RouterLink>
          <nav class="flex items-center gap-2 text-sm font-semibold">
            <RouterLink class="rounded-md px-3 py-2 text-white/85 hover:bg-white/10" to="/login">Entrar</RouterLink>
            <RouterLink class="rounded-md bg-white px-3 py-2 text-[#17211d] hover:bg-[#edf3ee]" to="/register">
              Comecar trial
            </RouterLink>
          </nav>
        </header>

        <div class="flex flex-1 items-center py-14">
          <div class="max-w-2xl">
            <p class="text-sm font-semibold uppercase text-[#9ad8c1]">SaaS para pequenos negocios</p>
            <h1 class="mt-4 text-4xl font-semibold leading-tight tracking-normal md:text-6xl">AtendePix</h1>
            <p class="mt-5 max-w-xl text-lg leading-8 text-white/86">
              Atendimento, orçamento e Pix em um fluxo simples para negocios que vendem pelo WhatsApp.
            </p>
            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <RouterLink class="rounded-md bg-mint px-5 py-3 text-center text-sm font-semibold text-white hover:bg-[#176d58]" to="/register">
                Criar conta
              </RouterLink>
              <RouterLink class="rounded-md border border-white/35 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-white/10" to="/login">
                Acessar painel
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="border-b border-[#dfe4da] bg-white">
      <div class="mx-auto grid max-w-6xl gap-4 px-5 py-8 md:grid-cols-4 md:px-8">
        <div v-for="step in steps" :key="step" class="rounded-md border border-[#dfe4da] bg-[#f8faf6] p-4">
          <p class="text-sm font-semibold text-[#11644f]">{{ step }}</p>
        </div>
      </div>
    </section>

    <section class="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1fr_1.2fr] md:px-8">
      <div>
        <p class="text-sm font-semibold uppercase text-[#11644f]">Fluxo comercial</p>
        <h2 class="mt-3 text-3xl font-semibold tracking-normal text-ink">Da conversa ao pagamento sem planilha paralela.</h2>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="rounded-md border border-[#dfe4da] bg-white p-5">
          <p class="text-lg font-semibold text-ink">Histórico por cliente</p>
          <p class="mt-2 text-sm leading-6 text-[#667067]">Atendimentos, orçamentos, pedidos e pagamentos em uma linha do tempo.</p>
        </div>
        <div class="rounded-md border border-[#dfe4da] bg-white p-5">
          <p class="text-lg font-semibold text-ink">Pix com acompanhamento</p>
          <p class="mt-2 text-sm leading-6 text-[#667067]">Cobrança, link público e status financeiro no mesmo painel.</p>
        </div>
        <div class="rounded-md border border-[#dfe4da] bg-white p-5">
          <p class="text-lg font-semibold text-ink">WhatsApp no processo</p>
          <p class="mt-2 text-sm leading-6 text-[#667067]">Inbox, templates e respostas aprovadas para manter o atendimento andando.</p>
        </div>
        <div class="rounded-md border border-[#dfe4da] bg-white p-5">
          <p class="text-lg font-semibold text-ink">Automações e IA</p>
          <p class="mt-2 text-sm leading-6 text-[#667067]">Follow-ups, lembretes e sugestoes editaveis sem envio automatico sem revisao.</p>
        </div>
      </div>
    </section>

    <section class="bg-[#18231f] text-white">
      <div class="mx-auto max-w-6xl px-5 py-12 md:px-8">
        <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase text-[#9ad8c1]">Planos</p>
            <h2 class="mt-3 text-3xl font-semibold tracking-normal">Comece com trial e evolua por uso.</h2>
          </div>
          <RouterLink class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#17211d] hover:bg-[#edf3ee]" to="/register">
            Comecar agora
          </RouterLink>
        </div>
        <div class="mt-7 grid gap-4 md:grid-cols-3">
          <article v-for="plan in plans" :key="plan.name" class="rounded-md border border-white/15 bg-white/[0.08] p-5">
            <h3 class="text-xl font-semibold">{{ plan.name }}</h3>
            <p class="mt-3 text-3xl font-semibold">{{ plan.price }}<span class="text-sm font-medium text-white/70">/mes</span></p>
            <p class="mt-3 text-sm leading-6 text-white/75">{{ plan.detail }}</p>
          </article>
        </div>
      </div>
    </section>

    <footer class="border-t border-[#dfe4da] bg-white">
      <div class="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 text-sm text-[#667067] md:flex-row md:items-center md:justify-between md:px-8">
        <p>AtendePix - Atendimento, orçamento e Pix para pequenos negocios.</p>
        <nav class="flex gap-4 font-semibold text-[#11644f]">
          <RouterLink to="/terms">Termos</RouterLink>
          <RouterLink to="/privacy">Privacidade</RouterLink>
        </nav>
      </div>
    </footer>
  </main>
</template>
