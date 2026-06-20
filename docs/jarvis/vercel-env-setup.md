# JARVIS · Variables de entorno en Vercel (zenkaibrain)

Proyecto: **zenkaibrain** · dominio `panel.zenkai.systems` · runtime `/api/jarvis/*`

Guía para completar variables que el Command Center necesita en producción. **No commitear tokens** — solo configurarlos en el dashboard de Vercel.

---

## Estado verificado (2026-06-20)

| Variable | Producción | Notas |
|----------|------------|-------|
| `AIRTABLE_TOKEN` | ✅ | CRM + finanzas live |
| `ZENKAI_API_KEY` | ✅ | Auth orquestador / speak |
| `ELEVENLABS_API_KEY` | ✅ | TTS `/api/jarvis/speak` |
| `ELEVENLABS_JARVIS_VOICE_ID` | ✅ | Voz JARVIS-ZENKAI |
| `ELEVENLABS_MODEL_ID` | ✅ | Default `eleven_multilingual_v2` |
| `ANTHROPIC_API_KEY` | ✅ | Orquestador (si aplica) |
| `RESEND_API_KEY` | ✅ | Email propuestas |
| `META_ACCESS_TOKEN` | ❌ | Pendiente · ver abajo |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | ❌ | Pendiente |
| `META_AD_ACCOUNT_ID` | ❌ | Pendiente |

Referencia local sin secretos: `.env.example` (raíz) y `docs/jarvis/live-api.md`.

---

## 1 · Voz ElevenLabs (ya configurada)

El código lee la voz en este orden:

1. `ELEVENLABS_JARVIS_VOICE_ID` ← **preferido en zenkaibrain**
2. `ELEVENLABS_VOICE_ID` ← compatibilidad web/legacy
3. Default hardcoded `FqHzPCWiAfnd8t6A5LN4` (JARVIS-ZENKAI)

Implementación: `scripts/jarvis/elevenlabs-speak.ts` · endpoint `POST /api/jarvis/speak`.

**Smoke test** (requiere `ZENKAI_API_KEY` + origen permitido):

```bash
curl -s -X POST "https://panel.zenkai.systems/api/jarvis/speak" \
  -H "Origin: https://panel.zenkai.systems" \
  -H "Authorization: Bearer $ZENKAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Sistemas en línea."}' \
  -o /tmp/jarvis.mp3 -w "%{http_code}\n"
```

Respuesta esperada: HTTP 200 · header `X-Jarvis-TTS: elevenlabs` · archivo MP3.

---

## 2 · Meta · Instagram + Ads (pendiente manual)

Sin estas variables, el dashboard social muestra placeholders y `/api/jarvis/social` responde `source: "mock"`.

Código: `scripts/meta/jarvis-social.ts` · KPIs ROAS / Engagement IG en panel JARVIS.

### Variables requeridas

| Variable | Ejemplo | Dónde obtenerla |
|----------|---------|-----------------|
| `META_ACCESS_TOKEN` | `EAAG...` | Meta Business Suite → System User o App con permisos `instagram_basic`, `instagram_manage_insights`, `ads_read` |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | `178414...` | Graph API Explorer: `GET /me/accounts` → Instagram Business Account ID |
| `META_AD_ACCOUNT_ID` | `act_123456789` | Ads Manager → Configuración de cuenta → ID (prefijo `act_`) |

**Fallback:** si no hay `META_ACCESS_TOKEN`, el runtime intenta `WHATSAPP_ACCESS_TOKEN` (mismo ecosistema Meta). Solo sirve si ese token tiene scopes de Graph para IG/Ads.

### Paso a paso en Vercel

1. Abrir [Vercel Dashboard](https://vercel.com) → Team **mrhaxel26-sketchs-projects** → proyecto **zenkaibrain**
2. **Settings** → **Environment Variables** → **Add new**
3. Agregar cada variable:

```
Name:  META_ACCESS_TOKEN
Value: (token largo EAAG… — copiar desde Meta)
Environments: Production + Preview (opcional Development)
```

Repetir para `INSTAGRAM_BUSINESS_ACCOUNT_ID` y `META_AD_ACCOUNT_ID`.

4. **Redeploy** producción (Deployments → último deploy → Redeploy) para que las funciones lean las nuevas vars.

### Paso a paso en Meta (resumen)

1. [developers.facebook.com](https://developers.facebook.com) → App de negocio ZENKAI
2. Agregar productos: **Instagram Graph API**, **Marketing API** (si aplica Ads)
3. Generar **System User Token** de larga duración con permisos:
   - `instagram_basic`
   - `instagram_manage_insights`
   - `ads_read` (solo si usas ROAS)
4. Vincular Instagram Business a la página de Facebook de ZENKAI
5. Copiar IDs — **nunca** pegarlos en el repo ni en commits

Documentación relacionada: `conexiones/conexiones-whatsapp.md` (mismo Business Manager) · permisos Graph en [Meta docs](https://developers.facebook.com/docs/instagram-api).

### Smoke test social

```bash
curl -sH "Origin: https://panel.zenkai.systems" \
  https://panel.zenkai.systems/api/jarvis/social | jq .source
```

Esperado tras configurar tokens: `"live"` con bloques `instagram` y/o `metaAds`.

---

## 3 · CLI alternativa (opcional)

Desde la raíz del repo (con Vercel CLI autenticado como HaxelGG):

```bash
vercel env add META_ACCESS_TOKEN production
vercel env add INSTAGRAM_BUSINESS_ACCOUNT_ID production
vercel env add META_AD_ACCOUNT_ID production
```

Listar vars (solo nombres, no valores):

```bash
vercel env ls
```

Pull local para dev (**gitignored**):

```bash
vercel env pull .env.vercel.local
```

---

## Seguridad

- Rotar tokens si se exponen en logs o chats
- Usar tokens de **System User** en producción, no tokens personales de corta vida
- Mantener **Vercel Deployment Protection** activo en producción
- Los endpoints `/api/jarvis/*` validan `Origin`/`Referer` del panel

---

ZENKAI Growth Systems · JARVIS Command Center · FORGE + NEXUS
