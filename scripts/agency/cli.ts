#!/usr/bin/env tsx
/**
 * CLI · ZENKAI Agency Platform
 * npm run agency:status | agency:director "..." | agency:content "..."
 */
import { config } from "dotenv";
config();

const cmd = process.argv[2];
const arg = process.argv.slice(3).join(" ").trim();

async function main() {
  if (cmd === "status") {
    const { getProviderCapabilities, getMcpManifest } = await import("./capabilities.js");
    const { auditRequiredKeys } = await import("./keys-audit.js");
    const { AGENT_REGISTRY, JARVIS_DIRECTOR } = await import("./registry.js");
    console.log(JSON.stringify({
      director: JARVIS_DIRECTOR,
      agents: Object.keys(AGENT_REGISTRY).length,
      keys: auditRequiredKeys(),
      providers: getProviderCapabilities(),
      mcp: getMcpManifest(),
    }, null, 2));
    return;
  }

  if (cmd === "keys") {
    const { auditRequiredKeys } = await import("./keys-audit.js");
    console.log(JSON.stringify(auditRequiredKeys(), null, 2));
    return;
  }

  if (cmd === "tick") {
    const { runAgencySchedulerTick } = await import("./scheduler.js");
    console.log(JSON.stringify(await runAgencySchedulerTick(), null, 2));
    return;
  }

  if (cmd === "director" && arg) {
    const { directorRoute } = await import("./director.js");
    const r = await directorRoute(arg);
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  if (cmd === "content" && arg) {
    const { runMarketingContentPipeline } = await import("./departments/marketing.js");
    const r = await runMarketingContentPipeline({ brief: arg, voice: true, video: false });
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  if (cmd === "agent" && arg) {
    const agentMatch = arg.match(/^(\w+):\s*(.+)/);
    if (!agentMatch) {
      console.error("Uso: agency:agent MUSE: tu instrucción");
      process.exit(1);
    }
    const { runAgent } = await import("./agent-runner.js");
    const { resolveAgentId } = await import("./registry.js");
    const id = resolveAgentId(agentMatch[1]);
    if (!id) {
      console.error("Agente no encontrado");
      process.exit(1);
    }
    const r = await runAgent({ agentId: id, instruction: agentMatch[2] });
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  console.log(`ZENKAI Agency CLI
  npm run agency:status
  npm run agency:keys
  npm run agency:tick
  npm run agency:setup-schema [-- --apply]
  npm run agency:director -- "recap pipeline y prioridades"
  npm run agency:content -- "reel sobre automatización con IA para clínicas"
  npm run agency:agent -- "MUSE: calendario editorial semana 26"`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
