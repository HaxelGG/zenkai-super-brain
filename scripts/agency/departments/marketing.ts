/**
 * MUSE + ARES · pipeline de contenido automatizado
 */
import { dispatchJarvisEvent } from "../../jarvis/n8n-dispatch.js";
import { callAgencyLlm } from "../llm.js";
import { getAgent } from "../registry.js";
import { runMediaPipeline } from "../providers/media.js";
import type { AgencyRunResult, MediaJob } from "../types.js";
import { createOpsTask } from "./operations.js";

export type ContentPipelineInput = {
  brief: string;
  platform?: "instagram" | "linkedin" | "tiktok";
  format?: "reel" | "carousel" | "post" | "story";
  voice?: boolean;
  video?: boolean;
  videoProvider?: "heygen" | "higgsfield";
  schedule?: string;
};

export type ContentPipelineOutput = {
  hook: string;
  caption: string;
  script: string;
  hashtags: string[];
  cta: string;
  calendarSlot?: string;
};

function extractJson(raw: string): ContentPipelineOutput {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1) throw new Error("no JSON");
  const o = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  return {
    hook: String(o.hook || ""),
    caption: String(o.caption || ""),
    script: String(o.script || o.caption || ""),
    hashtags: Array.isArray(o.hashtags) ? o.hashtags.map(String) : [],
    cta: String(o.cta || ""),
    calendarSlot: o.calendarSlot ? String(o.calendarSlot) : undefined,
  };
}

export async function runMarketingContentPipeline(
  input: ContentPipelineInput,
): Promise<AgencyRunResult & { content: ContentPipelineOutput; media: MediaJob[] }> {
  const muse = getAgent("MUSE");
  const platform = input.platform || "instagram";
  const format = input.format || "reel";

  const llm = await callAgencyLlm(muse.modelo, [
    {
      role: "system",
      content: `Eres MUSE, agente de contenido ZENKAI. Generá contenido para ${platform} formato ${format}.
Responde SOLO JSON: { "hook": "...", "caption": "...", "script": "guion hablado max 60s", "hashtags": ["..."], "cta": "...", "calendarSlot": "ISO date opcional" }
Español LATAM · hook en 3 segundos · valor concreto · CTA suave.`,
    },
    { role: "user", content: input.brief },
  ]);

  if (!llm.ok) {
    throw new Error(llm.error);
  }

  const content = extractJson(llm.text);
  const media = await runMediaPipeline(content.script, {
    voice: input.voice ?? true,
    video: input.video ?? format === "reel",
    videoProvider: input.videoProvider,
  });

  let dispatch: AgencyRunResult["dispatch"];
  const d = await dispatchJarvisEvent("agency.marketing.content", {
    platform,
    format,
    hook: content.hook,
    caption: content.caption,
    script: content.script,
    hashtags: content.hashtags,
    schedule: input.schedule,
    mediaJobs: media.map((m) => ({ provider: m.provider, status: m.status })),
  });
  dispatch = { event: "agency.marketing.content", ok: d.ok, error: d.ok ? undefined : d.error };

  const task = await createOpsTask({
    title: `Publicar ${format} · ${platform}: ${content.hook.slice(0, 50)}`,
    agent: "MUSE",
    department: "marketing",
    priority: "medium",
    status: "review",
    deadline: input.schedule,
  });

  return {
    id: `content_${Date.now()}`,
    agent: "MUSE",
    department: "marketing",
    reply: `${content.hook}\n\n${content.caption}\n\nCTA: ${content.cta}`,
    speech: content.script.slice(0, 220),
    provider: llm.provider,
    model: llm.model,
    timestamp: new Date().toISOString(),
    tasks: [task],
    media,
    dispatch,
    content,
    meta: { platform, format },
  };
}
