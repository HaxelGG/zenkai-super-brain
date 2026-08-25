/**
 * Airtable Agency · Tasks · ContentCalendar · Goals
 * npm run agency:setup-schema [-- --apply]
 */
import "dotenv/config";

type FieldDef = { name: string; type: string; options?: Record<string, unknown> };

const TABLES: Record<string, { fields: FieldDef[] }> = {
  Tasks: {
    fields: [
      { name: "title", type: "singleLineText" },
      {
        name: "agent",
        type: "singleSelect",
        options: {
          choices: ["ARES", "HERMES", "ATLAS", "NEXUS", "MUSE", "FORGE", "ORACLE", "ZEUS"].map((n) => ({
            name: n,
          })),
        },
      },
      {
        name: "department",
        type: "singleSelect",
        options: {
          choices: ["marketing", "sales", "operations", "ia", "finance", "strategy"].map((n) => ({
            name: n,
          })),
        },
      },
      {
        name: "priority",
        type: "singleSelect",
        options: { choices: [{ name: "high" }, { name: "medium" }, { name: "low" }] },
      },
      {
        name: "status",
        type: "singleSelect",
        options: {
          choices: ["pending", "working", "review", "done"].map((n) => ({ name: n })),
        },
      },
      { name: "deadline", type: "dateTime", options: { dateFormat: { name: "iso" }, timeFormat: { name: "24hour" }, timeZone: "client" } },
    ],
  },
  ContentCalendar: {
    fields: [
      { name: "title", type: "singleLineText" },
      {
        name: "platform",
        type: "singleSelect",
        options: { choices: [{ name: "instagram" }, { name: "linkedin" }, { name: "tiktok" }] },
      },
      {
        name: "format",
        type: "singleSelect",
        options: { choices: [{ name: "reel" }, { name: "post" }, { name: "carousel" }, { name: "story" }] },
      },
      {
        name: "status",
        type: "singleSelect",
        options: { choices: [{ name: "draft" }, { name: "scheduled" }, { name: "published" }, { name: "failed" }] },
      },
      { name: "scheduled_at", type: "dateTime", options: { dateFormat: { name: "iso" }, timeFormat: { name: "24hour" }, timeZone: "client" } },
      { name: "hook", type: "multilineText" },
      { name: "caption", type: "multilineText" },
      { name: "script", type: "multilineText" },
      { name: "video_url", type: "url" },
      { name: "image_url", type: "url" },
      { name: "publish_url", type: "url" },
    ],
  },
  Goals: {
    fields: [
      { name: "title", type: "singleLineText" },
      { name: "target", type: "number", options: { precision: 0 } },
      { name: "current", type: "number", options: { precision: 0 } },
      { name: "unit", type: "singleLineText" },
      {
        name: "status",
        type: "singleSelect",
        options: { choices: [{ name: "green" }, { name: "yellow" }, { name: "red" }] },
      },
      { name: "deadline", type: "date", options: { dateFormat: { name: "iso" } } },
    ],
  },
  Activity: {
    // Log durable del feed: cada run del orquestador + tick del scheduler.
    // `message` va primero (campo primario · singleLineText).
    fields: [
      { name: "message", type: "singleLineText" },
      { name: "ts", type: "dateTime", options: { dateFormat: { name: "iso" }, timeFormat: { name: "24hour" }, timeZone: "client" } },
      { name: "type", type: "singleLineText" },
      { name: "agent", type: "singleLineText" },
      { name: "department", type: "singleLineText" },
      { name: "status", type: "singleLineText" },
      { name: "source", type: "singleLineText" },
      { name: "ref", type: "singleLineText" },
    ],
  },
};

type MetaTable = { id: string; name: string; fields: { name: string }[] };

async function fetchTables(baseId: string, token: string): Promise<MetaTable[]> {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`meta API ${res.status}`);
  return ((await res.json()) as { tables: MetaTable[] }).tables;
}

async function createTable(baseId: string, token: string, name: string, fields: FieldDef[]): Promise<void> {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      fields: fields.map((f) => ({ name: f.name, type: f.type, ...(f.options ? { options: f.options } : {}) })),
    }),
  });
  if (!res.ok) console.error(`create table ${name}:`, await res.text());
  else console.log(`✓ tabla ${name} creada`);
}

async function createField(baseId: string, tableId: string, token: string, field: FieldDef): Promise<void> {
  const body: Record<string, unknown> = { name: field.name, type: field.type };
  if (field.options) body.options = field.options;
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error(`  field ${field.name}:`, (await res.text()).slice(0, 120));
  else console.log(`  ✓ ${field.name}`);
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_VENTAS;
  console.log(`Agency Airtable schema ${apply ? "APPLY" : "CHECK"}\n`);
  if (!token || !baseId) {
    console.log("Set AIRTABLE_TOKEN + AIRTABLE_BASE_VENTAS");
    process.exit(1);
  }

  const tables = await fetchTables(baseId, token);
  for (const [tableName, spec] of Object.entries(TABLES)) {
    const existing = tables.find((t) => t.name === tableName);
    if (!existing) {
      console.log(`MISSING table: ${tableName}`);
      if (apply) await createTable(baseId, token, tableName, spec.fields);
      continue;
    }
    const have = new Set(existing.fields.map((f) => f.name));
    for (const f of spec.fields) {
      if (!have.has(f.name)) {
        console.log(`${tableName}.${f.name} missing`);
        if (apply) await createField(baseId, existing.id, token, f);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
