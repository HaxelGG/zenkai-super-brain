# Sprint 1 · Automatizaciones comerciales ZENKAI (n8n)

**Fecha:** 2026-06-19  
**Objetivo:** M-02 · M-03 · M-04 · S-01 operativos en n8n Cloud  
**Motor:** n8n Cloud + Anthropic (M-03) + Airtable VENTAS + Resend

---

## 1. Credenciales en n8n Cloud

Settings → Variables:

| Variable | Valor |
|----------|--------|
| `AIRTABLE_BASE_VENTAS` | Base ID VENTAS (`app...`) |
| `ZENKAI_FROM_EMAIL` | `ZENKAI <hola@zenkai.systems>` |
| `ZENKAI_ALERT_EMAIL` | `hola@zenkai.systems` |
| `SLACK_WEBHOOK_URL` | Opcional · alertas fundador |
| `N8N_JARVIS_CALLBACK_URL` | `https://zenkai-growth-systems.app.n8n.cloud/webhook/jarvis-callback` |

Credenciales HTTP:

- **Resend:** `Authorization: Bearer <RESEND_API_KEY>`
- **Anthropic:** header `x-api-key: <ANTHROPIC_API_KEY>` + `anthropic-version: 2023-06-01`

---

## 2. Campos Airtable

Ejecutar checklist:

```bash
npm run jarvis:setup-sprint1
```

Ver detalle: `docs/jarvis/airtable-sprint1-fields.md`

---

## 3. Importar workflows

n8n Cloud → **Import from file** → `jarvis/n8n/`:

1. `ZENKAI-M-04-hot-lead-alert.json`
2. `LEADS-05-qualify-on-create.json`
3. `ZENKAI-M-02-demo-autoreply.json`
4. `ZENKAI-S-01-sla-form-3h.json`

En cada workflow:

- Mapear credenciales Airtable + Resend + Anthropic
- Marcar **Available in MCP**
- **Activate**

Copiar URLs de producción de cada webhook (Test → Production).

---

## 4. Airtable Automations

### M-02 · Demo creado con email

- **Trigger:** Record created in `demos`
- **Condition:** `email_capturado` is not empty AND `autoreply_sent` is unchecked
- **Action:** Webhook POST → URL producción `demo-autoreply`

```json
{
  "record_id": "{{record.id}}",
  "email": "{{email_capturado}}",
  "sector": "{{sector_detectado}}"
}
```

### M-03 · Lead creado

- **Trigger:** Record created in `leads`
- **Action:** Webhook POST → URL producción `leads-qualify`

```json
{
  "record_id": "{{record.id}}"
}
```

---

## 5. Smoke tests

```powershell
# M-02
curl -X POST "https://zenkai-growth-systems.app.n8n.cloud/webhook/demo-autoreply" `
  -H "Content-Type: application/json" `
  -d '{"record_id":"recXXX","email":"test@example.com","sector":"salud"}'

# M-03
curl -X POST "https://zenkai-growth-systems.app.n8n.cloud/webhook/leads-qualify" `
  -H "Content-Type: application/json" `
  -d '{"record_id":"recYYY"}'

# M-04
curl -X POST "https://zenkai-growth-systems.app.n8n.cloud/webhook/jarvis-callback" `
  -H "Content-Type: application/json" `
  -d '{"event":"lead.hot","record_id":"recYYY","score":8,"brief":"CEO clínica Medellín"}'
```

---

## 6. Criterios de done

- [ ] Demo con email → auto-reply Resend + `autoreply_sent` checked
- [ ] Lead nuevo → score + etapa en Airtable vía M-03
- [ ] Score ≥ 6 → alerta Slack/email (M-04)
- [ ] Demo/lead sin respuesta 3h → alerta S-01 (una sola vez)

---

## Notas

- `/api/lead-demo` ya envía propuesta completa si hay email; **M-02** es confirmación de recepción (compromiso SLA 4h).
- WhatsApp comercial sigue **human-in-the-loop** — M-04 solo alerta al fundador.
