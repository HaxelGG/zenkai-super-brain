/**
 * MUSE + APOLLO · batch contenido con Job HITL
 */
import { saveCalendarItem } from "../calendar.js";
import { getClient } from "../clients.js";
import { dispatchAgencyEvent, dispatchToN8nResult } from "../dispatch.js";
import type { ContentBatchParams } from "../intent-router.js";
import { createJob, updateJob, type JobArtifacts, type JobPostArtifact } from "../jobs.js";
import { callAgencyLlm } from "../llm.js";
import { publishToInstagram } from "../providers/meta-publish.js";
import type { AgencyRunResult } from "../types.js";
import { generateImagesForJob, imageBatchLimit } from "./content-images.js";

type BatchSlot = {
  hook: string;
  caption: string;
  hashtags: string[];
  image_prompt: string;
};

function extractBatchJson(raw: string, count: number): BatchSlot[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1) throw new Error("no JSON array in LLM response");
  const arr = JSON.parse(raw.slice(start, end + 1)) as BatchSlot[];
  if (!Array.isArray(arr)) throw new Error("invalid batch array");
  return arr.slice(0, count);
}

export async function runContentBatchPipeline(
  instruction: string,
  params: ContentBatchParams,
): Promise<AgencyRunResult & { jobId: string; artifacts: JobArtifacts }> {
  const client = getClient(params.clientSlug);

  const job = await createJob({
    instruction,
    intent: "CONTENT_BATCH",
    client_slug: params.clientSlug,
    channel: params.channel,
    topic: params.topic,
    count: params.count,
    agents: ["MUSE", "APOLLO"],
    risk_level: "high",
    status: "generating",
  });

  const llm = await callAgencyLlm("sonnet", [
    {
      role: "system",
      content: `Eres MUSE + APOLLO para ${client.name}.
Cliente: ${client.tone}
Mercado: ${client.market} · Sector: ${client.sector}
Canal: ${params.channel} · Formato: ${params.format}

Generá EXACTAMENTE ${params.count} piezas sobre: ${params.topic}

Responde SOLO JSON array (sin markdown):
[{
  "hook": "frase gancho max 120 chars",
  "caption": "copy completo max 2200 chars, español peninsular si cliente ES",
  "hashtags": ["tag1", "tag2"],
  "image_prompt": "prompt detallado para imagen editorial, sin texto en imagen"
}]`,
    },
    { role: "user", content: instruction },
  ]);

  if (!llm.ok) {
    if (job.id.startsWith("rec")) {
      await updateJob(job.id, { status: "failed", rejected_reason: llm.error });
    }
    throw new Error(llm.error);
  }

  const slots = extractBatchJson(llm.text, params.count);
  const posts: JobPostArtifact[] = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]!;
    const calendar = await saveCalendarItem({
      title: slot.hook.slice(0, 80),
      platform: params.channel,
      format: params.format === "carousel" ? "carousel" : "post",
      status: "draft",
      hook: slot.hook,
      caption: slot.caption,
    });
    posts.push({
      index: i + 1,
      hook: slot.hook,
      caption: slot.caption,
      hashtags: slot.hashtags || [],
      image_prompt: slot.image_prompt,
      image_url: null,
      calendar_id: calendar.id,
      publish_status: "draft",
    });
  }

  const artifacts: JobArtifacts = {
    posts,
    client_slug: params.clientSlug,
    channel: params.channel,
    topic: params.topic,
  };

  const updatedJob = job.id.startsWith("rec")
    ? await updateJob(job.id, {
        status: "generating",
        artifacts_json: JSON.stringify(artifacts),
      })
    : null;

  const finalId = updatedJob?.id ?? job.id;

  let imageSummary = "";
  if (finalId.startsWith("rec")) {
    const imgLimit = imageBatchLimit(posts.length);
    const imgResult = await generateImagesForJob(finalId, { limit: imgLimit, onlyMissing: true });
    imageSummary =
      imgResult.generated > 0
        ? `\nImágenes APOLLO: ${imgResult.generated}/${imgLimit} (${imgResult.errors.length ? "con errores" : "listas"}).`
        : `\nImágenes: pendientes · ${imgResult.errors[0] || "generar en HUD Jobs"}.`;
    if (posts.length > imgLimit) {
      imageSummary += `\nRestantes ${posts.length - imgLimit} → botón «Generar imágenes» en Jobs.`;
    }
  }

  const d = await dispatchAgencyEvent("agency.content.batch", {
    jobId: finalId,
    client: params.clientSlug,
    count: posts.length,
    channel: params.channel,
  });

  const preview = posts
    .slice(0, 3)
    .map((p) => `${p.index}. ${p.hook}`)
    .join("\n");

  return {
    id: `batch_${Date.now()}`,
    agent: "MUSE",
    department: "marketing",
    reply: `Generé ${posts.length} borradores para ${client.name} (${params.channel}).\n\n${preview}${posts.length > 3 ? `\n… +${posts.length - 3} más` : ""}${imageSummary}\n\nJob \`${finalId}\` · estado: pending_approval.\nRevisá en JARVIS → Jobs → Aprobar / Editar / Rechazar.`,
    speech: `${posts.length} publicaciones listas para tu revisión en ${client.name}.`,
    provider: llm.provider,
    model: llm.model,
    timestamp: new Date().toISOString(),
    dispatch: dispatchToN8nResult(d),
    jobId: finalId,
    artifacts,
    meta: {
      jobId: finalId,
      status: "pending_approval",
      client: params.clientSlug,
      count: posts.length,
      jobsUrl: `/jarvis/jobs?job=${finalId}`,
    },
  };
}

export async function executeApprovedJob(
  jobId: string,
  approvedBy = "founder",
): Promise<{ jobId: string; published: number; skipped: number; errors: string[] }> {
  const { getJob } = await import("../jobs.js");
  const job = await getJob(jobId);
  if (!job?.artifacts?.posts?.length) {
    throw new Error("Job not found or empty artifacts");
  }
  if (job.status !== "pending_approval" && job.status !== "approved") {
    throw new Error(`Job status must be pending_approval, got ${job.status}`);
  }

  await updateJob(jobId, {
    status: "executing",
    approved_by: approvedBy,
    approved_at: new Date().toISOString(),
  });

  const errors: string[] = [];
  let published = 0;
  let skipped = 0;

  for (const post of job.artifacts.posts) {
    const caption = [post.hook, post.caption, post.hashtags?.map((h) => `#${h.replace(/^#/, "")}`).join(" ")]
      .filter(Boolean)
      .join("\n\n");

    if (!post.image_url) {
      post.publish_status = "skipped";
      post.publish_error = "image_url missing — generar con APOLLO (Gemini/Higgsfield) antes de publicar";
      skipped++;
      continue;
    }

    const result = await publishToInstagram({ caption, imageUrl: post.image_url });
    if (result.status === "done") {
      post.publish_status = "published";
      post.meta_post_id = result.postId;
      published++;
    } else {
      post.publish_status = "error";
      post.publish_error = result.error || "publish failed";
      errors.push(`#${post.index}: ${post.publish_error}`);
    }
  }

  const artifacts = { ...job.artifacts, publish_results: { published, skipped, errors } };
  await updateJob(jobId, {
    status: errors.length && !published ? "failed" : "done",
    artifacts_json: JSON.stringify(artifacts),
  });

  return { jobId, published, skipped, errors };
}

export async function rejectJob(jobId: string, reason: string): Promise<void> {
  await updateJob(jobId, { status: "rejected", rejected_reason: reason.slice(0, 2000) });
}
