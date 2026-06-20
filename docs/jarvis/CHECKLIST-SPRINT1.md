# Checklist Sprint 1 · n8n comercial ZENKAI

Marcar en orden. Tiempo estimado restante: **~10 min** (solo Airtable automations).

## Repo (local)

- [x] `npm run n8n:checklist` — 4 JSON válidos
- [x] `npm run jarvis:setup-sprint1` — campos Airtable OK
- [x] Workflows usan `$vars.*` en repo · secrets inyectados desde `.env` al importar MCP
- [x] `npm run n8n:import:mcp -- --apply --force` — 4 workflows activos

## n8n Cloud

- [x] MCP token válido · HTTP 200
- [x] M-04 `jarvis-callback` — **success** · alerta fundador
- [x] M-03 `leads-qualify` — **success** · score/etapa en Airtable
- [x] M-02 `demo-autoreply` — **success** · `autoreply_sent=true`
- [x] S-01 cron horario — **active**
- [x] Secrets vía import MCP (`.env` → literales en nodos; no requiere Variables UI)
- [x] `npm run n8n:smoke` — webhooks OK

## Airtable VENTAS

- [x] Campos `demos` + `Leads` (schema Sprint 1)
- [ ] Automation demo → webhook M-02 — ver `docs/jarvis/airtable-automations-sprint1.md`
- [ ] Automation lead → webhook M-03

## Smoke test end-to-end

- [x] Executions **success** (sin `access to env vars denied` ni `v0//Leads`)
- [x] POST M-02 con `record_id` real + email
- [x] POST M-03 con `record_id` lead real
- [x] POST M-04 con `score: 8` → email fundador
- [ ] Demo en landing con email → Airtable automation → M-02

## Done

- [x] M-03 cualifica y escribe Airtable (M-04 si score ≥ 6)
- [ ] Fundador recibe alerta lead caliente en producción real (score ≥ 6)
- [ ] SLA S-01 alerta una sola vez (`sla_alert_sent`) — cron OK (fix merge secuencial + CREATED_TIME)
