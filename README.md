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
npm run db:generate
npm run db:migrate
```

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
