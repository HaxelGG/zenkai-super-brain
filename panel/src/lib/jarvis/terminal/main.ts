import { parseInput } from "./parse-input";
import { SLASH_COMMANDS, resolveCommand, filterCommands, type SlashCommand } from "./slash-commands";
import { renderBlock, type OutputBlock } from "./render";

// Subconjunto estructural del JarvisRunResult del orquestador
// (fuente de verdad: scripts/jarvis/orchestrator.ts). Mantener en sync si
// cambia la respuesta de /api/jarvis/run.
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
    const s = (await res.json()) as { agents?: unknown[]; keys?: { ready?: boolean }; director?: { id?: string } };
    append({
      type: "card-kpis",
      title: "Estado de la agencia",
      items: [
        { label: "director", value: s.director?.id ?? "JARVIS" },
        { label: "agentes", value: String(s.agents?.length ?? "—") },
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
