# Importador / Migración CSV — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/importar` hub that migrates clientes and productos from a CSV file into the existing `customers` / `products` / `categories` tables, with column mapping, validation preview, and upsert/skip deduplication.

**Architecture:** Pure TDD logic (`csv.ts` parser + `entities.ts` field catalog/coercion/validation), two server actions that **re-parse and re-validate** on the server (trust boundary), a 5-step client wizard, one hub page, and one additive nav entry. No SQL migration — writes through the same RLS-scoped Supabase client the existing forms use.

**Tech Stack:** Next.js 16 (App Router, server components + `"use client"` wizard), Supabase (RLS, no service role), TypeScript, Vitest, Tailwind v4 / Atelier tokens, sonner.

---

## File Structure

**Create:**
- `src/lib/importar/csv.ts` — `parseCSV`, `toRecords` (pure)
- `src/lib/importar/csv.test.ts` — Vitest
- `src/lib/importar/entities.ts` — `FieldDef`, `CUSTOMER_FIELDS`, `PRODUCT_FIELDS`, `normalize`, `autoMatch`, `coerceValue`, `validateRecord` (pure)
- `src/lib/importar/entities.test.ts` — Vitest
- `src/lib/importar/actions.ts` — `importCustomers`, `importProducts` (`"use server"`)
- `src/components/importar/import-wizard.tsx` — `"use client"` 5-step wizard
- `src/app/(app)/importar/page.tsx` — hub (server)

**Modify:**
- `src/components/app-shell/nav-config.tsx` — add `Upload` icon + `/importar` entry under Operaciones

**Do NOT touch:** `sidebar.tsx`, `lib/automatizaciones/**`, `/crm` and `/inventario` pages/actions.

**Note (refinement of spec §6):** v1 does **per-row** insert/update (not 200-row batches) so each failure maps to a precise row number in the result. Internal migration volumes make this acceptable.

---

## Task 1: CSV parser (`lib/importar/csv.ts`)

**Files:**
- Create: `src/lib/importar/csv.ts`
- Test: `src/lib/importar/csv.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/importar/csv.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseCSV, toRecords } from "./csv";

describe("parseCSV", () => {
  it("parses simple rows", () => {
    expect(parseCSV("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("keeps commas inside quotes", () => {
    expect(parseCSV('a,"b,c",d')).toEqual([["a", "b,c", "d"]]);
  });

  it("unescapes doubled quotes", () => {
    expect(parseCSV('"she said ""hi"""')).toEqual([['she said "hi"']]);
  });

  it("keeps newlines inside quotes", () => {
    expect(parseCSV('"l1\nl2",b')).toEqual([["l1\nl2", "b"]]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCSV("a,b\r\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("strips a leading BOM", () => {
    expect(parseCSV("﻿a,b")).toEqual([["a", "b"]]);
  });

  it("drops a single trailing newline artifact", () => {
    expect(parseCSV("a,b\n")).toEqual([["a", "b"]]);
  });
});

describe("toRecords", () => {
  it("maps headers to cells and skips blank lines", () => {
    const rows = parseCSV("nombre,email\nAna,ana@x.com\n\nLuis,luis@x.com");
    const { headers, records } = toRecords(rows);
    expect(headers).toEqual(["nombre", "email"]);
    expect(records).toEqual([
      { nombre: "Ana", email: "ana@x.com" },
      { nombre: "Luis", email: "luis@x.com" },
    ]);
  });

  it("returns empty for no rows", () => {
    expect(toRecords([])).toEqual({ headers: [], records: [] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/importar/csv.test.ts`
Expected: FAIL — `Failed to resolve import "./csv"` / `parseCSV is not a function`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/importar/csv.ts`:

```ts
/** Minimal RFC 4180 CSV parser. No dependencies. */
export function parseCSV(text: string): string[][] {
  const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const n = s.length;

  while (i < n) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      if (s[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }

  row.push(field);
  rows.push(row);

  // Drop the single empty row produced by a trailing newline.
  const last = rows[rows.length - 1];
  if (rows.length > 1 && last.length === 1 && last[0] === "") rows.pop();

  return rows;
}

export function toRecords(rows: string[][]): {
  headers: string[];
  records: Record<string, string>[];
} {
  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0].map((h) => h.trim());
  const records: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (cells.every((c) => c.trim() === "")) continue;
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = cells[idx] ?? "";
    });
    records.push(rec);
  }
  return { headers, records };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/importar/csv.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/importar/csv.ts src/lib/importar/csv.test.ts
