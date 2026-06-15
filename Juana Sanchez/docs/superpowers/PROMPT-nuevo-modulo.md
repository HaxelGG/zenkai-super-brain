# Prompt para planificar un módulo nuevo del panel

Abre una terminal nueva con `claude` en `C:\Users\jordy\Desktop\Juana Sanchez` y pega
el prompt de abajo, cambiando `<NOMBRE_DEL_MODULO>` por el módulo que toque
(CRM, Cotizaciones, Ventas, Finanzas, Dashboards, Tareas, Comunicación, Social media,
Automatizaciones IA, 2º Cerebro).

> ⚠️ Importante: este prompt **solo planifica** (brainstorm → spec → plan). NO construye
> código todavía, para no chocar con los cimientos que se están construyendo en paralelo.
> Cuando los cimientos estén listos, ejecutamos los planes ya hechos.

---

## PROMPT (copiar desde aquí)

```
Quiero planificar el módulo "<NOMBRE_DEL_MODULO>" del Panel de Control del Grupo
Juana Sánchez. NO construyas código todavía — solo brainstorm, spec y plan.

Contexto obligatorio que debes leer antes de empezar:
- docs/superpowers/specs/2026-05-25-panel-control-grupo-design.md  (diseño de cimientos)
- docs/superpowers/plans/2026-05-25-panel-control-grupo.md         (plan de cimientos+Inventario)
- docs/superpowers/ROADMAP-modulos-panel.md                        (mapa de todos los módulos)

Reglas:
- Este módulo se construye SOBRE los cimientos ya existentes (auth Supabase, multi-empresa
  con company_id, RLS, app shell, selector de empresa, shadcn/ui). NO reconstruyas nada de eso.
- Reutiliza el patrón de Inventario: lib/<modulo>/queries.ts, lib/<modulo>/actions.ts,
  ruta en src/app/(app)/<modulo>/, entrada en el Sidebar, y políticas RLS por company_id.
- Respeta las dependencias y el alcance descritos para este módulo en el ROADMAP.
- Stack fijo: Next.js 15 + Supabase + Vercel + shadcn/ui. No cambies de stack.

Proceso:
1. Usa la skill de brainstorming. Hazme las preguntas de decisión específicas de este
   módulo (las que el ROADMAP marca como "Decisiones a tomar"), una a una.
2. Cuando aprobemos el diseño, escribe el spec en
   docs/superpowers/specs/AAAA-MM-DD-<modulo>-design.md
3. Luego usa la skill writing-plans para escribir el plan detallado en
   docs/superpowers/plans/AAAA-MM-DD-<modulo>.md, con tareas TDD bite-sized,
   rutas de archivo exactas y código real, igual de detallado que el plan de Inventario.

Empieza leyendo los 3 documentos de contexto y dime qué entendiste del módulo antes
de la primera pregunta.
```

---

## Cuando los cimientos ya estén construidos

Para **ejecutar** (construir) un plan de módulo ya escrito, en una terminal con `claude`
dentro de `juana-sanchez-panel/`:

```
Ejecuta el plan docs/superpowers/plans/AAAA-MM-DD-<modulo>.md usando la skill
subagent-driven-development: un subagente por tarea, revisión entre tareas.
Los cimientos ya están construidos; reutilízalos, no los recrees.
```
```
