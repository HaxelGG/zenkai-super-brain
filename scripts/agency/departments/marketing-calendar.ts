/**
 * MUSE · calendario editorial semanal (batch)
 */
import { saveCalendarItem } from "../calendar.js";
import { dispatchAgencyEvent, dispatchToN8nResult } from "../dispatch.js";
import { callAgencyLlm } from "../llm.js";
import type { AgencyRunResult } from "../types.js";

type WeekSlot = {
  day: string;
  platform: string;
  format: string;
  hook: string;
  caption: string;
};

function extractWeek(raw: string): WeekSlot[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1) throw new Error("no JSON array");
  const arr = JSON.parse(raw.slice(start, end + 1)) as WeekSlot[];
  return Array.isArray(arr) ? arr.slice(0, 7) : [];
}

export async function runMarketingCalendarPipeline(brief: string): Promise<AgencyRunResult & { slots: WeekSlot[] }> {
  const llm = await callAgencyLlm("sonnet", [
    {
      role: "system",
      content: `Eres MUSE. Generá calendario editorial 7 días para ZENKAI (IA para empresas LATAM).
Responde SOLO JSON array: [{ "day": "lunes", "platform": "instagram", "format": "reel", "hook": "...", "caption": "..." }]
Sin markdown. 7 items máximo.`,
    },
    { role: "user", content: brief },
  ]);

  if (!llm.ok) throw new Error(llm.error);
  const slots = extractWeek(llm.text);

  const saved = [];
  for (const slot of slots) {
    saved.push(
      await saveCalendarItem({
        title: slot.hook.slice(0, 80),
        platform: (slot.platform as "instagram") || "instagram",
        format: (slot.format as "reel") || "reel",
        status: "draft",
        hook: slot.hook,
        caption: slot.caption,
      }),
    );
  }

  const d = await dispatchAgencyEvent("agency.marketing.calendar", { count: saved.length, brief: brief.slice(0, 200) });

  return {
    id: `calendar_${Date.now()}`,
    agent: "MUSE",
    department: "marketing",
    reply: `Calendario generado: ${saved.length} piezas en borrador. Revisá en JARVIS → Social.`,
    speech: `${saved.length} contenidos listos para revisión en calendario.`,
    provider: llm.provider,
    model: llm.model,
    timestamp: new Date().toISOString(),
    dispatch: dispatchToN8nResult(d),
    slots,
    meta: { savedIds: saved.map((s) => s.id) },
  };
}
