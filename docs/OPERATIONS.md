# Operacao do AtendePix

Runbook para operar o AtendePix em producao ou homologacao.

## Requisitos do servidor

- Node.js 22+
- npm 10+
- Git
- PostgreSQL 16 ou banco PostgreSQL gerenciado
- Redis 7 ou Redis gerenciado
- Processo supervisor para API, por exemplo systemd, PM2 ou servico da plataforma
- Servidor web/proxy TLS para expor API e web, por exemplo Nginx, Caddy ou proxy da plataforma

## Variaveis de ambiente

Configure as variaveis em arquivo `.env` no servidor, secrets da plataforma ou cofre equivalente.

Obrigatorias:

- `NODE_ENV=production`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN_SECONDS`
- `API_PORT`
- `WEB_ORIGIN`
- `VITE_API_BASE_URL`

Recomendadas:

- `ADMIN_EMAILS`
- `ERROR_MONITORING_ENABLED=true`
- `ERROR_MONITORING_CAPTURE_4XX=false`
- `ERROR_LOG_PATH=.logs/api-errors.log`
- `STRUCTURED_LOGGING_ENABLED=true`
- `REQUEST_LOGGING_ENABLED=true`
- `RATE_LIMIT_ENABLED=true`
- `RATE_LIMIT_TRUST_PROXY=true` quando estiver atras de proxy confiavel
- `BACKUP_DIR`
- `BACKUP_RETENTION_DAYS`
- `POSTGRES_CONTAINER`
- `POSTGRES_DATABASE`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

Nunca grave tokens Mercado Pago, WhatsApp ou JWT reais no repositorio.

## Primeiro deploy

1. Clonar o repositorio no servidor.
2. Criar o `.env` de producao.
3. Instalar dependencias.

```bash
npm ci
```

4. Gerar Prisma Client.

```bash
npm run db:generate
```

5. Aplicar migrations versionadas.

```bash
npm run db:deploy
```

6. Gerar build.

```bash
npm run build
```

7. Iniciar ou reiniciar os processos da API e web conforme a plataforma.

## Deploy recorrente

O deploy manual do GitHub Actions usa `.github/workflows/deploy-production.yml`.

Secrets esperados no ambiente `production`:

- `DEPLOY_HOST`
- `DEPLOY_PORT`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PATH`
- `DEPLOY_RESTART_COMMAND`

O workflow executa:

```bash
git pull --ff-only origin master
npm ci
npm run db:generate
npm run db:deploy
npm run build
$DEPLOY_RESTART_COMMAND
```

## Validacao apos deploy

1. Verificar healthcheck da API.

```bash
curl -f https://api.seu-dominio.com/health
```

2. Abrir o painel web.
3. Fazer login com usuario de teste.
4. Validar um fluxo curto: criar cliente, criar orcamento e abrir link publico.
5. Conferir logs recentes da API.

## Backup

Para ambiente local com Postgres em Docker:

```bash
npm run db:backup
```

O script salva arquivos em `.backups/postgres` por padrao e aplica retencao via `BACKUP_RETENTION_DAYS`.

Em producao com banco gerenciado, prefira snapshots automáticos do provedor e mantenha o script versionado como backup operacional adicional quando houver acesso a `pg_dump`.

## Restore check

Valide periodicamente se um backup restaura em banco temporario:

```bash
npm run db:restore-check -- -BackupPath .backups/postgres/arquivo.sql
```

Nunca teste restore diretamente no banco de producao.

## Logs

Logs estruturados da API saem em stdout/stderr e devem ser coletados pela plataforma ou supervisor.

Erros HTTP 5xx tambem sao gravados no arquivo configurado por `ERROR_LOG_PATH`. Usuarios em `ADMIN_EMAILS` podem ver eventos recentes em `/admin/errors`.

## Webhooks

Mercado Pago:

- configure o endpoint publico `POST /webhooks/mercado-pago`
- use `webhookSecret` quando disponivel
- confirme que eventos duplicados por `x-request-id` sao ignorados
- monitore a tela de pagamentos e os logs de webhook

WhatsApp:

- configure `GET/POST /webhooks/whatsapp`
- confira `verifyToken`, `phoneNumberId`, `accessToken` e `appSecret`
- monitore mensagens recebidas e status de entrega no inbox

## Rollback

Rollback simples de aplicacao:

1. Voltar para o commit anterior.

```bash
git checkout <commit-anterior>
npm ci
npm run db:generate
npm run build
```

2. Reiniciar processos.
3. Validar `/health`.

Migrations Prisma aplicadas em producao nao devem ser revertidas manualmente sem plano especifico. Para mudancas destrutivas, crie migration corretiva ou restaure backup em ambiente controlado.

## Alertas basicos

Configure alertas externos para:

- `/health` fora do ar por mais de 2 minutos
- aumento de HTTP 5xx
- falha de backup
- falha de restore check agendado
- fila Redis indisponivel
- webhooks Mercado Pago com status `FAILED`
- disco acima de 80%

Ferramentas simples possiveis: UptimeRobot, Better Stack, Grafana Cloud, healthchecks.io ou monitoramento nativo da plataforma.

O repositorio tambem inclui um healthcheck automatizavel:

```bash
HEALTHCHECK_URL=https://api.seu-dominio.com/health npm run ops:healthcheck
```

O workflow `.github/workflows/healthcheck.yml` roda a cada 5 minutos quando o secret `PRODUCTION_HEALTHCHECK_URL` estiver configurado. Para receber notificacoes, configure `ALERT_WEBHOOK_URL` com um endpoint que aceite `POST` JSON.

## Checklist final

Antes de liberar clientes reais, use `docs/PRODUCTION_CHECKLIST.md` e execute:

```bash
ENV_FILE=.env.production npm run ops:production-check
```
