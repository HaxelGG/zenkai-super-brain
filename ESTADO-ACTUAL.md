# ESTADO ACTUAL · ZENKAI Super Cerebro
## Punto de continuación entre sesiones de Claude Code

**Última sesión cerrada:** 2026-05-13 · Sprints 1+2+2.5+3 DEPLOYED · landing comercial v3.3 live · demo end-to-end cableado a `/api/lead-demo` con persistencia Airtable · **smoke test producción verde 2026-05-13 06:58 UTC**
**Modo recomendado para continuar:** `claude --dangerously-skip-permissions` desde `C:\Users\jordy\Desktop\Kenzai Super Brain\`

---

## ✅ SMOKE TEST PRODUCCIÓN 2026-05-13

Verificación end-to-end del pipeline público en `zenkai-web-rho.vercel.app`:

| Check | Resultado |
|-------|-----------|
| HTTP status `/api/lead-demo` | 200 OK (sin auth · es endpoint público) |
| Latencia primera call | ~13s (cache miss) |
| Latencia segunda call | ~8s (cache parcial · prompt cache de system prompt común) |
| Header `x-airtable-record-id` | `recqgahRfwCSZZMhn` (presente) |
| Record visible en Airtable VENTAS / demos | ✅ todos los campos OK |
| `sector_detectado` (clínica dental Medellín) | `salud` ✓ |
| `sector_detectado` (restaurante Bogotá Rappi) | `restaurante` ✓ |
| `tier_recomendado` ($500-1500 USD budget) | `Starter` ✓ |
| `created_at` manual ISO | `2026-05-13T06:58:48.741Z` (no createdTime auto) ✓ |
| `ip_hash` | SHA256 64-char hex · IP NO en claro ✓ |
| Rate limit Upstash | ✅ **ACTIVO** · sliding window decrementa 5→4→3 entre calls (`bypassed:false`) |
| Captcha Turnstile | ⚠️ no-op · acepta requests sin token (TURNSTILE_SECRET_KEY pendiente) |
| Email Resend | sin probar (requiere campo opcional `email` en input) |

**Hallazgo importante:** Upstash Redis YA está configurado en Vercel `zenkai-web` (contrariamente a lo que decía ESTADO-ACTUAL pre-update). Solo faltan **Turnstile** (captcha) y **Resend** (email opcional) para defensas 100%.

---

## 🚧 EN CURSO · LANDING PÚBLICA zenkai.systems

- **Spec original:** `docs/specs/2026-05-05-landing-zenkai-design.md` (commit `c87e538`)
- **Spec Fase 2 (visual):** `docs/specs/2026-05-11-fase2-landing-visual-design.md` · transformación placeholder → landing comercial que convierte
- **Plan:** `docs/plans/2026-05-10-landing-zenkai-implementation.md` v1.3 · copy validado + 8 sectores + problema/CTA final · commit `fbc7ccf`
- **LIVE:** `https://zenkai-web-rho.vercel.app` desde 2026-05-10 · landing comercial v3.3 funcional con demo cableado end-to-end
- **Estado por fase:**
  - ✅ Fase 0 · scaffolding `web/` + Vercel project `zenkai-web` (Tareas 0.1-0.2)
  - ✅ Fase 1 (Tareas 1.1-1.3) · design tokens + content collections + index inicial (commits `4249ced` `8a75321` `c30a275`)
  - ⏸️ Tarea 1.4 · helper de env tipado · **superseded** por validación inline en `lib/proposal.ts` + middleware · sigue siendo nice-to-have (45 min) pero no bloquea
  - ✅ **Sprint 1 foundation** (commit `edf8c11`) · backend `POST /api/protocolo` server-side Sonnet 4.6 + Zod input/output · tokens zk-* completos · `global.css` con 15 keyframes + mesh-bg + glass · logos astro:assets WebP · NavBar v3.2 con currency toggle USD/COP/EUR/MXN · 7/7 tests vitest
  - ✅ **Sprint 2** (commit `2e2ff47`) · 11 componentes landing en orden visual final · HeroDemo · Proyeccion90Dias · StatsReales · ComoFunciona · DiagramaNeural (12 nodos + 24 líneas SVG + parallax 3D) · Comparativa · Sectores · Planes (5 tiers) · VentajasTecnicas · FAQ · CTAFinal · Footer
  - ✅ **Sprint 2.5 (v3.3 hero ventas)** (commit `129f7db`) · headline orientado a ventas + trust mini-bar + stats comerciales en hero · sección 'El problema' como contraste positivo · DiagramaNeural v4 cinematográfico (bloom + Bezier) · sticky CTA bar 50% off · demo movido a sección 5 (no bloquea visitantes nuevos)
  - ✅ **Sprint 3 demo end-to-end** (commit `a09d8c8`) · `POST /api/lead-demo` operativo · validación Zod + captcha Turnstile (no-op si missing) + rate limit Upstash 5/IP/h (no-op si missing) + persistencia Airtable best-effort + email Resend opcional · DemoSection cableado con 3 estados (input→loading 8s→propuesta) · 23/23 tests vitest verdes · dual auth header (x-zenkai-key O Bearer) · CVE mitigada vía middleware
  - ✅ **Post-Sprint 3 hardening** · tabla `demos` creada en Airtable VENTAS (commit `40bbbc9`) · cleanup branches mergeados (commit `d160a87`) · wordmark Orbitron en lugar de logo image (commit `435bb6e`) · /privacy creada con política mínima legal (commit `2d11213`) · fixes QA Sprint 4 (5 commits `267072c` `099628a` `56f365d` `3556837` `5f06204`): footer hrefs reales · Pro/Enterprise CTAs a Cal.com · FAQ moneda copy alineado con behavior real · hamburger menu mobile <lg con overlay · pre-fill textarea demo con template por sector
