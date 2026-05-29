# AtendePix - Roadmap do Produto

## 0. Status de desenvolvimento

Atualizado em: 2026-05-29

### Concluido

- Fundacao do monorepo com API NestJS, web Vue, pacote compartilhado e scripts de qualidade.
- Docker Compose com PostgreSQL e Redis.
- Prisma com migrations versionadas.
- Autenticacao inicial com cadastro de empresa, login, JWT e rotas protegidas.
- Dashboard real com resumo operacional.
- CRUD de clientes com isolamento por tenant.
- CRUD de catalogo com ativar/desativar itens.
- Criacao manual de atendimentos.
- Criacao de orcamentos com itens livres, itens ativos do catalogo, numeracao por empresa, link publico e PDF.
- Conversao de orcamento em pedido.
- Pedidos com troca de status.
- Registro manual de pagamento e dashboard refletindo pedido pago.
- Tela de pagamentos com resumo, historico e filtros basicos por status e provedor.
- Relatorios mensais basicos com exportacao CSV de pedidos e pagamentos.
- Configuracoes da empresa com nome, documento, telefone e logo para painel e documentos.
- Detalhe do cliente com cadastro, totais e timeline de atendimentos, orcamentos e pedidos.
- Configuracao de provedor Pix/Mercado Pago por empresa, com credenciais em sandbox.
- Geracao de cobranca Pix via Mercado Pago, com copia-e-cola e link salvos no pagamento.
- Link publico de pagamento Pix com QR Code, copia-e-cola e atalho Mercado Pago.
- Webhook Mercado Pago com idempotencia, logs e atualizacao automatica de pedido pago.
- Logs de pagamento exibidos no painel financeiro.
- Configuracao de WhatsApp Cloud API por empresa.
- Webhook de mensagens recebidas com persistencia idempotente.
- Lista de conversas no inbox.
- Vinculo manual de conversa ao cliente.
- Criacao de cliente a partir de conversa recebida.
- Criacao de atendimento a partir do inbox.
- Envio de respostas de texto pela WhatsApp Cloud API dentro da janela de atendimento.
- Templates de utilidade no inbox.
- Status de entrega/leitura de mensagem quando recebido pelo webhook.
- Regras de follow-up configuraveis, desligadas por padrao.
- Tela para ligar/desligar regras de automacao.
- Lembrete de orcamento vencendo com agendamento idempotente e logs.
- Lembrete de pagamento pendente com agendamento idempotente e logs.
- Mensagem de pedido pronto com agendamento idempotente e logs.
- Fila BullMQ para execucao futura de automacoes agendadas.
- Worker BullMQ registrando execucao e falhas de automacao.
- Botao para resumir conversa no inbox com provedor local plugavel.
- Sugestao editavel de resposta no inbox com provedor local plugavel.
- Geracao de itens de orcamento a partir de texto livre.
- Sugestao editavel de follow-up no inbox.
- Configuracao para ativar/desativar IA por empresa.
- Logs de uso de IA e limite mensal por empresa.
- Planos comerciais selecionaveis por empresa.
- Limites por plano com bloqueio de orcamentos mensais, protecao contra downgrade incompativel e resumo de uso.
- Assinatura com checkout local separado dos pagamentos de clientes, confirmacao simulada, renovacao e cancelamento ao fim do periodo.
- Trial de 14 dias para novas empresas, exibicao de dias restantes e bloqueio com mensagem clara apos expiracao.
- Pagina simples de apresentacao comercial com hero visual, proposta de valor, fluxo do produto, planos e CTAs publicos.
- Painel admin interno com acesso restrito por ADMIN_EMAILS, resumo SaaS e lista de empresas com plano, status e uso.
- Termos de uso e politica de privacidade publicados com links na pagina comercial e no cadastro.
- Fluxo de cancelamento com confirmacao, motivo opcional, agendamento ao fim do periodo e reativacao.
- Controle de inadimplencia com status PAST_DUE/SUSPENDED, periodo de tolerancia, bloqueio de uso suspenso e acoes admin de teste.
- Backups automaticos do Postgres com script versionado, retencao configuravel e validacao de restore em banco temporario.
- Monitoramento de erros da API com filtro global, registro JSON Lines configuravel e contexto de rota/usuario quando disponivel.
- Tela admin de erros em /admin/errors, lendo ERROR_LOG_PATH e visivel apenas para emails configurados em ADMIN_EMAILS.
- Logs estruturados JSON na API com requestId, metodo, rota, status, duracao e contexto de usuario/empresa quando disponivel.
- Rate limiting global por IP na API, com limites especificos para autenticacao e webhooks publicos.
- Auditoria de acoes sensiveis em pagamentos, assinaturas e acoes admin, com consulta por empresa no admin interno.
- Pipeline de CI/CD com validacao automatica, E2E e deploy manual por SSH.
- Documentacao operacional com deploy, variaveis, backup, restore, logs, rollback e alertas basicos.
- Healthcheck agendado para producao com webhook opcional de alerta.
- Revisao final de producao com checklist, validacao automatica de ambiente e audit de dependencias de producao sem vulnerabilidades.

### Em andamento

