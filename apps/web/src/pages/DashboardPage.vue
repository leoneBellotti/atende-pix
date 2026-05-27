<script setup lang="ts">
const metrics = [
  { label: 'Vendido no mes', value: 'R$ 8.420', hint: '+18% vs. periodo anterior' },
  { label: 'A receber', value: 'R$ 2.180', hint: '7 pedidos pendentes' },
  { label: 'Orcamentos enviados', value: '24', hint: '11 aguardando resposta' },
  { label: 'Atendimentos abertos', value: '16', hint: '5 aguardando cliente' }
];

const pendingActions = [
  'Enviar orcamento para Ana Clara',
  'Confirmar pagamento manual do pedido #1024',
  'Retomar atendimento parado ha 2 dias'
];
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-normal text-ink">Dashboard</h1>
        <p class="mt-1 text-sm text-[#667067]">Vendas, pendencias e proximas acoes de hoje.</p>
      </div>
      <div class="flex rounded-md border border-[#dfe4da] bg-white p-1 text-sm">
        <button class="rounded bg-[#dcebe3] px-3 py-1.5 font-medium text-[#11644f]" type="button">
          Mes
        </button>
        <button class="px-3 py-1.5 font-medium text-[#667067]" type="button">Semana</button>
      </div>
    </div>

    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="rounded-md border border-[#dfe4da] bg-white p-4"
      >
        <p class="text-sm text-[#667067]">{{ metric.label }}</p>
        <p class="mt-2 text-2xl font-semibold text-ink">{{ metric.value }}</p>
        <p class="mt-2 text-xs text-[#11644f]">{{ metric.hint }}</p>
      </article>
    </div>

    <div class="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      <section class="rounded-md border border-[#dfe4da] bg-white p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold">Pedidos por status</h2>
          <span class="text-xs text-[#667067]">Atualizado agora</span>
        </div>
        <div class="mt-4 space-y-3">
          <div class="grid grid-cols-[130px_1fr_48px] items-center gap-3 text-sm">
            <span>Pago</span>
            <span class="h-2 rounded bg-[#dcebe3]">
              <span class="block h-2 w-[68%] rounded bg-mint"></span>
            </span>
            <strong>17</strong>
          </div>
          <div class="grid grid-cols-[130px_1fr_48px] items-center gap-3 text-sm">
            <span>Aguardando Pix</span>
            <span class="h-2 rounded bg-[#f4ead1]">
              <span class="block h-2 w-[42%] rounded bg-amber"></span>
            </span>
            <strong>9</strong>
          </div>
          <div class="grid grid-cols-[130px_1fr_48px] items-center gap-3 text-sm">
            <span>Em execucao</span>
            <span class="h-2 rounded bg-[#f3ddd6]">
              <span class="block h-2 w-[36%] rounded bg-coral"></span>
            </span>
            <strong>6</strong>
          </div>
        </div>
      </section>

      <section class="rounded-md border border-[#dfe4da] bg-white p-4">
        <h2 class="text-base font-semibold">Resolver hoje</h2>
        <ul class="mt-4 divide-y divide-[#edf0ea]">
          <li v-for="action in pendingActions" :key="action" class="py-3 text-sm">
            {{ action }}
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
