# JARVIS · Live API (runtime)

Endpoints serverless en Vercel para refrescar datos sin redeploy del panel estático.

## Endpoints

| Ruta | Qué devuelve | Cache |
|------|--------------|-------|
| `GET /api/jarvis/crm` | Leads + clientes activos desde Airtable | 45s |
| `GET /api/jarvis/social` | Instagram insights + Meta Ads (7d) | 5min |

## Variables requeridas (Vercel · zenkaibrain)

```bash
# CRM
AIRTABLE_TOKEN=pat...

# Social (opcional · degradación a mock)
META_ACCESS_TOKEN=EAAG...
INSTAGRAM_BUSINESS_ACCOUNT_ID=178...
META_AD_ACCOUNT_ID=act_...
```

`WHATSAPP_ACCESS_TOKEN` se usa como fallback si no hay `META_ACCESS_TOKEN`.

## Cliente

`panel/public/jarvis-live.js` se carga en `JarvisLayout`:

- Actualiza badge LIVE/MOCK al cargar
- Refresca KPIs con `data-jv-live` y `data-jv-social`
- Reemplaza tabla pipeline (`#jv-pipeline-leads`) con leads live
- Poll: CRM cada 5 min · Social cada 10 min

## Seguridad

- Solo acepta `Origin`/`Referer` de `jarvis.zenkai.systems` y `panel.zenkai.systems`
- Combinar con **Vercel Deployment Protection** en producción

## Smoke test

```bash
curl -sH "Origin: https://jarvis.zenkai.systems" https://jarvis.zenkai.systems/api/jarvis/crm | jq .source
curl -sH "Origin: https://jarvis.zenkai.systems" https://jarvis.zenkai.systems/api/jarvis/social | jq .source
```
