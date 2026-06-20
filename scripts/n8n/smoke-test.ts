/**
 * Smoke test Sprint 1 · webhooks n8n + diagnóstico de ejecuciones.
 *
 * Uso:
 *   npm run n8n:smoke
 *   npm run n8n:smoke -- --record-demo=recXXX --record-lead=recYYY
 */
import "dotenv/config";

const BASE = (process.env.N8N_BASE_URL ?? "https://zenkai-growth-systems.app.n8n.cloud").replace(
  /\/$/,
  "",
);
const MCP_URL = process.env.N8N_MCP_URL ?? `${BASE}/mcp-server/http`;
const MCP_TOKEN = process.env.N8N_MCP_ACCESS_TOKEN?.trim();

type McpResult = { data?: unknown; error?: string; execution?: { status?: string } };

async function mcp(name: string, args: Record<string, unknown> = {}): Promise<McpResult | null> {
  if (!MCP_TOKEN) return null;
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MCP_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });
  const text = await res.text();
  const line =
    text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("data:"))
      ?.slice(5)
      .trim() ?? text;
  if (!line.startsWith("{")) return { error: line };
  const raw = JSON.parse(line) as {
    result?: { structuredContent?: McpResult; content?: { text?: string }[] };
  };
  const sc = raw.result?.structuredContent;
  if (sc) return sc;
  const t = raw.result?.content?.[0]?.text;
  return t ? (JSON.parse(t) as McpResult) : null;
}

async function postWebhook(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/webhook/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 300) };
}

function argValue(prefix: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${prefix}=`));
  return hit?.split("=").slice(1).join("=");
}

async function fetchAirtableRecord(table: string): Promise<string | undefined> {
  const base = process.env.AIRTABLE_BASE_VENTAS?.trim();
  const pat = process.env.AIRTABLE_TOKEN?.trim();
  if (!base || !pat) return undefined;
  const res = await fetch(
    `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?maxRecords=1`,
    { headers: { Authorization: `Bearer ${pat}` } },
  );
  if (!res.ok) return undefined;
  const j = (await res.json()) as { records?: { id: string }[] };
  return j.records?.[0]?.id;
}

const demoId = argValue("record-demo") ?? (await fetchAirtableRecord("demos"));
const leadId = argValue("record-lead") ?? (await fetchAirtableRecord("Leads"));

console.log("=== ZENKAI Sprint 1 smoke test ===\n");
console.log(`Base: ${BASE}`);
console.log(`Demo record: ${demoId ?? "(ninguno)"}`);
console.log(`Lead record: ${leadId ?? "(ninguno)"}\n`);

const tests: { name: string; path: string; body: Record<string, unknown> }[] = [
  {
    name: "M-02 demo-autoreply",
    path: "demo-autoreply",
    body: {
      record_id: demoId ?? "recSMOKE",
      email: "smoke@test.zenkai.systems",
      sector: "general",
    },
  },
  {
    name: "M-03 leads-qualify",
    path: "leads-qualify",
    body: { record_id: leadId ?? "recSMOKE" },
  },
  {
    name: "M-04 jarvis-callback",
    path: "jarvis-callback",
    body: { event: "lead.hot", record_id: leadId ?? "recSMOKE", score: 8, brief: "smoke test" },
  },
];

const before = await mcp("search_executions", { limit: 1 });
const lastIdBefore = Number(
  ((before?.data as { id?: string }[] | undefined)?.[0]?.id as string | undefined) ?? "0",
);

for (const t of tests) {
  const r = await postWebhook(t.path, t.body);
  const ok = r.status >= 200 && r.status < 300;
  console.log(`${ok ? "✓" : "✗"} ${t.name} → HTTP ${r.status}`);
  if (r.body) console.log(`  ${r.body}`);
}

if (MCP_TOKEN) {
  await new Promise((r) => setTimeout(r, 3000));
  const recent = await mcp("search_executions", { status: ["error", "crashed"], limit: 5 });
  const errors = (recent?.data as { id: string; workflowId: string; status: string }[]) ?? [];
  const fresh = errors.filter((e) => Number(e.id) > lastIdBefore);
  if (fresh.length) {
    console.log("\n⚠ Ejecuciones con error tras smoke test:");
    for (const e of fresh) {
      const detail = await mcp("get_execution", {
        executionId: e.id,
        workflowId: e.workflowId,
        includeData: true,
        truncateData: 1,
      });
      const msg =
        (detail?.data as { resultData?: { error?: { message?: string; description?: string } } })
          ?.resultData?.error?.message ??
        (detail?.data as { resultData?: { error?: { description?: string } } })?.resultData?.error
          ?.description ??
        "unknown";
      console.log(`  #${e.id} wf=${e.workflowId} → ${msg}`);
    }
    console.log(
      "\nDiagnóstico habitual: secrets vacíos en n8n, RESEND/Airtable inválidos, o S-01 merge sin ambas ramas.",
    );
    console.log("Fix: npm run n8n:import:mcp -- --apply --force  (inyecta .env al desplegar)");
  } else {
    console.log("\n✓ Sin errores nuevos en ejecuciones recientes");
  }
} else {
  console.log("\n(Sin N8N_MCP_ACCESS_TOKEN — omitiendo revisión de ejecuciones)");
}
