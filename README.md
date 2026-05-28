# AtendePix

Mini SaaS para pequenos negocios transformarem atendimentos recebidos por WhatsApp, Instagram ou telefone em clientes, orcamentos, cobrancas Pix, pedidos e acompanhamento financeiro simples.

## Stack

- Monorepo com npm workspaces
- API: Node.js, TypeScript, NestJS, Prisma e PostgreSQL
- Web: Vue 3, TypeScript, Vite, Vue Router, Pinia e Tailwind CSS
- Infra local: Docker Compose com PostgreSQL e Redis
- Qualidade: ESLint, Prettier, Vitest e Swagger

## Requisitos

- Node.js 22+
- npm 10+
- Docker e Docker Compose

No Windows PowerShell, se `npm` estiver bloqueado pela Execution Policy, use `npm.cmd`.

## Como rodar localmente

```bash
npm install
docker compose up -d
npm run db:generate
npm run dev
```

Servicos locais:

- Web: http://localhost:5173
- API: http://localhost:3000
- Swagger: http://localhost:3000/docs
- Healthcheck: http://localhost:3000/health

## Scripts principais

```bash
npm run dev
npm run build
npm run test
npm run lint
npm run format
npm run db:backup
npm run db:restore-check -- -BackupPath .backups/postgres/arquivo.sql
npm run db:generate
npm run db:migrate
```

## Backups locais do banco

O backup usa o `pg_dump` do container `atende-pix-postgres` e grava arquivos `.sql` em `.backups/postgres`, mantendo por padrao 14 dias.

```bash
npm run db:backup
npm run db:restore-check -- -BackupPath .backups/postgres/atende_pix_YYYYMMDD_HHMMSS.sql
```

Para producao, agende `npm run db:backup` no cron, Task Scheduler ou job da plataforma. Configure `BACKUP_DIR`, `BACKUP_RETENTION_DAYS`, `POSTGRES_CONTAINER`, `POSTGRES_DATABASE`, `POSTGRES_USER` e `POSTGRES_PASSWORD` no ambiente.

## Monitoramento de erros

A API registra excecoes HTTP 5xx em JSON Lines no arquivo configurado por `ERROR_LOG_PATH` (`.logs/api-errors.log` por padrao). Use `ERROR_MONITORING_ENABLED=false` para desligar localmente e `ERROR_MONITORING_CAPTURE_4XX=true` se quiser registrar tambem erros 4xx.

Usuarios com e-mail em `ADMIN_EMAILS` veem os menus **Admin** e **Erros** no painel. A tela **Erros** fica em `/admin/errors` e le os eventos recentes do arquivo de monitoramento.

## Logs estruturados

A API escreve logs JSON no stdout/stderr do processo, incluindo inicializacao do Nest e requisicoes HTTP com `requestId`, metodo, rota, status e duracao. Em desenvolvimento esses logs ficam em `.logs/dev.out.log` e `.logs/dev.err.log` porque o `npm run dev` e iniciado com redirecionamento.

Variaveis:

- `STRUCTURED_LOGGING_ENABLED=true`
- `STRUCTURED_LOGGING_VERBOSE=false`
- `REQUEST_LOGGING_ENABLED=true`

## Estrutura

```text
apps/
  api/   API NestJS
  web/   Frontend Vue
packages/
  shared/ Schemas e tipos compartilhados
```

## Primeira meta

A fase inicial foca em deixar a fundacao do produto pronta: monorepo, API com healthcheck, frontend inicial, Docker Compose, Prisma, variaveis de ambiente documentadas e Swagger.
