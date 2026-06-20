# Terminal REPL de JARVIS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una terminal REPL a pantalla completa en `/jarvis/terminal` que acepta lenguaje natural y slash-commands, con historial, autocompletado y salida estructurada, reusando `/api/jarvis/run` y `window.JarvisVoice`.

**Architecture:** Página Astro full-screen que carga `jarvis-voice.js` (global `window.JarvisVoice`) y un `<script>` bundleado que importa el runtime desde `panel/src/lib/jarvis/terminal/`. La lógica pura (`parse-input`, `slash-commands`, `render`) se testea con vitest; el runtime (`main.ts`) cablea DOM, fetch y voz.

**Tech Stack:** Astro 5 (panel), TypeScript, vitest + happy-dom (nuevo en `panel/`), CSS en `jarvis.css`. Spec: `docs/superpowers/specs/2026-06-20-terminal-jarvis-design.md`. Rama: `feat/jarvis-terminal-repl`.

---

## File Structure

| Archivo | Responsabilidad |
|---------|-----------------|
| `panel/vitest.config.ts` | Config de tests (entorno node por defecto) |
| `panel/src/lib/jarvis/terminal/parse-input.ts` | `parseInput()` puro |
| `panel/src/lib/jarvis/terminal/parse-input.test.ts` | tests de parseInput |
| `panel/src/lib/jarvis/terminal/slash-commands.ts` | registro + `resolveCommand`/`filterCommands` |
| `panel/src/lib/jarvis/terminal/slash-commands.test.ts` | tests del registro |
| `panel/src/lib/jarvis/terminal/render.ts` | `renderBlock()` (OutputBlock → DOM) |
| `panel/src/lib/jarvis/terminal/render.test.ts` | tests de render (happy-dom) |
| `panel/src/lib/jarvis/terminal/main.ts` | runtime REPL |
| `panel/src/pages/jarvis/terminal.astro` | página full-screen |
| `panel/src/styles/jarvis.css` | bloque `.jvt-*` (append) |

---

### Task 1: Setup vitest + happy-dom en `panel/`

**Files:**
- Modify: `panel/package.json`
- Create: `panel/vitest.config.ts`

- [ ] **Step 1: Add devDeps + test script**

Run:
```bash
cd panel && npm install -D vitest@^2.1.0 happy-dom@^15.0.0
```
Then add to `panel/package.json` `scripts`: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 2: Create vitest config**

Create `panel/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 3: Verify vitest runs (no tests yet)**

Run: `cd panel && npx vitest run`
Expected: exits 0 with "No test files found" (or runs 0 tests). If it errors on config, fix before continuing.

- [ ] **Step 4: Commit**

```bash
git add panel/package.json panel/package-lock.json panel/vitest.config.ts
git commit -m "chore(panel): add vitest + happy-dom for terminal modules"
```

---

### Task 2: `parse-input.ts` (TDD)

**Files:**
- Create: `panel/src/lib/jarvis/terminal/parse-input.ts`
- Test: `panel/src/lib/jarvis/terminal/parse-input.test.ts`

- [ ] **Step 1: Write the failing test**

Create `panel/src/lib/jarvis/terminal/parse-input.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseInput } from "./parse-input";

