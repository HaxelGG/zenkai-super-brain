# ZENKAI Panel

Panel interno de control · Capa 1 del Super Cerebro.

## URLs

| Servicio | URL | Notas |
|----------|-----|-------|
| **JARVIS** (ops center) | https://jarvis.zenkai.systems | Command center · finanzas · social · tareas · goals |
| **Panel** (Super Cerebro) | https://panel.zenkai.systems | Agentes · sectores · workflows · finanzas markdown |
| **Vercel fallback** | https://zenkaibrain-git-main-mrhaxel26-sketchs-projects.vercel.app/ | Requiere auth Vercel si Deployment Protection ON |
| **Local dev** | http://localhost:4321 | `npm run dev` desde `panel/` |

JARVIS vive en el mismo deploy que el panel (`zenkaibrain`). El subdominio `jarvis.zenkai.systems` redirige `/` → `/jarvis` vía `vercel.json` en la raíz del repo.

Setup DNS: `sops/sop-jarvis-domain.md`

## Comandos

```bash
npm install     # primera vez
npm run dev     # desarrollo · hot reload · JARVIS en /jarvis
npm run build   # genera dist/ con HTML estático
npm run preview # sirve dist/ localmente
```

## JARVIS

Rutas internas (local y producción):

- `/jarvis` — Command Center
- `/jarvis/finanzas` — Finanzas
- `/jarvis/social` — Social & engagement
- `/jarvis/tareas` — Task board
- `/jarvis/goals` — Metas & OKRs 2026

Datos: mock tipado en `src/lib/jarvis/mock-data.ts` · merge opcional con Airtable CRM si `AIRTABLE_TOKEN` está configurado en build.

## Estructura

Ver `docs/specs/2026-05-01-panel-zenkai-design.md` en la raíz del repo.

## Cómo se actualiza el contenido

Editar cualquier `.md` en `agentes/`, `sectores/`, `workflows/`, etc. → `git push` → Vercel rebuild + deploy en <1 min.

## Stack

- Astro 5 + TypeScript estricto
- Tailwind CSS 3 con paleta ZENKAI custom
- Content Collections con loaders `glob` apuntando a `../<carpeta>/*.md`
- Frontmatter validado por Zod en build
- Cross-references entre colecciones validadas en build (`validateCrossRefs`)
- Self-hosted Inter Variable + JetBrains Mono Variable
- Build estático puro · sin runtime de servidor