- Validacao em ambiente real antes de clientes pagantes.
- Preparacao de deploy real, secrets de producao, dominio HTTPS e banco/Redis de producao.
- Planejamento do piloto com 1 a 3 negocios reais.

### Proximo

- Executar deploy real, configurar secrets de producao e rodar checklist de go-live.
- Validar webhooks Mercado Pago e WhatsApp em ambiente real/sandbox publico.
- Rodar piloto assistido, coletar atritos do fluxo e priorizar refinamentos antes de escalar vendas.

## 1. Visao do produto

O AtendePix sera um mini SaaS para pequenos negocios transformarem atendimentos recebidos por WhatsApp, Instagram ou telefone em clientes organizados, orcamentos, cobrancas Pix, pedidos e acompanhamento financeiro simples.

A promessa principal do produto:

> De uma conversa para um orcamento com Pix e acompanhamento em menos de 1 minuto.

O produto deve ser simples o suficiente para um pequeno negocio usar no mesmo dia, mas bem estruturado o bastante para virar renda recorrente com planos mensais, implantacoes pagas e personalizacoes por nicho.

## 2. Publico-alvo inicial

### Nichos prioritarios

1. Assistencia tecnica
2. Estetica, beleza e barbearias
3. Oficinas e manutencao
4. Pequenas lojas e distribuidores locais
5. Prestadores de servico recorrente
6. Despachantes, consultorias e servicos documentais

### Perfil do usuario comprador

- Dono ou gerente de pequeno negocio.
- Vende ou atende pelo WhatsApp.
- Perde pedidos em conversas desorganizadas.
- Faz orcamento manual em mensagem, planilha ou bloco de notas.
- Recebe por Pix, mas concilia tudo manualmente.
- Quer parecer mais profissional sem contratar um sistema grande.

## 3. Proposta de valor

### Problemas que o sistema resolve

- Conversas espalhadas e sem historico comercial.
- Clientes sem cadastro padronizado.
- Orcamentos feitos manualmente e sem identidade visual.
- Dificuldade para saber o que foi pago, entregue ou pendente.
- Ausencia de indicadores basicos de faturamento.
- Falta de processo simples entre atendimento, pagamento e entrega.

### Resultado esperado para o cliente

- Menos perda de vendas.
- Mais rapidez no atendimento.
- Orcamentos com aparencia profissional.
- Pix com QR Code ou link de pagamento.
- Dashboard claro de vendas, pendencias e clientes.
- Historico organizado por cliente.

## 4. Stack tecnica recomendada

### Frontend

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Tailwind CSS
- Axios com camada propria de API client
- Zod para validacao compartilhada quando fizer sentido
- Vitest para testes unitarios
- Playwright para testes end-to-end

### Backend

- Node.js
- TypeScript
- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ para filas e jobs
- JWT com refresh token em cookie HttpOnly
- OpenAPI/Swagger para documentacao da API
- Webhooks para Pix e WhatsApp
- Docker Compose para ambiente local

### Integracoes externas

- Mercado Pago para Pix no MVP
- WhatsApp Cloud API para recebimento e envio oficial de mensagens
- Provedor de e-mail transacional em fase posterior
- S3 compativel para arquivos, PDFs e anexos
- Provedor de IA plugavel em fase posterior

### Infraestrutura sugerida

- Ambiente local com Docker Compose
- Deploy inicial simples em VPS ou Render/Fly.io/Railway
- Banco PostgreSQL gerenciado quando houver clientes reais
- Redis gerenciado quando automacoes e filas entrarem em producao
- Backups diarios do banco
- Logs estruturados e monitoramento basico

## 5. Nome, posicionamento e narrativa publica

### Nome de trabalho

AtendePix

### Frase curta

Atendimento, orcamento e Pix em um fluxo simples para pequenos negocios.

### Demonstracao ideal para redes

Video curto:

1. Chega uma mensagem de cliente.
2. O atendente cadastra ou encontra o cliente.
3. Seleciona servicos/produtos.
4. Gera um orcamento em PDF.
5. Gera cobranca Pix.
6. O status muda para pago.
7. O dashboard atualiza faturamento e pendencias.

Gancho:

> Criei um sistema que transforma conversa de WhatsApp em orcamento + Pix + dashboard.

## 6. Modulos finais do sistema

### 6.1 Autenticacao e contas

Funcionalidades:

- Cadastro de conta da empresa.
- Login por e-mail e senha.
- Recuperacao de senha.
- Convite de usuarios.
- Perfis: dono, gerente, atendente e financeiro.
- Selecao de empresa para usuarios com acesso a mais de uma conta.

Criterios de pronto:

- Usuario consegue criar conta e acessar painel.
- Empresa fica isolada por tenant.
- Rotas protegidas no front e back.
- Refresh token seguro.
- Auditoria basica de login.

### 6.2 Onboarding da empresa

Funcionalidades:

- Nome da empresa.
- CNPJ ou CPF opcional no MVP.
- Segmento.
- Telefone comercial.
- Chave Pix ou conta Mercado Pago.
- Logo.
- Cores da marca para documentos.
- Dados de contato exibidos no orcamento.

Criterios de pronto:

- Primeira experiencia leva o usuario a configurar o minimo para gerar orcamento.
- Sistema mostra pendencias de configuracao.
- Dados aparecem no PDF do orcamento.

