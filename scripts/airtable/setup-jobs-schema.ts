/**
 * Agency Jobs · tabla Airtable VENTAS
 *
 * Uso:
 *   npm run jarvis:setup-jobs
 *   npm run jarvis:setup-jobs -- --apply
 */
import "dotenv/config";

type FieldDef = {
  name: string;
  type: string;
  options?: Record<string, unknown>;
};

const TABLE_JOBS = "Jobs";

const REQUIRED: FieldDef[] = [
  { name: "instruction", type: "multilineText" },
  {
    name: "intent",
    type: "singleSelect",
    options: {
      choices: [
        { name: "CONTENT_BATCH", color: "purpleBright" },
        { name: "CONTENT_SINGLE", color: "blueBright" },
        { name: "COMMUNICATION", color: "redBright" },
        { name: "CODE_BUILD", color: "greenBright" },
        { name: "AUTOMATION", color: "yellowBright" },
        { name: "QUERY", color: "grayBright" },
      ],
    },
  },
  {
    name: "status",
    type: "singleSelect",
    options: {
      choices: [
        { name: "draft", color: "grayBright" },
        { name: "generating", color: "yellowBright" },
        { name: "pending_approval", color: "orangeBright" },
        { name: "approved", color: "greenBright" },
        { name: "executing", color: "blueBright" },
        { name: "done", color: "greenBright" },
        { name: "rejected", color: "redBright" },
        { name: "failed", color: "redBright" },
      ],
    },
  },
  { name: "client_slug", type: "singleLineText" },
  {
    name: "channel",
    type: "singleSelect",
    options: {
      choices: [
        { name: "instagram", color: "pinkBright" },
        { name: "linkedin", color: "blueBright" },
        { name: "tiktok", color: "cyanBright" },
      ],
    },
  },
  { name: "topic", type: "multilineText" },
  { name: "count", type: "number", options: { precision: 0 } },
  { name: "agents", type: "singleLineText" },
  {
    name: "risk_level",
    type: "singleSelect",
    options: {
      choices: [
        { name: "low", color: "greenBright" },
        { name: "medium", color: "yellowBright" },
        { name: "high", color: "redBright" },
      ],
    },
  },
  { name: "artifacts_json", type: "multilineText" },
  { name: "approved_by", type: "singleLineText" },
  {
    name: "approved_at",
    type: "dateTime",
    options: { dateFormat: { name: "iso" }, timeFormat: { name: "24hour" }, timeZone: "client" },
  },
  { name: "rejected_reason", type: "multilineText" },
];

type MetaTable = { id: string; name: string; fields: { name: string }[] };

async function fetchTables(baseId: string, token: string): Promise<MetaTable[]> {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`meta API → ${res.status}`);
  return ((await res.json()) as { tables: MetaTable[] }).tables;
}

async function createTable(baseId: string, token: string): Promise<MetaTable> {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: TABLE_JOBS,
      fields: REQUIRED.slice(0, 3).map((f) => ({ name: f.name, type: f.type, options: f.options })),
    }),
  });
  if (!res.ok) throw new Error(`create table → ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as MetaTable;
}

async function createField(
  baseId: string,
  tableId: string,
  token: string,
  field: FieldDef,
): Promise<void> {
  const body: Record<string, unknown> = { name: field.name, type: field.type };
  if (field.options) body.options = field.options;
  const res = await fetch(
    `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`create ${field.name} → ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_VENTAS;
  console.log(`Agency Jobs · Airtable ${apply ? "APPLY" : "check"}\n`);

  if (!token || !baseId) {
    console.log("Falta AIRTABLE_TOKEN o AIRTABLE_BASE_VENTAS");
    process.exit(1);
  }

  let tables = await fetchTables(baseId, token);
  let table = tables.find((t) => t.name === TABLE_JOBS);

  if (!table) {
    console.log(`Table ${TABLE_JOBS} — NO ENCONTRADA`);
    if (apply) {
      table = await createTable(baseId, token);
      console.log(`+ tabla ${TABLE_JOBS} creada (${table.id})`);
      tables = await fetchTables(baseId, token);
      table = tables.find((t) => t.name === TABLE_JOBS)!;
    } else {
      console.log("Ejecutar con --apply para crear tabla");
      process.exit(0);
    }
  }

  const existing = new Set(table.fields.map((f) => f.name));
  console.log(`Table: ${TABLE_JOBS} (${existing.size} fields)\n`);

  for (const field of REQUIRED) {
    if (existing.has(field.name)) {
      console.log(`  ✓ ${field.name}`);
      continue;
    }
    console.log(`  ✗ FALTA: ${field.name}`);
    if (apply) {
      await createField(baseId, table.id, token, field);
      console.log(`    + creado`);
    }
  }

  if (!apply) console.log("\nnpm run jarvis:setup-jobs -- --apply");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
