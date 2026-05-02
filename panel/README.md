# ZENKAI Panel

Panel interno de control · Capa 1 del Super Cerebro.

## URLs

- **Producción (URL estable):** https://zenkaibrain-git-main-mrhaxel26-sketchs-projects.vercel.app/ (siempre apunta al último deploy de `main` · requiere login Vercel · solo miembros del team `mrhaxel26-sketchs-projects`)
- **Custom domain:** https://zenkai.systems (mismo contenido · puede requerir verificar configuración de auth)
- **Local dev:** http://localhost:4321 después de `npm run dev`

## Comandos

```bash
npm install     # primera vez
npm run dev     # desarrollo · hot reload
npm run build   # genera dist/ con HTML estático
npm run preview # sirve dist/ localmente
```

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
