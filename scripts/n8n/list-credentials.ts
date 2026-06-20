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
  clientInfo: { name: "creds", version: "1" },
});

const creds = parseTool(
  await call("tools/call", { name: "list_credentials", arguments: { limit: 50 } }),
);
console.log(JSON.stringify(creds, null, 2));
