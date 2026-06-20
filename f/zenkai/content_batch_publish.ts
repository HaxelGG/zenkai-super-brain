/**
 * Windmill · publica Job aprobado (post-approval · Meta IG)
 * Path: f/zenkai/content_batch_publish
 *
 * Invocado desde approve endpoint o manual:
 *   wmill script run f/zenkai/content_batch_publish -d '{"jobId":"recXXX","approvedBy":"jordy"}'
 */
export async function main(
  jobId: string,
  approvedBy = "windmill",
  apiUrl?: string,
) {
  const base = apiUrl || Deno.env.get("JARVIS_API_URL") || "https://panel.zenkai.systems";
  const secret = Deno.env.get("ZENKAI_API_KEY") || Deno.env.get("CRON_SECRET") || "";

  const res = await fetch(`${base}/api/agency/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify({ action: "approve", jobId, approvedBy }),
  });

  const text = await res.text();
  return { status: res.status, body: text.slice(0, 2000) };
}
