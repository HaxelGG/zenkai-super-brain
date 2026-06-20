# Flow M-04 · Lead caliente alerta

- **Plataforma:** n8n Cloud
- **Export:** `jarvis/n8n/ZENKAI-M-04-hot-lead-alert.json`
- **Estado:** STAGING
- **Owner:** HERMES · fundador

## Disparador

Webhook `jarvis-callback` — evento `lead.hot` o score ≥ 6.

## Pasos

1. Formatear mensaje con record_id + brief
2. Slack (opcional) + email a `ZENKAI_ALERT_EMAIL`
3. **No envía WhatsApp** — humano responde
