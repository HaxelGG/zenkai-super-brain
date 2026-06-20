# JARVIS · n8n automations

Motor de automatización oficial de ZENKAI (junto con Make). JARVIS no reemplaza n8n — lo orquesta vía webhooks y Airtable.

## Instancia

| Campo | Valor |
|-------|--------|
| Cloud | `https://zenkai-growth-systems.app.n8n.cloud` |
| MCP (Cursor) | Configurado en `.cursor/mcp.json` → servidor `n8n-mcp` |

Si el MCP de n8n falla en Cursor, revisa **Settings → MCP → n8n-mcp** y regenera el token en n8n Cloud.

## Flujos esperados (Capa 1)

| Workflow | Trigger | Destino |
|----------|---------|---------|
| Lead web → CRM | Webhook / form | Airtable VENTAS |
| Cualificación HERMES | Airtable / webhook | Actualiza etapa lead |
| Reporte semanal | Cron (lunes) | Email + Airtable |
| Aprobación WhatsApp | JARVIS `/api/jarvis/approve` | **Human-in-the-loop** — nunca auto-envía |

Referencia de diseño: `workflows/workflow-reporte-semanal.md`, `conexiones/conexiones-make.md`.

## Integración con JARVIS HUD

- **CRM / finanzas:** Airtable (build + runtime `/api/jarvis/crm`, `/api/jarvis/finance`)
- **Social:** Meta Graph (`/api/jarvis/social`) — independiente de n8n
- **Runs / voz:** `/api/jarvis/run`, `/api/jarvis/runs`, `/api/jarvis/speak` en zenkaibrain

Los webhooks de n8n deben apuntar a:

- `https://panel.zenkai.systems/api/...` (orquestador)
- Bases Airtable documentadas en `.env.example`

## Self-host (Premium)

Ver `infra/n8n/docker-compose.yml` y `infra/n8n/.env.example` para despliegue local o VPS.

## Checklist operativo

1. [ ] Workflows activos en n8n Cloud (no solo draft)
2. [ ] Credenciales Airtable + Anthropic en n8n (no duplicar en repo)
3. [ ] Webhooks de producción usan HTTPS y tokens de verificación
4. [ ] Flujos de envío WA / propuesta / cobro tienen paso de aprobación humana
5. [ ] MCP n8n conectado en Cursor para auditar desde el IDE
