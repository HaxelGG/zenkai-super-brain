# Checklist Sprint 1 · n8n comercial ZENKAI

Marcar en orden. Tiempo estimado restante: **15–20 min** (variables + Airtable automations).

## Repo (local)

- [x] `npm run n8n:checklist` — 4 JSON válidos
- [x] `npm run jarvis:setup-sprint1` — campos Airtable OK
- [x] Workflows refactorizados a `$vars.*` (sin credenciales vault · Slack opcional)
- [x] `npm run n8n:import:mcp -- --apply --force` — 4 workflows recreados + publicados

## n8n Cloud

- [x] MCP token válido · HTTP 200
- [x] M-04 `jarvis-callback` — **active** · webhook 200
- [x] M-03 `leads-qualify` — **active** · webhook 200
- [x] M-02 `demo-autoreply` — **active** · webhook 200
- [x] S-01 cron horario — **active**
- [ ] **Variables** `$vars.*` → `npm run n8n:vars -- --apply` (requiere `N8N_API_KEY`) o `--print` + pegar en UI
- [ ] `npm run n8n:smoke` — sin errores en ejecuciones

## Airtable VENTAS

- [x] Campos `demos` + `Leads` (schema Sprint 1)
- [ ] Automation demo → webhook M-02 — ver `docs/jarvis/airtable-automations-sprint1.md`
- [ ] Automation lead → webhook M-03

## Smoke test end-to-end

- [ ] Variables n8n cargadas (sin error en Executions)
- [ ] POST M-02 con `record_id` real + email
- [ ] POST M-03 con `record_id` lead real
- [ ] POST M-04 con `score: 8` → email/Slack fundador
- [ ] Demo en landing con email → Airtable automation → M-02

## Done

- [ ] Fundador recibe alerta lead caliente (score ≥ 6)
- [ ] SLA S-01 alerta una sola vez (`sla_alert_sent`)
