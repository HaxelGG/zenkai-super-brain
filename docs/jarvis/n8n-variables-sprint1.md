# n8n Cloud · Variables Sprint 1

Configurar en **n8n Cloud → Settings → Variables** (una sola vez).

| Variable | Origen | Obligatoria |
|----------|--------|-------------|
| `AIRTABLE_BASE_VENTAS` | `.env` · base ID `app...` | ✅ |
| `AIRTABLE_TOKEN` | `.env` · `AIRTABLE_TOKEN` (PAT) | ✅ |
| `RESEND_API_KEY` | `.env` · `re_...` | ✅ M-02, M-04 |
| `ANTHROPIC_API_KEY` | `.env` · `sk-ant-...` | ✅ M-03 |
| `ZENKAI_FROM_EMAIL` | `ZENKAI <hola@zenkai.systems>` | ✅ |
| `ZENKAI_ALERT_EMAIL` | `hola@zenkai.systems` | ✅ |
| `N8N_JARVIS_CALLBACK_URL` | `https://zenkai-growth-systems.app.n8n.cloud/webhook/jarvis-callback` | ✅ M-03 |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook | Opcional |

Los workflows Sprint 1 **no usan credenciales vault** — leen secrets vía `$env.*`.

## Verificar

```bash
npm run n8n:publish
```

Los 4 workflows deben publicarse sin error de credenciales faltantes.
