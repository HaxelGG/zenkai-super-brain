/**
 * Importa workflows Sprint 1 a n8n Cloud vía REST API.
 *
 * Requiere en .env:
 *   N8N_API_KEY       — Settings → n8n API → Create API Key (owner)
 *   N8N_BASE_URL      — default: https://zenkai-growth-systems.app.n8n.cloud
 *
 * Uso:
 *   npm run n8n:import              # dry-run (lista + valida)
 *   npm run n8n:import -- --apply   # crea + activa en orden M-04→M-03→M-02→S-01
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ORDER = [
  "ZENKAI-M-04-hot-lead-alert.json",
  "LEADS-05-qualify-on-create.json",
  "ZENKAI-M-02-demo-autoreply.json",
  "ZENKAI-S-01-sla-form-3h.json",
] as const;

type WorkflowExport = {
  name: string;
  nodes: unknown[];
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
  staticData?: unknown;
  pinData?: unknown;
};

type ApiWorkflow = WorkflowExport & { id?: string; active?: boolean };

function baseUrl(): string {
  const raw = process.env.N8N_BASE_URL ?? "https://zenkai-growth-systems.app.n8n.cloud";
  return raw.replace(/\/$/, "");
}

function loadExport(filename: string): WorkflowExport {
  const path = join(process.cwd(), "jarvis", "n8n", filename);
  const raw = JSON.parse(readFileSync(path, "utf8")) as WorkflowExport;
  if (!raw.name || !raw.nodes?.length || !raw.connections) {
    throw new Error(`${filename}: export inválido (name/nodes/connections)`);
  }
  return raw;
}

function toCreateBody(exp: WorkflowExport): WorkflowExport {
  return {
    name: exp.name,
    nodes: exp.nodes,
    connections: exp.connections,
    ...(exp.settings ? { settings: exp.settings } : {}),
    ...(exp.staticData ? { staticData: exp.staticData } : {}),
    ...(exp.pinData ? { pinData: exp.pinData } : {}),
  };
}

async function api<T>(
  method: string,
  path: string,
  apiKey: string,
  body?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; status: number; detail: string }> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      "X-N8N-API-KEY": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, detail: text.slice(0, 400) };
  }
  const data = text ? (JSON.parse(text) as T) : ({} as T);
  return { ok: true, data };
}

async function listWorkflows(apiKey: string): Promise<ApiWorkflow[]> {
  const res = await api<{ data?: ApiWorkflow[] } | ApiWorkflow[]>("GET", "/api/v1/workflows", apiKey);
  if (!res.ok) throw new Error(`GET workflows → HTTP ${res.status}: ${res.detail}`);
  const payload = res.data;
  if (Array.isArray(payload)) return payload;
  return payload.data ?? [];
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const apiKey = process.env.N8N_API_KEY?.trim();
  const url = baseUrl();

  console.log(`ZENKAI n8n import ${apply ? "APPLY" : "dry-run"}`);
  console.log(`Instance: ${url}\n`);

  for (const file of ORDER) {
    const exp = loadExport(file);
    const webhooks = (exp.nodes as { type?: string; parameters?: { path?: string } }[]).filter(
      (n) => n.type === "n8n-nodes-base.webhook",
    );
    const path = webhooks[0]?.parameters?.path ?? "(cron)";
    console.log(`  • ${file} → ${exp.name} [${path}]`);
  }

  if (!apiKey) {
    console.log("\nFalta N8N_API_KEY en .env");
    console.log("n8n Cloud → Settings → n8n API → Create API Key");
    console.log("Luego: npm run n8n:import -- --apply");
    process.exit(apply ? 1 : 0);
  }

  let existing: ApiWorkflow[] = [];
  try {
    existing = await listWorkflows(apiKey);
    console.log(`\nWorkflows en instancia: ${existing.length}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`\nNo se pudo listar workflows: ${msg}`);
    console.error("Verifica N8N_API_KEY y que la API esté habilitada (Settings → n8n API).");
    process.exit(1);
  }

  if (!apply) {
    console.log("\nDry-run OK. Para importar: npm run n8n:import -- --apply");
    return;
  }

  console.log("\nImportando en orden Sprint 1…\n");

  for (const file of ORDER) {
    const exp = loadExport(file);
    const found = existing.find((w) => w.name === exp.name);

    let id = found?.id;
    if (found?.id) {
      console.log(`[SKIP CREATE] ${exp.name} ya existe (${found.id})`);
    } else {
      const created = await api<ApiWorkflow>("POST", "/api/v1/workflows", apiKey, toCreateBody(exp));
      if (!created.ok) {
        console.error(`[FAIL] ${exp.name} → HTTP ${created.status}: ${created.detail}`);
        process.exit(1);
      }
      id = created.data.id;
      console.log(`[CREATED] ${exp.name} → ${id}`);
      existing.push(created.data);
    }

    if (!id) {
      console.error(`[FAIL] ${exp.name} — sin id`);
      process.exit(1);
    }

    const active = existing.find((w) => w.id === id)?.active;
    if (active) {
      console.log(`[ACTIVE] ${exp.name} ya activo`);
      continue;
    }

    const act = await api<ApiWorkflow>("POST", `/api/v1/workflows/${id}/activate`, apiKey, {});
    if (!act.ok) {
      console.error(`[FAIL ACTIVATE] ${exp.name} → HTTP ${act.status}: ${act.detail}`);
      process.exit(1);
    }
    console.log(`[ACTIVATED] ${exp.name}`);
  }

  console.log("\nPost-import manual (no automatizable vía API):");
  console.log("  1. Mapear credenciales Airtable + Resend + Anthropic en cada workflow");
  console.log("  2. Settings → Variables (AIRTABLE_BASE_VENTAS, ZENKAI_FROM_EMAIL, …)");
  console.log("  3. Marcar Available in MCP en cada workflow");
  console.log("  4. Airtable automations → webhooks (docs/plans/2026-06-19-sprint1-automatizaciones-n8n.md §4)");
  console.log("\nSmoke: npm run n8n:checklist && curl webhooks (ver CHECKLIST-SPRINT1.md)");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
