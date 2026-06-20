/**
 * wmill sync con credenciales desde .env (token workspace-scoped).
 *
 * El token de workspace no pasa `wmill workspace add` (/workspaces/exists → 401).
 * Usar --base-url + --workspace + --token en cada sync.
 *
 * Uso:
 *   npm run wmill:pull
 *   npm run wmill:push
 */
import "dotenv/config";
import { execSync } from "node:child_process";

const cmd = process.argv[2];
if (cmd !== "pull" && cmd !== "push") {
  console.error("Uso: tsx scripts/windmill/sync.ts pull|push");
  process.exit(1);
}

const token = process.env.WINDMILL_API_TOKEN?.trim();
const base = (process.env.WINDMILL_BASE_URL ?? "https://app.windmill.dev").replace(/\/$/, "");
const workspace = process.env.WINDMILL_WORKSPACE?.trim() ?? "zenkai";

if (!token) {
  console.error("Falta WINDMILL_API_TOKEN en .env");
  process.exit(1);
}

const args = [
  "sync",
  cmd,
  "--token",
  token,
  "--base-url",
  base,
  "--workspace",
  workspace,
];

execSync(`wmill ${args.map((a) => (a.includes(" ") ? `"${a}"` : a)).join(" ")}`, {
  stdio: "inherit",
  shell: true,
});