### 6.3 CRM simples

Funcionalidades:

- Cadastro de clientes.
- Pessoa fisica ou juridica.
- Nome, telefone, e-mail, documento, endereco e observacoes.
- Tags.
- Historico de atendimentos, orcamentos, pedidos e pagamentos.
- Busca por nome, telefone, documento e tag.

Criterios de pronto:

- Cadastro rapido em ate 30 segundos.
- Evita duplicidade por telefone/documento.
- Cliente tem uma linha do tempo clara.

### 6.4 Catalogo de produtos e servicos

Funcionalidades:

- Produtos.
- Servicos.
- Preco padrao.
- Custo opcional.
- Categoria.
- Status ativo/inativo.
- Observacoes e duracao estimada para servicos.

Criterios de pronto:

- Atendente consegue montar orcamento usando itens cadastrados.
- Permite item livre para casos nao padronizados.
- Lista tem busca rapida.

### 6.5 Atendimentos

Funcionalidades:

- Criacao manual de atendimento.
- Origem: WhatsApp, Instagram, telefone, presencial, outro.
- Status: novo, em atendimento, aguardando cliente, aguardando pagamento, concluido, cancelado.
- Responsavel.
- Notas internas.
- Vinculo com cliente.
- Vinculo com orcamentos e pedidos.

Criterios de pronto:

- Todo atendimento fica associado a um cliente.
- Dashboard mostra atendimentos abertos.
- Filtro por status, origem e responsavel.

### 6.6 Inbox WhatsApp

Fase inicial:

- Cadastro manual da origem WhatsApp.
- Campo para colar resumo ou mensagem principal.
- Botao para abrir conversa no WhatsApp Web pelo telefone do cliente.

Fase integrada:

- Webhook da WhatsApp Cloud API.
- Recebimento de mensagens.
- Historico de conversa.
- Envio de mensagens aprovadas.
- Templates para confirmacao de orcamento, pagamento e entrega.
- Status de entrega/leitura quando disponivel.

Criterios de pronto:

- MVP nao depende da aprovacao da API oficial.
- Integracao oficial entra depois que o fluxo principal estiver validado.
- Nenhuma automacao deve simular WhatsApp pessoal de forma insegura.

### 6.7 Orcamentos

Funcionalidades:

- Criar orcamento a partir de cliente ou atendimento.
- Itens com quantidade, preco, desconto e observacao.
- Validade do orcamento.
- Condicoes de pagamento.
- Observacoes comerciais.
- Status: rascunho, enviado, aprovado, recusado, expirado, convertido.
- Geracao de PDF.
- Link publico para visualizacao do orcamento.
- Acao para converter em pedido.

Criterios de pronto:

- PDF profissional e responsivo.
- Link publico nao exige login.
- Orcamento tem numeracao sequencial por empresa.
- Ao aprovar, vira pedido sem redigitar dados.

### 6.8 Pedidos ou ordens de servico

Funcionalidades:

- Pedido gerado a partir de orcamento ou criado direto.
- Status: aberto, aguardando pagamento, pago, em execucao, pronto, entregue, cancelado.
- Datas importantes.
- Responsavel.
- Checklist simples.
- Anexos.
- Observacoes internas e visiveis para o cliente.

Criterios de pronto:

- Pedido mostra claramente o proximo passo.
- Mudancas de status ficam no historico.
- Dashboard mostra pedidos atrasados e pendentes.

### 6.9 Pix e pagamentos

Funcionalidades MVP:

- Gerar cobranca Pix via Mercado Pago.
- Exibir QR Code e copia-e-cola.
- Enviar link de pagamento.
- Registrar pagamento manual quando necessario.
- Receber webhook de pagamento aprovado.
- Associar pagamento ao pedido/orcamento.

Funcionalidades futuras:

- Suporte a mais provedores.
- Parcelamento via cartao.
- Assinaturas do proprio SaaS.
- Conciliacao por periodo.
- Exportacao financeira.

Criterios de pronto:

- Pedido muda para pago automaticamente quando o webhook confirmar pagamento.
- Webhook deve ser idempotente.
- Pagamento manual exige usuario autorizado.
- Sistema registra origem, valor, data e provedor.

### 6.10 Dashboard

Funcionalidades:

- Faturamento do mes.
- Valor pendente.
- Orcamentos enviados.
- Taxa de conversao de orcamento para pedido.
- Atendimentos abertos.
- Pedidos por status.
- Top clientes.
- Top produtos/servicos.
- Grafico diario ou semanal.

Criterios de pronto:

- Primeira tela responde: quanto vendi, quanto falta receber e o que preciso resolver hoje.
- Filtros por periodo.
- Dados carregam rapido mesmo com volume moderado.

### 6.11 Automacoes

Funcionalidades:

- Lembrete de orcamento perto de vencer.
- Mensagem de pagamento pendente.
- Mensagem de pedido pronto.
- Tarefas internas automaticas.
- Regras simples: quando status mudar, executar acao.

Criterios de pronto:

- Automacoes ficam desligadas por padrao no MVP.
- Usuario entende o que sera enviado antes de ativar.
- Logs mostram sucesso ou falha de cada automacao.

