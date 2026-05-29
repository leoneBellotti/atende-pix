<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { getAiUsage } from '../services/aiService';
import {
  getPaymentProviderConfig,
  getTenantSettings,
  getWhatsAppConfig,
  updatePaymentProviderConfig,
  updateTenantSettings,
  updateWhatsAppConfig
} from '../services/settingsService';
import { useSessionStore } from '../stores/session.store';

const sessionStore = useSessionStore();
const form = reactive({
  name: '',
  document: '',
  phone: '',
  logoUrl: '',
  aiEnabled: true,
  aiMonthlyLimit: 100
});
const aiUsage = ref<{ used: number; limit: number; remaining: number } | null>(null);
const pixForm = reactive({
  active: false,
  sandbox: true,
  accessToken: '',
  publicKey: '',
  webhookSecret: '',
  hasAccessToken: false,
  hasPublicKey: false,
  hasWebhookSecret: false
});
const whatsappForm = reactive({
  active: false,
  phoneNumberId: '',
  businessAccountId: '',
  accessToken: '',
  verifyToken: '',
  appSecret: '',
  hasAccessToken: false,
  hasVerifyToken: false,
  hasAppSecret: false
});
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const isSaving = ref(false);
const isSavingPix = ref(false);
const isSavingWhatsApp = ref(false);

onMounted(() => {
  loadSettings();
});

async function loadSettings() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const [settings, pixConfig, whatsappConfig, usage] = await Promise.all([
      getTenantSettings(),
      getPaymentProviderConfig(),
      getWhatsAppConfig(),
      getAiUsage()
    ]);
    form.name = settings.name;
    form.document = settings.document ?? '';
    form.phone = settings.phone ?? '';
    form.logoUrl = settings.logoUrl ?? '';
    form.aiEnabled = settings.aiEnabled ?? true;
    form.aiMonthlyLimit = settings.aiMonthlyLimit ?? 100;
    aiUsage.value = usage;
    pixForm.active = pixConfig.active;
    pixForm.sandbox = pixConfig.sandbox;
    pixForm.hasAccessToken = pixConfig.hasAccessToken;
    pixForm.hasPublicKey = pixConfig.hasPublicKey;
    pixForm.hasWebhookSecret = pixConfig.hasWebhookSecret;
    whatsappForm.active = whatsappConfig.active;
    whatsappForm.phoneNumberId = whatsappConfig.phoneNumberId ?? '';
    whatsappForm.businessAccountId = whatsappConfig.businessAccountId ?? '';
    whatsappForm.hasAccessToken = whatsappConfig.hasAccessToken;
    whatsappForm.hasVerifyToken = whatsappConfig.hasVerifyToken;
    whatsappForm.hasAppSecret = whatsappConfig.hasAppSecret;
    sessionStore.updateTenant(settings);
  } catch {
    errorMessage.value = 'Não foi possível carregar as configurações.';
  } finally {
    isLoading.value = false;
  }
}

async function submitWhatsApp() {
  errorMessage.value = '';
  successMessage.value = '';
  isSavingWhatsApp.value = true;

  try {
    const config = await updateWhatsAppConfig({
      active: whatsappForm.active,
      phoneNumberId: whatsappForm.phoneNumberId,
      businessAccountId: whatsappForm.businessAccountId,
      accessToken: whatsappForm.accessToken || undefined,
      verifyToken: whatsappForm.verifyToken || undefined,
      appSecret: whatsappForm.appSecret || undefined
    });
    whatsappForm.active = config.active;
    whatsappForm.phoneNumberId = config.phoneNumberId ?? '';
    whatsappForm.businessAccountId = config.businessAccountId ?? '';
    whatsappForm.hasAccessToken = config.hasAccessToken;
    whatsappForm.hasVerifyToken = config.hasVerifyToken;
    whatsappForm.hasAppSecret = config.hasAppSecret;
    whatsappForm.accessToken = '';
    whatsappForm.verifyToken = '';
    whatsappForm.appSecret = '';
    successMessage.value = 'Configuração WhatsApp salva.';
  } catch {
    errorMessage.value = 'Não foi possível salvar a configuração WhatsApp.';
  } finally {
    isSavingWhatsApp.value = false;
  }
}