describe("parseInput", () => {
  it("blanco → empty", () => {
    expect(parseInput("   ")).toEqual({ kind: "empty" });
  });
  it("texto → nl (trim)", () => {
    expect(parseInput("  resumen del día ")).toEqual({ kind: "nl", text: "resumen del día" });
  });
  it("slash sin args", () => {
    expect(parseInput("/finanzas")).toEqual({ kind: "slash", name: "finanzas", args: [], raw: "/finanzas" });
  });
  it("slash con args", () => {
    expect(parseInput("/run HERMES cualificá el lead")).toEqual({
      kind: "slash",
      name: "run",
      args: ["HERMES", "cualificá", "el", "lead"],
      raw: "/run HERMES cualificá el lead",
    });
  });
  it("nombre del comando en minúsculas", () => {
    expect(parseInput("/HELP")).toMatchObject({ kind: "slash", name: "help" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd panel && npx vitest run src/lib/jarvis/terminal/parse-input.test.ts`
Expected: FAIL — cannot find module `./parse-input`.

- [ ] **Step 3: Write minimal implementation**

Create `panel/src/lib/jarvis/terminal/parse-input.ts`:
```ts
export type ParsedInput =
  | { kind: "empty" }
  | { kind: "nl"; text: string }
  | { kind: "slash"; name: string; args: string[]; raw: string };

export function parseInput(raw: string): ParsedInput {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "empty" };
  if (trimmed.startsWith("/")) {
    const parts = trimmed.slice(1).split(/\s+/).filter(Boolean);
    const name = (parts.shift() ?? "").toLowerCase();
    return { kind: "slash", name, args: parts, raw: trimmed };
  }
  return { kind: "nl", text: trimmed };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd panel && npx vitest run src/lib/jarvis/terminal/parse-input.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add panel/src/lib/jarvis/terminal/parse-input.ts panel/src/lib/jarvis/terminal/parse-input.test.ts
git commit -m "feat(terminal): parseInput (nl/slash/empty)"
```

---

### Task 3: `slash-commands.ts` (TDD)

**Files:**
- Create: `panel/src/lib/jarvis/terminal/slash-commands.ts`
- Test: `panel/src/lib/jarvis/terminal/slash-commands.test.ts`

- [ ] **Step 1: Write the failing test**

Create `panel/src/lib/jarvis/terminal/slash-commands.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { SLASH_COMMANDS, resolveCommand, filterCommands } from "./slash-commands";

describe("slash-commands", () => {
  it("resuelve por nombre", () => {
    expect(resolveCommand("finanzas")?.kind).toBe("nav");
  });
  it("resuelve por alias (agente → run)", () => {
    expect(resolveCommand("agente")?.name).toBe("run");
  });
  it("desconocido → null", () => {
    expect(resolveCommand("nope")).toBeNull();
  });
  it("filtra por prefijo", () => {
    const names = filterCommands("fin").map((c) => c.name);
    expect(names).toContain("finanzas");
    expect(names).not.toContain("pipeline");
  });
  it("todo comando nav tiene navKey", () => {
    for (const c of SLASH_COMMANDS) {
      if (c.kind === "nav") expect(c.navKey).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd panel && npx vitest run src/lib/jarvis/terminal/slash-commands.test.ts`
Expected: FAIL — cannot find module `./slash-commands`.

- [ ] **Step 3: Write minimal implementation**

Create `panel/src/lib/jarvis/terminal/slash-commands.ts`:
```ts
import type { JarvisRouteKey } from "../config";

export type SlashCommand = {
  name: string;
  aliases?: string[];
  description: string;
  usage?: string;
  kind: "nav" | "run" | "local";
  navKey?: JarvisRouteKey;
};

export const SLASH_COMMANDS: SlashCommand[] = [
  { name: "help", description: "Lista los comandos disponibles", kind: "local" },
  { name: "clear", description: "Limpia la terminal", kind: "local" },
  { name: "status", description: "Estado de la agencia", kind: "local" },
  { name: "finanzas", description: "Ir a Finanzas", kind: "nav", navKey: "finanzas" },
  { name: "pipeline", description: "Ir a Pipeline / CRM", kind: "nav", navKey: "pipeline" },
  { name: "clientes", description: "Ir a Clientes", kind: "nav", navKey: "clientes" },
  { name: "agentes", description: "Ir a Agentes", kind: "nav", navKey: "agentes" },
  { name: "tareas", description: "Ir a Tareas", kind: "nav", navKey: "tareas" },
  { name: "social", description: "Ir a Social", kind: "nav", navKey: "social" },
  { name: "sistemas", description: "Ir a Sistemas", kind: "nav", navKey: "sistemas" },
  { name: "intel", description: "Ir a Intel Brief", kind: "nav", navKey: "intel" },
  { name: "goals", description: "Ir a Goals", kind: "nav", navKey: "goals" },
  { name: "run", aliases: ["agente"], description: "Ejecutar un agente", usage: "/run <AGENTE> <instrucción>", kind: "run" },
];

export function resolveCommand(name: string): SlashCommand | null {
  const n = name.toLowerCase();
  return SLASH_COMMANDS.find((c) => c.name === n || c.aliases?.includes(n)) ?? null;
}

export function filterCommands(prefix: string): SlashCommand[] {
  const p = prefix.toLowerCase();
  return SLASH_COMMANDS.filter((c) => c.name.startsWith(p) || c.aliases?.some((a) => a.startsWith(p)));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd panel && npx vitest run src/lib/jarvis/terminal/slash-commands.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add panel/src/lib/jarvis/terminal/slash-commands.ts panel/src/lib/jarvis/terminal/slash-commands.test.ts
git commit -m "feat(terminal): registro de slash-commands"
```

---

### Task 4: `render.ts` (TDD con happy-dom)

**Files:**
- Create: `panel/src/lib/jarvis/terminal/render.ts`
- Test: `panel/src/lib/jarvis/terminal/render.test.ts`

- [ ] **Step 1: Write the failing test**

Create `panel/src/lib/jarvis/terminal/render.test.ts`:
```ts
// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { renderBlock } from "./render";

describe("renderBlock", () => {
  it("user muestra el texto y la clase", () => {
    const e = renderBlock({ type: "user", text: "hola" });
    expect(e.textContent).toContain("hola");
    expect(e.className).toContain("jvt-line-user");
  });
  it("reply incluye badges de source/model", () => {
    const e = renderBlock({ type: "reply", text: "ok", source: "deepseek", model: "sonnet" });
    expect(e.textContent).toContain("deepseek");
    expect(e.textContent).toContain("sonnet");
  });
  it("card-kpis renderiza cada item", () => {
    const e = renderBlock({ type: "card-kpis", title: "Agencia", items: [{ label: "agentes", value: "12" }] });
    expect(e.textContent).toContain("agentes");
    expect(e.textContent).toContain("12");
  });
  it("nav-link crea un <a> con href", () => {
    const e = renderBlock({ type: "nav-link", label: "ir a finanzas", href: "/jarvis/finanzas" });
    expect(e.querySelector("a")?.getAttribute("href")).toBe("/jarvis/finanzas");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd panel && npx vitest run src/lib/jarvis/terminal/render.test.ts`
Expected: FAIL — cannot find module `./render`.

- [ ] **Step 3: Write minimal implementation**

Create `panel/src/lib/jarvis/terminal/render.ts`:
```ts
export type OutputBlock =
  | { type: "user"; text: string }
  | { type: "reply"; text: string; source?: string; model?: string; tier?: string }
  | { type: "card-kpis"; title?: string; items: { label: string; value: string }[] }
  | { type: "run-status"; agent: string; model?: string; tier?: string; note?: string }
  | { type: "nav-link"; label: string; href: string }
  | { type: "error"; text: string };

function el(tag: string, cls: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function badge(text: string, extra = ""): HTMLElement {
  return el("span", `jvt-badge ${extra}`.trim(), text);
}

export function renderBlock(block: OutputBlock): HTMLElement {
  const row = el("div", `jvt-line jvt-line-${block.type}`);
  switch (block.type) {
    case "user":
      row.append(el("span", "jvt-prompt", "jarvis ❯"), el("span", "jvt-user-text", block.text));
      break;
    case "reply": {
      row.append(el("div", "jvt-reply-text", block.text));
      const meta = el("div", "jvt-meta");
      if (block.source) meta.append(badge(block.source));
      if (block.model) meta.append(badge(block.model, "jvt-badge-amber"));
      if (block.tier) meta.append(badge(block.tier));
      if (meta.childElementCount) row.append(meta);
      break;
    }
    case "card-kpis": {
      if (block.title) row.append(el("div", "jvt-card-title", block.title));
      const grid = el("div", "jvt-kpi-grid");
      for (const it of block.items) {
        const card = el("div", "jvt-kpi");
        card.append(el("div", "jvt-kpi-label", it.label), el("div", "jvt-kpi-value", it.value));
        grid.append(card);
      }
      row.append(grid);
      break;
    }
    case "run-status": {
      const meta = el("div", "jvt-meta");
      meta.append(badge(block.agent, "jvt-badge-cyan"));
      if (block.model) meta.append(badge(block.model, "jvt-badge-amber"));
      if (block.tier) meta.append(badge(block.tier));
      if (block.note) meta.append(el("span", "jvt-note", block.note));
      row.append(meta);
      break;
    }
    case "nav-link": {
      const a = document.createElement("a");
      a.className = "jvt-nav-link";
      a.href = block.href;
      a.textContent = `↳ ${block.label}`;
      row.append(a);
      break;
    }
    case "error":
      row.append(el("div", "jvt-error-text", block.text));
      break;
  }
  return row;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd panel && npx vitest run src/lib/jarvis/terminal/render.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add panel/src/lib/jarvis/terminal/render.ts panel/src/lib/jarvis/terminal/render.test.ts
git commit -m "feat(terminal): renderBlock (tipos de salida rica)"
```

---

### Task 5: `main.ts` runtime

**Files:**
- Create: `panel/src/lib/jarvis/terminal/main.ts`

Integración (DOM + fetch + voz); se verifica con `astro check` + smoke manual, no con test unitario. El runtime asume el markup de Task 6 (ids `jvt-input`, `jvt-output`, `jvt-suggest`, `jvt-mic`) y `window.__JV_ROUTES` (mapa `JarvisRouteKey → string`) inyectado por la página.

- [ ] **Step 1: Write the runtime**

Create `panel/src/lib/jarvis/terminal/main.ts`:
```ts
import { parseInput } from "./parse-input";
import { SLASH_COMMANDS, resolveCommand, filterCommands, type SlashCommand } from "./slash-commands";
import { renderBlock, type OutputBlock } from "./render";

type JarvisRunResult = {
  reply: string;
  speech?: string;
  source?: string;
  action?: { type: string; path: string };
  meta?: { tier?: string; model?: string; fallbackReason?: string };
};

const PANEL_API = "https://panel.zenkai.systems";
const HISTORY_KEY = "zenkai_jarvis_terminal_history";
const API_KEY_STORAGE = "zenkai_jarvis_api_key";
const API_KEY_LEGACY = "zenkai_api_key";

const routes: Record<string, string> = (window as unknown as { __JV_ROUTES?: Record<string, string> }).__JV_ROUTES ?? {};

const output = document.getElementById("jvt-output");
const input = document.getElementById("jvt-input") as HTMLInputElement | null;
const suggest = document.getElementById("jvt-suggest");
const mic = document.getElementById("jvt-mic");
if (!output || !input) throw new Error("terminal: faltan #jvt-output / #jvt-input");

let history: string[] = loadHistory();
let historyIdx = history.length;
let suggestItems: SlashCommand[] = [];
let suggestIdx = 0;

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function pushHistory(cmd: string): void {
  history.push(cmd);
  history = history.slice(-100);
  historyIdx = history.length;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    /* ignore */
  }
}

function append(block: OutputBlock): void {
  output!.append(renderBlock(block));
  output!.scrollTop = output!.scrollHeight;
}

function isJarvisHost(): boolean {
  const h = location.hostname.toLowerCase();
  return h === "jarvis.zenkai.systems" || h.endsWith(".jarvis.zenkai.systems");
}
function apiBase(): string {
  const h = location.hostname.toLowerCase();
  return isJarvisHost() || h === "localhost" || h === "127.0.0.1" ? PANEL_API : "";
}
function apiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE) || localStorage.getItem(API_KEY_LEGACY) || "";
  } catch {
    return "";
  }
}
async function fetchWithTimeout(url: string, opts: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, credentials: "same-origin", signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}
function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const k = apiKey();
  if (k) h.Authorization = `Bearer ${k}`;
  return h;
}

async function runInstruction(instruction: string): Promise<void> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${apiBase()}/api/jarvis/run`,
      { method: "POST", headers: authHeaders(), body: JSON.stringify({ instruction }) },
      45000,
    );
  } catch {
    append({ type: "error", text: "Sin conexión con el cerebro JARVIS." });
    return;
  }
  if (res.status === 401 || res.status === 403) {
    append({ type: "error", text: "Sin autorización · pegá ZENKAI_API_KEY en la consola de voz (⋯)." });
    return;
  }
  if (!res.ok) {
    append({ type: "error", text: `Error ${res.status} del orquestador.` });
    return;
  }
  const data = (await res.json()) as JarvisRunResult;
  append({
    type: "reply",
    text: data.reply,
    source: data.source,
    model: data.meta?.model,
    tier: data.meta?.tier,
  });
  if (data.action?.type === "navigate" && data.action.path) {
    append({ type: "nav-link", label: `ir a ${data.action.path}`, href: normalizeNavPath(data.action.path) });
  }
}

function normalizeNavPath(path: string): string {
  if (!path) return path;
  if (isJarvisHost()) return path.replace(/^\/jarvis(\/|$)/, "/") || "/";
  return path;
}

async function showStatus(): Promise<void> {
  try {
    const res = await fetchWithTimeout(`${apiBase()}/api/agency/status`, { headers: authHeaders() }, 15000);
    if (!res.ok) {
      append({ type: "error", text: `Status ${res.status}` });
      return;
    }
    const s = (await res.json()) as { agents?: number; keys?: { ready?: boolean }; director?: { id?: string } };
    append({
      type: "card-kpis",
      title: "Estado de la agencia",
      items: [
        { label: "director", value: s.director?.id ?? "JARVIS" },
        { label: "agentes", value: String(s.agents ?? "—") },
        { label: "keys", value: s.keys?.ready ? "ready" : "incompletas" },
      ],
    });
  } catch {
    append({ type: "error", text: "No pude leer /api/agency/status." });
  }
}

function showHelp(): void {
  for (const c of SLASH_COMMANDS) {
    append({ type: "reply", text: `/${c.name}${c.usage ? "  " + c.usage : ""} — ${c.description}` });
  }
}

async function execSlash(cmd: SlashCommand, args: string[]): Promise<void> {
  if (cmd.kind === "local") {
    if (cmd.name === "clear") {
      output!.replaceChildren();
      return;
    }
    if (cmd.name === "help") return showHelp();
    if (cmd.name === "status") return showStatus();
    return;
  }
  if (cmd.kind === "nav" && cmd.navKey) {
    const href = routes[cmd.navKey] ?? `/jarvis/${cmd.navKey}`;
    append({ type: "nav-link", label: `ir a /${cmd.navKey}`, href });
    return;
  }
  if (cmd.kind === "run") {
    const agent = (args[0] ?? "").toUpperCase();
    const rest = args.slice(1).join(" ");
    if (!agent || !rest) {
      append({ type: "error", text: "Uso: /run <AGENTE> <instrucción>" });
      return;
    }
    append({ type: "run-status", agent, note: "ejecutando…" });
    await runInstruction(`[AGENTE:${agent}] ${rest}`);
  }
}

async function submit(raw: string): Promise<void> {
  const parsed = parseInput(raw);
  if (parsed.kind === "empty") return;
  append({ type: "user", text: raw.trim() });
  pushHistory(raw.trim());
  closeSuggest();
  if (parsed.kind === "nl") {
    await runInstruction(parsed.text);
    return;
  }
  const cmd = resolveCommand(parsed.name);
  if (!cmd) {
    append({ type: "error", text: `Comando desconocido: /${parsed.name}. Probá /help.` });
    return;
  }
  await execSlash(cmd, parsed.args);
}

function renderSuggest(): void {
  if (!suggest) return;
  suggest.replaceChildren();
  if (!suggestItems.length) {
    suggest.setAttribute("hidden", "");
    return;
  }
  suggest.removeAttribute("hidden");
  suggestItems.forEach((c, i) => {
    const row = document.createElement("div");
    row.className = `jvt-suggest-item${i === suggestIdx ? " jvt-suggest-active" : ""}`;
    row.textContent = `/${c.name}`;
    const d = document.createElement("span");
    d.className = "jvt-suggest-desc";
    d.textContent = ` — ${c.description}`;
    row.append(d);
    row.addEventListener("mousedown", (e) => {
      e.preventDefault();
      applySuggest(c);
    });
    suggest.append(row);
  });
}
function openSuggest(prefix: string): void {
  suggestItems = filterCommands(prefix);
  suggestIdx = 0;
  renderSuggest();
}
function closeSuggest(): void {
  suggestItems = [];
  if (suggest) suggest.setAttribute("hidden", "");
}
function applySuggest(c: SlashCommand): void {
  if (!input) return;
  input.value = `/${c.name} `;
  closeSuggest();
  input.focus();
}

input.addEventListener("input", () => {
  const v = input.value;
  if (v.startsWith("/") && !v.includes(" ")) openSuggest(v.slice(1));
  else closeSuggest();
});

input.addEventListener("keydown", (e) => {
  const suggestOpen = suggestItems.length > 0;
  if (e.key === "Enter") {
    e.preventDefault();
    if (suggestOpen && suggestItems[suggestIdx]) {
      applySuggest(suggestItems[suggestIdx]);
      return;
    }
    const v = input.value;
    input.value = "";
    void submit(v);
    return;
  }
  if (e.key === "Escape") {
    closeSuggest();
    return;
  }
  if (e.key === "Tab" && suggestOpen) {
    e.preventDefault();
    const item = suggestItems[suggestIdx];
    if (item) applySuggest(item);
    return;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (suggestOpen) {
      suggestIdx = Math.max(0, suggestIdx - 1);
      renderSuggest();
    } else if (historyIdx > 0) {
      historyIdx -= 1;
      input.value = history[historyIdx] ?? "";
    }
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (suggestOpen) {
      suggestIdx = Math.min(suggestItems.length - 1, suggestIdx + 1);
      renderSuggest();
    } else if (historyIdx < history.length) {
      historyIdx += 1;
      input.value = history[historyIdx] ?? "";
    }
    return;
  }
});

mic?.addEventListener("click", () => {
  (window as unknown as { JarvisVoice?: { startCommandMode?: () => void } }).JarvisVoice?.startCommandMode?.();
});
window.addEventListener("jarvis-voice-command", (e) => {
  const detail = (e as CustomEvent<{ text?: string }>).detail;
  if (detail?.text) void submit(detail.text);
});

append({ type: "reply", text: "JARVIS en línea. Escribí un comando o /help para ver las opciones." });
input.focus();
```

- [ ] **Step 2: Typecheck (página aún no existe; verifica el módulo)**

Run: `cd panel && npx astro check 2>&1 | tail -20`
Expected: sin errores en `src/lib/jarvis/terminal/main.ts` (puede haber otros no relacionados). Si `astro check` se queja de `main.ts` por falta de DOM types, confirmá que `panel/tsconfig.json` incluye `"lib": ["DOM", ...]` o el preset de Astro (que ya lo trae). No debe haber errores de tipos en este archivo.

- [ ] **Step 3: Commit**

```bash
git add panel/src/lib/jarvis/terminal/main.ts
git commit -m "feat(terminal): runtime REPL (historial, autocompletado, bridge, voz)"
```

---

### Task 6: `terminal.astro` (página full-screen)

**Files:**
- Create: `panel/src/pages/jarvis/terminal.astro`

- [ ] **Step 1: Write the page**

Create `panel/src/pages/jarvis/terminal.astro`:
```astro
---
import "../../styles/global.css";
import "../../styles/jarvis.css";
import JarvisVoiceOrb from "../../components/jarvis/JarvisVoiceOrb.astro";
import { resolveJarvisRoutes } from "../../lib/jarvis/config";

const routes = resolveJarvisRoutes(Astro.url.hostname);
const routesJson = JSON.stringify(routes);
---

<!doctype html>
<html lang="es" class="jarvis-app">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="theme-color" content="#030810" />
    <link rel="icon" type="image/svg+xml" href="/jarvis-favicon.svg" />
    <title>Terminal · JARVIS · ZENKAI</title>
    <script is:inline set:html={`window.__JV_ROUTES = ${routesJson};`} />
    <script src="/jarvis-sounds.js?v=20260620f" defer></script>
    <script src="/jarvis-voice.js?v=20260620f" defer></script>
  </head>
  <body>
    <div id="jv-voice-toast" class="jv-voice-toast" aria-live="polite" aria-atomic="true"></div>
    <div class="jarvis-scanline" aria-hidden="true"></div>
    <main class="jvt-shell">
      <header class="jvt-bar">
        <div class="jvt-brand"><span class="jvt-dot"></span> jarvis // terminal</div>
        <div class="jvt-bar-right">
          <JarvisVoiceOrb />
          <a class="jvt-back" href={routes.home}>← HUD</a>
        </div>
      </header>
      <section id="jvt-output" class="jvt-output" aria-live="polite"></section>
      <div class="jvt-suggest-wrap">
        <div id="jvt-suggest" class="jvt-suggest" hidden></div>
        <div class="jvt-input-row">
          <span class="jvt-prompt">jarvis ❯</span>
          <input
            id="jvt-input"
            class="jvt-input"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="comando o lenguaje natural · /help"
            enterkeyhint="send"
          />
          <button id="jvt-mic" class="jvt-mic" type="button" aria-label="Dictar por voz">●</button>
        </div>
        <div class="jvt-hint">↑↓ historial · enter envía · / autocompleta · orb = voz</div>
      </div>
    </main>
    <script>
      import "../../lib/jarvis/terminal/main";
    </script>
  </body>
</html>
```

- [ ] **Step 2: Build to verify it compiles and bundles the runtime**

Run: `cd panel && npm run build 2>&1 | tail -25`
Expected: `astro check` + build pass; `/jarvis/terminal` aparece en las páginas generadas. Si `astro check` falla por tipos en la página o el import, corregir antes de seguir.

- [ ] **Step 3: Commit**

```bash
git add panel/src/pages/jarvis/terminal.astro
git commit -m "feat(terminal): pagina full-screen /jarvis/terminal"
```

---

### Task 7: Estilos `.jvt-*` en `jarvis.css`

**Files:**
- Modify: `panel/src/styles/jarvis.css` (append al final)

- [ ] **Step 1: Append the styles**

Append a `panel/src/styles/jarvis.css`:
```css
.jvt-shell { display: flex; flex-direction: column; height: 100vh; height: 100dvh; background: var(--jv-bg); color: var(--jv-text); font-family: var(--jv-mono, ui-monospace, monospace); }
.jvt-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid var(--jv-border); background: rgba(10,15,24,.6); }
.jvt-brand { color: var(--jv-cyan); font-size: 12px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; }
.jvt-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--jv-success, #5dcaa5); }
.jvt-bar-right { display: flex; align-items: center; gap: 12px; }
.jvt-back { color: var(--jv-text-muted); font-size: 12px; text-decoration: none; }
.jvt-back:hover { color: var(--jv-cyan); }
.jvt-output { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; font-size: 13px; line-height: 1.7; }
.jvt-line { margin-bottom: 10px; }
.jvt-prompt { color: var(--jv-cyan); margin-right: 8px; }
.jvt-user-text { color: var(--jv-text-muted); }
.jvt-reply-text { color: var(--jv-text); white-space: pre-wrap; }
.jvt-meta { margin-top: 4px; display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.jvt-badge { font-size: 10px; padding: 1px 7px; border-radius: 3px; border: 1px solid var(--jv-border); color: var(--jv-text-muted); }
.jvt-badge-cyan { background: var(--jv-cyan); color: #06121c; border-color: transparent; }
.jvt-badge-amber { background: #efb04a; color: #2a1c02; border-color: transparent; }
.jvt-note { font-size: 11px; color: var(--jv-text-muted); }
.jvt-card-title { color: var(--jv-text-muted); font-size: 11px; margin-bottom: 6px; }
.jvt-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; }
.jvt-kpi { border: 1px solid var(--jv-border); border-radius: 6px; padding: 8px 10px; }
.jvt-kpi-label { color: var(--jv-text-muted); font-size: 10px; }
.jvt-kpi-value { color: var(--jv-cyan); font-size: 16px; }
.jvt-nav-link { color: var(--jv-cyan); text-decoration: none; }
.jvt-nav-link:hover { text-decoration: underline; }
.jvt-error-text { color: var(--jv-danger, #e24b4a); }
.jvt-suggest-wrap { position: relative; border-top: 1px solid var(--jv-border); background: rgba(10,15,24,.6); padding: 10px 16px; }
.jvt-suggest { position: absolute; bottom: 100%; left: 16px; right: 16px; background: var(--jv-bg); border: 1px solid var(--jv-border); border-radius: 6px; overflow: hidden; max-height: 220px; overflow-y: auto; }
.jvt-suggest-item { padding: 6px 10px; color: var(--jv-text); cursor: pointer; }
.jvt-suggest-active { background: rgba(77,226,255,.12); color: var(--jv-cyan); }
.jvt-suggest-desc { color: var(--jv-text-muted); }
.jvt-input-row { display: flex; align-items: center; gap: 8px; }
.jvt-input { flex: 1; background: transparent; border: 0; outline: 0; color: var(--jv-text); font-family: inherit; font-size: 14px; }
.jvt-input::placeholder { color: var(--jv-text-dim, #5a6b7d); }
.jvt-mic { width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--jv-border); background: transparent; color: var(--jv-cyan); cursor: pointer; }
.jvt-hint { margin-top: 6px; font-size: 10px; color: var(--jv-text-dim, #3a4757); }
```

- [ ] **Step 2: Verify visually (smoke)**

Run: `cd panel && npm run dev` then open `http://localhost:4321/jarvis/terminal`.
Expected: terminal oscura full-screen, prompt cyan, input abajo, hint visible. (Si las vars `--jv-*` faltan, confirmá los nombres reales en `jarvis.css` y ajustá los fallbacks.)

- [ ] **Step 3: Commit**

```bash
git add panel/src/styles/jarvis.css
git commit -m "style(terminal): estetica .jvt-* de la terminal"
```

---

### Task 8: Verificación end-to-end

**Files:** ninguno (solo verificación)

- [ ] **Step 1: Unit tests verdes**

Run: `cd panel && npx vitest run`
Expected: PASS — parse-input (5), slash-commands (5), render (4).

- [ ] **Step 2: Typecheck + build**

Run: `cd panel && npm run build 2>&1 | tail -15`
Expected: `astro check` sin errores; build OK con `/jarvis/terminal`.

- [ ] **Step 3: Smoke manual (Chrome/Edge)**

`npm run dev` → `http://localhost:4321/jarvis/terminal`. Verificar contra los criterios de aceptación del spec:
1. Carga full-screen monospace.
2. Texto NL + Enter → reply con badges (requiere API; si 401, pegar ZENKAI_API_KEY en la consola de voz del HUD primero).
3. `/finanzas` → link de navegación clicable.
4. `/run HERMES probando` → run-status + reply.
5. `/status` → tarjeta con director / agentes / keys.
6. `/help` lista; `/clear` limpia.
7. ↑↓ recorre historial; `/` abre autocompletado (Tab/Enter/Esc, ↑↓ navegan el menú).
8. Botón mic dispara la voz.

- [ ] **Step 4: Final commit (si quedó algo)**

```bash
git add -A panel/
git commit -m "test(terminal): verificacion e2e de la terminal REPL" || echo "nada que commitear"
```

---

## Notas para el ejecutor

- Reusar nombres exactos entre módulos: `OutputBlock` (render.ts), `SlashCommand`/`SLASH_COMMANDS`/`resolveCommand`/`filterCommands` (slash-commands.ts), `ParsedInput`/`parseInput` (parse-input.ts). `main.ts` los importa tal cual.
- No auto-redirigir en navegación: la terminal emite un `nav-link` clicable, nunca cambia `location` sola (criterio del spec).
- Auth y base de API replican el patrón de `panel/public/jarvis-voice.js` (Bearer de `zenkai_jarvis_api_key`, proxy a `panel.zenkai.systems` en host jarvis/localhost).
- Si `--jv-mono`, `--jv-success`, `--jv-danger`, `--jv-text-dim` no existen en `jarvis.css`, los fallbacks inline cubren; opcionalmente definirlos en `:root.jarvis-app`.