### 6.12 IA assistente

Funcionalidades futuras:

- Resumir conversa.
- Sugerir resposta para cliente.
- Transformar texto livre em itens de orcamento.
- Sugerir follow-up.
- Gerar observacoes comerciais mais profissionais.
- Classificar atendimento por urgencia.

Criterios de pronto:

- IA sempre precisa de revisao humana antes de enviar mensagens.
- Dados sensiveis devem ser minimizados nos prompts.
- Empresa pode desativar IA.

### 6.13 Relatorios e exportacoes

Funcionalidades:

- Exportar clientes CSV.
- Exportar orcamentos CSV.
- Exportar pagamentos CSV.
- Relatorio PDF mensal simples.
- Filtros por periodo, status e origem.

Criterios de pronto:

- Exportacoes respeitam tenant e permissoes.
- Arquivos grandes devem rodar em fila.

### 6.14 Administracao do SaaS

Funcionalidades:

- Painel interno do dono do SaaS.
- Ver empresas cadastradas.
- Ver plano, status e uso.
- Bloquear ou desbloquear empresa.
- Logs basicos de erro.
- Controle de feature flags.

Criterios de pronto:

- Administrador nao altera dados do cliente sem auditoria.
- Acesso administrativo deve ser restrito.

### 6.15 Planos e cobranca do SaaS

Planos sugeridos:

- Gratis ou demo: 20 orcamentos/mes, sem integracao oficial.
- Basico: R$ 39/mes, 1 usuario, clientes e orcamentos.
- Pro: R$ 79/mes, 3 usuarios, Pix automatico e dashboard completo.
- Premium: R$ 149/mes, WhatsApp oficial, automacoes e IA limitada.
- Implantacao: R$ 300 a R$ 1.000 por cliente, dependendo do nicho.

Criterios de pronto:

- Sistema bloqueia limites com mensagem clara.
- Pagamento do SaaS nao deve misturar com pagamentos dos clientes finais.
- Dono consegue testar planos sem quebrar contas reais.

## 7. Modelo de dados inicial

### Entidades principais

- Tenant
- User
- Membership
- Role
- Customer
- CustomerTag
- ProductService
- Attendance
- Quote
- QuoteItem
- Order
- OrderItem
- Payment
- PaymentWebhookEvent
- Message
- MessageTemplate
- AutomationRule
- AutomationLog
- FileAsset
- AuditLog
- SubscriptionPlan
- Subscription

### Relacionamentos principais

- Tenant possui muitos Users via Membership.
- Tenant possui muitos Customers.
- Customer possui muitos Attendances.
- Attendance pode possuir muitos Quotes.
- Quote possui muitos QuoteItems.
- Quote pode virar Order.
- Order possui muitos OrderItems.
- Order pode possuir muitos Payments.
- Payment pode ser confirmado por PaymentWebhookEvent.
- Customer e Attendance podem possuir Messages.
- Tenant possui configuracoes de Pix, documentos e marca.

### Campos obrigatorios por entidade no MVP

Tenant:

- id
- name
- slug
- document
- phone
- logoUrl
- createdAt
- updatedAt

User:

- id
- name
- email
- passwordHash
- status
- createdAt
- updatedAt

Customer:

- id
- tenantId
- name
- phone
- email
- document
- notes
- createdAt
- updatedAt

ProductService:

- id
- tenantId
- type
- name
- description
- price
- active
- createdAt
- updatedAt

Quote:

- id
- tenantId
- customerId
- attendanceId
- number
- status
- subtotal
- discount
- total
- validUntil
- publicToken
- createdAt
- updatedAt

Order:

- id
- tenantId
- customerId
- quoteId
- number
- status
- total
- dueDate
- paidAt
- createdAt
- updatedAt

Payment:

- id
- tenantId
- orderId
- provider
- providerPaymentId
- status
- amount
- qrCode
- qrCodeText
- paymentUrl
- paidAt
- createdAt
- updatedAt

## 8. Arquitetura de pastas esperada

Estrutura planejada para quando o projeto for implementado:

```text
atende-pix/
  ROADMAP.md
  README.md
  docker-compose.yml
  .env.example
  apps/
    web/
      src/
        app/
        components/
        pages/
        router/
        stores/
        services/
        styles/
        tests/
    api/
      src/
        modules/
          auth/
          tenants/
          customers/
          catalog/
          attendances/
          quotes/
          orders/
          payments/
          webhooks/
          dashboard/
          automations/
        common/
        config/
        main.ts
      prisma/
        schema.prisma
        migrations/
  packages/
    shared/
      src/
        schemas/
        types/
```

## 9. API inicial planejada

### Auth

- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password

### Empresa

- GET /tenants/current
- PATCH /tenants/current
- POST /tenants/current/logo

### Clientes

- GET /customers
- POST /customers
- GET /customers/:id
- PATCH /customers/:id
- DELETE /customers/:id
- GET /customers/:id/timeline

### Catalogo

- GET /catalog/items
- POST /catalog/items
- GET /catalog/items/:id
- PATCH /catalog/items/:id
- DELETE /catalog/items/:id

### Atendimentos

