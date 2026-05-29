# Checklist de Producao

Use este checklist antes de colocar clientes reais no AtendePix.

## Codigo e build

- [ ] `npm ci` executa sem erro.
- [ ] `npm run lint` passa.
- [ ] `npm run test` passa.
- [ ] `npm run build` passa.
- [ ] `npm run test:e2e` passa contra ambiente descartavel.
- [ ] `npm audit --omit=dev` retorna zero vulnerabilidades.

## Banco e dados

- [ ] `npm run db:deploy` aplica migrations sem pendencia.
- [ ] Backup automatico esta agendado.
- [ ] Restore check foi executado em banco temporario.
- [ ] Acesso ao banco esta restrito por rede/credenciais fortes.

## Ambiente

- [ ] `NODE_ENV=production`.
- [ ] `DATABASE_URL` aponta para banco de producao.
- [ ] `REDIS_URL` aponta para Redis de producao.
- [ ] `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` sao fortes e unicos.
- [ ] `WEB_ORIGIN` e `VITE_API_BASE_URL` usam HTTPS.
- [ ] `ADMIN_EMAILS` contem apenas e-mails autorizados.
- [ ] `RATE_LIMIT_ENABLED=true`.
- [ ] `RATE_LIMIT_TRUST_PROXY=true` quando atras de proxy confiavel.

Execute a validacao automatica:

```bash
ENV_FILE=.env.production npm run ops:production-check
```

## Operacao

- [ ] Deploy manual do GitHub Actions testado.
- [ ] Processo da API reinicia automaticamente se cair.
- [ ] Healthcheck externo configurado.
- [ ] `ALERT_WEBHOOK_URL` configurado quando houver canal de alerta.
- [ ] Logs estruturados sao coletados pela plataforma.
- [ ] Tela `/admin/errors` acessivel apenas para admin.

## Produto

- [ ] Cadastro, login e dashboard funcionam.
- [ ] Fluxo cliente -> orcamento -> pedido -> pagamento foi testado.
- [ ] Link publico de orcamento abre sem login.
- [ ] Webhook Mercado Pago foi testado em sandbox.
- [ ] Webhook WhatsApp foi validado em ambiente de teste.
- [ ] Politica de privacidade e termos estao publicados.

## Go/no-go

So avance para clientes pagantes quando todos os itens obrigatorios acima estiverem concluídos ou houver aceite explicito do risco.
