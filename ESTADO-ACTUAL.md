# ESTADO ACTUAL · ZENKAI Super Cerebro
## Punto de continuación entre sesiones de Claude Code

**Última sesión cerrada:** 2026-05-02 (sesión 3 · build del panel + deploy completo)
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

⏸️ **PENDIENTE FASE 1 (post-v0.1)**
- Exponer `protocolo()` como Vercel serverless function `/api/protocolo` (~1h)
- Página `/sandbox` en panel Astro para probar con UI (~1.5h)
- Migrar render a "propuesta-ready" con branding ZENKAI (~30 min)
- Anthropic prompt caching (bajar costo de $0.08 a ~$0.02 por call)
- Caso de test ECO claro para validar que el modelo no tenga bias hacia PRO

⏸️ **PAUSADO: Fases 2-7** — empezar después de validar Fase 1 en uso real

---

## ENV VARS YA CONFIGURADAS EN VERCEL

- `ANTHROPIC_API_KEY` ✓ (lista para Fase 1)
- `AIRTABLE_TOKEN` ✓ (lista para Fase 2 · falta crear las bases y agregar `AIRTABLE_BASE_*`)

**Importante:** ninguna de estas env vars se usa en el panel v1 actual (es estático puro). Quedan listas para cuando empiecen las Fases 1-7.

---

## QUÉ HACER EN LA NUEVA SESIÓN

Fase 1 v0.1 está operativa. Para continuar, opciones:
1. **Path 2 — Endpoint HTTP:** convertir `protocolo()` en Vercel serverless function `/api/protocolo`. Habilita Make/Airtable/landing para llamarlo. ~1h.
2. **Path 3 — UI sandbox:** página `/sandbox` en panel Astro para probar con interfaz. Convierte el panel en herramienta usable. ~1.5h.
3. **Fase 2 — Airtable:** crear las 6 bases internas de ZENKAI y persistir cada call de protocolo en `propuestas`. Empieza la trazabilidad.

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