- GET /attendances
- POST /attendances
- GET /attendances/:id
- PATCH /attendances/:id
- POST /attendances/:id/notes

### Orcamentos

- GET /quotes
- POST /quotes
- GET /quotes/:id
- PATCH /quotes/:id
- POST /quotes/:id/send
- POST /quotes/:id/approve
- POST /quotes/:id/reject
- POST /quotes/:id/convert-to-order
- GET /public/quotes/:token

### Pedidos

- GET /orders
- POST /orders
- GET /orders/:id
- PATCH /orders/:id
- POST /orders/:id/status
- POST /orders/:id/files

### Pagamentos

- POST /orders/:id/payments/pix
- GET /payments
- GET /payments/:id
- POST /payments/:id/manual-confirm
- POST /webhooks/mercado-pago

### Dashboard

- GET /dashboard/summary
- GET /dashboard/revenue
- GET /dashboard/pipeline
- GET /dashboard/pending-actions

### WhatsApp

- POST /webhooks/whatsapp
- GET /messages
- POST /messages/send
- GET /message-templates

## 10. Telas do frontend

### Publicas

- Login
- Cadastro
- Recuperar senha
- Visualizacao publica de orcamento
- Pagina publica de pagamento

### Internas

- Dashboard
- Atendimentos
- Inbox
- Clientes
- Detalhe do cliente
- Catalogo
- Orcamentos
- Criar/editar orcamento
- Detalhe do orcamento
- Pedidos
- Detalhe do pedido
- Pagamentos
- Relatorios
- Configuracoes da empresa
- Usuarios e permissoes
- Plano e assinatura
- Admin interno do SaaS

## 11. Roadmap por fases

### Fase 0 - Fundacao e planejamento tecnico

Status: concluida.

Objetivo:

Preparar a base para desenvolver rapido sem criar divida tecnica logo no inicio.

Entregas:

- [x] README inicial.
- [x] Monorepo com apps/web e apps/api.
- [x] Configuracao TypeScript.
- [x] Docker Compose com PostgreSQL e Redis.
- [x] API NestJS inicial.
- [x] Front Vue inicial.
- [x] Prisma configurado.
- [x] Padrao de lint e formatacao.
- [x] Variaveis de ambiente documentadas.
- [x] Swagger inicial.

Criterios de pronto:

- [x] `npm install` funciona na raiz.
- [x] `docker compose up` sobe banco e Redis.
- [x] API responde healthcheck.
- [x] Front abre tela inicial.
- [x] Documentacao explica como rodar localmente.

### Fase 1 - MVP sem integracoes externas

Status: concluida.

Objetivo:

Validar a experiencia principal sem depender de WhatsApp oficial ou Pix automatico.

Entregas:

- [x] Cadastro de empresa.
- [x] Login.
- [x] Dashboard basico.
- [x] CRUD de clientes.
- [x] CRUD de produtos/servicos.
- [x] Criacao manual de atendimento.
- [x] Criacao de orcamento.
- [x] PDF de orcamento.
- [x] Pedido gerado a partir de orcamento.
- [x] Registro manual de pagamento.
- [x] Tela de pagamentos.
- [x] Filtros e busca basicos.

Criterios de pronto:

- [x] Usuario cadastra cliente.
- [x] Usuario cria atendimento.
- [x] Usuario cria orcamento com itens livres.
- [x] Usuario cria orcamento usando itens do catalogo.
- [x] Usuario gera PDF.
- [x] Usuario converte orcamento em pedido.
- [x] Usuario marca pedido como pago manualmente.
- [x] Dashboard reflete o pedido pago.

Demo publica:

- "Criei o fluxo completo: cliente -> atendimento -> orcamento -> pedido -> pagamento -> dashboard."

### Fase 2 - Pix automatico

Status: concluida.

Objetivo:

Adicionar cobranca Pix real ou sandbox para transformar o MVP em produto vendavel.

Entregas:

- [x] Conta/configuracao de provedor Pix por empresa.
- [x] Integracao Mercado Pago em sandbox.
- [x] Geracao de cobranca Pix.
- [x] QR Code e copia-e-cola.
- [x] Link publico de pagamento.
- [x] Webhook de pagamento.
- [x] Idempotencia de webhooks.
- Tela de pagamentos.
- [x] Logs de pagamento.

Criterios de pronto:

- Pedido gera Pix.
- Cliente acessa pagina publica com QR Code.
- [x] Webhook confirma pagamento.
- [x] Pedido muda para pago automaticamente.
- [x] Falhas ficam registradas.

Demo publica:

- "Gerei um Pix dentro do sistema e o dashboard atualizou sozinho quando o pagamento caiu."

### Fase 3 - WhatsApp oficial e inbox

Status: concluida.

Objetivo:

Trazer atendimento conversacional para dentro do produto.

Entregas:

- [x] Configuracao de WhatsApp Cloud API.
- [x] Webhook de mensagens recebidas.
- [x] Lista de conversas.
- [x] Conversa vinculada ao cliente.
- [x] Criar cliente a partir de mensagem.
- [x] Criar atendimento a partir de conversa.
- [x] Envio de mensagens permitidas.
- [x] Templates de utilidade.
- [x] Status de mensagem quando disponivel.

