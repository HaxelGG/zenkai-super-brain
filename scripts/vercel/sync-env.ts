/**
 * Sync .env → Vercel (production · preview · development)
 * npm run vercel:sync-env
 */
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { config } from "dotenv";
import { resolve } from "node:path";

config();

const ROOT = resolve(import.meta.dirname, "../..");
const TARGETS = ["production", "preview", "development"] as const;

const KEYS_FROM_ENV = [
  "ANTHROPIC_API_KEY",
  "ZENKAI_API_KEY",
  "AIRTABLE_TOKEN",
  "AIRTABLE_BASE_VENTAS",
  "RESEND_API_KEY",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_JARVIS_VOICE_ID",
  "ELEVENLABS_MODEL_ID",
  "N8N_JARVIS_CALLBACK_URL",
  "N8N_MCP_ACCESS_TOKEN",
  "WINDMILL_API_TOKEN",
  "CLAUDE_MODEL_OPUS",
  "CLAUDE_MODEL_SONNET",
  "CLAUDE_MODEL_HAIKU",
];

function buildVars(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of KEYS_FROM_ENV) {
    const v = process.env[k]?.trim();
    if (v) out[k] = v;
  }

  out.CRON_SECRET = process.env.CRON_SECRET?.trim() || randomBytes(32).toString("hex");
  out.JARVIS_API_URL = "https://panel.zenkai.systems";
  out.N8N_WEBHOOK_URL = out.N8N_JARVIS_CALLBACK_URL || process.env.N8N_WEBHOOK_URL || "";
  out.WINDMILL_WORKSPACE = "zenkai";
  out.WINDMILL_BASE_URL = "https://app.windmill.dev";
  out.WINDMILL_AGENCY_WEBHOOK_PATH = "f/agency/event_handler";
  out.AIRTABLE_TABLE_TASKS = "Tasks";
  out.AIRTABLE_TABLE_CONTENT = "ContentCalendar";

  return Object.fromEntries(Object.entries(out).filter(([, v]) => v));
}

function vercelBin(): string {
  if (process.platform === "win32") return "vercel.cmd";
  return "vercel";
}

function addVar(name: string, value: string, target: string): void {
  execFileSync(
    vercelBin(),
    ["env", "add", name, target, "--force", "--yes", "--sensitive"],
    { cwd: ROOT, input: value, stdio: ["pipe", "pipe", "pipe"], shell: process.platform === "win32" },
  );
  console.log(`✓ ${name} → ${target}`);
}

const vars = buildVars();
console.log(`Syncing ${Object.keys(vars).length} vars to Vercel zenkaibrain…\n`);

for (const [name, value] of Object.entries(vars)) {
  for (const target of TARGETS) {
    try {
      addVar(name, value, target);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`✗ ${name} ${target}: ${msg.slice(0, 120)}`);
    }
  }
}

console.log("\nDone. Redeploy production for cron + functions to pick up env.");
