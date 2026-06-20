/**
 * APOLLO · generación de imágenes · Gemini Imagen + Higgsfield Platform
 */
export type ImageGenProvider = "gemini" | "higgsfield" | "auto";

export type ImageGenResult = {
  provider: ImageGenProvider | "none";
  status: "done" | "skipped" | "error";
  url?: string;
  previewDataUrl?: string;
  error?: string;
};

export type ImageGenOptions = {
  provider?: ImageGenProvider;
  aspectRatio?: "1:1" | "4:5" | "9:16" | "16:9";
  clientTone?: string;
};

function higgsfieldCredentials(): string | null {
  const combined =
    process.env.HF_CREDENTIALS?.trim() ||
    process.env.HIGGSFIELD_API_KEY?.trim() ||
    null;
  if (combined?.includes(":")) return combined;

  const key = process.env.HIGGSFIELD_API_KEY?.trim();
  const secret = process.env.HIGGSFIELD_API_SECRET?.trim();
  if (key && secret) return `${key}:${secret}`;
  return null;
}

function geminiKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim() || null;
}

function resolveProvider(preferred?: ImageGenProvider): ImageGenProvider {
  const env = (process.env.APOLLO_IMAGE_PROVIDER || "auto").toLowerCase() as ImageGenProvider;
  const pick = preferred && preferred !== "auto" ? preferred : env;
  if (pick === "gemini" || pick === "higgsfield") return pick;
  if (higgsfieldCredentials()) return "higgsfield";
  if (geminiKey()) return "gemini";
  return "higgsfield";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function pollHiggsfieldRequest(
  requestId: string,
  creds: string,
  maxMs = 120_000,
): Promise<{ url?: string; error?: string }> {
  const base = process.env.HIGGSFIELD_PLATFORM_URL?.trim() || "https://platform.higgsfield.ai";
  const started = Date.now();

  while (Date.now() - started < maxMs) {
    const res = await fetch(`${base}/requests/${requestId}/status`, {
      headers: {
        Authorization: `Key ${creds}`,
        Accept: "application/json",
        "User-Agent": "zenkai-agency/1.0",
      },
    });
    if (!res.ok) {
      return { error: `Higgsfield status HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      status?: string;
      images?: Array<{ url?: string }>;
      video?: { url?: string };
      error?: string;
    };

    if (body.status === "completed") {
      const url = body.images?.[0]?.url || body.video?.url;
      return url ? { url } : { error: "completed without url" };
    }
    if (body.status === "failed" || body.status === "nsfw" || body.status === "cancelled") {
      return { error: body.error || `Higgsfield ${body.status}` };
    }

    await sleep(2500);
  }
  return { error: "Higgsfield poll timeout" };
}

export async function generateHiggsfieldImage(
  prompt: string,
  aspectRatio: ImageGenOptions["aspectRatio"] = "4:5",
): Promise<ImageGenResult> {
  const creds = higgsfieldCredentials();
  if (!creds) {
    return { provider: "higgsfield", status: "skipped", error: "HIGGSFIELD credentials missing (KEY:SECRET)" };
  }

  const base = process.env.HIGGSFIELD_PLATFORM_URL?.trim() || "https://platform.higgsfield.ai";
  const model =
    process.env.HIGGSFIELD_IMAGE_MODEL?.trim() || "bytedance/seedream/v4/text-to-image";

  try {
    const res = await fetch(`${base}/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${creds}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "zenkai-agency/1.0",
      },
      body: JSON.stringify({
        prompt: prompt.slice(0, 1200),
        resolution: process.env.HIGGSFIELD_IMAGE_RESOLUTION || "2K",
        aspect_ratio: aspectRatio,
        camera_fixed: false,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return {
        provider: "higgsfield",
        status: "error",
        error: `HTTP ${res.status}: ${detail.slice(0, 160)}`,
      };
    }

    const body = (await res.json()) as {
      request_id?: string;
      status?: string;
      images?: Array<{ url?: string }>;
    };

    if (body.status === "completed" && body.images?.[0]?.url) {
      return { provider: "higgsfield", status: "done", url: body.images[0].url };
    }

    const requestId = body.request_id;
    if (!requestId) {
      return { provider: "higgsfield", status: "error", error: "no request_id in response" };
    }

    const polled = await pollHiggsfieldRequest(requestId, creds);
    if (polled.url) {
      return { provider: "higgsfield", status: "done", url: polled.url };
    }
    return { provider: "higgsfield", status: "error", error: polled.error || "poll failed" };
  } catch (e) {
    return {
      provider: "higgsfield",
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function generateGeminiImage(
  prompt: string,
  aspectRatio: ImageGenOptions["aspectRatio"] = "4:5",
): Promise<ImageGenResult> {
  const apiKey = geminiKey();
  if (!apiKey) {
    return { provider: "gemini", status: "skipped", error: "GEMINI_API_KEY missing" };
  }

  const model = process.env.GEMINI_IMAGE_MODEL?.trim() || "imagen-3.0-generate-002";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: prompt.slice(0, 1200) }],
        parameters: {
          sampleCount: 1,
          aspectRatio,
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return {
        provider: "gemini",
        status: "error",
        error: `HTTP ${res.status}: ${detail.slice(0, 160)}`,
      };
    }

    const body = (await res.json()) as {
      predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
    };
    const pred = body.predictions?.[0];
    if (!pred?.bytesBase64Encoded) {
      return { provider: "gemini", status: "error", error: "no image bytes in response" };
    }

    const mime = pred.mimeType || "image/png";
    const previewDataUrl = `data:${mime};base64,${pred.bytesBase64Encoded}`;

    // Meta publish needs HTTPS URL — try Higgsfield CDN upload when credentials exist
    const hosted = await hostImageViaHiggsfield(Buffer.from(pred.bytesBase64Encoded, "base64"), mime);
    if (hosted) {
      return { provider: "gemini", status: "done", url: hosted, previewDataUrl };
    }

    return {
      provider: "gemini",
      status: "done",
      previewDataUrl,
      error: hosted === null ? undefined : "hosted url unavailable — preview only",
    };
  } catch (e) {
    return {
      provider: "gemini",
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Sube bytes a Higgsfield CDN (presigned) para obtener URL pública · opcional */
async function hostImageViaHiggsfield(data: Buffer, mime: string): Promise<string | null> {
  const creds = higgsfieldCredentials();
  if (!creds) return null;

  const base = process.env.HIGGSFIELD_PLATFORM_URL?.trim() || "https://platform.higgsfield.ai";

  try {
    const init = await fetch(`${base}/v1/uploads`, {
      method: "POST",
      headers: {
        Authorization: `Key ${creds}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content_type: mime }),
    });
    if (!init.ok) return null;

    const meta = (await init.json()) as { upload_url?: string; url?: string; public_url?: string };
    if (meta.upload_url) {
      await fetch(meta.upload_url, {
        method: "PUT",
        headers: { "Content-Type": mime },
        body: new Uint8Array(data),
      });
    }
    return meta.url || meta.public_url || null;
  } catch {
    return null;
  }
}

export async function generatePostImage(
  prompt: string,
  opts: ImageGenOptions = {},
): Promise<ImageGenResult> {
  const provider = resolveProvider(opts.provider);
  const aspect = opts.aspectRatio || "4:5";
  const enriched = opts.clientTone
    ? `${prompt}. Brand tone: ${opts.clientTone}. No text overlay, no watermark.`
    : prompt;

  if (provider === "higgsfield") {
    const hf = await generateHiggsfieldImage(enriched, aspect);
    if (hf.status === "done") return hf;
    if (geminiKey()) {
      const gm = await generateGeminiImage(enriched, aspect);
      if (gm.status === "done") return { ...gm, provider: "gemini" };
    }
    return hf;
  }

  const gm = await generateGeminiImage(enriched, aspect);
  if (gm.status === "done" && (gm.url || gm.previewDataUrl)) return gm;
  if (higgsfieldCredentials()) {
    const hf = await generateHiggsfieldImage(enriched, aspect);
    if (hf.status === "done") return hf;
  }
  return gm;
}

export async function generateImagesForPosts<T extends { image_prompt: string }>(
  posts: T[],
  opts: ImageGenOptions & { concurrency?: number; limit?: number } = {},
): Promise<Array<ImageGenResult>> {
  const limit = opts.limit ?? posts.length;
  const slice = posts.slice(0, limit);
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 2, 4));
  const results: ImageGenResult[] = new Array(slice.length);

  let idx = 0;
  async function worker(): Promise<void> {
    while (idx < slice.length) {
      const i = idx++;
      const post = slice[i]!;
      results[i] = await generatePostImage(post.image_prompt, opts);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}