Criterios de pronto:

- Mensagem recebida cria ou atualiza conversa.
- Atendente consegue vincular conversa a cliente.
- Atendente consegue gerar orcamento a partir da conversa.
- Sistema respeita regras de templates e janela de atendimento.

Demo publica:

- "Uma mensagem chegou no WhatsApp e virou atendimento, orcamento e Pix dentro do painel."

### Fase 4 - Automacoes e produtividade

Status: concluida.

Objetivo:

Reduzir tarefas repetitivas e aumentar conversao.

Entregas:

- [x] Regras de follow-up.
- [x] Lembrete de orcamento vencendo.
- [x] Lembrete de pagamento pendente.
- [x] Mensagem de pedido pronto.
- [x] Jobs com BullMQ.
- [x] Logs de automacao.
- [x] Tela para ligar/desligar regras.

Criterios de pronto:

- Usuario ativa regra.
- Regra executa em horario correto.
- Falhas sao registradas.
- Usuario consegue pausar automacao.

Demo publica:

- "O sistema lembrou automaticamente o cliente que tinha um orcamento pendente."

### Fase 5 - IA assistente

Status: concluida.

Objetivo:

Adicionar diferencial de produto e conteudo forte para redes.

Entregas:

- [x] Botao para resumir conversa.
- [x] Sugestao de resposta.
- [x] Geracao de itens de orcamento a partir de texto.
- [x] Sugestao de follow-up.
- [x] Configuracao para ativar/desativar IA.
- [x] Logs de uso e limite por plano.

Criterios de pronto:

- IA nunca envia mensagem sem aprovacao do usuario.
- Resultado pode ser editado antes de salvar.
- Limites por plano funcionam.

Demo publica:

- "Colei uma conversa baguncada e a IA montou um orcamento editavel."

### Fase 6 - SaaS comercial

Objetivo:

Preparar cobranca recorrente e operacao com clientes reais.

Entregas:

- [x] Planos.
- [x] Limites por plano.
- [x] Assinatura.
- [x] Trial.
- [x] Pagina simples de apresentacao comercial.
- [x] Painel admin interno.
- [x] Termos de uso e politica de privacidade.
- [x] Fluxo de cancelamento.
- [x] Controle de inadimplencia.

Criterios de pronto:

- Cliente consegue assinar.
- Sistema aplica limites.
- Dono do SaaS acompanha empresas ativas.
- Dados legais minimos publicados.

Demo publica:

- "Transformei o projeto em um SaaS com planos, trial e painel administrativo."

### Fase 7 - Producao, seguranca e escala

Objetivo:

Deixar o produto confiavel para clientes pagantes.

Entregas:

- [x] Backups automaticos.
- [x] Monitoramento de erros.
- [x] Logs estruturados.
- [x] Rate limiting.
- [x] Auditoria de acoes sensiveis.
- [x] Testes end-to-end dos fluxos principais.
- [x] Testes de webhooks.
- [x] Pipeline de deploy.
- [x] Documentacao operacional.
- [x] Alertas basicos.
- [x] Revisao final de producao.

Criterios de pronto:

- Restore de backup testado.
- Deploy repetivel.
- Fluxo cliente -> orcamento -> Pix -> pagamento testado automaticamente.
- Alertas basicos configurados.

## 12. Primeiro sprint recomendado

Duracao sugerida:

1 a 2 semanas de tempo livre.

Objetivo:

Ter uma base rodando e uma primeira tela apresentavel.

Tarefas:

1. [x] Criar monorepo.
2. [x] Criar API NestJS.
3. [x] Criar frontend Vue.
4. [x] Configurar Docker Compose com PostgreSQL.
5. [x] Configurar Prisma.
6. [x] Criar entidades Tenant, User, Customer, ProductService, Quote e QuoteItem.
7. [x] Criar login simples.
8. [x] Criar layout interno com sidebar.
9. [x] Criar tela de clientes.
10. [x] Criar tela de catalogo.
11. [x] Criar primeira versao de orcamento.
12. [x] Criar dashboard mockado ou parcialmente real.

Resultado esperado:

- Video curto mostrando a interface inicial e o fluxo de criar cliente + montar orcamento.

## 13. Criterios globais de qualidade

### Produto

- Fluxos principais devem exigir poucos cliques.
- Nenhuma tela importante deve depender de explicacao longa.
- O usuario deve sempre saber o proximo passo.
- Estados vazios devem convidar acao clara.
- O sistema deve funcionar bem em notebook e tablet.

### Codigo

- TypeScript estrito.
- Validacao no backend em todos os inputs.
- DTOs claros.
- Regras de negocio fora dos controllers.
- Testes para regras de pagamento, orcamento e permissoes.
- Webhooks idempotentes.
- Logs com contexto.

### Design

- Interface densa, limpa e operacional.
- Foco em dashboard, tabelas e formularios eficientes.
- Evitar visual de landing page dentro do app.
- Componentes consistentes.
- Botao primario claro por tela.
- Mobile utilizavel, mas desktop/tablet como foco inicial.

### Seguranca e LGPD

