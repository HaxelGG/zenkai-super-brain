/**
 * Importa workflows Sprint 1 via n8n Instance MCP (HTTP JSON-RPC).
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

type WorkflowExport = {
  name: string;
  nodes: Record<string, unknown>[];
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

/** Minimal SDK program that materializes our JSON export inside n8n MCP. */
function toSdkCode(exp: WorkflowExport): string {
  const payload = JSON.stringify({
    name: exp.name,
    nodes: exp.nodes,
    connections: exp.connections,
    settings: exp.settings ?? { executionOrder: "v1" },
  });
  return `
import { workflow, node, jsonParse } from 'n8n-workflow';

const def = jsonParse(${JSON.stringify(payload)});

export default workflow({
  name: def.name,
  nodes: def.nodes.map((n) => node(n)),
  connections: def.connections,
  settings: def.settings,
});
`.trim();
}

let rpcId = 0;

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
        "MCP HTTP 401 Unauthorized — regenera el token en n8n Cloud → Settings → Instance-level MCP → Access Token, actualiza N8N_MCP_ACCESS_TOKEN en .env y ~/.cursor/mcp.json, reinicia Cursor.",
      );
    }
    throw new Error(`MCP HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
  let parsed: { result?: T; error?: { message?: string; code?: number } };
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    throw new Error(`MCP non-JSON response: ${text.slice(0, 400)}`);
  }
  if (parsed.error) {
    throw new Error(parsed.error.message ?? `MCP error ${parsed.error.code ?? "?"}`);
  }
  return parsed.result as T;
}

async function mcpTool<T>(
  token: string,
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  return mcpCall<T>(token, "tools/call", { name, arguments: args });
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
    /* some servers omit this */
  }
}

type SearchResult = {
  data?: { id: string; name: string | null; active?: boolean | null }[];
  count?: number;
};

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const token = process.env.N8N_MCP_ACCESS_TOKEN?.trim();

  console.log(`ZENKAI n8n MCP import ${apply ? "APPLY" : "dry-run"}`);
  console.log(`MCP: ${mcpUrl()}\n`);

  for (const file of ORDER) {
    const exp = loadExport(file);
    console.log(`  • ${file} → ${exp.name}`);
  }

  if (!token) {
    console.log("\nFalta N8N_MCP_ACCESS_TOKEN en .env");
    process.exit(apply ? 1 : 0);
  }

  await initMcp(token);
  const tools = await mcpCall<{ tools?: { name: string }[] }>(token, "tools/list", {});
  const names = (tools.tools ?? []).map((t) => t.name);
  console.log(`\nMCP conectado · ${names.length} tools`);
  const required = ["search_workflows", "validate_workflow", "create_workflow_from_code", "publish_workflow"];
  for (const r of required) {
    console.log(names.includes(r) ? `  ✓ ${r}` : `  ✗ missing ${r}`);
  }
  if (required.some((r) => !names.includes(r))) {
    console.error("\nInstancia n8n muy antigua o MCP sin workflow builder (v2.12+).");
    process.exit(1);
  }

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

  for (const file of ORDER) {
    const exp = loadExport(file);
    const found = existing.find((w) => w.name === exp.name);

    let workflowId = found?.id;
    if (workflowId) {
      console.log(`[SKIP CREATE] ${exp.name} (${workflowId})`);
    } else {
      const code = toSdkCode(exp);
      const validated = await mcpTool<{ valid?: boolean; error?: string }>(token, "validate_workflow", {
        code,
      });
      if (validated.valid === false) {
        console.error(`[FAIL VALIDATE] ${exp.name}: ${validated.error ?? "invalid"}`);
        process.exit(1);
      }

      const created = await mcpTool<{
        workflowId?: string;
        name?: string;
        url?: string;
        error?: string;
      }>(token, "create_workflow_from_code", {
        code,
        name: exp.name,
        description: `ZENKAI Sprint 1 · ${file}`,
      });

      if (!created.workflowId) {
        console.error(`[FAIL CREATE] ${exp.name}: ${created.error ?? "no workflowId"}`);
        process.exit(1);
      }
      workflowId = created.workflowId;
      existing.push({ id: workflowId, name: exp.name, active: false });
      console.log(`[CREATED] ${exp.name} → ${workflowId}`);
      if (created.url) console.log(`          ${created.url}`);
    }

    const row = existing.find((w) => w.id === workflowId);
    if (row?.active) {
      console.log(`[ACTIVE] ${exp.name} ya publicado`);
      continue;
    }

    const pub = await mcpTool<{ workflowId?: string; error?: string }>(token, "publish_workflow", {
      workflowId,
    });
    if (!pub.workflowId && pub.error) {
      console.error(`[FAIL PUBLISH] ${exp.name}: ${pub.error}`);
      process.exit(1);
    }
    console.log(`[PUBLISHED] ${exp.name}`);
  }

  console.log("\nPost-import manual:");
  console.log("  1. Mapear credenciales Airtable + Resend + Anthropic en UI");
  console.log("  2. Settings → Variables en n8n Cloud");
  console.log("  3. Airtable automations → webhooks (ver CHECKLIST-SPRINT1.md)");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
