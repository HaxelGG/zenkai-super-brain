# Módulo Analítica / BI — Panel de Control Grupo Juana Sánchez

**Fecha:** 2026-05-26
**Estado:** Diseño aprobado · pendiente de plan de implementación
**Módulo nº:** 6 (corresponde a "Dashboards / BI" del ROADMAP, acotado como módulo aparte)
**Alcance:** Vista ejecutiva de gráficos en una ruta nueva `/analitica`, SOLO LECTURA sobre los
datos existentes. No reconstruye cimientos ni toca el dashboard de inicio (`(app)/page.tsx`).

---

## 1. Contexto y objetivo

El Panel tiene cimientos + 5 módulos en producción (Inventario, CRM, Cotizaciones, Ventas,
Finanzas) y el sistema de diseño Atelier. **Otra terminal mantiene en paralelo** la rama
`frontend-atelier` y ya construyó el **dashboard de inicio** (`src/app/(app)/page.tsx`,
"Panel del grupo": roll-up de KPIs por módulo). Para **no colisionar**, este módulo NO toca
ese home: añade una ruta separada **`/analitica`** con la capa visual de análisis (gráficos,
comparativa entre empresas, proyección).

**Objetivo:** una vista ejecutiva con 4 gráficos que dan profundidad analítica ("ver el dinero"
con tendencia y comparativa) reutilizando los datos ya calculados por Finanzas/Ventas.

## 2. Stack y reutilización (NO se reconstruye)

- **Next.js 15 + Supabase + Vercel + shadcn/ui + Atelier + Recharts (nuevo)**.
- Reutiliza `financeOverview` (de `src/lib/finanzas/queries.ts`), el `YearSelect`
  (`src/components/finanzas/year-select.tsx`), `getActiveCompany()`, y los tokens/primitivas Atelier.
- **Sin migraciones, sin RLS nuevo, sin tablas nuevas**: módulo de solo lectura; el aislamiento
  por empresa lo aplican las queries reutilizadas (que ya pasan por RLS).
- **Deploy:** integrar por `main` con `git pull` antes de empujar (otra terminal en paralelo).

## 3. Decisiones tomadas (brainstorming 2026-05-26)

| Decisión | Elección |
|---|---|
| Ubicación | Ruta nueva `/analitica`. NO toca `(app)/page.tsx`. |
| Gráficos | **Recharts**, tematizado con tokens Atelier. |
| Proyección | **Media móvil simple** (media de los últimos N meses, proyectada como continuación punteada). |
| Contenido | **4 gráficos núcleo** (ver §5). |
| Datos | **Derivados en vivo** de Finanzas/Ventas. Sin `kpi_snapshots`, sin cron. |

## 4. Dependencia nueva

`recharts` (instalada con `npm install recharts`). Es la librería de gráficos React que sugiere
el ROADMAP. Se tematiza con los tokens Atelier (no se usa su estilo por defecto).

## 5. Los 4 gráficos

1. **Ingresos vs Gastos por mes** — línea/área de los 12 meses del año, más la **proyección de
   ingresos** (media móvil) dibujada como continuación punteada hacia los próximos meses.
   Fuente: `financeOverview(empresa, año)` (mismos números que el módulo Finanzas → cuadran).
2. **Ventas por canal** — donut de las ventas en estado `pagada` del año, agrupadas por canal
   (`tienda`/`online`/`feria`/`mayorista`), suma de `total`.
3. **Comparativa entre empresas** — barras con los ingresos del año por cada una de las 3 marcas
   (Juana Sánchez, Lolikas, Printellar), cada barra con su color de acento. Muestra siempre las 3
   (independiente del selector de empresa).
4. **Margen por mes** — línea del margen mensual (de `financeOverview`).

## 6. Lógica pura (TDD) — `src/lib/analitica/forecast.ts`

- `movingAverageForecast(history: number[], window?: number, periods?: number): number[]`
  - `window` por defecto 3, `periods` por defecto 3.
  - Proyecta `periods` valores: cada nuevo valor = media de los últimos `window` valores
    (incluyendo los ya proyectados, para una proyección suave). Redondea a 2 decimales.
  - Con historial vacío devuelve un array de ceros de longitud `periods`.
- Tipo de salida usado por el gráfico: el componente compone `[...history, ...forecast]` marcando
  los proyectados.
