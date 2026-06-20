/**
 * Windmill · generar imágenes faltantes para un Job HITL
 * Llama POST /api/agency/jobs { action: "generate_images", jobId, limit? }
 */
export async function main(
  jobId: string,
  limit?: number,
  apiUrl?: string,
  apiKey?: string,
): Promise<unknown> {
  const base = apiUrl || Deno.env.get("JARVIS_API_URL") || "https://panel.zenkai.systems";
  const key = apiKey || Deno.env.get("ZENKAI_API_KEY") || "";
  if (!jobId?.startsWith("rec")) throw new Error("jobId must be rec...");

  const res = await fetch(`${base.replace(/\/$/, "")}/api/agency/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "generate_images",
      jobId,
      limit: limit || undefined,
    }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}
