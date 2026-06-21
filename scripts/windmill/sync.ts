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
import { spawnSync } from "node:child_process";

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

// Defensa en profundidad: los valores van como argv (no string de shell),
// y además se validan contra un allowlist por si alguna config trae basura.
const SAFE = /^[A-Za-z0-9_\-:/.]+$/;
for (const [label, val] of [
  ["token", token],
  ["base-url", base],
  ["workspace", workspace],
] as const) {
  if (!SAFE.test(val)) {
    console.error(`Valor Windmill inválido (${label}): caracteres no permitidos`);
    process.exit(1);
  }
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

// Windows instala el CLI como wmill.cmd → requiere shell para resolverlo;
// los argumentos van en array (no interpolados) y validados arriba.
const bin = process.platform === "win32" ? "wmill.cmd" : "wmill";
const result = spawnSync(bin, args, { stdio: "inherit", shell: process.platform === "win32" });
if (result.error) {
  console.error(`wmill no disponible: ${result.error.message}`);
  console.error("Instalá el CLI: npm install -g windmill-cli");
  process.exit(1);
}
process.exit(result.status ?? 0);
