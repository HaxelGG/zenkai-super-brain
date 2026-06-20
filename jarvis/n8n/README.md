# JARVIS · n8n workflow exports

Motor de automatización comercial ZENKAI. Importar en **n8n Cloud** (`zenkai-growth-systems.app.n8n.cloud`).

## Sprint 1 (comercial)

| ID | Archivo | Webhook / trigger | Propósito |
|----|---------|-------------------|-----------|
| M-04 | `ZENKAI-M-04-hot-lead-alert.json` | `POST /webhook/jarvis-callback` | Alerta Slack/email lead caliente |
| M-03 | `LEADS-05-qualify-on-create.json` | `POST /webhook/leads-qualify` | Cualificación HERMES → Airtable |
| M-02 | `ZENKAI-M-02-demo-autoreply.json` | `POST /webhook/demo-autoreply` | Auto-reply recepción demo (SLA 4h) |
| M-05 | `ZENKAI-M-05-content-pipeline.json` | `POST /webhook/agency-content` | Pipeline contenido MUSE |
| M-06 | `ZENKAI-M-06-meta-publish.json` | `POST /webhook/agency-publish` | Publicación Meta/Instagram |
| OPS-01 | `ZENKAI-OPS-01-daily-recap.json` | Cron 8h | Tick autónomo agency |
| IA-01 | `ZENKAI-IA-01-devtask.json` | `POST /webhook/agency-devtask` | Cola dev FORGE/Cursor |

**Orden de importación:** M-04 → M-03 → M-02 → S-01 (M-03 llama al webhook de M-04).

## Variables n8n (Settings → Variables)

| Variable | Ejemplo |
|----------|---------|
| `AIRTABLE_BASE_VENTAS` | `appXXXXXXXX` |
| `AIRTABLE_TOKEN` | `pat...` (PAT Airtable) |
| `RESEND_API_KEY` | `re_...` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `ZENKAI_FROM_EMAIL` | `ZENKAI <hola@zenkai.systems>` |
| `ZENKAI_ALERT_EMAIL` | `hola@zenkai.systems` |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/...` (opcional) |
| `N8N_JARVIS_CALLBACK_URL` | `https://zenkai-growth-systems.app.n8n.cloud/webhook/jarvis-callback` |

Los exports usan **`$vars.*`**. Al importar con MCP, `import-via-mcp.ts` **inyecta literales desde `.env`** (n8n Cloud no expone REST `/api/v1/variables` en este plan).

Alternativa manual: Settings → Variables + `npm run n8n:vars -- --apply` (requiere `N8N_API_KEY`).

## Credenciales (legacy · ya no requeridas en Sprint 1 env-based)

| Nombre sugerido | Tipo | Uso |
|-----------------|------|-----|
| ~~Airtable PAT~~ | — | Reemplazado por `$vars.AIRTABLE_TOKEN` |
| ~~Resend API Bearer~~ | — | Reemplazado por `$vars.RESEND_API_KEY` |
| ~~Anthropic API Key~~ | — | Reemplazado por `$vars.ANTHROPIC_API_KEY` |

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
