/**
 * Genera imágenes APOLLO para un Job existente
 */
import type { JobPostArtifact } from "../jobs.js";
import { getJob, updateJob } from "../jobs.js";
import { getClient } from "../clients.js";
import { generateImagesForPosts } from "../providers/image-gen.js";

export function imageBatchLimit(requested: number): number {
  const env = parseInt(process.env.APOLLO_IMAGE_BATCH_LIMIT || "", 10);
  if (!Number.isNaN(env) && env > 0) return Math.min(requested, env);
  if (process.env.VERCEL) return Math.min(requested, 3);
  return requested;
}

export async function generateImagesForJob(
  jobId: string,
  opts?: { limit?: number; onlyMissing?: boolean },
): Promise<{ jobId: string; generated: number; errors: string[] }> {
  const job = await getJob(jobId);
  if (!job?.artifacts?.posts?.length) {
    throw new Error("Job not found or empty artifacts");
  }

  const client = getClient(job.client_slug);
  const posts = job.artifacts.posts;
  const targets =
    opts?.onlyMissing !== false
      ? posts.filter((p) => !p.image_url && !p.image_preview)
      : posts;

  const limit = opts?.limit ?? imageBatchLimit(targets.length);
  const slice = targets.slice(0, limit);
  if (!slice.length) {
    return { jobId, generated: 0, errors: [] };
  }

  await updateJob(jobId, { status: "generating" });

  const results = await generateImagesForPosts(slice, {
    clientTone: client.tone,
    aspectRatio: job.channel === "instagram" ? "4:5" : "1:1",
    concurrency: 2,
    limit: slice.length,
  });

  const errors: string[] = [];
  let generated = 0;

  for (let i = 0; i < slice.length; i++) {
    const post = slice[i]!;
    const result = results[i]!;
    if (result.status === "done") {
      if (result.url) post.image_url = result.url;
      if (result.previewDataUrl) post.image_preview = result.previewDataUrl;
      post.image_provider =
        result.provider === "gemini" || result.provider === "higgsfield"
          ? result.provider
          : undefined;
      generated++;
    } else {
      post.image_error = result.error || "generation failed";
      errors.push(`#${post.index}: ${post.image_error}`);
    }
  }

  await updateJob(jobId, {
    status: "pending_approval",
    artifacts_json: JSON.stringify({ ...job.artifacts, posts }),
  });

  return { jobId, generated, errors };
}

export async function updateJobPost(
  jobId: string,
  index: number,
  patch: Partial<Pick<JobPostArtifact, "hook" | "caption" | "hashtags" | "image_prompt">>,
): Promise<void> {
  const job = await getJob(jobId);
  if (!job?.artifacts?.posts) throw new Error("Job not found");

  const post = job.artifacts.posts.find((p) => p.index === index);
  if (!post) throw new Error(`Post #${index} not found`);

  Object.assign(post, patch);
  await updateJob(jobId, {
    artifacts_json: JSON.stringify(job.artifacts),
  });
}
