/**
 * Windmill · handler de eventos agency (invocado por dispatch.ts)
 */
export async function main(event: string, payload: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ event, payload, ts: new Date().toISOString() }));
  return { ok: true, event, received: true };
}
