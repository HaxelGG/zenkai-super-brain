/**
 * Importa workflows Sprint 1 via n8n Instance MCP (HTTP JSON-RPC).
 *
 * Estrategia: create_workflow_from_code (nodo trigger) + update_workflow (resto del JSON).
 *
 * Requiere en .env:
 *   N8N_MCP_ACCESS_TOKEN  — Settings → Instance-level MCP → Access Token
 *   N8N_BASE_URL          — default zenkai-growth-systems.app.n8n.cloud
 *
 * Uso:
 *   npm run n8n:import:mcp
 *   npm run n8n:import:mcp -- --apply
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

type JsonNode = {
  name: string;
  type: string;
  typeVersion: number;
  parameters: Record<string, unknown>;
  position?: [number, number];
  credentials?: Record<string, unknown>;
  disabled?: boolean;
  notes?: string;
};

type WorkflowExport = {
  name: string;
  nodes: JsonNode[];
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

function baseUrl(): string {
  return (process.env.N8N_BASE_URL ?? "https://zenkai-growth-systems.app.n8n.cloud").replace(
    /\/$/,
    "",
  );
}

function mcpUrl(): string {
  return process.env.N8N_MCP_URL ?? `${baseUrl()}/mcp-server/http`;
}

function loadExport(filename: string): WorkflowExport {
  const path = join(process.cwd(), "jarvis", "n8n", filename);
  const raw = JSON.parse(readFileSync(path, "utf8")) as WorkflowExport;
  if (!raw.name || !raw.nodes?.length) throw new Error(`${filename}: invalid export`);
  return raw;
}

function escapeForTemplate(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

/** Primer nodo (webhook/cron) via SDK — el resto se añade con update_workflow. */
function toStubSdkCode(exp: WorkflowExport): string {
  const first = exp.nodes[0];
  const paramsJson = JSON.stringify(first.parameters ?? {});
  const pos = first.position ?? [240, 300];
  const slug = exp.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);

  return `
import { workflow, node, trigger } from '@n8n/workflow-sdk';

const isTrigger = ${JSON.stringify(first.type.includes("Trigger") || first.type.includes("trigger"))};
const root = isTrigger
  ? trigger({ type: '${first.type}', version: ${first.typeVersion}, config: { name: '${first.name.replace(/'/g, "\\'")}', parameters: ${paramsJson} } })
  : node({ type: '${first.type}', version: ${first.typeVersion}, config: { name: '${first.name.replace(/'/g, "\\'")}', parameters: ${paramsJson}, position: ${JSON.stringify(pos)} } });

export default workflow('${slug}', '${escapeForTemplate(exp.name)}').add(root);
`.trim();
}

function buildUpdateOps(exp: WorkflowExport): Record<string, unknown>[] {
  const ops: Record<string, unknown>[] = [];

  for (let i = 1; i < exp.nodes.length; i++) {
    const n = exp.nodes[i];
    ops.push({
      type: "addNode",
      node: {
        name: n.name,
        type: n.type,
        typeVersion: n.typeVersion,
        parameters: n.parameters ?? {},
        ...(n.position ? { position: n.position } : {}),
        ...(n.disabled != null ? { disabled: n.disabled } : {}),
        ...(n.notes ? { notes: n.notes } : {}),
      },
    });
  }

  for (const [source, raw] of Object.entries(exp.connections)) {
    const main = (raw as { main?: { node: string; type?: string; index?: number }[][] }).main;
    if (!main) continue;
    for (let outIdx = 0; outIdx < main.length; outIdx++) {
      for (const target of main[outIdx] ?? []) {
        ops.push({
          type: "addConnection",
          source,
          target: target.node,
          sourceIndex: outIdx,
          targetIndex: target.index ?? 0,
          ...(target.type ? { connectionType: target.type } : {}),
        });
      }
    }
  }

  return ops;
}

let rpcId = 0;

function parseMcpPayload(text: string): unknown {
  const line =
    text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("data:"))
      ?.slice(5)
      .trim() ?? text.trim();
  return JSON.parse(line);
}

async function mcpCall<T>(
  token: string,
  method: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  rpcId += 1;
  const res = await fetch(mcpUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: rpcId, method, params }),
  });
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(
        "MCP HTTP 401 — regenera token en n8n Cloud → Settings → Instance-level MCP → Access Token",
      );
    }
    throw new Error(`MCP HTTP ${res.status}: ${text.slice(0, 400)}`);
  }

  const parsed = parseMcpPayload(text) as {
    result?: T;
    error?: { message?: string; code?: number };
  };
  if (parsed.error) {
    throw new Error(parsed.error.message ?? `MCP error ${parsed.error.code ?? "?"}`);
  }
  return parsed.result as T;
}

/** MCP tools/call devuelve { content: [{ type:'text', text:'{...json...}' }] }. */
function unwrapToolResult<T>(result: unknown): T {
  if (!result || typeof result !== "object") return result as T;
  const r = result as { content?: { type?: string; text?: string }[] };
  const text = r.content?.find((c) => c.type === "text" && c.text)?.text;
  if (text) {
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }
  return result as T;
}

