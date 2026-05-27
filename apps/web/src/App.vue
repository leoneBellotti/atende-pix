<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppShell from './components/AppShell.vue';
</script>

<template>
  <AppShell v-if="$route.meta.requiresAuth">
    <RouterView />
  </AppShell>
  <RouterView v-else />
</template>
