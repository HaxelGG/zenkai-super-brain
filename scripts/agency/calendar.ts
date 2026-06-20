/**
 * Calendario editorial · Airtable ContentCalendar (degradación mock)
 */
const BASE = process.env.AIRTABLE_BASE_VENTAS || "appmiicsbFsvRfxQ9";
const TABLE = process.env.AIRTABLE_TABLE_CONTENT || "ContentCalendar";

export type CalendarItem = {
  id: string;
  title: string;
  platform: "instagram" | "linkedin" | "tiktok";
  format: "reel" | "post" | "carousel" | "story";
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledAt?: string;
  hook?: string;
  caption?: string;
  script?: string;
  publishUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
};

type Record = { id: string; fields: Record<string, unknown> };

function map(r: Record): CalendarItem {
  const f = r.fields;
  return {
    id: r.id,
    title: String(f.title || f.Título || ""),
    platform: (String(f.platform || f.Plataforma || "instagram").toLowerCase() as CalendarItem["platform"]) || "instagram",
    format: (String(f.format || f.Formato || "reel").toLowerCase() as CalendarItem["format"]) || "reel",
    status: (String(f.status || f.Estado || "draft").toLowerCase() as CalendarItem["status"]) || "draft",
    scheduledAt: f.scheduled_at ? String(f.scheduled_at) : f.Fecha ? String(f.Fecha) : undefined,
    hook: f.hook ? String(f.hook) : undefined,
    caption: f.caption ? String(f.caption) : undefined,
    script: f.script ? String(f.script) : undefined,
    publishUrl: f.publish_url ? String(f.publish_url) : undefined,
    videoUrl: f.video_url ? String(f.video_url) : undefined,
    imageUrl: f.image_url ? String(f.image_url) : undefined,
  };
}

export async function listCalendarDue(withinHours = 24): Promise<{ source: "live" | "mock"; items: CalendarItem[] }> {
  const token = process.env.AIRTABLE_TOKEN?.trim();
  if (!token) {
    return { source: "mock", items: [] };
  }

  const res = await fetch(
    `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}?maxRecords=50&filterByFormula=${encodeURIComponent('{status}="scheduled"')}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return { source: "live", items: [] };
  const data = (await res.json()) as { records: Record[] };
  const cutoff = Date.now() + withinHours * 3600_000;
  const items = (data.records || [])
    .map(map)
    .filter((i) => !i.scheduledAt || new Date(i.scheduledAt).getTime() <= cutoff);
  return { source: "live", items };
}

export async function saveCalendarItem(
  item: Omit<CalendarItem, "id"> & { id?: string },
): Promise<CalendarItem> {
  const token = process.env.AIRTABLE_TOKEN?.trim();
  const fields = {
    title: item.title,
    platform: item.platform,
    format: item.format,
    status: item.status,
    scheduled_at: item.scheduledAt,
    hook: item.hook,
    caption: item.caption,
    script: item.script,
    publish_url: item.publishUrl,
  };

  if (!token) {
    return { ...item, id: item.id || `mock_${Date.now()}` };
  }

  const url = item.id?.startsWith("rec")
    ? `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}/${item.id}`
    : `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}`;

  const res = await fetch(url, {
    method: item.id?.startsWith("rec") ? "PATCH" : "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) return { ...item, id: item.id || `local_${Date.now()}` };
  return map((await res.json()) as Record);
}

export async function listCalendarAll(max = 30): Promise<{ source: "live" | "mock"; items: CalendarItem[] }> {
  const token = process.env.AIRTABLE_TOKEN?.trim();
  if (!token) {
    return {
      source: "mock",
      items: [
        {
          id: "mock_1",
          title: "Reel IA clínicas",
          platform: "instagram",
          format: "reel",
          status: "draft",
        },
      ],
    };
  }
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}?maxRecords=${max}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return { source: "live", items: [] };
  const data = (await res.json()) as { records: Record[] };
  return { source: "live", items: (data.records || []).map(map) };
}

export async function getCalendarItem(id: string): Promise<CalendarItem | null> {
  const token = process.env.AIRTABLE_TOKEN?.trim();
  if (!token || !id.startsWith("rec")) {
    const all = await listCalendarAll();
    return all.items.find((i) => i.id === id) || null;
  }
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}/${id}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  return map((await res.json()) as Record);
}

export async function markCalendarPublished(id: string, publishUrl?: string): Promise<void> {
  const token = process.env.AIRTABLE_TOKEN?.trim();
  if (!token || !id.startsWith("rec")) return;
  await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { status: "published", publish_url: publishUrl || "" } }),
  });
}
