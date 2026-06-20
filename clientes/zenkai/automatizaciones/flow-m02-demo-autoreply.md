# Flow M-02 · Demo auto-reply (Resend)

- **Plataforma:** n8n Cloud
- **Export:** `jarvis/n8n/ZENKAI-M-02-demo-autoreply.json`
- **Estado:** STAGING
- **Owner:** ARES · ECHO

## Disparador

Airtable automation → webhook `demo-autoreply` cuando se crea record en `demos` con `email_capturado`.

## Pasos

1. Webhook recibe `{ record_id, email, sector }`
2. Si hay email y `autoreply_sent` false → Resend auto-reply (SLA 4h hábiles)
3. Marca `autoreply_sent` en Airtable
4. Responde 200

## Variables

- `RESEND_API_KEY` (credencial HTTP Bearer)
- `ZENKAI_FROM_EMAIL`

## Test

Webhook POST manual con email de prueba.