async function submitPix() {
  errorMessage.value = '';
  successMessage.value = '';
  isSavingPix.value = true;

  try {
    const config = await updatePaymentProviderConfig({
      provider: 'MERCADO_PAGO',
      active: pixForm.active,
      sandbox: pixForm.sandbox,
      accessToken: pixForm.accessToken || undefined,
      publicKey: pixForm.publicKey || undefined,
      webhookSecret: pixForm.webhookSecret || undefined
    });
    pixForm.active = config.active;
    pixForm.sandbox = config.sandbox;
    pixForm.hasAccessToken = config.hasAccessToken;
    pixForm.hasPublicKey = config.hasPublicKey;
    pixForm.hasWebhookSecret = config.hasWebhookSecret;
    pixForm.accessToken = '';
    pixForm.publicKey = '';
    pixForm.webhookSecret = '';
    successMessage.value = 'Configuração Pix salva.';
  } catch {
    errorMessage.value = 'Não foi possível salvar a configuração Pix.';
  } finally {
    isSavingPix.value = false;
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
      logoUrl: form.logoUrl,
      aiEnabled: form.aiEnabled,
      aiMonthlyLimit: Number(form.aiMonthlyLimit)
    });
    sessionStore.updateTenant(settings);
    successMessage.value = 'Configurações salvas.';
  } catch {
    errorMessage.value = 'Não foi possível salvar as configurações.';
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold text-ink">Configurações</h1>
      <p class="mt-1 text-sm text-[#667067]">
        Dados da empresa usados no painel, nos orçamentos públicos e no PDF.
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
      <div v-if="isLoading" class="text-sm text-[#667067]">Carregando configurações...</div>
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
        <label class="flex items-center gap-2 text-sm font-medium">
          <input v-model="form.aiEnabled" class="h-4 w-4 accent-[#11644f]" type="checkbox" />
          IA assistente ativa
        </label>
        <label class="block text-sm font-medium">
          Limite mensal de IA
          <input
            v-model.number="form.aiMonthlyLimit"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            min="0"
            type="number"
          />
        </label>
        <div v-if="aiUsage" class="text-sm text-[#667067]">
          Uso de IA no mês:
          <span class="font-semibold text-ink">{{ aiUsage.used }} / {{ aiUsage.limit }}</span>
        </div>
      </div>

      <div class="mt-5 flex justify-end">
        <button
          class="rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:opacity-60"
          type="submit"
          :disabled="isLoading || isSaving"
        >
          {{ isSaving ? 'Salvando...' : 'Salvar configurações' }}
        </button>
      </div>
    </form>

    <form class="rounded-md border border-[#dfe4da] bg-white p-5" @submit.prevent="submitPix">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="text-base font-semibold">Pix via Mercado Pago</h2>
          <p class="mt-1 text-sm text-[#667067]">
            Credenciais usadas para gerar cobranças Pix em sandbox ou produção.
          </p>
        </div>
        <label class="flex items-center gap-2 text-sm font-medium">
          <input v-model="pixForm.active" class="h-4 w-4 accent-[#11644f]" type="checkbox" />
          Ativo
        </label>
      </div>

      <div v-if="isLoading" class="mt-4 text-sm text-[#667067]">Carregando Pix...</div>
      <div v-else class="mt-4 grid gap-4 lg:grid-cols-2">
        <label class="flex items-center gap-2 text-sm font-medium">
          <input v-model="pixForm.sandbox" class="h-4 w-4 accent-[#11644f]" type="checkbox" />
          Usar sandbox
        </label>
        <div class="text-sm text-[#667067]">
          Status:
          <span class="font-semibold text-ink">
            {{ pixForm.active ? 'habilitado' : 'desabilitado' }}
          </span>
        </div>
        <label class="block text-sm font-medium">
          Access token
          <input
            v-model="pixForm.accessToken"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            :placeholder="pixForm.hasAccessToken ? 'Token já cadastrado' : 'TEST-...'"
            type="password"
          />
        </label>
        <label class="block text-sm font-medium">
          Public key
          <input
            v-model="pixForm.publicKey"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            :placeholder="pixForm.hasPublicKey ? 'Chave já cadastrada' : 'TEST-...'"
          />
        </label>
        <label class="block text-sm font-medium lg:col-span-2">
          Webhook secret
          <input
            v-model="pixForm.webhookSecret"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            :placeholder="pixForm.hasWebhookSecret ? 'Segredo já cadastrado' : 'Segredo do webhook'"
            type="password"
          />
        </label>
      </div>

      <div class="mt-5 flex justify-end">
        <button
          class="rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:opacity-60"
          type="submit"
          :disabled="isLoading || isSavingPix"
        >
          {{ isSavingPix ? 'Salvando...' : 'Salvar Pix' }}
        </button>
      </div>
    </form>

    <form class="rounded-md border border-[#dfe4da] bg-white p-5" @submit.prevent="submitWhatsApp">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="text-base font-semibold">WhatsApp Cloud API</h2>
          <p class="mt-1 text-sm text-[#667067]">
            Dados para receber e enviar mensagens quando o inbox for ativado.
          </p>
        </div>
        <label class="flex items-center gap-2 text-sm font-medium">
          <input v-model="whatsappForm.active" class="h-4 w-4 accent-[#11644f]" type="checkbox" />
          Ativo
        </label>
      </div>

      <div v-if="isLoading" class="mt-4 text-sm text-[#667067]">Carregando WhatsApp...</div>
      <div v-else class="mt-4 grid gap-4 lg:grid-cols-2">
        <label class="block text-sm font-medium">
          Phone number ID
          <input
            v-model="whatsappForm.phoneNumberId"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
          />
        </label>
        <label class="block text-sm font-medium">
          Business account ID
          <input
            v-model="whatsappForm.businessAccountId"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
          />
        </label>
        <label class="block text-sm font-medium">
          Access token
          <input
            v-model="whatsappForm.accessToken"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            :placeholder="whatsappForm.hasAccessToken ? 'Token já cadastrado' : 'EAAB...'"
            type="password"
          />
        </label>
        <label class="block text-sm font-medium">
          Verify token
          <input
            v-model="whatsappForm.verifyToken"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            :placeholder="
              whatsappForm.hasVerifyToken ? 'Token já cadastrado' : 'Token de verificação'
            "
            type="password"
          />
        </label>
        <label class="block text-sm font-medium lg:col-span-2">
          App secret
          <input
            v-model="whatsappForm.appSecret"
            class="mt-2 w-full rounded-md border border-[#cfd7ce] px-3 py-2 text-sm outline-none focus:border-mint"
            :placeholder="whatsappForm.hasAppSecret ? 'Segredo já cadastrado' : 'App secret'"
            type="password"
          />
        </label>
      </div>

      <div class="mt-5 flex justify-end">
        <button
          class="rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:opacity-60"
          type="submit"
          :disabled="isLoading || isSavingWhatsApp"
        >
          {{ isSavingWhatsApp ? 'Salvando...' : 'Salvar WhatsApp' }}
        </button>
      </div>
    </form>
  </section>
</template>
