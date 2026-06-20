# Checklist Sprint 1 · n8n comercial ZENKAI

Marcar en orden. Tiempo estimado: **45–60 min**.

## Repo (local)

- [ ] `npm run n8n:checklist` — 4 JSON válidos
- [ ] `npm run jarvis:setup-sprint1` — campos Airtable documentados

## n8n Cloud

- [ ] Variables: `AIRTABLE_BASE_VENTAS`, `ZENKAI_FROM_EMAIL`, `ZENKAI_ALERT_EMAIL`
- [ ] Variable opcional: `SLACK_WEBHOOK_URL`
- [ ] Credencial Airtable PAT
- [ ] Credencial Resend (HTTP Bearer)
- [ ] Credencial Anthropic (`x-api-key`)

## Import + activar (orden)

- [ ] M-04 `jarvis-callback`
- [ ] M-03 `leads-qualify`
- [ ] M-02 `demo-autoreply`
- [ ] S-01 cron horario
- [ ] Todos: **Available in MCP** + **Active**

## Airtable VENTAS

- [ ] Campos en `demos`: `autoreply_sent`, `respondido_at`, `sla_alert_sent`
- [ ] Campos en `leads`: `score`, `etapa`, `respondido_at`, `sla_alert_sent`, `cualificacion_razon`, `cualificacion_brief`, `created_at`
- [ ] Automation demo → webhook M-02
- [ ] Automation lead → webhook M-03

## Smoke test

- [ ] POST manual M-02 con email test
- [ ] POST manual M-03 con `record_id` real
- [ ] POST manual M-04 con `score: 8`
- [ ] Esperar cron S-01 o forzar record demo >3h sin `respondido_at`

## Done

- [ ] Fundador recibe alerta lead caliente
- [ ] SLA alerta una sola vez (`sla_alert_sent`)