- Tests escritos primero (como en los módulos previos).

## 7. Capa de datos — `src/lib/analitica/queries.ts`

- `monthlyFinance(companyFilter, year)` — delega en `financeOverview` y devuelve los 12 meses
  con `{ month, ingresos, gastos, margen }` (forma lista para los gráficos 1 y 4).
- `salesByChannel(companyFilter, year)` — ventas `pagada` del año agrupadas por `channel`;
  devuelve `{ channel, total }[]` (canales sin ventas se omiten o van a 0). Filtra por empresa
  activa cuando no es `"all"`.
- `revenueByCompany(year)` — para la comparativa: llama `financeOverview(companyId, year)` por
  cada empresa accesible y devuelve `{ companyId, name, slug, ingresos }[]` (ingresos = la misma
  definición de Finanzas: ventas pagadas + ingresos manuales).
- `companiesForComparison()` — lista de empresas accesibles (id, name, slug) para mapear acentos.

## 8. UI — Atelier-native, Recharts tematizado

- `src/components/analitica/chart-theme.ts` — constantes de estilo Atelier para Recharts:
  colores de marca (`--js`/`--lk`/`--pr` resueltos), tinta para ejes/grid, `--good`/`--bad`,
  fuente mono en ejes, tooltip sobre superficie `--elevated` con borde `--line`. Se leen vía
  variables CSS con un pequeño helper o valores fijos equivalentes a los tokens.
- Componentes **cliente** (`"use client"`, Recharts lo requiere), cada uno recibe datos ya
  agregados por props:
  - `revenue-expense-chart.tsx` — ComposedChart (ingresos/gastos) + serie de proyección punteada.
  - `channel-donut.tsx` — PieChart donut con leyenda.
  - `company-bars.tsx` — BarChart de ingresos por empresa, color por marca.
  - `margin-line.tsx` — LineChart del margen mensual.
- `src/app/(app)/analitica/page.tsx` (server): hace los fetches (`monthlyFinance`,
  `salesByChannel`, `revenueByCompany`), calcula la proyección con `movingAverageForecast`,
  y compone los 4 gráficos en una rejilla responsive con cabecera "Analítica" + `YearSelect`
  (reutilizado de Finanzas). Respeta la empresa activa salvo en la comparativa.
- Entrada `{ href: "/analitica", label: "Analítica", icon: LineChart }` en
  `src/components/app-shell/sidebar.tsx` (cambio mínimo: símbolo de import + entrada NAV).

## 9. Estructura de archivos

```
src/lib/analitica/
  forecast.ts          # movingAverageForecast (pura)
  forecast.test.ts
  queries.ts           # monthlyFinance, salesByChannel, revenueByCompany, companiesForComparison
src/app/(app)/analitica/page.tsx
src/components/analitica/
  chart-theme.ts
  revenue-expense-chart.tsx
  channel-donut.tsx
  company-bars.tsx
  margin-line.tsx
src/components/app-shell/sidebar.tsx   # MODIFY: entrada "Analítica"
package.json                            # + recharts
# sin migraciones
```

## 10. Criterios de éxito

- `/analitica` muestra los 4 gráficos con datos reales según empresa activa + año; los importes cuadran con Finanzas (reutiliza `financeOverview`).
- La proyección de ingresos (media móvil) se dibuja como continuación punteada de la línea histórica.
- La comparativa muestra las 3 empresas con su color de acento, siempre (independiente del selector).
- El selector de año recalcula; la empresa activa filtra los gráficos 1, 2 y 4.
- Recharts está tematizado al lenguaje Atelier (tinta/acento/crema, fuente mono en ejes), no genérico.
- La lógica pura (`movingAverageForecast`) tiene tests verdes; `npm run build` y `npm test` limpios.
- No se modifica `(app)/page.tsx` ni ningún archivo del dashboard de inicio de la otra terminal.

## 11. Fuera de alcance

- Tabla `kpi_snapshots`, tendencias diarias, cron de captura.
- Top productos por ventas y clientes nuevos por mes (ampliación futura).
- Objetivos configurables / forecast avanzado (la proyección es media móvil simple).
- Filtros de rango por días (7D/30D/90D); la granularidad es mensual por año.
- Cualquier cambio al home dashboard (`(app)/page.tsx`) — es de la otra terminal.
