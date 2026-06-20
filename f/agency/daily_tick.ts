/**
 * Windmill · tick diario (schedule: 8am, 2pm, 8pm COT)
 * Llama al endpoint Vercel /api/agency/cron/tick
 */
export async function main() {
  const url = Deno.env.get("JARVIS_API_URL") || "https://panel.zenkai.systems";
  const secret = Deno.env.get("CRON_SECRET") || "";
  const res = await fetch(`${url}/api/agency/cron/tick`, {
    method: "POST",
    headers: {
      Authorization: secret ? `Bearer ${secret}` : "",
      "Content-Type": "application/json",
    },
  });
  const body = await res.text();
  return { status: res.status, body: body.slice(0, 500) };
}
