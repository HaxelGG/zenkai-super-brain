# JARVIS · n8n automations

Motor de automatización oficial de ZENKAI. JARVIS no reemplaza n8n — lo orquesta vía webhooks y Airtable.

## Instancia

| Campo | Valor |
|-------|--------|
| Cloud | `https://zenkai-growth-systems.app.n8n.cloud` |
| Exports | `jarvis/n8n/*.json` |
| MCP (Cursor) | `.cursor/mcp.json.example` → servidor `n8n-mcp` |

## Sprint 1 (comercial · 2026-06-19)

| ID | Archivo | Webhook |
|----|---------|---------|
| M-04 | `ZENKAI-M-04-hot-lead-alert.json` | `/webhook/jarvis-callback` |
| M-03 | `LEADS-05-qualify-on-create.json` | `/webhook/leads-qualify` |
| M-02 | `ZENKAI-M-02-demo-autoreply.json` | `/webhook/demo-autoreply` |
| S-01 | `ZENKAI-S-01-sla-form-3h.json` | Cron horario |

Checklist: `docs/jarvis/CHECKLIST-SPRINT1.md`  
Plan: `docs/plans/2026-06-19-sprint1-automatizaciones-n8n.md`

```bash
npm run n8n:checklist
npm run jarvis:setup-sprint1
```

## Flujos canónicos (roadmap)

| Workflow | Trigger | Destino |
|----------|---------|---------|
| Lead web → CRM | Webhook / form | Airtable VENTAS |
| Cualificación HERMES | Airtable / webhook | M-03 |
| Reporte semanal | Cron (lunes) | Email + Airtable |
| Aprobación WhatsApp | JARVIS approve | **Human-in-the-loop** |

Referencia: `workflows/workflow-reporte-semanal.md`, `conexiones/conexiones-make.md`.

## Integración con JARVIS HUD

- **CRM / finanzas:** Airtable (`/api/jarvis/crm`, `/api/jarvis/finance`)
- **Runs / voz:** `/api/jarvis/run`, `/api/jarvis/speak`
- **Orquestador web:** `/api/orquestar` (propuesta + optional n8n notify)

## Self-host (dev / Premium)

Ver `infra/n8n/.env.example` para Docker local.

## Checklist operativo

1. [ ] Workflows Sprint 1 activos en n8n Cloud
2. [ ] Credenciales Airtable + Anthropic + Resend en n8n
3. [ ] Airtable automations → webhooks M-02 / M-03
4. [ ] Flujos WA / propuesta / cobro con aprobación humana
5. [ ] MCP n8n conectado en Cursor
