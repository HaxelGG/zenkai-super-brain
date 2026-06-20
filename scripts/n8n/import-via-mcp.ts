/**
 * Importa workflows Sprint 1 via n8n Instance MCP (HTTP JSON-RPC).
 *
 * Estrategia: crear workflow con el nodo trigger (SDK) y luego
 * `update_workflow` con addNode + addConnection desde el JSON exportado.
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

type N8nNode = {
  id?: string;
  name: string;
  type: string;
  typeVersion: number;
  position?: [number, number];
  parameters?: Record<string, unknown>;
  credentials?: Record<string, { id?: string; name?: string }>;
  disabled?: boolean;
  notes?: string;
};

type WorkflowExport = {
  name: string;
  nodes: N8nNode[];
  connections: Record<string, { main?: { node: string; type?: string; index?: number }[][] }>;
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

function triggerSdkCode(trigger: N8nNode, workflowId: string, workflowName: string): string {
  const params = JSON.stringify(trigger.parameters ?? {});
  const isSchedule = trigger.type.includes("scheduleTrigger");
  const factory = isSchedule ? "trigger" : "node";
  return `
import { workflow, ${factory} } from '@n8n/workflow-sdk';

const root = ${factory}({
  type: '${trigger.type}',
  version: ${trigger.typeVersion},
  config: {
    name: ${JSON.stringify(trigger.name)},
    parameters: ${params},
  },
});

export default workflow(${JSON.stringify(workflowId)}, ${JSON.stringify(workflowName)}).add(root);
`.trim();
}

function connectionOperations(
  connections: WorkflowExport["connections"],
): Record<string, unknown>[] {
  const ops: Record<string, unknown>[] = [];
  for (const [source, outputs] of Object.entries(connections)) {
    const mains = outputs.main ?? [];
    for (let sourceIndex = 0; sourceIndex < mains.length; sourceIndex++) {
      for (const conn of mains[sourceIndex] ?? []) {
        ops.push({
          type: "addConnection",
          source,
          target: conn.node,
          sourceIndex,
          targetIndex: conn.index ?? 0,
          connectionType: conn.type ?? "main",
        });
      }
    }
  }
  return ops;
}

function nodeOperations(nodes: N8nNode[]): Record<string, unknown>[] {
  return nodes.map((n) => ({
    type: "addNode",
    node: {
      name: n.name,
      type: n.type,
      typeVersion: n.typeVersion,
      ...(n.id ? { id: n.id } : {}),
      ...(n.parameters ? { parameters: n.parameters } : {}),
      ...(n.position ? { position: n.position } : {}),
      ...(n.credentials ? { credentials: n.credentials } : {}),
      ...(n.disabled ? { disabled: n.disabled } : {}),
      ...(n.notes ? { notes: n.notes } : {}),
    },
  }));
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

let rpcId = 0;

type McpEnvelope<T> = { result?: T; error?: { message?: string; code?: number } };

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
        "MCP HTTP 401 — regenera token en n8n → Settings → Instance-level MCP → Access Token.",
      );
    }
    throw new Error(`MCP HTTP ${res.status}: ${text.slice(0, 400)}`);
  }

  const jsonLine =
    text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("data:"))
      ?.slice(5)
      .trim() ?? text.trim();

  const parsed = JSON.parse(jsonLine) as McpEnvelope<T>;
  if (parsed.error) {
    throw new Error(parsed.error.message ?? `MCP error ${parsed.error.code ?? "?"}`);
  }
  return parsed.result as T;
}

type ToolResult<T> = {
  content?: { type: string; text?: string }[];
  structuredContent?: T;
  isError?: boolean;
};

function parseToolResult<T>(result: ToolResult<T>): T {
  if (result.isError) {
    const msg = result.content?.[0]?.text ?? "MCP tool error";
    throw new Error(msg);
  }
  if (result.structuredContent) return result.structuredContent;
  const text = result.content?.[0]?.text;
  if (text) return JSON.parse(text) as T;
  throw new Error("Empty MCP tool result");
}

async function mcpTool<T>(
  token: string,
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  const raw = await mcpCall<ToolResult<T>>(token, "tools/call", { name, arguments: args });
  return parseToolResult(raw);
}

async function initMcp(token: string): Promise<void> {
  await mcpCall(token, "initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "zenkai-import", version: "1.0.0" },
  });
  try {
    await mcpCall(token, "notifications/initialized", {});
  } catch {
    /* optional */
  }
}

