# ESTADO ACTUAL · ZENKAI Super Cerebro
## Punto de continuación entre sesiones de Claude Code

**Última sesión cerrada:** 2026-05-05 (Fase 2.2 alcance A · LEGAL + FINANZAS + INMOBILIARIA conectadas)
**Modo recomendado para continuar:** `claude --dangerously-skip-permissions` desde `C:\Users\jordy\Desktop\Kenzai Super Brain\`

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

- `ANTHROPIC_API_KEY` ✓ (en uso por `/api/clasificar` y `/api/protocolo`)
- `ZENKAI_API_KEY` ✓ (Bearer token para auth de los endpoints · ver `.env.example`)
- `AIRTABLE_TOKEN` ✓ (en uso por persistirPropuesta · Personal Access Token)
- `AIRTABLE_BASE_VENTAS=appmiicsbFsvRfxQ9` ✓ (Fase 2 v0.1 · base de propuestas)

**Disponibles en `.env` local pero NO sincronizadas a Vercel** (sólo `getBase("VENTAS")` se usa en producción hoy · agregar en Vercel cuando algún endpoint las consuma):
- `AIRTABLE_BASE_LEGAL=appy9s8qJ9TP98HYS`
- `AIRTABLE_BASE_FINANZAS=appyZf10t2OmfJvrp`
- `AIRTABLE_BASE_INMOBILIARIA=appjyT85koBY6odNk`
- `AIRTABLE_BASE_SALUD/FOOD/ECOMMERCE/SERVICIOS/EDUCACION` (sector templates)

**.env local** tiene los mismos valores · `.env.example` documenta cómo regenerar `ZENKAI_API_KEY`.

---

## QUÉ HACER EN LA NUEVA SESIÓN

Fases 2 + 2.1 + 2.2 (alcance A) cerradas. Opciones para continuar:
1. **Fase 3 — Make:** workflow que recibe webhook de Tally/Typeform/landing → crea Lead en Airtable → llama a `/api/protocolo?persist=true&lead_id=recXXX` → propuesta queda guardada y linkeada al lead. Cero intervención humana hasta el HERMES-CLOSE. Es el primer flujo end-to-end realmente automatizado.
2. **Sembrar FINANZAS con gastos actuales:** registrar Anthropic API · Vercel · Airtable · GitHub (todos $0 hoy excepto Anthropic, que ya está cobrando por las llamadas a `/api/protocolo`). Da baseline para calcular costo operativo trimestral según fórmula §4 CLAUDE.md.
3. **Validación con cliente real:** usar el sandbox para preparar tu primera propuesta comercial · linkeala a un Lead real en Airtable · seguimiento manual por ahora · camino al "primer cliente cerrado" del objetivo 2026.

**Smoke test del pipeline completo (verificar que sigue vivo):**
```bash
curl -X POST "https://zenkaibrain-git-main-mrhaxel26-sketchs-projects.vercel.app/api/protocolo?persist=true&lead_id=recXXX" \
  -H "Authorization: Bearer $ZENKAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input":"[CLIENTE] Tu input acá..."}'
# Headers esperados: X-Airtable-Record-Id + X-Airtable-Linked-Lead
```

**Sandbox UI:** `https://zenkaibrain-git-main-mrhaxel26-sketchs-projects.vercel.app/sandbox`

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

- **Hosting:** GitHub (privado) → Vercel team `mrhaxel26-sketchs-projects` (Hobby)
- **Stack actual:** Eco · $0/mes
- **Clientes activos:** 0
- **Facturado 2026:** $0 / objetivo $100K USD
- **Próximo hito:** primer cliente cerrado · activar Fase 1 (Claude API) y Fase 2 (Airtable) en paralelo
