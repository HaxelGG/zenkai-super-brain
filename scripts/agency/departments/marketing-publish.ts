/**
 * Publicación · MUSE → Meta Instagram
 */
import { dispatchAgencyEvent, dispatchToN8nResult } from "../dispatch.js";
import { getCalendarItem, markCalendarPublished } from "../calendar.js";
import { publishToInstagram } from "../providers/meta-publish.js";
import type { AgencyRunResult } from "../types.js";

export async function runMarketingPublishPipeline(calendarId?: string): Promise<AgencyRunResult> {
  const item = calendarId ? await getCalendarItem(calendarId) : null;
  const caption = [item?.hook, item?.caption].filter(Boolean).join("\n\n") || "ZENKAI Growth Systems";

  const publish = await publishToInstagram({
    caption,
    videoUrl: item?.videoUrl,
    imageUrl: item?.imageUrl,
  });

  if (publish.status === "done" && item?.id) {
    await markCalendarPublished(item.id, publish.postId || publish.artifactUrl);
  }

  const d = await dispatchAgencyEvent("agency.marketing.publish", {
    calendarId: item?.id,
    postId: publish.postId,
    status: publish.status,
  });

  return {
    id: `publish_${Date.now()}`,
    agent: "MUSE",
    department: "marketing",
    reply:
      publish.status === "done"
        ? `Publicado en Instagram. Post ID: ${publish.postId || "ok"}.`
        : publish.status === "skipped"
          ? `Publicación pendiente: ${publish.error}. Configurá Meta API keys.`
          : `Error al publicar: ${publish.error}`,
    speech: publish.status === "done" ? "Contenido publicado en Instagram." : "Falta configurar Meta para publicar.",
    provider: "anthropic",
    model: "pipeline",
    timestamp: new Date().toISOString(),
    dispatch: dispatchToN8nResult(d),
    meta: { publish },
  };
}
