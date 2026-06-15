# Módulo Analítica / BI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una vista ejecutiva `/analitica` con 4 gráficos (Recharts tematizado Atelier) derivados en vivo de Finanzas/Ventas, con proyección por media móvil — sin tocar el dashboard de inicio de la otra terminal.

**Architecture:** Módulo de SOLO LECTURA. Sin migraciones ni tablas: reutiliza `financeOverview` (Finanzas) y agrega ventas por canal/empresa. Lógica pura testeada para la proyección (media móvil). Gráficos con Recharts en componentes cliente, tematizados con tokens Atelier; el server agrega los datos y los pasa por props. Ruta nueva `/analitica` + entrada en el sidebar; no se toca `(app)/page.tsx`.

**Tech Stack:** Next.js 15 (App Router, TS), Supabase, Recharts (nuevo), shadcn/ui + Atelier, Vitest, Vercel.

**Spec:** `docs/superpowers/specs/2026-05-26-analitica-design.md`

---

## Prerrequisitos

- Cimientos + Inventario + CRM + Cotizaciones + Ventas + Finanzas + Atelier en `main`.
- Reutiliza: `financeOverview(companyFilter, year)` de `src/lib/finanzas/queries.ts` (devuelve `{ year, months: { month, ingresos, gastos, margen, ... }[], totals }`); `channelLabel` + tipo `SaleChannel` (`tienda|online|feria|mayorista`) de `src/lib/ventas/sale.ts`; `getActiveCompany()`; `YearSelect` de `src/components/finanzas/year-select.tsx`; tokens Atelier en `globals.css`.
- `recharts` NO está instalado. Tablas `sales` (`total`,`status`,`channel`,`sale_date`,`company_id`), `companies` (`id`,`slug`,`name`) existen.
- Trabajar en rama feature desde `main`; **`git pull` antes de empujar** (otra terminal en paralelo). Comandos desde `juana-sanchez-panel/`.

---

## File Structure

```
juana-sanchez-panel/
├── src/
│   ├── lib/analitica/
│   │   ├── forecast.ts          # movingAverageForecast (pura)
│   │   ├── forecast.test.ts
│   │   └── queries.ts           # monthlyFinance, salesByChannel, revenueByCompany
│   ├── app/(app)/analitica/page.tsx
│   └── components/
│       ├── app-shell/sidebar.tsx          # MODIFY: entrada "Analítica" (mínimo)
│       └── analitica/
│           ├── chart-theme.ts             # constantes de color/estilo Atelier para Recharts
│           ├── revenue-expense-chart.tsx  # client: ingresos/gastos + proyección
│           ├── channel-donut.tsx          # client: ventas por canal
│           ├── company-bars.tsx           # client: ingresos por empresa
│           └── margin-line.tsx            # client: margen por mes
├── package.json                            # + recharts
# sin migraciones
```

---

## Phase 1 — Setup + lógica pura

### Task 1: Instalar Recharts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar**

```bash
npm install recharts
```
Expected: `recharts` añadido a dependencies.

- [ ] **Step 2: Verificar build**

```bash
npm run build
```
Expected: compila (sin uso aún de recharts; solo confirma que la instalación no rompe nada).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(analitica): add recharts"
```

### Task 2: Proyección por media móvil (TDD)

**Files:**
- Create: `src/lib/analitica/forecast.ts`
- Test: `src/lib/analitica/forecast.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/analitica/forecast.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { movingAverageForecast } from "./forecast";

