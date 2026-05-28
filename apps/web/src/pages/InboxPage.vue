<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { createCustomer, listCustomers } from '../services/customersService';
import { linkConversationToCustomer, listConversations } from '../services/messagesService';
import type { Customer } from '../types/customer';
import type { ConversationSummary } from '../types/message';

const conversations = ref<ConversationSummary[]>([]);
const customers = ref<Customer[]>([]);
const selectedCustomers = ref<Record<string, string>>({});
const search = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const linkingConversationId = ref('');
const creatingCustomerConversationId = ref('');

const filteredConversations = computed(() => {
  const term = search.value.trim().toLowerCase();

  if (!term) {
    return conversations.value;
  }

  return conversations.value.filter((conversation) => {
    const customerName = conversation.customer?.name ?? '';
    const contactName = conversation.contactName ?? '';
    const phone = conversation.phone ?? '';
    const body = conversation.lastMessage.body ?? '';

    return `${customerName} ${contactName} ${phone} ${body}`.toLowerCase().includes(term);
  });
});

onMounted(() => {
  loadConversations();
});

async function loadConversations() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const [conversationData, customerData] = await Promise.all([listConversations(), listCustomers()]);
    conversations.value = conversationData;
    customers.value = customerData;
  } catch {
    errorMessage.value = 'Nao foi possivel carregar as conversas.';
  } finally {
    isLoading.value = false;
  }
}

function conversationName(conversation: ConversationSummary) {
  return conversation.customer?.name ?? conversation.contactName ?? conversation.phone ?? 'Contato sem nome';
}

function formatPhone(phone?: string | null) {
  if (!phone) {
    return 'Telefone nao informado';
  }

  return phone;
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Sem data';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function lastMessagePreview(conversation: ConversationSummary) {
  return conversation.lastMessage.body || `Mensagem do tipo ${conversation.lastMessage.type ?? 'desconhecido'}`;
}

async function linkCustomer(conversation: ConversationSummary) {
  const customerId = selectedCustomers.value[conversation.id];

  if (!customerId) {
    return;
  }

  errorMessage.value = '';
  linkingConversationId.value = conversation.id;

  try {
    await linkConversationToCustomer(conversation.id, customerId);
    await loadConversations();
  } catch {
    errorMessage.value = 'Nao foi possivel vincular a conversa ao cliente.';
  } finally {
    linkingConversationId.value = '';
  }
}

async function createCustomerFromConversation(conversation: ConversationSummary) {
  const phone = conversation.phone ?? '';
  const name = conversation.contactName ?? phone;

  if (!name) {
    return;
  }

  errorMessage.value = '';
  creatingCustomerConversationId.value = conversation.id;

  try {
    const customer = await createCustomer({
      name,
      phone,
      notes: 'Criado a partir de mensagem recebida no WhatsApp.'
    });
    await linkConversationToCustomer(conversation.id, customer.id);
    await loadConversations();
  } catch {
    errorMessage.value = 'Nao foi possivel criar o cliente a partir da conversa.';
  } finally {
    creatingCustomerConversationId.value = '';
  }
}
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-ink">Inbox</h1>
        <p class="mt-1 text-sm text-[#667067]">
          Acompanhe mensagens recebidas pelo WhatsApp oficial.
        </p>
      </div>
      <button
        class="rounded-md border border-[#cfd7ce] bg-white px-4 py-2 text-sm font-semibold text-[#465047] hover:bg-[#edf3ee]"
        type="button"
        @click="loadConversations"
      >
        Atualizar
      </button>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-md border border-[#efc8bd] bg-[#fff7f4] px-3 py-2 text-sm text-coral"
    >
      {{ errorMessage }}
    </p>

    <section class="overflow-hidden rounded-md border border-[#dfe4da] bg-white">
      <div
        class="flex flex-col gap-3 border-b border-[#edf0ea] px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h2 class="text-base font-semibold">Conversas recentes</h2>
          <p class="mt-1 text-xs text-[#667067]">
            {{ filteredConversations.length }} conversas encontradas
          </p>
        </div>
        <input
          v-model="search"
          class="w-full rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint lg:w-80"
          placeholder="Buscar por nome, telefone ou mensagem"
          type="search"
        />
      </div>

      <div v-if="isLoading" class="px-4 py-8 text-sm text-[#667067]">
        Carregando conversas...
      </div>
      <div v-else-if="!filteredConversations.length" class="px-4 py-8 text-sm text-[#667067]">
        Nenhuma mensagem recebida ainda.
      </div>
      <div v-else class="divide-y divide-[#edf0ea]">
        <article
          v-for="conversation in filteredConversations"
          :key="conversation.id"
          class="px-4 py-4 hover:bg-[#fbfcf9]"
        >
          <div class="grid gap-3 lg:grid-cols-[1fr_280px_180px] lg:items-center">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate font-semibold text-ink">
                  {{ conversationName(conversation) }}
                </h3>
                <span
                  v-if="conversation.customer"
                  class="rounded-md bg-[#dcebe3] px-2 py-0.5 text-xs font-semibold text-[#11644f]"
                >
                  Cliente vinculado
                </span>
              </div>
              <p class="mt-1 text-xs text-[#667067]">{{ formatPhone(conversation.phone) }}</p>
              <p class="mt-2 truncate text-sm text-[#465047]">
                {{ lastMessagePreview(conversation) }}
              </p>
            </div>
            <div v-if="!conversation.customer" class="flex flex-col gap-2">
              <div class="flex flex-col gap-2 sm:flex-row">
                <select
                  v-model="selectedCustomers[conversation.id]"
                  class="min-w-0 flex-1 rounded-md border border-[#cfd7ce] bg-white px-3 py-2 text-sm outline-none focus:border-mint"
                >
                  <option value="">Vincular cliente</option>
                  <option v-for="customer in customers" :key="customer.id" :value="customer.id">
                    {{ customer.name }}
                  </option>
                </select>
                <button
                  class="rounded-md bg-mint px-3 py-2 text-sm font-semibold text-white hover:bg-[#176d58] disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  :disabled="!selectedCustomers[conversation.id] || linkingConversationId === conversation.id"
                  @click="linkCustomer(conversation)"
                >
                  Vincular
                </button>
              </div>
              <button
                class="rounded-md border border-[#cfd7ce] px-3 py-2 text-sm font-semibold text-[#465047] hover:bg-[#edf3ee] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                :disabled="creatingCustomerConversationId === conversation.id"
                @click="createCustomerFromConversation(conversation)"
              >
                Criar cliente
              </button>
            </div>
            <div v-else class="text-sm text-[#667067]">
              {{ conversation.customer.phone || 'Cliente sem telefone' }}
            </div>
            <div class="text-xs text-[#667067] lg:text-right">
              <p>{{ conversation.lastMessage.direction === 'INBOUND' ? 'Recebida' : 'Enviada' }}</p>
              <p class="mt-1">{{ formatDate(conversation.lastMessage.sentAt) }}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