type SearchResult = {
  data?: { id: string; name: string | null; active?: boolean | null }[];
};

async function applyOperations(
  token: string,
  workflowId: string,
  operations: Record<string, unknown>[],
): Promise<void> {
  for (const batch of chunk(operations, 80)) {
    await mcpTool(token, "update_workflow", { workflowId, operations: batch });
  }
}

async function importOne(
  token: string,
  file: string,
  existing: { id: string; name: string | null; active?: boolean | null }[],
  force = false,
): Promise<void> {
  const exp = loadExport(file);
  const found = existing.find((w) => w.name === exp.name);

  if (found?.id && force) {
    await mcpTool(token, "archive_workflow", { workflowId: found.id });
    console.log(`[ARCHIVED] ${exp.name} (${found.id})`);
    const idx = existing.findIndex((w) => w.id === found.id);
    if (idx >= 0) existing.splice(idx, 1);
  }

  let workflowId = force ? undefined : found?.id;
  if (!workflowId) {
    const trigger =
      exp.nodes.find((n) => n.type.includes("webhook") || n.type.includes("scheduleTrigger")) ??
      exp.nodes[0];
    const slug = exp.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    const code = triggerSdkCode(trigger, slug, exp.name);

    const validated = await mcpTool<{ valid?: boolean; errors?: unknown[] }>(token, "validate_workflow", {
      code,
    });
    if (validated.valid === false) {
      throw new Error(`validate ${exp.name}: ${JSON.stringify(validated.errors ?? "invalid")}`);
    }

    const created = await mcpTool<{
      workflowId?: string;
      url?: string;
      error?: string;
    }>(token, "create_workflow_from_code", {
      code,
      name: exp.name,
      description: `ZENKAI Sprint 1 · ${file}`.slice(0, 255),
    });

    if (!created.workflowId) {
      throw new Error(`create ${exp.name}: ${created.error ?? "no workflowId"}`);
    }
    workflowId = created.workflowId;
    existing.push({ id: workflowId, name: exp.name, active: false });
    console.log(`[CREATED] ${exp.name} → ${workflowId}`);
    if (created.url) console.log(`          ${created.url}`);

    const rest = exp.nodes.filter((n) => n.name !== trigger.name);
    const ops = [...nodeOperations(rest), ...connectionOperations(exp.connections)];
    if (ops.length) {
      await applyOperations(token, workflowId, ops);
      console.log(`[NODES] ${exp.name} +${rest.length} nodos, ${connectionOperations(exp.connections).length} conexiones`);
    }
  } else {
    console.log(`[SKIP CREATE] ${exp.name} (${workflowId})`);
  }

  const row = existing.find((w) => w.id === workflowId);
  if (row?.active) {
    console.log(`[ACTIVE] ${exp.name} ya publicado`);
    return;
  }

  await mcpTool(token, "publish_workflow", { workflowId });
  console.log(`[PUBLISHED] ${exp.name}`);
  if (row) row.active = true;
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const force = process.argv.includes("--force");
  const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
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

  const required = [
    "search_workflows",
    "validate_workflow",
    "create_workflow_from_code",
    "update_workflow",
    "publish_workflow",
  ];
  for (const r of required) {
    console.log(names.includes(r) ? `  ✓ ${r}` : `  ✗ missing ${r}`);
  }
  if (required.some((r) => !names.includes(r))) process.exit(1);

  const search = await mcpTool<SearchResult>(token, "search_workflows", {
    query: "ZENKAI",
    limit: 50,
  });
  const existing = search.data ?? [];
  console.log(`\nWorkflows ZENKAI en instancia: ${existing.length}`);

  if (!apply) {
    console.log("\nDry-run OK. Para importar: npm run n8n:import:mcp -- --apply");
    return;
  }

  console.log("\nImportando…\n");
  const files = only ? ORDER.filter((f) => f.includes(only)) : [...ORDER];
  if (only && !files.length) {
    console.error(`No match for --only=${only}`);
    process.exit(1);
  }
  for (const file of files) {
    await importOne(token, file, existing, force);
  }

  console.log("\nPost-import manual en n8n UI:");
  console.log("  1. Mapear credenciales Airtable + Resend + Anthropic");
  console.log("  2. Settings → Variables (AIRTABLE_BASE_VENTAS, ZENKAI_FROM_EMAIL, …)");
  console.log("  3. Airtable automations → webhooks (CHECKLIST-SPRINT1.md §4)");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
