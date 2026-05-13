---
name: "Cloudflare Turnstile"
slug: turnstile
servicios_dependientes: [Vercel zenkai-web]
criticidad: alta
estado_conexion: pendiente
fase_conexion: 3
---

# CONEXIONES · CLOUDFLARE TURNSTILE
## Captcha invisible para `/api/lead-demo` y formularios públicos

**Owner:** FORGE · NEXUS
**Plan recomendado:** Free (ilimitado para uso comercial · Cloudflare absorbe el costo)
**Reemplaza:** reCAPTCHA v3 (Google) — Turnstile es privacy-friendly, no rastrea visitantes, y no requiere checkbox visible.

---

## POR QUÉ LO NECESITAMOS

`/api/lead-demo` (landing zenkai.systems) genera propuestas vía Sonnet 4.6. Cada call cuesta ~$0.025-0.08 USD según prompt cache. Sin captcha, un bot puede dispararlo en bucle y vaciar créditos en horas.

Capas de defensa actuales del endpoint:
1. ✅ **Rate limit Upstash** — 5/IP/h sliding window (activo · verificado 2026-05-13)
2. ⏸️ **Turnstile** — bloquea bots antes de llegar al modelo (pendiente · este doc)
3. ✅ **Validación Zod** — texto 80-600 chars, schema estricto (activo)
4. ✅ **IP hash SHA256** — IP nunca en claro en Airtable (activo)

Sin Turnstile, un atacante puede rotar IPs (proxy chains, residential IPs) y sortear el rate limit. Turnstile usa heurísticas de Cloudflare (TLS fingerprint, browser challenges) que un bot estándar no pasa.

---

## ⚠️ ORDEN CRÍTICO DE EJECUCIÓN

**NO activar `TURNSTILE_SECRET_KEY` en Vercel antes de integrar el widget en frontend.**

`DemoSection.astro` actualmente NO incluye Turnstile (verificado 2026-05-13 · `grep turnstile` da 0 matches). Si configuras `TURNSTILE_SECRET_KEY` ahora, cada submit del demo va a fallar con HTTP 403 `captcha failed` porque el body no lleva `turnstileToken`.

**Orden correcto:**
1. Sprint de código (paso 5) · integrar widget en `DemoSection.astro` · push a main · Vercel redeploy
2. Verificar en preview que el captcha aparece y un submit sin completarlo es rechazado client-side
3. Crear widget + keys en Cloudflare (pasos 1-2 de abajo)
4. Setear ENV vars en Vercel (paso 3 de abajo)
5. Redeploy (paso 4)
6. Smoke test con curl sin token → 403 esperado (paso 6)

Si necesitas activar las defensas YA y no podés esperar el sprint de código: configurar solo `TURNSTILE_SITE_KEY` (no la SECRET) — el endpoint queda no-op pero el dominio queda reservado en Cloudflare para cuando se integre.

---

## SETUP PASO A PASO (15 min)

### 1 · Crear cuenta Cloudflare (si no existe)

- URL: `https://dash.cloudflare.com/sign-up`
- Email: `hola@zenkai.systems`
- Plan: Free

### 2 · Crear widget Turnstile

1. Dashboard Cloudflare → menú izquierdo → `Turnstile`
2. Click `Add site`
3. Configuración del widget:
   - **Site name:** `zenkai-web-prod`
   - **Domain:** `zenkai.systems` + `zenkai-web-rho.vercel.app` (agregar ambos · separados por línea o coma según UI)
   - **Widget Mode:** `Managed` (default · Cloudflare decide invisible vs challenge según contexto)
   - **Pre-clearance for this site:** OFF
4. Click `Create`

Cloudflare muestra:
- **Site Key** (público · va en el frontend) — empieza con `0x4AAAAAAA...`
- **Secret Key** (server · NUNCA exponer) — empieza con `0x4AAAAAAA...`

### 3 · Copiar las keys a Vercel `zenkai-web`

```
Dashboard Vercel → Projects → zenkai-web → Settings → Environment Variables → Add new
```

Agregar 2 variables (Environment: **Production + Preview + Development**):