git commit -m "feat(importar): CSV parser (parseCSV + toRecords) with tests"
```

---

## Task 2: Field catalog + validation (`lib/importar/entities.ts`)

**Files:**
- Create: `src/lib/importar/entities.ts`
- Test: `src/lib/importar/entities.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/importar/entities.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  CUSTOMER_FIELDS,
  PRODUCT_FIELDS,
  normalize,
  autoMatch,
  coerceValue,
  validateRecord,
} from "./entities";

describe("normalize", () => {
  it("lowercases and strips accents", () => {
    expect(normalize("  Teléfono ")).toBe("telefono");
  });
});

describe("autoMatch", () => {
  it("matches headers to fields by alias, accent-insensitive", () => {
    const m = autoMatch(["Nombre", "Correo", "Teléfono"], CUSTOMER_FIELDS);
    expect(m).toEqual({ Nombre: "name", Correo: "email", "Teléfono": "phone" });
  });

  it("does not assign two headers to the same field", () => {
    const m = autoMatch(["nombre", "name"], CUSTOMER_FIELDS);
    const assigned = Object.values(m).filter((v) => v === "name");
    expect(assigned).toHaveLength(1);
  });
});

describe("coerceValue", () => {
  const cost = PRODUCT_FIELDS.find((f) => f.key === "cost")!;
  const type = CUSTOMER_FIELDS.find((f) => f.key === "type")!;
  const email = CUSTOMER_FIELDS.find((f) => f.key === "email")!;
  const tags = CUSTOMER_FIELDS.find((f) => f.key === "tags")!;

  it("parses comma-decimal numbers with currency symbol", () => {
    expect(coerceValue(cost, "1.234,56 €")).toEqual({ value: 1234.56 });
  });

  it("parses dot-decimal numbers", () => {
    expect(coerceValue(cost, "99.90")).toEqual({ value: 99.9 });
  });

  it("maps enum synonyms to canonical values", () => {
    expect(coerceValue(type, "Mayorista")).toEqual({ value: "mayorista" });
  });

  it("defaults blank enums", () => {
    expect(coerceValue(type, "")).toEqual({ value: "particular" });
  });

  it("rejects unknown enum values", () => {
    expect(coerceValue(type, "vip")).toHaveProperty("error");
  });

  it("rejects malformed email", () => {
    expect(coerceValue(email, "not-an-email")).toHaveProperty("error");
  });

  it("splits tags by comma and semicolon", () => {
    expect(coerceValue(tags, "vip, oro; plata")).toEqual({
      value: ["vip", "oro", "plata"],
    });
  });
});

