# PROYECTO · Grupo Juana Sánchez
## Plan vivo · Landing page editorial pre-lanzamiento

---

## Estado actual

- **Fase:** LANZAMIENTO (pre-launch — landing funcional y desplegada)
- **Semana actual:** 1 de 1 (sprint enfocado)
- **Semáforo:** 🟢 EN MARCHA
- **% avance global:** ~85% (Fases 0-4 + fix Timeline cerradas; resta dominio + material del cliente)

---

## Equipo asignado

| Rol | Persona / Agente | Responsabilidades |
|-----|------------------|-------------------|
| Owner del cliente | Jordy (Growth) | Punto de contacto, validación, dominio/DNS |
| Agente Master | FORGE | Desarrollo Next.js, infra, deploy Vercel |
| Agente Master | APOLLO | Diseño / branding editorial |

---

## Naturaleza del proyecto

Landing page **editorial de branding** (no de venta) para Grupo Juana Sánchez —
conglomerado familiar de Madrid (1975), tres firmas: Juana Sánchez (ceremonia) ·
Lolikas (moda) · Printellar (taller técnico). La venta sucede en las tiendas
externas; la única conversión de la landing es captura de email pre-lanzamiento.
Entró **directo por brief** (`docs/CLAUDE-CODE-BRIEF.md` + addendum v2), sin pasar
por propuesta/contrato formal — ver `propuesta.md` / `contrato.md`.

**Deadline duro:** 17 mayo 2026 18:00 CEST (lanzamiento tienda Juana Sánchez).

---

## Plan por fases · estado

- [x] **Fase 0 — Setup** · Next 15 + shadcn + deps + assets + deploy inicial
- [x] **Fase 1 — Estructura** · 15 componentes de sección, maqueta estática
- [x] **Fase 2 — Countdown + formulario** · cuenta atrás en vivo + captura email (Resend)
- [x] **Fase 3 — Animaciones premium + addendum v2** · reveals, Lenis, cursor magnético,
      FimiLiveBubble, WhatsApp nav, reorden dinámico FIMI
- [x] **Fase 4 — SEO + performance** · next/image, OG dinámico, JSON-LD, sitemap/robots/manifest,
      Analytics + Speed Insights, video HQ con poster
- [x] **Fix Timeline** · scroll horizontal usable (botones, rueda, rail, móvil vertical)
- [ ] **Fase 5 — Dominio** · `grupojuanasanchez.com` — BLOQUEADA (necesita DNS IONOS)

---

## Hitos cliente

| Hito | Fecha objetivo | Estado |
|------|----------------|--------|
| Brief recibido (v1 + addendum v2) | 2026-05-14 | ✅ |
| Landing funcional desplegada (preview) | 2026-05-14 | ✅ |
| Material real del cliente (fotos, boutiques, logo) | — | ⏳ pendiente cliente |
| Dominio `grupojuanasanchez.com` conectado | antes 17/05 | ⏳ |
| Lanzamiento | 2026-05-17 18:00 CEST | ⏳ |

---

## Decisiones del cliente pendientes

- [x] Versión de Next (15 vs 16) → fijado 15 · 2026-05-14
- [x] Provider de email → Resend, audiencia "Grupo Juana Sánchez" · 2026-05-14
- [x] Video: HQ 4.5 MB vs 1 MB → HQ con poster + preload metadata · 2026-05-14
- [x] Rango FIMI → solo 15-16 mayo · 2026-05-14
- [ ] Dominio / DNS IONOS — diferido por el cliente
- [ ] Email de marca `hola@grupojuanasanchez.com` — diferido por el cliente

---

## Bloqueos y riesgos

### Activos
- 🟡 **Material real del cliente** (§14 del brief): lista real de boutiques (12 placeholder),
  fotos reales del taller, logo SVG vectorial. No bloquea el lanzamiento de la pieza de branding
  pero sí el crossfade de imágenes y el hover-preview de productos.
- 🟡 **Dominio** diferido — la landing vive en la URL de Vercel hasta que se configure DNS.
- 🟡 **Bundle ~307 kB First Load JS** (objetivo brief <150 kB) — tradeoff aceptado por el
  cliente (video HQ + Motion/Lenis). Refactor Motion→vanilla recomendado post-lanzamiento.

### Resueltos (histórico)
- ✅ Vercel CLI rechazaba los tokens → script REST `scripts/vercel-deploy.mjs` + git integration
- ✅ Timeline no scrolleable en desktop → reconstruido con botones/rueda/rail · 2026-05-14

---

## Links operativos

- **Repo GitHub:** https://github.com/HaxelGG/GrupoJuanaSanchez (rama `main` → auto-deploy)
- **Proyecto Vercel:** `grupo-juana-sanchez` · https://grupo-juana-sanchez.vercel.app
- **Carpeta del proyecto (local):** `C:\Users\jordy\Desktop\Juana Sanchez\juana-sanchez-landing\`
- **Brief + spec:** en `docs/` del repo (brief v1, addendum v2, spec HTML, video fuente)
- **Resend:** audiencia "Grupo Juana Sánchez" (`0bd2857d-e19c-4316-8828-261837c8e6c8`)
- **Reportes:** `./reportes/` · **Assets:** `./assets/` · **Automatizaciones:** `./automatizaciones/`
