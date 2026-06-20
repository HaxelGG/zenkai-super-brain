/**
 * GET /api/agency/keys · auditoría de API keys requeridas (sin valores)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { auditRequiredKeys } from "../../scripts/agency/keys-audit.js";
import { allowDashboardRequest, setDashboardCacheHeaders } from "../jarvis/_guard.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowDashboardRequest(req, res)) return;
  setDashboardCacheHeaders(res, 60);

  const audit = auditRequiredKeys();
  res.status(200).json({
    ready: audit.ready,
    criticalMissing: audit.criticalMissing,
    requirements: audit.requirements.map((r) => ({
      env: r.env,
      label: r.label,
      tier: r.tier,
      departments: r.departments,
      purpose: r.purpose,
      configured: r.configured,
    })),
  });
}
