# JARVIS · n8n workflow exports

Motor de automatización comercial ZENKAI. Importar en **n8n Cloud** (`zenkai-growth-systems.app.n8n.cloud`).

## Sprint 1 (comercial)

| ID | Archivo | Webhook / trigger | Propósito |
|----|---------|-------------------|-----------|
| M-04 | `ZENKAI-M-04-hot-lead-alert.json` | `POST /webhook/jarvis-callback` | Alerta Slack/email lead caliente |
| M-03 | `LEADS-05-qualify-on-create.json` | `POST /webhook/leads-qualify` | Cualificación HERMES → Airtable |
| M-02 | `ZENKAI-M-02-demo-autoreply.json` | `POST /webhook/demo-autoreply` | Auto-reply recepción demo (SLA 4h) |
| S-01 | `ZENKAI-S-01-sla-form-3h.json` | Cron cada hora | Alerta si sin respuesta >3h |

**Orden de importación:** M-04 → M-03 → M-02 → S-01 (M-03 llama al webhook de M-04).

## Variables n8n (Settings → Variables)

| Variable | Ejemplo |
|----------|---------|
| `AIRTABLE_BASE_VENTAS` | `appXXXXXXXX` |
| `ZENKAI_FROM_EMAIL` | `ZENKAI <hola@zenkai.systems>` |
| `ZENKAI_ALERT_EMAIL` | `hola@zenkai.systems` |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/...` (opcional) |
| `N8N_JARVIS_CALLBACK_URL` | `https://zenkai-growth-systems.app.n8n.cloud/webhook/jarvis-callback` |

## Credenciales (mapear al importar)

| Nombre sugerido | Tipo | Uso |
|-----------------|------|-----|
| Airtable PAT ZENKAI | Airtable Personal Access Token | M-02, M-03, S-01 |
| Resend API Bearer | HTTP Header Auth · `Authorization: Bearer re_...` | M-02, M-04 |
| Anthropic API Key | HTTP Header Auth · `x-api-key: sk-ant-...` | M-03 |

## Checklist operativo

Ver `docs/jarvis/CHECKLIST-SPRINT1.md` y `docs/plans/2026-06-19-sprint1-automatizaciones-n8n.md`.

## Validar exports localmente

```bash
npm run n8n:checklist
npm run jarvis:setup-sprint1
```

## Importar a n8n Cloud

### Opción A · MCP (recomendado si tienes Access Token válido)

```bash
npm run n8n:import:mcp          # dry-run + verifica MCP
npm run n8n:import:mcp -- --apply
```

Token: n8n Cloud → **Settings → Instance-level MCP → Access Token** → `.env` como `N8N_MCP_ACCESS_TOKEN`.

Si responde **401**: regenera el token (el anterior queda revocado) y reinicia Cursor.

### Opción B · REST API

1. n8n Cloud → **Settings → n8n API** → Create API Key  
2. `.env`: `N8N_API_KEY=...`  
3. `npm run n8n:import -- --apply`

Orden: M-04 → M-03 → M-02 → S-01. Tras import: mapear credenciales + variables + **Available in MCP**.