| Variable | Valor |
|----------|-------|
| `TURNSTILE_SITE_KEY` | (Site Key del paso 2) |
| `TURNSTILE_SECRET_KEY` | (Secret Key del paso 2) |

⚠️ `TURNSTILE_SITE_KEY` es el público — el frontend lo necesita. Sin exponerlo como `PUBLIC_*` Astro NO lo inyecta al cliente. **Renombrar a `PUBLIC_TURNSTILE_SITE_KEY` si el componente del frontend lo necesita** (verificar `web/src/components/landing/DemoSection.astro`).

### 4 · Trigger redeploy en Vercel

Vercel detecta env vars nuevas pero **NO redeploya automáticamente**. Forzar:

```
Vercel UI → Deployments → último deploy → ... menu → Redeploy → "Use existing Build Cache" OFF
```

O push un commit dummy:
```bash
git commit --allow-empty -m "trigger: redeploy post-turnstile env vars"
git push origin main
```

### 5 · Integrar widget en frontend

⚠️ **TODO de código pendiente:** el endpoint `/api/lead-demo` ya valida el token (`web/src/lib/turnstile.ts`), pero el frontend (`DemoSection.astro`) actualmente NO inserta el widget ni envía `turnstileToken` en el body. Hay que:

1. Cargar script de Turnstile en `DemoSection.astro`:
   ```html
   <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
   ```
2. Renderizar el widget arriba del botón submit:
   ```html
   <div class="cf-turnstile" data-sitekey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY}></div>
   ```
3. En el handler del submit, leer el token y agregarlo al body:
   ```js
   const token = document.querySelector('[name="cf-turnstile-response"]')?.value;
   fetch('/api/lead-demo', { body: JSON.stringify({ texto, turnstileToken: token }) });
   ```

Estimación de implementación: 20-30 min (dispatch a FORGE-FRONTEND en próxima sesión).

### 6 · Verificación post-setup

```bash
# Debería rechazar request sin token (403 si TURNSTILE_SECRET_KEY está set)
curl -i -X POST "https://zenkai-web-rho.vercel.app/api/lead-demo" \
  -H "Content-Type: application/json" \
  -d '{"texto":"[CLIENTE] Test sin token de captcha porque quiero ver que ahora SI rechaza requests sin captcha valido. Esto debe devolver 403 captcha failed."}'

# Respuesta esperada: 403 {"error":"captcha failed","detail":["missing-input-response"]}
```

Si responde 200, `TURNSTILE_SECRET_KEY` no se configuró bien o el widget no está cargado correctamente.

---

## COSTO

- **Free tier:** ilimitado (Cloudflare absorbe el costo · ningún plan paid de Turnstile existe)
- Único caso pago: si necesitamos **Turnstile Enterprise** para custom challenge UX o multi-account billing — no aplica para ZENKAI hoy.

---

## RIESGOS Y MITIGACIONES

| Riesgo | Mitigación |
|--------|------------|
| Falsos positivos · users legítimos bloqueados | Widget Mode `Managed` deja a Cloudflare decidir · raramente falsos positivos en humanos. Si pasa, mostrar fallback "tener problemas con el captcha? envíanos un email a hola@zenkai.systems" |
| Cloudflare cae · widget no carga · users ven el demo sin submit | `verifyTurnstile()` en `lib/turnstile.ts` ya tiene fallback graceful: si `TURNSTILE_SECRET_KEY` está vacío devuelve `success:true`. Para outage real, hot-toggle env var a vacío y redeploy (degrada gracefully a "sin captcha" durante el outage) |
| Token de captcha reutilizado por bot | Cloudflare expira tokens en ~5 min. Después de cada submit exitoso, llamar `turnstile.reset()` para forzar nuevo challenge |

---

## REFERENCIAS

- Docs Cloudflare Turnstile: https://developers.cloudflare.com/turnstile/
- Endpoint de verificación server: `https://challenges.cloudflare.com/turnstile/v0/siteverify`
- Lib local: `web/src/lib/turnstile.ts`
- Endpoint que lo consume: `web/src/pages/api/lead-demo.ts`