async function mcpTool<T>(
  token: string,
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  const raw = await mcpCall<unknown>(token, "tools/call", { name, arguments: args });
  return unwrapToolResult<T>(raw);
}

async function initMcp(token: string): Promise<void> {
  await mcpCall(token, "initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "zenkai-import", version: "1.0.0" },
  });
}

type SearchResult = {
  data?: { id: string; name: string | null; active?: boolean | null }[];
  count?: number;
};

type CreateResult = {
  workflowId?: string;
  name?: string;
  url?: string;
  error?: string;
  hint?: string;
};

type ValidateResult = {
  valid?: boolean;
  error?: string;
  errors?: string[];
};

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const token = process.env.N8N_MCP_ACCESS_TOKEN?.trim();

  console.log(`ZENKAI n8n MCP import ${apply ? "APPLY" : "dry-run"}`);
  console.log(`MCP: ${mcpUrl()}\n`);

  for (const file of ORDER) {
    const exp = loadExport(file);
    console.log(`  • ${file} → ${exp.name} (${exp.nodes.length} nodes)`);
  }

  if (!token) {
    console.log("\nFalta N8N_MCP_ACCESS_TOKEN en .env");
    process.exit(apply ? 1 : 0);
  }

  await initMcp(token);
  const tools = await mcpCall<{ tools?: { name: string }[] }>(token, "tools/list", {});
  const names = (tools.tools ?? []).map((t) => t.name);
  console.log(`\nMCP conectado · ${names.length} tools`);

  const search = await mcpTool<SearchResult>(token, "search_workflows", {
    query: "ZENKAI",
    limit: 50,
  });
  const existing = search.data ?? [];
  console.log(`Workflows ZENKAI en instancia: ${existing.length}`);

  if (!apply) {
    console.log("\nDry-run OK. Para importar: npm run n8n:import:mcp -- --apply");
    return;
  }

  console.log("\nImportando…\n");

  for (const file of ORDER) {
    const exp = loadExport(file);
    const found = existing.find((w) => w.name === exp.name);
    let workflowId = found?.id;

    if (!workflowId) {
      const stubCode = toStubSdkCode(exp);
      const validated = await mcpTool<ValidateResult>(token, "validate_workflow", {
        code: stubCode,
      });
      if (validated.valid === false) {
        console.error(
          `[FAIL VALIDATE] ${exp.name}: ${validated.error ?? validated.errors?.join("; ") ?? "invalid"}`,
        );
        process.exit(1);
      }

      const created = await mcpTool<CreateResult>(token, "create_workflow_from_code", {
        code: stubCode,
        name: exp.name,
        description: `ZENKAI Sprint 1 · ${file}`,
      });

      if (!created.workflowId) {
        console.error(
          `[FAIL CREATE] ${exp.name}: ${created.error ?? created.hint ?? JSON.stringify(created)}`,
        );
        process.exit(1);
      }
      workflowId = created.workflowId;
      existing.push({ id: workflowId, name: exp.name, active: false });
      console.log(`[CREATED STUB] ${exp.name} → ${workflowId}`);

      const ops = buildUpdateOps(exp);
      if (ops.length) {
        const updated = await mcpTool<CreateResult & { appliedOperations?: number }>(
          token,
          "update_workflow",
          { workflowId, operations: ops },
        );
        if (updated.error) {
          console.error(`[FAIL UPDATE] ${exp.name}: ${updated.error}`);
          process.exit(1);
        }
        console.log(`[UPDATED] ${exp.name} · ${updated.appliedOperations ?? ops.length} ops`);
      }
    } else {
      console.log(`[SKIP CREATE] ${exp.name} (${workflowId})`);
      const ops = buildUpdateOps(exp);
      if (ops.length) {
        const updated = await mcpTool<CreateResult & { appliedOperations?: number }>(
          token,
          "update_workflow",
          { workflowId, operations: ops },
        );
        if (updated.error) {
          console.warn(`[WARN UPDATE] ${exp.name}: ${updated.error} (puede estar ya importado)`);
        } else {
          console.log(`[UPDATED] ${exp.name} · ${updated.appliedOperations ?? ops.length} ops`);
        }
      }
    }

    const row = existing.find((w) => w.id === workflowId);
    if (row?.active) {
      console.log(`[ACTIVE] ${exp.name} ya publicado`);
      continue;
    }

    const pub = await mcpTool<CreateResult>(token, "publish_workflow", { workflowId });
    if (!pub.workflowId && pub.error) {
      console.error(`[FAIL PUBLISH] ${exp.name}: ${pub.error}`);
      process.exit(1);
    }
    console.log(`[PUBLISHED] ${exp.name}`);
  }

  console.log("\nPost-import manual:");
  console.log("  1. Mapear credenciales Airtable + Resend + Anthropic en UI");
  console.log("  2. Settings → Variables (AIRTABLE_BASE_VENTAS, ZENKAI_FROM_EMAIL, …)");
  console.log("  3. Airtable automations → webhooks (CHECKLIST-SPRINT1.md)");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
