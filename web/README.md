# ZENKAI · Landing publica (web/)

Esta subcarpeta contiene el codigo fuente de la **landing publica de ZENKAI Growth Systems** que se sirve en `https://zenkai.systems`. Es un proyecto **independiente** del panel interno (`panel/`); no confundir.

## Stack

- **Astro 5** (SSG · `output: 'static'`)
- **TypeScript** estricto (`astro/tsconfigs/strict`)
- **Tailwind CSS 3.4** via `@astrojs/tailwind`
- **Vercel adapter** unificado (`@astrojs/vercel`) con web analytics
- **Zod** para validacion de schemas
- **Airtable + Resend** para captura de leads (Fase 2+)
- **Fontsource** variable: Inter + JetBrains Mono
- **Vitest** para tests unitarios

## Scripts

```bash
npm run dev        # dev server en puerto 4322 (panel/ usa 4321)
npm run build      # build estatico a dist/
npm run preview    # preview del build en puerto 4322
npm run test       # vitest run
npm run test:watch # vitest watch
```

## Estructura del monorepo

```
Kenzai Super Brain/
├── panel/   ← panel interno (NO TOCAR desde web/)
├── web/     ← este proyecto · landing publica
├── api/     ← endpoints existentes del panel
└── ...
```

Cualquier cambio en `web/` no debe afectar `panel/` ni `api/`.

## Referencia

- Spec de diseno: `docs/specs/2026-05-05-landing-zenkai-design.md`
- Plan de implementacion: `docs/plans/2026-05-10-landing-zenkai-implementation.md`