- Isolamento por tenant em todas as queries.
- Senhas com hash seguro.
- Tokens em cookie HttpOnly.
- Permissoes por papel.
- Auditoria para pagamentos e alteracoes sensiveis.
- Exportacao e exclusao de dados planejadas.
- Nunca salvar credenciais externas em texto puro.
- Segredos somente em variaveis de ambiente ou cofre.

## 14. Metricas de produto

### Para o usuario final

- Total vendido no mes.
- Pagamentos pendentes.
- Orcamentos enviados.
- Orcamentos aprovados.
- Taxa de conversao.
- Tempo medio ate pagamento.
- Atendimentos abertos.

### Para o dono do SaaS

- Empresas cadastradas.
- Empresas ativas.
- Usuarios ativos por semana.
- Orcamentos gerados por empresa.
- Pix gerados por empresa.
- Conversao trial -> pago.
- MRR.
- Churn.
- Receita por nicho.

## 15. Estrategia de monetizacao

### Modelo inicial

Comecar vendendo como servico + assinatura:

- Implantacao paga para configurar a empresa.
- Mensalidade baixa para reduzir barreira.
- Personalizacao por nicho como oferta de maior valor.

### Oferta inicial

- Setup inicial: R$ 497
- Mensalidade: R$ 79
- Inclui configuracao visual, cadastro inicial de ate 20 produtos/servicos e treinamento rapido.

### Validacao comercial

Antes de automatizar tudo:

- Conseguir 3 negocios interessados.
- Demonstrar MVP com dados ficticios do nicho.
- Cobrar implantacao com desconto.
- Usar feedback para ajustar fluxo.

## 16. Plano de conteudo para redes

### Conteudos de construcao

- Dia 1: ideia e problema.
- Dia 2: primeira tela do dashboard.
- Dia 3: cadastro de cliente.
- Dia 4: gerador de orcamento.
- Dia 5: PDF profissional.
- Dia 6: Pix integrado.
- Dia 7: webhook atualizando pagamento.
- Dia 8: inbox WhatsApp.
- Dia 9: automacao de follow-up.
- Dia 10: IA montando orcamento.

### Formatos

- Reels/TikTok de 20 a 45 segundos.
- LinkedIn com print + explicacao tecnica curta.
- Thread mostrando arquitetura.
- Antes/depois de processo manual para processo automatizado.

### Ganchos

- "Cansei de ver pequenos negocios perdendo venda no WhatsApp, entao criei isso."
- "Do atendimento ao Pix pago em menos de 1 minuto."
- "O dashboard atualiza sozinho quando o Pix cai."
- "Transformei uma conversa em um orcamento profissional."

## 17. Riscos e mitigacoes

### Risco: depender cedo da WhatsApp Cloud API

Mitigacao:

- MVP com cadastro manual e botao de abrir WhatsApp Web.
- Integracao oficial entra apos validacao.

### Risco: Pix e webhooks falharem em producao

Mitigacao:

- Webhook idempotente.
- Logs detalhados.
- Reprocessamento manual.
- Status "aguardando confirmacao".

### Risco: produto ficar generico demais

Mitigacao:

- Comecar com 1 ou 2 nichos.
- Criar modelos de orcamento e status por nicho.

### Risco: excesso de funcionalidades antes de vender

Mitigacao:

- Vender com MVP.
- Priorizar fluxo cliente -> orcamento -> pedido -> pagamento.
- Guardar IA e automacoes para demonstracoes e planos maiores.

### Risco: dados sensiveis

Mitigacao:

- Evitar dados reais no desenvolvimento.
- Criar seed de dados ficticios.
- Politica de acesso e auditoria desde cedo.

## 18. Backlog futuro

- [x] Base de app mobile leve com manifest instalavel, icone e atalhos iniciais.
- [x] PWA offline parcial com service worker, cache do app shell e pagina offline.
- [x] Agenda de servicos com agendamentos por cliente, unidade, responsavel e status.
- [x] Controle de estoque simples para produtos do catalogo, com saldo e alerta minimo.
- [x] Multiunidade com cadastro de unidades e vinculo inicial em agenda/pedidos.
- [x] Comissoes de vendedores por pedido, com percentual, valor calculado e baixa de pagamento.
- [x] Portal do cliente para consulta publica por telefone/documento de orcamentos, pedidos, pagamentos e agenda.
- Assinatura recorrente para clientes finais.
- Boleto.
- NFC-e ou integracao fiscal, se o nicho exigir.
- Marketplace de templates de orcamento.
- White label para consultores.
- API publica para integradores.

## 19. Refinamentos priorizados

Esta lista concentra melhorias importantes depois do produto estar funcional. A ordem abaixo prioriza o que reduz atrito para clientes reais e aumenta confianca operacional.

### 19.1 Obrigatorios antes de vender para mais clientes

- Onboarding inicial guiado para configurar empresa, logo, contato, Mercado Pago, WhatsApp e primeiro item do catalogo.
- Checklist interno de configuracao mostrando pendencias para gerar primeiro orcamento e primeira cobranca Pix.
- Recuperacao de senha por e-mail.
- Convite de usuarios por empresa.
- Perfis e permissoes praticos: dono, gerente, atendente e financeiro.
- Ajuste fino de permissoes para pagamento manual, configuracoes, plano e area admin.
- Revisao completa de textos, acentuacao e mensagens de erro em documentos, telas publicas, painel e e-mails futuros.
- Seed/demo com dados ficticios por nicho para apresentacao comercial.
- Teste manual documentado do fluxo real: cadastro -> cliente -> catalogo -> orcamento -> pedido -> Pix -> webhook -> dashboard.

