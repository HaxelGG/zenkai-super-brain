# Agency Jobs · HITL (Human-in-the-loop)

Cola de automatizaciones con aprobación explícita antes de publicar o enviar.

## Flujo · ejemplo Juana Sánchez

```
"Jarvis, súbeme 10 publicaciones al Instagram de Juana Sánchez sobre la primera comunión"
        ↓
intent-router → CONTENT_BATCH (count=10, client=juana-sanchez)
        ↓
content-batch pipeline → MUSE genera copies + image_prompt
        ↓
APOLLO → imágenes (Higgsfield editorial · Gemini Imagen fallback)
        ↓
Airtable Jobs (status: pending_approval) + ContentCalendar drafts
        ↓
JARVIS HUD · /jarvis/jobs · grid preview
        ↓
Fundador: Aprobar | Rechazar | Generar imágenes
        ↓
POST /api/agency/jobs { action: "approve", jobId }
        ↓
Meta Graph publish (solo si image_url HTTPS)
```

## Proveedores de imagen (APOLLO)

| Proveedor | Env | Uso |
|-----------|-----|-----|
| **Higgsfield** | `HIGGSFIELD_API_KEY=KEY_ID:KEY_SECRET` | Editorial · Seedream · URL pública lista para Meta |
| **Gemini Imagen** | `GEMINI_API_KEY` | Fallback · `imagen-3.0-generate-002` |
| Selector | `APOLLO_IMAGE_PROVIDER=auto\|higgsfield\|gemini` | auto = Higgsfield → Gemini |

En Vercel, por timeout, se generan **3 imágenes** por batch por defecto. Resto vía botón «Generar imágenes» en HUD o `APOLLO_IMAGE_BATCH_LIMIT=10` en local/Windmill.

## Setup Airtable

```bash
npm run jarvis:setup-jobs          # audit
npm run jarvis:setup-jobs -- --apply
```

## API

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/api/agency/jobs` | Jobs `pending_approval` |
| GET | `/api/agency/jobs?id=recXXX` | Un job + artifacts |
| POST | `/api/agency/jobs` | `{ "action": "approve", "jobId": "rec..." }` |
| POST | `/api/agency/jobs` | `{ "action": "reject", "jobId": "rec...", "reason": "..." }` |
| POST | `/api/agency/jobs` | `{ "action": "generate_images", "jobId": "rec...", "limit": 10 }` |
| POST | `/api/agency/jobs` | `{ "action": "update_post", "jobId", "index", "patch": { "caption": "..." } }` |

Auth: Bearer `ZENKAI_API_KEY` o origen dashboard (panel/jarvis).

## UI JARVIS

- Ruta: **`/jarvis/jobs`** (sidebar · Jobs HITL)
- Query: `?job=recXXX` abre job directo
- Requiere `ZENKAI_API_KEY` en consola de voz (⋯) para POST

## Windmill

| Script | Uso |
|--------|-----|
| `f/zenkai/content_batch_publish.ts` | Approve + publish |
| `f/zenkai/content_batch_images.ts` | Generar imágenes restantes |

Push: `npm run wmill:push`

## Clasificador operativo

Archivo: `scripts/agency/intent-router.ts`

## Clientes registrados

`scripts/agency/clients.ts` · alias `juana sanchez` → `juana-sanchez`

## Obsidian

Documentar SOP: `[[Jobs HITL]]` → `[[MUSE]]` → `[[APOLLO]]` → `[[Juana Sanchez]]`.
