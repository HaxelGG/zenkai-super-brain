/**
 * Publica workflows Sprint 1 y reporta errores de configuración.
 * Uso: npx tsx scripts/n8n/publish-all.ts
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const NAMES = [
  "ZENKAI-M-04-hot-lead-alert",
  "LEADS-05-qualify-on-create",
  "ZENKAI-M-02-demo-autoreply",
  "ZENKAI-S-01-sla-form-3h",
];

const url = process.env.N8N_MCP_URL ?? "https://zenkai-growth-systems.app.n8n.cloud/mcp-server/http";
const token = process.env.N8N_MCP_ACCESS_TOKEN!;

async function call(method: string, params: Record<string, unknown> = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const text = await res.text();
  const line =
    text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("data:"))
      ?.slice(5)
      .trim() ?? text;
  return JSON.parse(line) as { result?: { content?: { text?: string }[]; structuredContent?: unknown } };
}

function parseTool(raw: Awaited<ReturnType<typeof call>>) {
  const sc = raw.result?.structuredContent;
  if (sc) return sc;
  const text = raw.result?.content?.[0]?.text;
  return text ? JSON.parse(text) : null;
}

await call("initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "publish", version: "1" },
});

const search = parseTool(
  await call("tools/call", { name: "search_workflows", arguments: { query: "ZENKAI", limit: 30 } }),
) as { data?: { id: string; name: string; active?: boolean }[] };

let ok = 0;
for (const name of NAMES) {
  const w = (search.data ?? []).find((x) => x.name === name);
  if (!w) {
    console.log(`[MISSING] ${name}`);
    continue;
  }
  const pub = parseTool(
    await call("tools/call", { name: "publish_workflow", arguments: { workflowId: w.id } }),
  ) as { success?: boolean; error?: string };
  if (pub.success === false) {
    console.log(`[FAIL] ${name}: ${pub.error ?? "unknown"}`);
  } else {
    console.log(`[OK] ${name} publicado`);
    ok++;
  }
}
console.log(`\n${ok}/${NAMES.length} publicados`);
process.exit(ok === NAMES.length ? 0 : 1);