### 19.2 Produto e experiencia

- Criar orcamento diretamente a partir de uma conversa do inbox, levando cliente e contexto ja preenchidos.
- Melhorar estados vazios com acao principal clara em clientes, catalogo, inbox, orcamentos, pedidos e pagamentos.
- Adicionar busca e filtros mais completos em orcamentos, pedidos, pagamentos e relatorios.
- Tela de detalhe do orcamento com status, historico, link publico, PDF, conversao e pagamentos relacionados.
- Tela de detalhe do pedido com linha do tempo, checklist simples, pagamento e proximas acoes.
- Campos comerciais extras no orcamento: condicoes de pagamento, observacoes visiveis, prazo de entrega e validade padrao.
- Modelos de texto por nicho para mensagens, observacoes comerciais e follow-ups.
- Parametros visuais por empresa para documentos: cor principal, rodape, logo e dados comerciais.
- Exportacao CSV de clientes e orcamentos, alem das exportacoes financeiras atuais.
- Relatorio mensal em PDF simples para o dono do negocio.

### 19.3 Operacao e confiabilidade

- Validar restore de backup em ambiente temporario com rotina agendada.
- Coletar logs estruturados na plataforma de hospedagem escolhida.
- Configurar alerta externo para healthcheck e falhas recorrentes.
- Criar procedimento de reprocessamento manual de webhooks de pagamento.
- Criar painel simples de eventos de webhook Mercado Pago e WhatsApp por empresa.
- Melhorar mensagens de bloqueio por plano/trial/inadimplencia com proxima acao clara.
- Adicionar auditoria para login, alteracoes de configuracao, usuarios e permissoes.
- Revisar LGPD: exportacao de dados, exclusao/anonimizacao e registro de consentimentos quando necessario.

### 19.4 Comercial e go-to-market

- Preparar roteiro de demo de 3 minutos por nicho.
- Criar landing publica final com oferta, planos, prints reais e chamada para implantacao.
- Criar material de onboarding para cliente: checklist de setup e guia rapido.
- Definir pacote de implantacao inicial e escopo do que entra no setup.
- Validar precificacao com 3 negocios antes de automatizar checkout real do SaaS.
- Medir funil basico: cadastro, primeiro cliente, primeiro orcamento, primeiro Pix, pagamento confirmado.

### 19.5 Backlog tecnico posterior

- Trocar checkout local de assinatura por provedor real para mensalidade do SaaS.
- Suporte a upload de arquivos/anexos em clientes, pedidos e atendimentos.
- Armazenamento S3 compativel para PDFs, logos e anexos.
- Recuperacao de senha e e-mails transacionais com provedor dedicado.
- API publica para integradores com tokens por tenant.
- Feature flags por empresa/plano.
- Melhor cobertura visual/E2E para fluxos web criticos alem do E2E de API.

## 20. Definicao de sistema finalizado funcional

O sistema sera considerado funcional e pronto para clientes pagantes quando:

1. Empresa consegue criar conta e configurar dados basicos.
2. Usuario consegue cadastrar clientes e servicos.
3. Usuario consegue criar atendimento.
4. Usuario consegue gerar orcamento em PDF.
5. Cliente consegue visualizar orcamento por link publico.
6. Usuario consegue converter orcamento em pedido.
7. Usuario consegue gerar cobranca Pix.
8. Pagamento confirmado atualiza pedido automaticamente.
9. Dashboard mostra vendas, pendencias e atendimentos.
10. Usuario consegue acompanhar historico do cliente.
11. Sistema tem isolamento por empresa.
12. Sistema tem backup e logs basicos.
13. Fluxo principal tem testes automatizados.
14. Dono do SaaS consegue controlar planos e empresas.
15. Documentacao local e operacional existe.
16. Ambiente de producao tem HTTPS, backups, healthcheck, logs e alertas basicos.
17. Piloto com dados reais controlados foi executado sem falhas bloqueantes.

## 21. Proxima decisao

A proxima decisao nao e mais tecnica de fundacao; o produto ja tem o fluxo principal e a base de producao. A decisao agora e escolher o caminho de validacao:

1. Subir ambiente de producao com dominio, HTTPS, Postgres, Redis e secrets reais.
2. Rodar `ENV_FILE=.env.production npm run ops:production-check`.
3. Aplicar migrations com `npm run db:deploy`.
4. Validar o checklist de go-live em `docs/PRODUCTION_CHECKLIST.md`.
5. Convidar 1 a 3 negocios para piloto assistido.
6. Registrar atritos encontrados no piloto.
7. Executar os refinamentos obrigatorios antes de vender para mais clientes.

Ordem sugerida:

1. Deploy real.
2. Checklist tecnico de producao.
3. Teste de integracoes externas.
4. Piloto assistido.
5. Refinamentos obrigatorios.
6. Oferta comercial inicial.
7. Primeiros clientes pagantes.
