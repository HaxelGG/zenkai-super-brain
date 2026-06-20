import "dotenv/config";

const token = process.env.N8N_MCP_ACCESS_TOKEN!;
const url = process.env.N8N_MCP_URL ?? "https://zenkai-growth-systems.app.n8n.cloud/mcp-server/http";

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
  clientInfo: { name: "inspect", version: "1" },
});

const search = parseTool(
  await call("tools/call", { name: "search_workflows", arguments: { query: "ZENKAI", limit: 20 } }),
) as { data?: { id: string; name: string; active?: boolean }[] };

for (const w of search.data ?? []) {
  const det = parseTool(
    await call("tools/call", { name: "get_workflow_details", arguments: { workflowId: w.id } }),
  ) as {
    nodes?: { name: string; type: string; parameters?: { path?: string }; disabled?: boolean }[];
    active?: boolean;
    issues?: unknown;
  };
  const triggers = (det.nodes ?? []).filter(
    (n) => n.type.includes("webhook") || n.type.includes("schedule") || n.type.includes("manual"),
  );
  console.log(`\n${w.name} (${w.id}) search_active=${w.active} detail_active=${det.active ?? "?"}`);
  if (det.issues) console.log("  issues:", JSON.stringify(det.issues).slice(0, 200));
  for (const t of triggers) {
    console.log(`  - ${t.name} [${t.type}] path=${t.parameters?.path ?? "-"} disabled=${t.disabled ?? false}`);
  }
}

// Try explicit publish on M-02 and print raw response
const m02 = (search.data ?? []).find((w) => w.name.includes("M-02"));
if (m02) {
  const pub = await call("tools/call", { name: "publish_workflow", arguments: { workflowId: m02.id } });
  console.log("\npublish M-02 raw:", JSON.stringify(pub.result, null, 2).slice(0, 1500));
}
