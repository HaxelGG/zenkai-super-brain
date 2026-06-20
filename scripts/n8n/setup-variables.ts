/**
 * Sincroniza Variables de instancia n8n Cloud desde `.env`.
 *
 * n8n Cloud bloquea `$env.*` en nodos (N8N_BLOCK_ENV_ACCESS_IN_NODE).
 * Los workflows Sprint 1 leen secrets vía `$vars.*` → Settings → Variables.
 *
 * Requiere:
 *   N8N_API_KEY  — Settings → n8n API → Create API Key (scopes: variable:*)
 *   N8N_BASE_URL — default: https://zenkai-growth-systems.app.n8n.cloud
 *
 * Uso:
 *   npm run n8n:vars              # dry-run
 *   npm run n8n:vars -- --apply   # crea/actualiza variables
 */
import "dotenv/config";

const BASE = (process.env.N8N_BASE_URL ?? "https://zenkai-growth-systems.app.n8n.cloud").replace(
  /\/$/,
  "",
);

/** Variables que los workflows Sprint 1 consumen vía `$vars.KEY`. */
const VARS: { key: string; env: string; required?: boolean; fallback?: string }[] = [
  { key: "AIRTABLE_BASE_VENTAS", env: "AIRTABLE_BASE_VENTAS", required: true },
  { key: "AIRTABLE_TOKEN", env: "AIRTABLE_TOKEN", required: true },
  { key: "RESEND_API_KEY", env: "RESEND_API_KEY", required: true },
  { key: "ANTHROPIC_API_KEY", env: "ANTHROPIC_API_KEY", required: true },
  {
    key: "ZENKAI_FROM_EMAIL",
    env: "ZENKAI_FROM_EMAIL",
    fallback: "ZENKAI <hola@zenkai.systems>",
  },
  { key: "ZENKAI_ALERT_EMAIL", env: "ZENKAI_ALERT_EMAIL", fallback: "hola@zenkai.systems" },
  {
    key: "N8N_JARVIS_CALLBACK_URL",
    env: "N8N_JARVIS_CALLBACK_URL",
    fallback: `${BASE}/webhook/jarvis-callback`,
  },
  { key: "SLACK_WEBHOOK_URL", env: "SLACK_WEBHOOK_URL" },
];

type Variable = { id: string; key: string; value: string };

async function api<T>(
  method: string,
  path: string,
  apiKey: string,
  body?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; status: number; detail: string }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "X-N8N-API-KEY": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, status: res.status, detail: text.slice(0, 500) };
  return { ok: true, data: text ? (JSON.parse(text) as T) : ({} as T) };
}

function resolveValue(spec: (typeof VARS)[number]): string | null {
  const raw = process.env[spec.env]?.trim();
  if (raw) return raw;
  if (spec.fallback) return spec.fallback;
  if (spec.required) return null;
  return "";
}

const apply = process.argv.includes("--apply");
const printOnly = process.argv.includes("--print");
const apiKey = process.env.N8N_API_KEY?.trim();

if (!apiKey && !printOnly) {
  console.error("Falta N8N_API_KEY en .env");
  console.error("n8n Cloud → Settings → n8n API → Create API Key (variable:list, variable:create, variable:update)");
  console.error("O ejecuta: npm run n8n:vars -- --print  (valores para pegar en UI → Variables)");
  process.exit(1);
}

if (printOnly) {
  console.log("Pegar en n8n Cloud → Variables (https://zenkai-growth-systems.app.n8n.cloud/home/variables)\n");
  for (const spec of VARS) {
    const value = resolveValue(spec);
    if (value === null) {
      console.log(`# SKIP ${spec.key} — falta ${spec.env}`);
      continue;
    }
    console.log(`${spec.key}=${value}`);
  }
  console.log("\nLuego: npm run n8n:import:mcp -- --apply --force && re-test webhooks");
  process.exit(0);
}

if (!apiKey) process.exit(1);

const list = await api<{ data?: Variable[] }>("GET", "/api/v1/variables?limit=100", apiKey);
if (!list.ok) {
  console.error(`GET /variables → ${list.status}: ${list.detail}`);
  process.exit(1);
}

const existing = new Map((list.data.data ?? []).map((v) => [v.key, v]));
let created = 0;
let updated = 0;
let skipped = 0;

for (const spec of VARS) {
  const value = resolveValue(spec);
  if (value === null) {
    console.log(`[SKIP] ${spec.key} — falta ${spec.env} en .env`);
    skipped++;
    continue;
  }

  const prev = existing.get(spec.key);
  const masked = spec.key.includes("TOKEN") || spec.key.includes("KEY") ? `${value.slice(0, 6)}…` : value;

  if (!prev) {
    console.log(`${apply ? "[CREATE]" : "[DRY]"} ${spec.key} = ${masked}`);
    if (apply) {
      const res = await api<Variable>("POST", "/api/v1/variables", apiKey, { key: spec.key, value });
      if (!res.ok) {
        console.error(`  FAIL ${res.status}: ${res.detail}`);
        process.exit(1);
      }
      created++;
    }
    continue;
  }

  if (prev.value === value) {
    console.log(`[OK] ${spec.key} sin cambios`);
    continue;
  }

  console.log(`${apply ? "[UPDATE]" : "[DRY]"} ${spec.key} = ${masked}`);
  if (apply) {
    const res = await api<Variable>("PUT", `/api/v1/variables/${prev.id}`, apiKey, { key: spec.key, value });
    if (!res.ok) {
      console.error(`  FAIL ${res.status}: ${res.detail}`);
      process.exit(1);
    }
    updated++;
  }
}

console.log(`\n${apply ? "Aplicado" : "Dry-run"} · create=${created} update=${updated} skip=${skipped}`);
if (!apply) console.log("\nEjecutar: npm run n8n:vars -- --apply");