describe("validateRecord", () => {
  it("flags a missing required field", () => {
    const mapping = { Correo: "email" };
    const { errors } = validateRecord({ Correo: "ana@x.com" }, CUSTOMER_FIELDS, mapping);
    expect(errors.join(" ")).toMatch(/Nombre/);
  });

  it("returns coerced values when valid", () => {
    const mapping = { Nombre: "name", Tipo: "type" };
    const { values, errors } = validateRecord(
      { Nombre: "Ana", Tipo: "tienda" },
      CUSTOMER_FIELDS,
      mapping,
    );
    expect(errors).toEqual([]);
    expect(values.name).toBe("Ana");
    expect(values.type).toBe("tienda");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/importar/entities.test.ts`
Expected: FAIL — `Failed to resolve import "./entities"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/importar/entities.ts`:

```ts
export type FieldKind = "text" | "email" | "number" | "int" | "tags" | "enum";

export type FieldDef = {
  key: string;
  label: string;
  required: boolean;
  kind: FieldKind;
  aliases: string[];
  enumValues?: string[];
  synonyms?: Record<string, string>;
  default?: string;
};

export const CUSTOMER_FIELDS: FieldDef[] = [
  { key: "name", label: "Nombre", required: true, kind: "text", aliases: ["nombre", "cliente", "razon social"] },
  { key: "email", label: "Email", required: false, kind: "email", aliases: ["correo", "e-mail", "mail"] },
  { key: "phone", label: "Teléfono", required: false, kind: "text", aliases: ["telefono", "tel", "celular", "movil"] },
  {
    key: "type", label: "Tipo", required: false, kind: "enum", aliases: ["tipo"],
    enumValues: ["particular", "tienda", "mayorista"], default: "particular",
    synonyms: { particular: "particular", tienda: "tienda", minorista: "tienda", mayorista: "mayorista" },
  },
  {
    key: "status", label: "Estado", required: false, kind: "enum", aliases: ["estado"],
    enumValues: ["lead", "active", "inactive"], default: "lead",
    synonyms: { lead: "lead", activo: "active", active: "active", cliente: "active", inactivo: "inactive", inactive: "inactive" },
  },
  { key: "tags", label: "Etiquetas", required: false, kind: "tags", aliases: ["etiquetas", "categorias"] },
  { key: "notes", label: "Notas", required: false, kind: "text", aliases: ["notas", "observaciones", "comentarios"] },
];

export const PRODUCT_FIELDS: FieldDef[] = [
  { key: "name", label: "Nombre", required: true, kind: "text", aliases: ["nombre", "producto", "articulo", "titulo"] },
  { key: "sku", label: "SKU", required: false, kind: "text", aliases: ["codigo", "ref", "referencia"] },
  { key: "category", label: "Categoría", required: false, kind: "text", aliases: ["categoria", "rubro"] },
  { key: "cost", label: "Costo", required: false, kind: "number", aliases: ["coste", "costo", "precio costo"] },
  { key: "price", label: "Precio", required: false, kind: "number", aliases: ["precio", "pvp", "precio venta"] },
  { key: "description", label: "Descripción", required: false, kind: "text", aliases: ["descripcion", "detalle"] },
  {
    key: "status", label: "Estado", required: false, kind: "enum", aliases: ["estado"],
    enumValues: ["active", "inactive"], default: "active",
    synonyms: { activo: "active", active: "active", inactivo: "inactive", inactive: "inactive" },
  },
  { key: "low_stock_threshold", label: "Stock mínimo", required: false, kind: "int", aliases: ["stock minimo", "umbral", "threshold"] },
];

export function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

export function autoMatch(headers: string[], fields: FieldDef[]): Record<string, string> {
  const out: Record<string, string> = {};
  const used = new Set<string>();
  for (const h of headers) {
    const nh = normalize(h);
    for (const f of fields) {
      if (used.has(f.key)) continue;
      const candidates = [f.key, f.label, ...f.aliases].map(normalize);
      if (candidates.includes(nh)) {
        out[h] = f.key;
        used.add(f.key);
        break;
      }
    }
  }
  return out;
}

type Coerced = { value: unknown } | { error: string };

function parseDecimal(s: string): number | null {
  let x = s.replace(/[^\d,.-]/g, "");
  if (x === "" || x === "-") return null;
  const hasComma = x.includes(",");
  const hasDot = x.includes(".");
  if (hasComma && hasDot) {
    if (x.lastIndexOf(",") > x.lastIndexOf(".")) x = x.replace(/\./g, "").replace(",", ".");
    else x = x.replace(/,/g, "");
  } else if (hasComma) {
    x = x.replace(",", ".");
  }
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

export function coerceValue(field: FieldDef, raw: string): Coerced {
  const t = (raw ?? "").trim();
  switch (field.kind) {
    case "text":
      return { value: t };
    case "email": {
      if (t === "") return { value: "" };
      const lower = t.toLowerCase();
      if (!lower.includes("@") || /\s/.test(lower)) return { error: `email inválido (${t})` };
      return { value: lower };
    }
    case "number": {
      if (t === "") return { value: 0 };
      const n = parseDecimal(t);
      return n === null ? { error: `número inválido (${t})` } : { value: n };
    }
    case "int": {
      if (t === "") return { value: 0 };
      const n = parseDecimal(t);
      return n === null ? { error: `entero inválido (${t})` } : { value: Math.max(0, Math.round(n)) };
    }
    case "tags": {
      if (t === "") return { value: [] as string[] };
      return { value: t.split(/[,;]/).map((s) => s.trim()).filter(Boolean) };
    }
    case "enum": {
      if (t === "") return { value: field.default ?? "" };
      const norm = normalize(t);
      const canon = field.synonyms?.[norm] ?? (field.enumValues?.includes(norm) ? norm : undefined);
      return canon ? { value: canon } : { error: `valor no reconocido (${t})` };
    }
  }
}

export function validateRecord(
  record: Record<string, string>,
  fields: FieldDef[],
  mapping: Record<string, string>,
): { values: Record<string, unknown>; errors: string[] } {
  const raw: Record<string, string> = {};
  for (const [header, fieldKey] of Object.entries(mapping)) {
    if (!fieldKey) continue;
    raw[fieldKey] = record[header] ?? "";
  }
  const values: Record<string, unknown> = {};
  const errors: string[] = [];
  for (const f of fields) {
    const res = coerceValue(f, raw[f.key] ?? "");
    if ("error" in res) {
      errors.push(`${f.label}: ${res.error}`);
      continue;
    }
    if (f.required && (res.value === "" || res.value == null)) {
      errors.push(`${f.label} es obligatorio`);
      continue;
    }
    values[f.key] = res.value;
  }
  return { values, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/importar/entities.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/importar/entities.ts src/lib/importar/entities.test.ts
git commit -m "feat(importar): field catalog, autoMatch, coercion and validation with tests"
```

---

## Task 3: Server actions (`lib/importar/actions.ts`)

**Files:**
- Create: `src/lib/importar/actions.ts`

- [ ] **Step 1: Write the implementation**

Create `src/lib/importar/actions.ts`:

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseCSV, toRecords } from "./csv";
import { CUSTOMER_FIELDS, PRODUCT_FIELDS, validateRecord } from "./entities";

export type ImportMode = "upsert" | "skip";
export type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
};
export type ImportInput = {
  companyId: string;
  csvText: string;
  mapping: Record<string, string>;
  mode: ImportMode;
};

export async function importCustomers(input: ImportInput): Promise<ImportResult | { error: string }> {
  if (!input.companyId) return { error: "Selecciona una empresa." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { records } = toRecords(parseCSV(input.csvText));
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  const { data: existing, error: exErr } = await supabase
    .from("customers")
    .select("id,email")
    .eq("company_id", input.companyId);
  if (exErr) return { error: exErr.message };
  const byEmail = new Map<string, string>();
  for (const c of existing ?? []) if (c.email) byEmail.set(c.email.toLowerCase(), c.id);

  for (let i = 0; i < records.length; i++) {
    const { values, errors } = validateRecord(records[i], CUSTOMER_FIELDS, input.mapping);
    if (errors.length) {
      result.errors.push({ row: i + 2, message: errors.join("; ") });
      continue;
    }
    const email = (values.email as string) || null;
    const payload = {
      company_id: input.companyId,
      name: values.name as string,
      type: ((values.type as string) || "particular") as "particular" | "tienda" | "mayorista",
      status: ((values.status as string) || "lead") as "lead" | "active" | "inactive",
      email,
      phone: (values.phone as string) || null,
      tags: (values.tags as string[]) ?? [],
      notes: (values.notes as string) || null,
    };
    const existingId = email ? byEmail.get(email.toLowerCase()) : undefined;
    if (existingId) {
      if (input.mode === "skip") {
        result.skipped++;
        continue;
      }
      const { error } = await supabase
        .from("customers")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", existingId);
      if (error) result.errors.push({ row: i + 2, message: error.message });
      else result.updated++;
    } else {
      const { data, error } = await supabase
        .from("customers")
        .insert({ ...payload, created_by: user?.id ?? null })
        .select("id")
        .single();
      if (error) result.errors.push({ row: i + 2, message: error.message });
      else {
        result.created++;
        if (email && data) byEmail.set(email.toLowerCase(), data.id);
      }
    }
  }
  revalidatePath("/crm");
  revalidatePath("/importar");
  return result;
}

export async function importProducts(input: ImportInput): Promise<ImportResult | { error: string }> {
  if (!input.companyId) return { error: "Selecciona una empresa." };
  const supabase = await createClient();
  const { records } = toRecords(parseCSV(input.csvText));
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  const { data: existing, error: exErr } = await supabase
    .from("products")
    .select("id,sku")
    .eq("company_id", input.companyId);
  if (exErr) return { error: exErr.message };
  const bySku = new Map<string, string>();
  for (const p of existing ?? []) if (p.sku) bySku.set(p.sku, p.id);

  const { data: cats, error: catErr } = await supabase
    .from("categories")
    .select("id,name")
    .eq("company_id", input.companyId);
  if (catErr) return { error: catErr.message };
  const catByName = new Map<string, string>();
  for (const c of cats ?? []) catByName.set(c.name.toLowerCase(), c.id);

  for (let i = 0; i < records.length; i++) {
    const { values, errors } = validateRecord(records[i], PRODUCT_FIELDS, input.mapping);
    if (errors.length) {
      result.errors.push({ row: i + 2, message: errors.join("; ") });
      continue;
    }

    let category_id: string | null = null;
    const catName = (values.category as string) || "";
    if (catName) {
      const key = catName.toLowerCase();
      category_id = catByName.get(key) ?? null;
      if (!category_id) {
        const { data, error } = await supabase
          .from("categories")
          .insert({ company_id: input.companyId, name: catName })
          .select("id")
          .single();
        if (error) {
          result.errors.push({ row: i + 2, message: `categoría: ${error.message}` });
          continue;
        }
        category_id = data.id;
        catByName.set(key, data.id);
      }
    }

    const sku = (values.sku as string) || null;
    const payload = {
      company_id: input.companyId,
      category_id,
      name: values.name as string,
      sku,
      description: (values.description as string) || null,
      cost: (values.cost as number) ?? 0,
      price: (values.price as number) ?? 0,
      status: ((values.status as string) || "active") as "active" | "inactive",
      low_stock_threshold: (values.low_stock_threshold as number) ?? 0,
    };
    const existingId = sku ? bySku.get(sku) : undefined;
    if (existingId) {
      if (input.mode === "skip") {
        result.skipped++;
        continue;
      }
      const { error } = await supabase
        .from("products")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", existingId);
      if (error) result.errors.push({ row: i + 2, message: error.message });
      else result.updated++;
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      if (error) result.errors.push({ row: i + 2, message: error.message });
      else {
        result.created++;
        if (sku && data) bySku.set(sku, data.id);
      }
    }
  }
  revalidatePath("/inventario");
  revalidatePath("/importar");
  return result;
}
```

- [ ] **Step 2: Type-check passes via build later** — no unit test (DB-bound). Verify it compiles in Task 6's build.

- [ ] **Step 3: Commit**

```bash
git add src/lib/importar/actions.ts
git commit -m "feat(importar): importCustomers/importProducts server actions (dedupe + per-row report)"
```

---

## Task 4: Import wizard (`components/importar/import-wizard.tsx`)

**Files:**
- Create: `src/components/importar/import-wizard.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/importar/import-wizard.tsx`:

```tsx
"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/atelier/field-error";
import { KpiGrid, KpiCard } from "@/components/atelier/kpi";
import { parseCSV, toRecords } from "@/lib/importar/csv";
import { CUSTOMER_FIELDS, PRODUCT_FIELDS, autoMatch, validateRecord, type FieldDef } from "@/lib/importar/entities";
import { importCustomers, importProducts, type ImportInput, type ImportMode, type ImportResult } from "@/lib/importar/actions";

type Entity = "customers" | "products";
type Company = { id: string; name: string };

const ENTITIES: { value: Entity; label: string; fields: FieldDef[]; dedupe: string }[] = [
  { value: "customers", label: "Clientes", fields: CUSTOMER_FIELDS, dedupe: "email" },
  { value: "products", label: "Productos", fields: PRODUCT_FIELDS, dedupe: "SKU" },
];

const labelCls = "font-mono text-[10px] uppercase tracking-[0.06em] text-ink-4";
const inputCls = "block w-full border border-line bg-elevated px-2 py-1.5 text-sm text-ink";

export function ImportWizard({ companies }: { companies: Company[] }) {
  const [step, setStep] = useState(1);
  const [entity, setEntity] = useState<Entity>("customers");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<ImportMode>("upsert");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>();

  const conf = ENTITIES.find((e) => e.value === entity)!;
  const fields = conf.fields;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { headers: hs, records: recs } = toRecords(parseCSV(text));
    if (hs.length === 0) {
      setError("El archivo está vacío o no tiene cabeceras.");
      return;
    }
    setError(undefined);
    setFileName(file.name);
    setCsvText(text);
    setHeaders(hs);
    setRecords(recs);
    setMapping(autoMatch(hs, fields));
    setStep(2);
  }

  function setMap(header: string, fieldKey: string) {
    setMapping((prev) => {
      const next: Record<string, string> = {};
      for (const [h, k] of Object.entries(prev)) next[h] = k === fieldKey && fieldKey !== "" ? "" : k;
      next[header] = fieldKey;
      return next;
    });
  }

  const preview = useMemo(() => {
    const rowsOut = records.map((rec) => validateRecord(rec, fields, mapping));
    const valid = rowsOut.filter((r) => r.errors.length === 0).length;
    return { rowsOut, valid, invalid: rowsOut.length - valid };
  }, [records, fields, mapping]);

  const fieldToHeader = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [h, k] of Object.entries(mapping)) if (k) out[k] = h;
    return out;
  }, [mapping]);

  const requiredMapped = fields.filter((f) => f.required).every((f) => Object.values(mapping).includes(f.key));

  async function onImport() {
    setBusy(true);
    setError(undefined);
    const input: ImportInput = { companyId, csvText, mapping, mode };
    const res = entity === "customers" ? await importCustomers(input) : await importProducts(input);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      toast.error("Falló la importación", { description: res.error });
      return;
    }
    setResult(res);
    setStep(5);
    toast.success(`Hecho: ${res.created} creados · ${res.updated} actualizados`);
  }

  function reset() {
    setStep(1);
    setFileName("");
    setCsvText("");
    setHeaders([]);
    setRecords([]);
    setMapping({});
    setResult(null);
    setError(undefined);
  }

  return (
    <div className="space-y-6">
      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="flex gap-2">
            {ENTITIES.map((e) => (
              <button
                key={e.value}
                type="button"
                onClick={() => setEntity(e.value)}
                className={`border px-4 py-2 text-sm ${entity === e.value ? "border-ink bg-ink text-paper" : "border-line bg-elevated text-ink"}`}
              >
                {e.label}
              </button>
            ))}
          </div>
          {companies.length > 1 && (
            <label className="block space-y-1.5">
              <span className={labelCls}>Empresa</span>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={inputCls}>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block space-y-1.5">
            <span className={labelCls}>Archivo CSV</span>
            <input type="file" accept=".csv,text/csv" onChange={onFile} className={inputCls} />
          </label>
          <p className="text-[12px] text-ink-4">
            Dedupe por <strong>{conf.dedupe}</strong>. Si la clave viene vacía, siempre se crea.
          </p>
          <FieldError msg={error} />
        </div>
      )}

      {/* STEP 2: mapping */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-[13px] text-ink-3">{fileName} · {records.length} filas</p>
          <div className="border border-line">
            {headers.map((h) => (
              <div key={h} className="flex items-center justify-between gap-3 border-b border-line bg-elevated px-4 py-2.5 last:border-0">
                <span className="truncate font-mono text-[12px] text-ink">{h}</span>
                <select value={mapping[h] ?? ""} onChange={(e) => setMap(h, e.target.value)} className="w-48 border border-line bg-paper px-2 py-1.5 text-sm text-ink">
                  <option value="">(ignorar)</option>
                  {fields.map((f) => (
                    <option key={f.key} value={f.key}>{f.label}{f.required ? " *" : ""}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {!requiredMapped && <FieldError msg="Asigna todos los campos obligatorios (*) antes de continuar." />}
          <div className="flex justify-between">
            <Button variant="outline" onClick={reset}>Atrás</Button>
            <Button onClick={() => setStep(3)} disabled={!requiredMapped}>Vista previa</Button>
          </div>
        </div>
      )}

      {/* STEP 3: preview */}
      {step === 3 && (
        <div className="space-y-4">
          <KpiGrid>
            <KpiCard label="Filas válidas" value={preview.valid} index="ok" />
            <KpiCard label="Con error" value={preview.invalid} index="err" />
            <KpiCard label="Total" value={records.length} index="nº" />
          </KpiGrid>
          <div className="overflow-x-auto border border-line">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-line bg-elevated">
                  <th className="px-2 py-1.5 text-left font-mono text-[10px] uppercase text-ink-4">#</th>
                  {fields.filter((f) => fieldToHeader[f.key]).map((f) => (
                    <th key={f.key} className="px-2 py-1.5 text-left font-mono text-[10px] uppercase text-ink-4">{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 20).map((rec, i) => {
                  const row = preview.rowsOut[i];
                  return (
                    <tr key={i} className={`border-b border-line last:border-0 ${row.errors.length ? "bg-[var(--danger-bg,#fee)]" : ""}`}>
                      <td className="px-2 py-1 text-ink-4">{i + 2}</td>
                      {fields.filter((f) => fieldToHeader[f.key]).map((f) => (
                        <td key={f.key} className="px-2 py-1 text-ink">{rec[fieldToHeader[f.key]] ?? ""}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {preview.invalid > 0 && (
            <p className="text-[12px] text-ink-4">Las {preview.invalid} filas con error se omitirán y se listarán en el resultado.</p>
          )}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
            <Button onClick={() => setStep(4)} disabled={preview.valid === 0}>Opciones</Button>
          </div>
        </div>
      )}

      {/* STEP 4: options */}
      {step === 4 && (
        <div className="space-y-5">
          <fieldset className="space-y-3">
            <legend className={labelCls}>Si ya existe ({conf.dedupe})</legend>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" name="mode" checked={mode === "upsert"} onChange={() => setMode("upsert")} className="accent-[var(--brand)]" />
              Actualizar el registro existente (upsert)
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" name="mode" checked={mode === "skip"} onChange={() => setMode("skip")} className="accent-[var(--brand)]" />
              Saltar (no tocar el existente)
            </label>
          </fieldset>
          <p className="text-[13px] text-ink-3">Se importarán <strong>{preview.valid}</strong> filas a <strong>{conf.label}</strong>.</p>
          <FieldError msg={error} />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>Atrás</Button>
            <Button onClick={onImport} disabled={busy}>{busy ? "Importando…" : "Importar"}</Button>
          </div>
        </div>
      )}

      {/* STEP 5: result */}
      {step === 5 && result && (
        <div className="space-y-5">
          <KpiGrid>
            <KpiCard label="Creados" value={result.created} index="+" />
            <KpiCard label="Actualizados" value={result.updated} index="~" />
            <KpiCard label="Saltados" value={result.skipped} index="–" />
            <KpiCard label="Errores" value={result.errors.length} index="!" />
          </KpiGrid>
          {result.errors.length > 0 && (
            <div className="border border-line">
              <p className="border-b border-line bg-elevated px-4 py-2 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-4">Errores</p>
              <ul className="max-h-64 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <li key={i} className="border-b border-line px-4 py-1.5 text-[12px] text-ink-3 last:border-0">Fila {e.row}: {e.message}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={reset}>Importar otro archivo</Button>
            <a href={entity === "customers" ? "/crm" : "/inventario"} className="inline-flex items-center border border-line bg-elevated px-4 py-2 text-sm text-ink">
              Ver {conf.label}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/importar/import-wizard.tsx
git commit -m "feat(importar): 5-step CSV import wizard (client)"
```

---

## Task 5: Hub page + nav entry

**Files:**
- Create: `src/app/(app)/importar/page.tsx`
- Modify: `src/components/app-shell/nav-config.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/(app)/importar/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/atelier/page-header";
import { ImportWizard } from "@/components/importar/import-wizard";

export default async function ImportarPage() {
  const supabase = await createClient();
  const { data: companies } = await supabase.from("companies").select("id,name").order("name");
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Operaciones" title="Importar datos" />
      <p className="max-w-2xl text-[14px] text-ink-3">
        Migra clientes o productos desde un archivo CSV de otro software. Sube el archivo,
        asigna las columnas, revisa la vista previa y confirma.
      </p>
      <ImportWizard companies={companies ?? []} />
    </div>
  );
}
```

- [ ] **Step 2: Add the nav entry**

In `src/components/app-shell/nav-config.tsx`, add `Upload` to the lucide import block (line ~21, next to `Undo2`):

```ts
  Undo2,
  Upload,
  type LucideIcon,
```

Then add the entry under Operaciones, right after the Devoluciones item (currently line 35):

```ts
      { href: "/devoluciones", label: "Devoluciones", icon: Undo2 },
      { href: "/importar", label: "Importar datos", icon: Upload },
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/importar/page.tsx src/components/app-shell/nav-config.tsx
git commit -m "feat(importar): hub page and Operaciones nav entry"
```

---

## Task 6: Verify, build, deploy

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit suite**

Run: `npm test`
Expected: PASS, including the new `csv.test.ts` and `entities.test.ts`.

- [ ] **Step 2: Production build (type-check + compile)**

Run: `npm run build`
Expected: build succeeds; `/importar` appears in the route list; no type errors from `actions.ts` / `import-wizard.tsx`.

- [ ] **Step 3: Manual smoke (optional but recommended)**

Start `npm run dev`. Create two small CSVs (clientes with `nombre,email,tipo`; productos with `nombre,sku,categoria,precio`). For each: open `/importar`, pick entity, upload, confirm auto-mapping, check preview flags a deliberately bad row (e.g. `tipo=vip`), import in `skip` then `upsert`, and confirm counts + that rows appear in `/crm` and `/inventario` with categories auto-created.

- [ ] **Step 4: Deploy (fast-forward to `main`)**

```bash
git push origin frontend-atelier
```

Then fast-forward `main` to `frontend-atelier` via the GitHub API (`PATCH refs/heads/main`, `force:false`). If rejected because `main` advanced, `git merge origin/main --no-edit`, re-push, retry the fast-forward.

- [ ] **Step 5: Update memory**

Append the Importador module to `panel-modulos-atelier.md` (no migration consumed; next free migration stays **0034**) and refresh the index line in `MEMORY.md`.

---

## Self-Review

**Spec coverage:**
- §4 csv.ts → Task 1 ✅; §4 entities.ts → Task 2 ✅
- §5 field catalog → Task 2 (`CUSTOMER_FIELDS`/`PRODUCT_FIELDS`) ✅
- §6 server actions (re-parse, dedupe, categories, per-row errors, revalidate) → Task 3 ✅
- §7 wizard 5 steps → Task 4 ✅; §7 hub page → Task 5 ✅
- §8 nav (additive, no sidebar) → Task 5 ✅
- §9 security (server re-validates, RLS, created_by) → Task 3 ✅
- §12 testing → Tasks 1, 2, 6 ✅
- Out of scope §11 respected (CSV only, no images, no stock, no migration).

**Placeholder scan:** none — every code step is complete.

**Type consistency:** `ImportInput`/`ImportResult`/`ImportMode` defined in Task 3 and imported in Task 4; `FieldDef`, `CUSTOMER_FIELDS`, `PRODUCT_FIELDS`, `autoMatch`, `validateRecord`, `parseCSV`, `toRecords` defined in Tasks 1–2 and consumed consistently in Tasks 3–4. `validateRecord` returns `{ values, errors }` everywhere. Atelier imports (`Button`, `FieldError` `msg=`, `KpiGrid`/`KpiCard` `label/value/index`, `PageHeader` `eyebrow/title`) match verified signatures.
