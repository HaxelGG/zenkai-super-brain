# Checklist Sprint 1 · n8n comercial ZENKAI

Marcar en orden. Tiempo estimado: **45–60 min**.

## Repo (local)

- [x] `npm run n8n:checklist` — 4 JSON válidos (2026-06-19)
- [x] `npm run jarvis:setup-sprint1` — campos `demos` + `Leads` OK en Airtable VENTAS
- [ ] `npm run n8n:import -- --apply` — requiere `N8N_API_KEY` en `.env`

## n8n Cloud

- [x] Workflows importados vía `npm run n8n:import:mcp -- --apply` (2026-06-19)
- [ ] Variables: `AIRTABLE_BASE_VENTAS`, `ZENKAI_FROM_EMAIL`, `ZENKAI_ALERT_EMAIL`
- [ ] Variable opcional: `SLACK_WEBHOOK_URL`
- [ ] Credencial Airtable PAT
- [ ] Credencial Resend (HTTP Bearer)
- [ ] Credencial Anthropic (`x-api-key`)

## Import + activar (orden)

- [ ] M-04 `jarvis-callback` — publicado
- [ ] M-03 `leads-qualify` — publicado
- [ ] M-02 `demo-autoreply` — publicado
- [ ] S-01 cron horario — publicado
- [ ] Credenciales mapeadas en UI (Airtable · Resend · Anthropic)
- [ ] Todos: **Available in MCP** (ya ON si creados vía MCP builder)

## Airtable VENTAS

- [ ] Campos en `demos`: `autoreply_sent`, `respondido_at`, `sla_alert_sent`
- [ ] Campos en `Leads`: `score`, `etapa`, `cualificacion_*`, `respondido_at`, `sla_alert_sent`
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
