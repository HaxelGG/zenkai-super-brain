import "dotenv/config";
import { readFileSync } from "node:fs";

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
  return JSON.parse(line) as { result?: unknown; error?: unknown };
}

await call("initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "dbg", version: "1" },
});

const tools = await call("tools/list", {});
console.log(
  "all tools:",
  ((tools.result as { tools?: { name: string }[] })?.tools ?? []).map((t) => t.name).join(", "),
);

const sdk = await call("tools/call", { name: "get_sdk_reference", arguments: {} });
const sdkText = ((sdk.result as { content?: { text?: string }[] })?.content?.[0]?.text ?? "").slice(0, 2500);
console.log("sdk ref:", sdkText);

const code = `
import { workflow, node } from '@n8n/workflow-sdk';

const wh = node({
  type: 'n8n-nodes-base.webhook',
  version: 2,
  config: {
    name: 'Webhook Test',
    parameters: { httpMethod: 'POST', path: 'zenkai-test-ping', responseMode: 'onReceived' },
  },
});

export default workflow('zenkai-test', 'ZENKAI-test-ping').add(wh);
`.trim();

const val = await call("tools/call", { name: "validate_workflow", arguments: { code } });
console.log("validate:", JSON.stringify(val, null, 2).slice(0, 2000));

const cre = await call("tools/call", {
  name: "create_workflow_from_code",
  arguments: { code, name: "ZENKAI-test-ping", description: "debug minimal webhook" },
});
console.log("create:", JSON.stringify(cre, null, 2).slice(0, 1500));

const exp = JSON.parse(readFileSync("jarvis/n8n/ZENKAI-M-04-hot-lead-alert.json", "utf8"));
const wfId = ((cre.result as { structuredContent?: { workflowId?: string } })?.structuredContent?.workflowId);
if (wfId) {
  const upd = await call("tools/call", {
    name: "update_workflow",
    arguments: {
      workflowId: wfId,
      name: exp.name,
      nodes: exp.nodes,
      connections: exp.connections,
      settings: exp.settings ?? { executionOrder: "v1" },
    },
  });
  console.log("update:", JSON.stringify(upd, null, 2).slice(0, 2000));
}
