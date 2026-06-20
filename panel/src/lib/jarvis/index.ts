import { getPanelStats } from "../airtable";
import { MOCK_JARVIS_DATA } from "./mock-data";
import type { JarvisData } from "./types";

/**
 * Returns Jarvis dashboard data.
 * Merges live Airtable CRM stats when available; falls back to mock values.
 */
export async function getJarvisData(): Promise<JarvisData> {
  const data = structuredClone(MOCK_JARVIS_DATA);
  const stats = await getPanelStats();

  if (stats) {
    const clientsKpi = data.kpis.find((k) => k.id === "clients");
    if (clientsKpi) {
      clientsKpi.value = String(stats.clientesActivos);
      clientsKpi.caption =
        stats.clientesActivos > 0
          ? stats.clientes.map((c) => c.empresa).join(" · ")
          : "sin clientes activos en CRM";
    }

    const leadsKpi = data.kpis.find((k) => k.id === "leads-week");
    if (leadsKpi && stats.leadsTotal > 0) {
      leadsKpi.caption = `${stats.leadsTotal} total en CRM · ${leadsKpi.caption}`;
    }
  }

  return data;
}

export { AGENTS } from "./mock-data";
export { JARVIS_URL, PANEL_URL, JARVIS_BASE, JARVIS_ROUTES } from "./config";
export type * from "./types";
