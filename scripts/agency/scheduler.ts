/**
 * Motor autónomo · tick programado (cron Vercel / Windmill / manual)
 */
import { listCalendarDue } from "./calendar.js";
import { auditRequiredKeys } from "./keys-audit.js";
import { runMarketingPublishPipeline } from "./departments/marketing-publish.js";
import { directorRoute } from "./director.js";
import { dispatchAgencyEvent } from "./dispatch.js";

export type SchedulerTickResult = {
  ts: string;
  keysReady: boolean;
  actions: { name: string; ok: boolean; detail?: string }[];
};

export async function runAgencySchedulerTick(): Promise<SchedulerTickResult> {
  const ts = new Date().toISOString();
  const audit = auditRequiredKeys();
  const actions: SchedulerTickResult["actions"] = [];

  if (!audit.ready) {
    actions.push({
      name: "keys-audit",
      ok: false,
      detail: `Faltan: ${audit.criticalMissing.join(", ")}`,
    });
    return { ts, keysReady: false, actions };
  }

  try {
    const recap = await directorRoute("Recap operativo diario: pipeline, finanzas y prioridad del día");
    actions.push({
      name: "daily-recap",
      ok: recap.results.length > 0,
      detail: recap.agents.join(","),
    });
  } catch (e) {
    actions.push({ name: "daily-recap", ok: false, detail: String(e) });
  }

  const due = await listCalendarDue(2);
  for (const item of due.items.slice(0, 3)) {
    try {
      await runMarketingPublishPipeline(item.id);
      actions.push({ name: `publish-${item.id}`, ok: true });
    } catch (e) {
      actions.push({ name: `publish-${item.id}`, ok: false, detail: String(e) });
    }
  }

  await dispatchAgencyEvent("agency.scheduler.tick", { ts, actions });

  return { ts, keysReady: true, actions };
}
