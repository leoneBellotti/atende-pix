<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <section class="rounded-md border border-[#dfe4da] bg-white p-5">
    <h1 class="text-xl font-semibold">{{ title }}</h1>
    <p class="mt-2 text-sm text-[#667067]">Modulo reservado para a proxima etapa do MVP.</p>
  </section>
</template>