describe("movingAverageForecast", () => {
  it("proyecta con la media de los últimos N (incluyendo proyectados)", () => {
    expect(movingAverageForecast([100, 200, 300], 3, 2)).toEqual([200, 233.33]);
  });
  it("ventana 1 repite el último valor", () => {
    expect(movingAverageForecast([10], 1, 2)).toEqual([10, 10]);
  });
  it("historial vacío devuelve ceros", () => {
    expect(movingAverageForecast([], 3, 3)).toEqual([0, 0, 0]);
  });
  it("ventana mayor que el historial usa todo el historial", () => {
    expect(movingAverageForecast([100, 200], 5, 1)).toEqual([150]);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
npm test
```
Expected: FAIL — `./forecast` no existe.

- [ ] **Step 3: Implementar**

Create `src/lib/analitica/forecast.ts`:
```typescript
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Proyecta `periods` meses como media móvil de los últimos `window` valores
 *  (incluye los ya proyectados para una continuación suave). */
export function movingAverageForecast(history: number[], window = 3, periods = 3): number[] {
  if (history.length === 0) return Array(periods).fill(0);
  const series = [...history];
  const out: number[] = [];
  for (let i = 0; i < periods; i++) {
    const w = series.slice(-window);
    const avg = w.reduce((a, b) => a + b, 0) / w.length;
    const v = round2(avg);
    series.push(v);
    out.push(v);
  }
  return out;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

```bash
npm test
```
Expected: PASS (toda la suite).

- [ ] **Step 5: Commit**

```bash
git add src/lib/analitica/forecast.ts src/lib/analitica/forecast.test.ts
git commit -m "feat(analitica): moving-average forecast + tests"
```

---

## Phase 2 — Capa de datos

### Task 3: Queries de analítica

**Files:**
- Create: `src/lib/analitica/queries.ts`

- [ ] **Step 1: Escribir las lecturas**

Create `src/lib/analitica/queries.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { financeOverview } from "@/lib/finanzas/queries";
import type { SaleChannel } from "@/lib/ventas/sale";

export type MonthlyPoint = { month: number; ingresos: number; gastos: number; margen: number };

export async function monthlyFinance(companyFilter: string | "all", year: number): Promise<MonthlyPoint[]> {
  const data = await financeOverview(companyFilter, year);
  return data.months.map((m) => ({ month: m.month, ingresos: m.ingresos, gastos: m.gastos, margen: m.margen }));
}

export type ChannelSlice = { channel: SaleChannel; total: number };

export async function salesByChannel(companyFilter: string | "all", year: number): Promise<ChannelSlice[]> {
  const supabase = await createClient();
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  let q = supabase
    .from("sales")
    .select("channel,total")
    .eq("status", "pagada")
    .gte("sale_date", start).lte("sale_date", end);
  if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
  const { data, error } = await q;
  if (error) throw error;
  const acc = new Map<string, number>();
  for (const r of data ?? []) {
    const ch = (r.channel as SaleChannel | null) ?? "tienda";
    acc.set(ch, (acc.get(ch) ?? 0) + Number(r.total));
  }
  return Array.from(acc.entries()).map(([channel, total]) => ({ channel: channel as SaleChannel, total }));
}

export type CompanyRevenue = { companyId: string; name: string; slug: string; ingresos: number };

export async function revenueByCompany(year: number): Promise<CompanyRevenue[]> {
  const supabase = await createClient();
  const { data: companies, error } = await supabase
    .from("companies").select("id,name,slug").order("name");
  if (error) throw error;
  const out: CompanyRevenue[] = [];
  for (const c of companies ?? []) {
    const ov = await financeOverview(c.id, year);
    out.push({ companyId: c.id, name: c.name, slug: c.slug, ingresos: ov.totals.ingresos });
  }
  return out;
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```
Expected: compila.

- [ ] **Step 3: Commit**

```bash
git add src/lib/analitica/queries.ts
git commit -m "feat(analitica): read queries (monthly finance, sales by channel, revenue by company)"
```

---

## Phase 3 — Componentes de gráficos (Recharts tematizado)

### Task 4: Tema de gráficos + los 4 componentes

**Files:**
- Create: `src/components/analitica/chart-theme.ts`
- Create: `src/components/analitica/revenue-expense-chart.tsx`
- Create: `src/components/analitica/channel-donut.tsx`
- Create: `src/components/analitica/company-bars.tsx`
- Create: `src/components/analitica/margin-line.tsx`

- [ ] **Step 1: Tema (tokens Atelier para Recharts)**

Create `src/components/analitica/chart-theme.ts`:
```typescript
// Los tokens son variables CSS de globals.css; Recharts las acepta como strings de color
// porque renderiza SVG en el DOM, donde las CSS vars cascadean.
export const C = {
  ink: "var(--ink)",
  ink3: "var(--ink-3)",
  ink4: "var(--ink-4)",
  line: "var(--line)",
  accent: "var(--accent)",
  good: "var(--good)",
  bad: "var(--bad)",
  js: "var(--js)",
  lk: "var(--lk)",
  pr: "var(--pr)",
  elevated: "var(--elevated)",
};

export const tooltipStyle = {
  background: "var(--elevated)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--ink)",
};

export const axisTick = { fontSize: 11, fill: "var(--ink-4)" };

// Color de marca por slug de empresa
export function brandColor(slug: string): string {
  if (slug === "lolikas") return C.lk;
  if (slug === "printellar") return C.pr;
  return C.js; // juana-sanchez por defecto
}
```

- [ ] **Step 2: Ingresos vs Gastos + proyección**

Create `src/components/analitica/revenue-expense-chart.tsx`:
```tsx
"use client";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C, tooltipStyle, axisTick } from "./chart-theme";

export type RevPoint = { label: string; ingresos: number | null; gastos: number | null; proyeccion: number | null };

export function RevenueExpenseChart({ data }: { data: RevPoint[] }) {
  return (
    <div className="font-mono">
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={C.line} vertical={false} />
          <XAxis dataKey="label" tick={axisTick} stroke={C.line} />
          <YAxis tick={axisTick} stroke={C.line} width={48} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `€${Number(v).toLocaleString("es-ES")}`} />
          <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke={C.accent} fill={C.accent} fillOpacity={0.08} strokeWidth={1.6} connectNulls />
          <Line type="monotone" dataKey="gastos" name="Gastos" stroke={C.bad} strokeWidth={1.4} dot={false} connectNulls />
          <Line type="monotone" dataKey="proyeccion" name="Proyección" stroke={C.accent} strokeWidth={1.4} strokeDasharray="4 4" dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 3: Donut de ventas por canal**

Create `src/components/analitica/channel-donut.tsx`:
```tsx
"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { C, tooltipStyle } from "./chart-theme";

export type DonutSlice = { name: string; value: number };
const PALETTE = [C.js, C.lk, C.pr, C.ink3];

export function ChannelDonut({ data }: { data: DonutSlice[] }) {
  if (data.length === 0) return <p className="text-sm text-ink-3">Sin ventas pagadas este año.</p>;
  return (
    <div className="font-mono">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2} stroke={C.elevated}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `€${Number(v).toLocaleString("es-ES")}`} />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--ink-4)" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: Barras de ingresos por empresa**

Create `src/components/analitica/company-bars.tsx`:
```tsx
"use client";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C, tooltipStyle, axisTick } from "./chart-theme";

export type CompanyBar = { name: string; ingresos: number; color: string };

export function CompanyBars({ data }: { data: CompanyBar[] }) {
  return (
    <div className="font-mono">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={C.line} vertical={false} />
          <XAxis dataKey="name" tick={axisTick} stroke={C.line} />
          <YAxis tick={axisTick} stroke={C.line} width={48} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent-soft)" }} formatter={(v: number) => `€${Number(v).toLocaleString("es-ES")}`} />
          <Bar dataKey="ingresos" name="Ingresos" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 5: Línea de margen por mes**

Create `src/components/analitica/margin-line.tsx`:
```tsx
"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C, tooltipStyle, axisTick } from "./chart-theme";

export type MarginPoint = { label: string; margen: number };

export function MarginLine({ data }: { data: MarginPoint[] }) {
  return (
    <div className="font-mono">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={C.line} vertical={false} />
          <XAxis dataKey="label" tick={axisTick} stroke={C.line} />
          <YAxis tick={axisTick} stroke={C.line} width={48} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `€${Number(v).toLocaleString("es-ES")}`} />
          <Line type="monotone" dataKey="margen" name="Margen" stroke={C.good} strokeWidth={1.6} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 6: Verificar build**

```bash
npm run build
```
Expected: compila con recharts.

- [ ] **Step 7: Commit**

```bash
git add src/components/analitica
git commit -m "feat(analitica): Atelier-themed Recharts components (revenue/expense, channel donut, company bars, margin line)"
```

---

## Phase 4 — Página y sidebar

### Task 5: Entrada en el sidebar

**Files:**
- Modify: `src/components/app-shell/sidebar.tsx`

- [ ] **Step 1: Añadir la entrada (cambio mínimo)**

Modify `src/components/app-shell/sidebar.tsx`: añadir `LineChart` al import de `lucide-react` y la entrada al array `NAV` tras "Finanzas":
```tsx
import { Package, Users, FileText, ShoppingCart, Wallet, LineChart } from "lucide-react";
```
y añadir al array NAV (tras la entrada de Finanzas):
```tsx
  { href: "/analitica", label: "Analítica", icon: LineChart },
```
IMPORTANTE: solo el símbolo de import + la entrada NAV. No reestructurar el sidebar (otra rama lo reestiló). Conservar todas las entradas existentes.

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/app-shell/sidebar.tsx
git commit -m "feat(analitica): sidebar entry"
```

### Task 6: Página `/analitica`

**Files:**
- Create: `src/app/(app)/analitica/page.tsx`

- [ ] **Step 1: Escribir la página**

Create `src/app/(app)/analitica/page.tsx`:
```tsx
import { getActiveCompany } from "@/lib/active-company";
import { monthlyFinance, salesByChannel, revenueByCompany } from "@/lib/analitica/queries";
import { movingAverageForecast } from "@/lib/analitica/forecast";
import { channelLabel } from "@/lib/ventas/sale";
import { brandColor } from "@/components/analitica/chart-theme";
import { RevenueExpenseChart, type RevPoint } from "@/components/analitica/revenue-expense-chart";
import { ChannelDonut } from "@/components/analitica/channel-donut";
import { CompanyBars } from "@/components/analitica/company-bars";
import { MarginLine } from "@/components/analitica/margin-line";
import { YearSelect } from "@/components/finanzas/year-select";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-4">{children}</h2>;
}

export default async function AnaliticaPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const company = await getActiveCompany();
  const { year } = await searchParams;
  const y = Number(year) || new Date().getFullYear();

  const [monthly, channels, byCompany] = await Promise.all([
    monthlyFinance(company, y),
    salesByChannel(company, y),
    revenueByCompany(y),
  ]);

  // Serie ingresos/gastos + proyección (3 meses)
  const ingresosHist = monthly.map((m) => m.ingresos);
  const forecast = movingAverageForecast(ingresosHist, 3, 3);
  const revData: RevPoint[] = monthly.map((m, i) => ({
    label: MESES[m.month - 1],
    ingresos: m.ingresos,
    gastos: m.gastos,
    // conectar la proyección desde el último mes histórico
    proyeccion: i === monthly.length - 1 ? m.ingresos : null,
  }));
  forecast.forEach((v, i) => revData.push({ label: `P+${i + 1}`, ingresos: null, gastos: null, proyeccion: v }));

  const donutData = channels.map((c) => ({ name: channelLabel(c.channel), value: c.total }));
  const marginData = monthly.map((m) => ({ label: MESES[m.month - 1], margen: m.margen }));
  const companyData = byCompany.map((c) => ({ name: c.name, ingresos: c.ingresos, color: brandColor(c.slug) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-4">Business intelligence</p>
          <h1 className="mt-1 font-display text-[34px] leading-none tracking-[-0.02em] text-ink">Analítica</h1>
        </div>
        <Suspense fallback={<div className="h-9 w-28 animate-pulse rounded-md bg-line" />}>
          <YearSelect year={y} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4 lg:col-span-2">
          <PanelTitle>Ingresos vs gastos · proyección</PanelTitle>
          <RevenueExpenseChart data={revData} />
        </Card>
        <Card className="p-4">
          <PanelTitle>Ventas por canal</PanelTitle>
          <ChannelDonut data={donutData} />
        </Card>
        <Card className="p-4">
          <PanelTitle>Ingresos por empresa</PanelTitle>
          <CompanyBars data={companyData} />
        </Card>
        <Card className="p-4 lg:col-span-2">
          <PanelTitle>Margen por mes</PanelTitle>
          <MarginLine data={marginData} />
        </Card>
      </div>
    </div>
  );
}
```
Nota: `YearSelect` (reutilizado de Finanzas) usa `useSearchParams`, por eso va envuelto en `<Suspense>` (igual que en Finanzas) para evitar el error de boundary de Next 16.

- [ ] **Step 2: Verificar**

```bash
npm run dev
```
Con datos: `/analitica` muestra los 4 gráficos (ingresos/gastos con tramo punteado de proyección, donut por canal, barras por empresa con su color, línea de margen). Cambiar el año recalcula. Cambiar empresa filtra los gráficos 1/2/4 (la comparativa siempre 3). Parar con Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/analitica/page.tsx"
git commit -m "feat(analitica): /analitica page composing the 4 charts + year select"
```

---

## Phase 5 — Verificación, prueba y deploy

### Task 7: Suite, build y prueba manual

**Files:** (ninguno nuevo)

- [ ] **Step 1: Tests**

```bash
npm test
```
Expected: PASS — incluye `forecast.test.ts` además de los módulos previos.

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: ruta `/analitica` presente; compila con recharts sin errores.

- [ ] **Step 3: Prueba manual (dev)**

```bash
npm run dev
```
Login como owner, empresa concreta activa:
1. `/analitica` carga los 4 gráficos sin errores de consola.
2. Si hay ventas pagadas + gastos del año, los gráficos muestran datos; la línea de proyección continúa punteada tras el último mes con datos.
3. El donut refleja los canales con ventas pagadas; la comparativa muestra las 3 empresas con sus colores (malva/salvia/dorado).
4. Cambiar el año recarga; cambiar empresa filtra ingresos/gastos/margen y el donut (la comparativa no).
5. Alternar tema claro/oscuro (toggle de la otra terminal): los gráficos siguen legibles (usan tokens).
Parar con Ctrl+C.

### Task 8: Merge a main y deploy

**Files:** (ninguno nuevo)

- [ ] **Step 1: Build + tests verdes** (Task 7 completada).

- [ ] **Step 2: Actualizar main y merge**

```bash
git checkout main
git pull --ff-only origin main
git merge --no-ff <rama-feature> -m "Merge <rama-feature>: módulo Analítica/BI (/analitica, Recharts Atelier)"
```
Conflicto probable solo en `sidebar.tsx` (otra rama lo reestiló) → resolver combinando: conservar el estilo Atelier + mantener TODAS las entradas NAV incluyendo "Analítica". Tras resolver, `npm run build` y `npm test` deben pasar antes de continuar. (No hay migraciones que aplicar.)

- [ ] **Step 3: Push (dispara deploy)**

```bash
git push origin main
```

- [ ] **Step 4: Verificar deploy**

Vía Vercel MCP `list_deployments` (projectId `prj_hIEU1GOM7JH457ZrWPxyYtcFBqkJ`, teamId `team_Zy4UDnbxRqU9SqD02b8uulQq`): el deployment del commit en estado READY.
Smoke test: `https://juana-sanchez-panel.vercel.app/analitica` redirige a `/login` sin sesión (ruta desplegada y protegida).

---

## Notas de ejecución

- **Sin base de datos:** módulo de solo lectura; el aislamiento por empresa lo dan las queries reutilizadas (`financeOverview`, `sales` con RLS). No hay migraciones.
- **Consistencia de cifras:** ingresos/gastos/margen vienen de `financeOverview` (mismos números que Finanzas). El donut y la comparativa usan ventas `pagada` / ingresos por empresa.
- **`revenueByCompany` llama `financeOverview` por empresa** (3 llamadas) — aceptable a esta escala; reutiliza lógica probada.
- **Recharts tematizado** con CSS vars Atelier (funcionan en el SVG del DOM); ejes en `font-mono`; tooltip sobre `--elevated`. Sigue el tema claro/oscuro automáticamente.
- **No se toca `(app)/page.tsx`** (home de la otra terminal). Sidebar: cambio mínimo, merge previsto.
- **Siguiente módulo del ROADMAP:** Tareas de equipo / Comunicación / Social media (transversales), o Automatizaciones IA / 2º Cerebro.
```
