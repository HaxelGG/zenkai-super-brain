# Flow S-01 · SLA formulario 3h

- **Plataforma:** n8n Cloud
- **Export:** `jarvis/n8n/ZENKAI-S-01-sla-form-3h.json`
- **Estado:** STAGING
- **Owner:** ECHO · ATLAS

## Disparador

Cron cada hora.

## Pasos

1. Buscar `demos` y `leads` sin `respondido_at`, >3h, `sla_alert_sent` false
2. Alerta Slack
3. Marcar `sla_alert_sent` (una sola vez)

## Operación humana

Al responder al lead, marcar `respondido_at` en Airtable.