- **Project Vercel:** `zenkai-web` (`prj_Ct9A96VniiBmECzUTeaNgTGFuSr7` · team `mrhaxel26-sketchs-projects`)
- **Domain swap en Fase 5:** panel actual → `panel.zenkai.systems` · landing `zenkai-web` → apex `zenkai.systems` · panel sigue vivo, NO se elimina (orquestación en Tarea 5.3-pre)
- **CVE `GHSA-mr6q-rp88-fx84`:** ✅ **mitigada** en `web/src/middleware.ts` (filtra headers `x-astro-path` / `x_astro_path` en /api/* · 5 tests cubriéndolo) · doc original en `docs/security/2026-05-10-cve-astrojs-vercel-x-astro-path.md`
- **Email comercial activo:** `hola@zenkai.systems` (Hostinger Starter Business · Resend dominio verified · Receiving OFF)
- **Nota técnica · fix crítico Vercel:** commit `d006b2e` agregó `web/vercel.json` propio para no heredar el `vercel.json` raíz panel-specific (que define `functions: api/*.ts` + `buildCommand: cd panel && npm run build`). Sin este fix, builds de `zenkai-web` fallan con "The pattern 'api/*.ts' defined in 'functions' doesn't match any Serverless Functions inside the 'api' directory" porque Vercel hereda el config del repo padre aún con Root Directory = `web`. Override mínimo (`{"$schema": "..."}`) rompe la herencia y deja que Astro auto-detect maneje el build.
- **TODO técnico (sectores):** sector hogar tiene `agentes_prioritarios` inferidos en `web/src/content/sectores/hogar.md`. Cuando se cree `sectores/hogar.md` raíz (Fase 2 o primer cliente del sector), sincronizar agentes y campos modulares.

---

## ⏸️ DEUDA TÉCNICA pendiente (próxima sesión)

- **Vercel · Root Directory de proyecto `zenkaibrain`:** actualmente la raíz del repo está configurada como root del project del panel (legado de cuando los endpoints `/api/*` se servían desde la raíz). Resultado: cualquier push a `main` rebuilds tanto `zenkai-web` (correcto · Root Directory = `web`) como `zenkaibrain` (innecesario si solo tocamos `web/` o `docs/`). Acción: cambiar Root Directory de `zenkaibrain` a `panel` en Vercel UI → Settings → General. Cuidado: hay que verificar que los handlers `/api/clasificar` y `/api/protocolo` (los del panel, no los nuevos de `web/`) sigan funcionando — si viven en `api/` raíz, hay que moverlos o exponerlos desde `panel/`. Estimación: 30-60 min con smoke test.
- **Tarea 1.4 · helper de env tipado (45 min):** crea `web/src/lib/env.ts` con Zod schemas para server/public env vars. Originalmente cerraba Fase 1 · ahora es nice-to-have (Sprint 3 ya valida inline en cada lib · `proposal.ts` `airtable.ts` `rate-limit.ts` `turnstile.ts` `email.ts`). Bloqueante: ninguno.
- **ENV vars opcionales en Vercel para activar defensas 100%** (estado verificado 2026-05-13 · guías paso-a-paso 2026-05-13):
  - ~~`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`~~ ✅ **YA configuradas** · sliding window 5/IP/h activo en producción
  - ⚠️ `TURNSTILE_SITE_KEY` (público) + `TURNSTILE_SECRET_KEY` (server) → guía completa en `conexiones/conexiones-turnstile.md` v1.0. **🚨 BLOQUEANTE DE CÓDIGO:** el frontend `DemoSection.astro` NO tiene el widget Turnstile integrado (verificado 2026-05-13). Si se setea `TURNSTILE_SECRET_KEY` antes de integrar el widget, todos los demos rompen con HTTP 403. Orden correcto documentado en la guía: sprint frontend (20-30 min) → keys Cloudflare → ENV vars Vercel → redeploy → smoke test
  - ⚠️ `RESEND_API_KEY` → guía completa en `conexiones/conexiones-resend.md` v1.0. Dominio `zenkai.systems` ya está verified en Resend (SPF + DKIM + DMARC OK). Solo falta generar API key y copiarla a Vercel (5 min · sin bloqueante de código)
  - Crítico antes de abrir demo público con tráfico orgánico en zenkai.systems
- **`copy_largo` de 8 sectores aún TODO:** la sesión 2026-05-11 validó preview de 3-4 frases (`copy_corto`) pero no el contenido largo de páginas dedicadas (3-5 párrafos por sector). Bloqueante de páginas `/sectores/<slug>` si se decide construirlas. Acción: el usuario genera con Claude.ai web antes del dispatch.

---

## 📢 COMPROMISOS COMERCIALES PUBLICADOS (deuda operativa)

Estos compromisos están **publicados en el copy de la landing** (`docs/specs/2026-05-11-fase2-copy-validado.md`) y deben cumplirse o documentarse formalmente antes del primer lead que los invoque:

1. **Garantía Lite 30 días** — *"Sin tarjeta. Sin contrato anual. Si en 30 días no te funciona, no nos debés nada."* → política de reembolso a documentar en `LEGAL · templates_legales` ANTES del primer cliente Lite cerrado. **STATUS: ✅ template v1.0 redactado 2026-05-13** en `templates/template-garantia-lite-30-dias.md` (Anexo C del contrato). Define causales objetivas (sitio inaccesible, WA no operativo, form no entrega, Cal.com no agenda, entregable retrasado >5d hábiles), exclusiones (cambio de prioridad, falta de tráfico, demora del cliente >14d en aportar contenido), tabla de reembolso por situación (100%/50%/25%/0% del setup · 100% del fee mensual), procedimiento de solicitud (email `hola@zenkai.systems` con asunto `GARANTÍA 30D — [empresa]`), plazos (acuse 4h hábiles · resolución 5d hábiles · transferencia 10d hábiles), garantía única por cliente (lockout 12 meses), cláusula buena fe contra abuso. ✅ Registrado en Airtable `LEGAL · templates_legales` (record `recx1Owy4MDbDtEsF` · v1.0 · 2026-05-13 · tipo "Otro" · idioma es) · referencia cruzada agregada en `templates/template-contrato-servicios.md` Cláusula 9.1 (excepción para Tier Lite). ⏸️ Solo falta adjuntar PDF del Anexo C al campo `archivo` (opcional · generar con `/make-pdf` cuando se prepare primer cliente Lite).
2. **SLA WhatsApp 30 min (horario laboral CO/ES)** — *"Habla con un fundador real. Respuesta en menos de 30 minutos en horario laboral."* → monitoreo manual (notificación WA Cloud API → app fundador) o alert Slack/Telegram sobre webhook de mensaje entrante. Tracking de SLA en Airtable. **STATUS: pendiente (WA flotante en landing ya enlaza a número real).**
3. **SLA form 4h hábiles** — *"Te respondemos en menos de 4 horas hábiles."* → Resend manda auto-reply inmediato confirmando recepción · respuesta humana real a `hola@zenkai.systems` antes de 4h hábiles. Marcar lead como "respondido" en Airtable VENTAS dentro del SLA. **STATUS: pendiente (form `/api/lead-demo` ya persiste a Airtable VENTAS · falta auto-reply Resend + SOP humano).**
4. **Multi-idioma (es/en/pt) en respuestas** — *"Respondemos en español, inglés y portugués."* → capacidad real vía fundador directo o herramientas de traducción asistida. Landing actualmente es solo español. **STATUS: pendiente.**
5. **Diagnóstico gratis 30 min** — *"Diagnóstico gratis. 30 minutos. Sin compromiso."* → Cal.com slot configurado · agenda real disponible · no rebookeable después del No-show 2× (política a redactar). Bloqueante de pre-launch: Cal.com público activo. **STATUS: Cal.com event `strategy-call` activo (commit `1074a66`) · CTAs Pro/Enterprise/Hero ya apuntan a Cal.com (commit `099628a`) · falta política No-show 2× escrita.**

⚠️ **Acción mínima antes de pre-launch público:** ~~item 1 (política reembolso escrita)~~ ✅ cubierto 2026-05-13. Items 2-4 pueden documentarse vía SOPs internos sin cambio de copy. Item 5 técnicamente OK · falta solo política No-show formal.

---

## DÓNDE ESTAMOS

✅ **PANEL DE CONTROL DESPLEGADO (v1) · LIVE EN PRODUCCIÓN**
- Astro 5 + Tailwind + TypeScript estricto en `panel/`
- 7 páginas visibles · **37 páginas estáticas generadas**
- Frontmatter en los ~55 markdown del repo · validación Zod en build
- 8 content collections: agentes · sectores · workflows · sops · conexiones · finanzas · templates · skills_zenkai
- Cross-references automáticas agentes ↔ sectores ↔ workflows ↔ sops (gate en build via `validateCrossRefs`)
- Diseño "ejecutivo limpio": paleta índigo · Inter Variable · JetBrains Mono Variable
- Responsive (mobile · tablet · desktop) · sticky top nav con menú hamburguesa

✅ **DEPLOYADO EN VERCEL**
- Repo: https://github.com/HaxelGG/zenkai-super-brain
- Team Vercel: `mrhaxel26-sketchs-projects`
- URL producción estable: https://zenkaibrain-git-main-mrhaxel26-sketchs-projects.vercel.app/
- Custom domain: https://zenkai.systems (verificar config auth)
- **Deployment Protection: Vercel Authentication ON** · solo miembros del team pueden acceder
- Auto-deploy: push a `main` → Vercel rebuild + deploy en <1 min

⏸️ **PENDIENTE OPCIONAL**
- Invitar socio como Member del team Vercel (Settings → Members → Invite)
- Verificar acceso de `zenkai.systems` con auth (si sigue dando 403, configurar custom domain en Settings → Domains)

✅ **FASE 1 · CLAUDE API · v0.1 OPERATIVA**
- Clasificador de inputs §7 (Haiku 4.5) · 10/10 tests · commit `48e7d11`
- Protocolo §8 generador (Sonnet 4.6) · 4/4 tests · commit `c8eb1d9`
- CLI: `npm run clasificar` · `npm run protocolo` · `npm run protocolo -- --json`
- Función exportable: `protocolo(input)` desde `scripts/anthropic/protocolo.ts`

✅ **PATH 2 · HTTP ENDPOINTS LIVE EN PRODUCCIÓN**
- `POST /api/clasificar` · Haiku 4.5 · ~3s · ~$0.002/call
- `POST /api/protocolo` · Sonnet 4.6 · ~10-15s · ~$0.08/call
- Ambos aceptan `?render=markdown` para devolver `text/markdown` (en lugar de JSON)
- Auth: `Authorization: Bearer <ZENKAI_API_KEY>` (timing-safe compare)
- Errores: 400 (input) · 401 (auth) · 405 (method) · 500 (LLM)
- vercel.json en raíz · Vercel root cambiado de `panel/` a raíz del repo
- Vercel Authentication: **DISABLED** (panel ahora público; API protegida por Bearer)
- Commits: `c05e4eb` (código) + `42af759` (trigger redeploy env vars)

✅ **PATH 3 · SANDBOX UI LIVE EN PRODUCCIÓN**
- `https://zenkaibrain-git-main-mrhaxel26-sketchs-projects.vercel.app/sandbox`
- Form interno: API key (localStorage del browser, no toca server) · radio endpoint · textarea input
- Llama a `?render=markdown` y renderiza con `marked.js` (CDN · sin nuevas deps)
- Loading state con timer · status HTTP + tiempo + size · errores muestran JSON del handler
- Commit: `6c8ee44`

✅ **PROMPT CACHING ACTIVO** (2026-05-04)
- `buildSystemPrompt()` devuelve 3 bloques: STATIC + stacks (cached) + sector (volátil)
- `cache_control: ephemeral` en los 2 estáticos · 6998 tokens cacheados constantes
- Costo per call medido: **$0.025 en cache hit · $0.08 en cache write**
- Test runner reporta cache stats + costo por corrida
- Ahorro real medido: 60% en corridas con sectores variados dentro de la ventana de 5 min

✅ **RENDER PROPUESTA-READY** (commit `c498611`)
- `renderPropuesta(result)` paralela a `render()` debug-friendly · sin jargon interno
- Schema extendido: `nombre_empresa_inferido` se infiere del input
- Rangos de precio (piso = precio_USD · techo = +20%) en lugar de exacto
- Sandbox: toggle "Modo: Debug | Propuesta" (localStorage · default Debug)
- API: `?render=propuesta` además de `?render=markdown`

✅ **CASO TEST ECO + DETECCIÓN BIAS** (commit pendiente)
- Caso 5 en `test-protocolo.ts`: consultora unipersonal Bogotá $300 USD presupuesto
- Resultado: tier=ECO N1 celda=A · ruta_recomendada=A ✓
- **El modelo NO tiene bias hacia PRO** — diagnostica ECO correctamente cuando el budget lo justifica
- TestCase ahora soporta `expected.tier` y `expected.ruta_recomendada` para futuros casos
- Assertions de costo flexibilizadas: `costo_operativo_mensual_USD >= 0` (era `> 0`) — $0/mes es legítimo en ECO con free tiers

⏸️ **HARDENING DEL CLASIFICADOR · INTENTADO 2026-05-04 · NO MOVIÓ AGUJA**
Probé refinar el prompt del clasificador (2 ejemplos extra + sección "REVISIÓN FINAL" forzando self-check). 5 corridas dieron 8/9/8/8/10 (avg 8.6/10) vs baseline 7-10/10 sin cambios — sin mejora medible.

Diagnóstico: Haiku 4.5 con `json_schema` tiene un bug estructural — el razonamiento puede ser correcto ("celda D✗ inviable", "patrón CONSULTA puro") pero el campo `tipo` se llena con otro enum. Prompt engineering no lo resuelve.

Decisión: **aceptar 85-90% rate en path inferido**. Razones:
- Inputs reales suelen llevar tag explícito → extractTag() en código garantiza 100%
- Path inferido afecta sólo casos exploratorios (sandbox)
- Cases #8 (CONSULTA Make) y #9 (ESCALADA budget) son los flakers persistentes — edge cases honestos

Si en uso real cae mucho en path inferido, escalar a Sonnet 4.6 para el classifier (10× costo · ~$0.02/call · viola CLAUDE.md §1 pero justificable por accuracy). Documentado pero NO ejecutado.

✅ **FASE 2 v0.1 · PERSISTENCIA EN AIRTABLE** (commits `14a949b` `211224f`)
- Base **ZENKAI · VENTAS** (`appmiicsbFsvRfxQ9`) · tabla `propuestas` (14 campos)
- `POST /api/protocolo?persist=true` guarda el ProtocoloResult automáticamente
- Header `X-Airtable-Record-Id` en respuesta · `X-Airtable-Error` si falla
- Non-blocking: si Airtable falla, responde 200 con la propuesta intacta + header de error
- Sandbox: checkbox "Persistir en Airtable" (localStorage · default OFF)
- Stack: SDK oficial `airtable` 0.12 · auth con `AIRTABLE_TOKEN` (Personal Access Token)

✅ **FASE 2.1 · LINKAGE LEADS ↔ PROPUESTAS** (commit `12e2385`)
- Campo `lead` (Link to record · single) en tabla `propuestas` · auto-creado inverso en `Leads`
- API: `POST /api/protocolo?persist=true&lead_id=recXXX` linkea automático
- Filtro defensivo: solo IDs que empiecen con "rec" se aceptan (evita basura del cliente)
- Header `X-Airtable-Linked-Lead` cuando el link se aplicó
- Sandbox UI: campo opcional "Link a Lead" visible solo cuando persist=true
- Backward compatible: sin `lead_id` la propuesta se persiste normal (sin link)

✅ **FASE 2.2 · SCAFFOLDING MULTI-BASE** (commit `e9db55e`)
- `client.ts` refactor: tipos `InternalBaseName` (7) + `SectorBaseName` (6 hechas, 5 pendientes) + helper genérico `getBase(name)`
- Helper bonus `sectorToBaseName(sector)` mapea output del clasificador → base template (ej. "restaurantes" → "FOOD")
- 6 sector bases creadas (Salud, Food, Ecommerce, Servicios, Educación, Inmobiliaria)

✅ **FASE 2.2 ALCANCE A · LEGAL + FINANZAS + INMOBILIARIA** (2026-05-05)
- **LEGAL** creada (`appy9s8qJ9TP98HYS`) · 2 tablas: `contratos` (tipo NDA/MSA/SOW/SA · status borrador→firmado→expirado · valor_USD · documento attachments) + `templates_legales` (idioma es/en · version · archivo)
- **FINANZAS** creada (`appyZf10t2OmfJvrp`) · 2 tablas: `gastos` (categoria AI APIs/Hosting/SaaS · proveedor enum Anthropic/Vercel/Airtable/etc · monto USD+COP · frecuencia · factura) + `ingresos` (cliente · monto · status cotizado→facturado→cobrado→perdido · metodo_pago Wompi/Stripe/PayU)
- **INMOBILIARIA** conectada (`appjyT85koBY6odNk` · ya existía en Airtable, sólo faltaba env var) · cierra el bug latente del SECTOR_BASE_NAMES
- 9/9 bases resuelven OK en smoke test de `getBase()`
- Pendiente JIT (4 internas): OPERACIONES (primer cliente) · MARKETING (ARES en prod) · SOPORTE (ECHO en prod) · EQUIPO (>2 personas)
- Pendiente sector (5): manufactura · retail · startups · gobierno · ong
- ⚠️ **TODO usuario:** agregar `AIRTABLE_BASE_LEGAL`, `AIRTABLE_BASE_FINANZAS`, `AIRTABLE_BASE_INMOBILIARIA` en Vercel env vars (Project Settings → Environment Variables) si llega a usarlas algún endpoint en producción. Hoy no hay endpoint que las consuma, así que es opcional hasta que se necesite.

✅ **FINANZAS · BASELINE OPERATIVO SEMBRADO** (2026-05-05)
- 8 records en `FINANZAS · gastos`: Vercel Hobby · Airtable Free · GitHub Free · Make Free · Anthropic API (placeholder) · **Claude Max $100** · **Framer Basic $15** · **Dominio zenkai.systems $40/año** (Hostinger · renueva 2027-05-04)
- **Overhead operativo confirmado: $118.33/mes USD** ($100 Claude Max + $15 Framer + $3.33 dominio prorrateado)
- **Trimestral: ~$355 USD** · **Piso §4 (×2): ~$710 USD** = baseline para sanity check al cotizar
- ⚠️ Recurrentes: actualizar record `Anthropic API` el último día de cada mes con uso real desde `console.anthropic.com/settings/usage`
- ⚠️ Recordatorio renovación dominio: 2027-04-20 (decidir renovar Hostinger o migrar a Cloudflare $25-30/año)

✅ **CONEXIONES-FRAMER ACTIVADO** (2026-05-05)
- `conexiones/conexiones-framer.md` · `estado_conexion: pendiente → activo`
- Documentado proyecto activo: https://framer.com/projects/Zenkai--Au6wxt8ezQ1Qj7tevWYd (interno · NO duplicar para clientes)
- Nota: Framer no publica MCP server. Si en el futuro hace falta automatización Claude ↔ Framer, requiere construir wrapper custom sobre Framer Plugin API (proyecto FORGE · no priorizado).

⏸️ **PAUSADO: Fases 3-7**
- Fase 3: Make · webhook landing → crear Lead → /api/protocolo?persist=true&lead_id
- Fases 4-7: WhatsApp Cloud API · Cal.com/Stripe · Docuseal/Notion/Drive · Sentry/BetterStack
- objeciones/contratos: pueden vivir en Deals (existing) cuando llegue el momento; objeciones mejor como endpoint manual de HERMES-CLOSE

---

## ENV VARS YA CONFIGURADAS EN VERCEL

**Panel `zenkaibrain` (legacy):**
- `ANTHROPIC_API_KEY` ✓ (en uso por `/api/clasificar` y `/api/protocolo` del panel)
- `ZENKAI_API_KEY` ✓ (Bearer token para auth · timing-safe compare · ver `.env.example`)
- `AIRTABLE_TOKEN` ✓ (Personal Access Token · en uso por persistirPropuesta)
- `AIRTABLE_BASE_VENTAS=appmiicsbFsvRfxQ9` ✓

**Project `zenkai-web` (landing pública · Sprint 1-3):**
- `ANTHROPIC_API_KEY` ✓ (en uso por `web/src/lib/proposal.ts` → `/api/lead-demo` y `/api/protocolo`)
- `ZENKAI_API_KEY` ✓ (acepta dual: header `x-zenkai-key` O `Authorization: Bearer`)
- `AIRTABLE_TOKEN` ✓ (en uso por `web/src/lib/airtable.ts` → `createDemo`)
- `AIRTABLE_BASE_VENTAS=appmiicsbFsvRfxQ9` ✓ (tabla `demos` `tblR1tgCOznCKCeBb` creada 2026-05-12)

**Configuradas en Vercel `zenkai-web` (verificado smoke test 2026-05-13):**
- `UPSTASH_REDIS_REST_URL` ✓ / `UPSTASH_REDIS_REST_TOKEN` ✓ → rate limit sliding window 5/IP/h activo en `/api/lead-demo`

**Pendientes en Vercel `zenkai-web` (no-op si missing · feature gating graceful):**
- `TURNSTILE_SITE_KEY` (público) / `TURNSTILE_SECRET_KEY` (server) → captcha Cloudflare en demo (free tier Cloudflare · widget para sitio único)
- `RESEND_API_KEY` → email opcional con HTML inline cuando visitor deja email en demo (Resend ya tiene dominio verified `zenkai.systems`)

**Disponibles en `.env` local pero NO sincronizadas a Vercel** (sólo `getBase("VENTAS")` se usa en producción hoy · agregar en Vercel cuando algún endpoint las consuma):
- `AIRTABLE_BASE_LEGAL=appy9s8qJ9TP98HYS`
- `AIRTABLE_BASE_FINANZAS=appyZf10t2OmfJvrp`
- `AIRTABLE_BASE_INMOBILIARIA=appjyT85koBY6odNk`
- `AIRTABLE_BASE_SALUD/FOOD/ECOMMERCE/SERVICIOS/EDUCACION` (sector templates)

**.env local** tiene los mismos valores · `.env.example` documenta cómo regenerar `ZENKAI_API_KEY`.

---

## QUÉ HACER EN LA NUEVA SESIÓN

Sprints 1+2+2.5+3 cerrados · landing comercial v3.3 deployed · demo end-to-end cableado. Opciones para continuar:

1. **Activar defensas restantes del demo público** (paso a paso documentado): seguir `conexiones/conexiones-resend.md` (5 min · sin código) + `conexiones/conexiones-turnstile.md` (requiere sprint frontend 20-30 min ANTES de activar la SECRET key). Upstash ya OK. Crítico antes de abrir tráfico orgánico.
   - **Sub-task de código:** integrar widget `<div class="cf-turnstile">` en `web/src/components/landing/DemoSection.astro` y leer `cf-turnstile-response` para enviar como `turnstileToken` en el body de `/api/lead-demo`. Dispatch a FORGE-FRONTEND en próxima sesión.
2. ~~**Política de reembolso 30 días escrita**~~ ✅ cerrado 2026-05-13 · template v1.0 en `templates/template-garantia-lite-30-dias.md` · pendiente registro Airtable + referencia cruzada en contrato master.
3. **Smoke test end-to-end con caso real** (15 min): disparar `/api/lead-demo` con un input real, validar que llega a tabla `demos` Airtable VENTAS · verificar header `x-airtable-record-id` · seguir el flujo desde browser real en zenkai-web-rho.vercel.app.
4. **Fase 5 · domain swap** (Tarea 5.3-pre): apex `zenkai.systems` → landing `zenkai-web` · panel actual → `panel.zenkai.systems`. Tareas DNS + Vercel domain config. Pre-launch comercial.
5. **Fase 2 sectores `/sectores/<slug>` con copy_largo:** generar 8 copys de 3-5 párrafos en Claude.ai web → poblar `web/src/content/sectores/*.md` → construir páginas dedicadas. Útil para SEO long-tail pero no bloquea pre-launch.

**Smoke test del demo público (verificar que sigue vivo):**
```bash
curl -X POST "https://zenkai-web-rho.vercel.app/api/lead-demo" \
  -H "Content-Type: application/json" \
  -d '{"input":"[CLIENTE] Tengo una clínica dental en Medellín con 3 doctores · perdemos turnos por WhatsApp..."}'
# Headers esperados: x-airtable-record-id (si persistencia OK)
```

**Smoke test del endpoint interno (auth requerida):**
```bash
curl -X POST "https://zenkai-web-rho.vercel.app/api/protocolo" \
  -H "Authorization: Bearer $ZENKAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input":"[CLIENTE] Tu input acá..."}'
```

**Landing pública:** `https://zenkai-web-rho.vercel.app`
**Sandbox UI panel (legacy):** `https://zenkaibrain-git-main-mrhaxel26-sketchs-projects.vercel.app/sandbox`

**Smoke test de los endpoints (verificar que siguen vivos):**
```bash
curl -X POST https://zenkaibrain-git-main-mrhaxel26-sketchs-projects.vercel.app/api/clasificar \
  -H "Authorization: Bearer $ZENKAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input":"[CLIENTE] Tengo una clínica..."}'
```

**Sandbox UI:** `https://zenkaibrain-git-main-mrhaxel26-sketchs-projects.vercel.app/sandbox`

Cuando una conexión se active, actualizar el frontmatter:
```yaml
# conexiones/conexiones-airtable.md
estado_conexion: activo  # antes era "pendiente"
```
Esto refresca automáticamente `/conexiones` y los KPIs de `/rendimiento` y Home.

**Spec + plan de Fase 1 v0.1:**
- `docs/specs/2026-05-03-fase1-protocolo-cliente-design.md`
- `docs/plans/2026-05-03-fase1-protocolo-cliente.md`

---

## TAREAS COMPLETADAS DEL PLAN PANEL

| Fase | Tareas | Status |
|------|--------|--------|
| 0 Setup | 0.1-0.5 | ✅ |
| 1 Frontmatter | 1.1-1.6 | ✅ |
| 2 Visual base | 2.1-2.3 | ✅ |
| 3 Listados | 3.1-3.6 | ✅ |
| 4 Detalles | 4.1-4.3 | ✅ |
| 5 Home + 404 | 5.1-5.2 | ✅ |
| 6 QA + Deploy | 6.1-6.3 | ✅ |

**27 / 27 tareas del plan completadas.**

---

## SIGUIENTES FASES (PAUSADAS · empezar post-validación del panel)

| # | Fase | Estado |
|---|-------|--------|
| 1 | Anthropic Claude API | pending — empezar acá |
| 2 | Airtable + 6 bases | pending |
| 3 | Make + connections | pending |
| 4 | WhatsApp Cloud API + BSP | pending |
| 5 | Cal.com + Stripe/Wompi | pending |
| 6 | Docuseal + Notion + Drive | pending |
| 7 | Monitoreo (Sentry + BetterStack) | pending |

---

## NO REHACER

❌ Panel de control · ya construido y deployado (15 commits desde init).
❌ Frontmatter de los markdown · ya añadido y validado.
❌ Schemas Zod · ya definidos en `panel/src/content.config.ts`.
❌ Setup inicial de Vercel · ya hecho · sólo modificar settings si hace falta.

---

## ARCHIVOS CLAVE

1. `ESTADO-ACTUAL.md` (este archivo)
2. `CLAUDE.md` (cerebro central · 12 agentes · matriz de decisión · stacks)
3. `docs/specs/2026-05-01-panel-zenkai-design.md` (spec del panel)
4. `docs/plans/2026-05-01-panel-zenkai-implementation.md` (plan ejecutado · 100% completo)
5. `panel/README.md` (URLs de producción y comandos de dev)

---

## STACK ACTUAL

- **Hosting:** GitHub (privado) → Vercel team `mrhaxel26-sketchs-projects` (Hobby · 2 projects: `zenkaibrain` panel · `zenkai-web` landing)
- **Stack actual:** Eco · ~$118.33 USD/mes (Claude Max $100 + Framer Basic $15 + dominio prorrateado $3.33 · resto en free tier)
- **Trimestral confirmado:** ~$355 USD · piso §4 (×2) = ~$710 USD
- **Clientes activos:** 0
- **Facturado 2026:** $0 / objetivo $100K USD
- **Próximo hito:** abrir demo público en zenkai.systems · activar defensas (Upstash + Turnstile + Resend) · capturar primer lead orgánico
