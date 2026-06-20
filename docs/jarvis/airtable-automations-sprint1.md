# Airtable Automations · Sprint 1

Base: **VENTAS** (`AIRTABLE_BASE_VENTAS`)

## 1. M-02 · Demo con email → auto-reply

1. Airtable → **Automations** → Create automation
2. **Trigger:** When record created → Table `demos`
3. **Condition:** `email_capturado` is not empty AND `autoreply_sent` is unchecked
4. **Action:** Send webhook
   - **URL:** `https://zenkai-growth-systems.app.n8n.cloud/webhook/demo-autoreply`
   - **Method:** POST
   - **Body (JSON):**

```json
{
  "record_id": "{{record.id}}",
  "email": "{{email_capturado}}",
  "sector": "{{sector_detectado}}"
}
```

5. **Turn on** automation

## 2. M-03 · Lead nuevo → cualificación HERMES

1. **Trigger:** When record created → Table `Leads` (nombre exacto)
2. **Action:** Send webhook
   - **URL:** `https://zenkai-growth-systems.app.n8n.cloud/webhook/leads-qualify`
   - **Method:** POST
   - **Body:**

```json
{
  "record_id": "{{record.id}}"
}
```

3. **Turn on** automation

## Smoke test manual (sin esperar Airtable)

```powershell
# M-02
Invoke-WebRequest -Uri "https://zenkai-growth-systems.app.n8n.cloud/webhook/demo-autoreply" `
  -Method POST -ContentType "application/json" `
  -Body '{"record_id":"recXXX","email":"test@example.com","sector":"salud"}'

# M-03
Invoke-WebRequest -Uri "https://zenkai-growth-systems.app.n8n.cloud/webhook/leads-qualify" `
  -Method POST -ContentType "application/json" `
  -Body '{"record_id":"recYYY"}'
```

Reemplazar `recXXX` / `recYYY` con IDs reales de Airtable VENTAS.

## Notas

- M-02 solo confirma recepción (SLA 4h). La propuesta completa la envía `/api/lead-demo` si hay email.
- M-03 con score ≥ 6 dispara M-04 (`jarvis-callback`) automáticamente.
- Marcar `respondido_at` manualmente en Airtable cuando respondas al lead (S-01 lo usa).
