/**
 * Meta Graph · publicación Instagram (env-gated)
 */
import type { MediaJob } from "../types.js";

export type PublishInput = {
  caption: string;
  imageUrl?: string;
  videoUrl?: string;
  scheduledAt?: string;
};

export type PublishResult = MediaJob & { postId?: string };

export async function publishToInstagram(input: PublishInput): Promise<PublishResult> {
  const token =
    process.env.META_ACCESS_TOKEN ||
    process.env.WHATSAPP_ACCESS_TOKEN ||
    process.env.META_SYSTEM_USER_TOKEN;
  const igId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim();

  if (!token?.trim()) {
    return { provider: "meta", status: "skipped", error: "META_ACCESS_TOKEN missing" };
  }
  if (!igId) {
    return { provider: "meta", status: "skipped", error: "INSTAGRAM_BUSINESS_ACCOUNT_ID missing" };
  }

  if (!input.imageUrl && !input.videoUrl) {
    return {
      provider: "meta",
      status: "skipped",
      error: "imageUrl or videoUrl required for Meta publish",
    };
  }

  try {
    if (input.videoUrl) {
      const container = await graphPost<{ id: string }>(token, `${igId}/media`, {
        media_type: "REELS",
        video_url: input.videoUrl,
        caption: input.caption.slice(0, 2200),
      });
      const published = await graphPost<{ id: string }>(token, `${igId}/media_publish`, {
        creation_id: container.id,
      });
      return { provider: "meta", status: "done", artifactUrl: input.videoUrl, postId: published.id };
    }

    const container = await graphPost<{ id: string }>(token, `${igId}/media`, {
      image_url: input.imageUrl,
      caption: input.caption.slice(0, 2200),
    });
    const published = await graphPost<{ id: string }>(token, `${igId}/media_publish`, {
      creation_id: container.id,
    });
    return { provider: "meta", status: "done", artifactUrl: input.imageUrl, postId: published.id };
  } catch (e) {
    return {
      provider: "meta",
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function graphPost<T>(
  token: string,
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`https://graph.facebook.com/v21.0/${path}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta ${path} → ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}
