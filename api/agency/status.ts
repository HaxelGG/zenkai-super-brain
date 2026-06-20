/**
 * GET /api/agency/status · agentes · proveedores · MCP
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMcpManifest, getProviderCapabilities } from "../../scripts/agency/capabilities.js";
import { AGENT_REGISTRY, JARVIS_DIRECTOR } from "../../scripts/agency/registry.js";
import { getDirectorStatus } from "../../scripts/agency/director.js";
import { allowDashboardRequest, setDashboardCacheHeaders } from "../jarvis/_guard.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;
  setDashboardCacheHeaders(res, 30);

  const providers = getProviderCapabilities();
  const configured = providers.filter((p) => p.configured).length;
  const keys = auditRequiredKeys();

  res.status(200).json({
    ok: keys.ready,
    director: JARVIS_DIRECTOR,
    keys: {
      ready: keys.ready,
      criticalMissing: keys.criticalMissing,
      missing: keys.requirements.filter((r) => !r.configured).map((r) => r.env),
    },
    agents: Object.values(AGENT_REGISTRY).map((a) => ({
      id: a.id,
      department: a.department,
      model: a.modeloLabel,
      n8nEvents: a.n8nEvents,
      mcpServers: a.mcpServers,
    })),
    providers,
    mcp: getMcpManifest(),
    departments: getDirectorStatus().departments,
    message: keys.ready
      ? `Agencia autónoma lista · ${configured}/${providers.length} proveedores`
      : `Faltan keys críticas: ${keys.criticalMissing.join(", ")}`,
  });
}
