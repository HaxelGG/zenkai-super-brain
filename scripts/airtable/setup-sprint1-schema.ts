/**
 * Sprint 1 · campos Airtable VENTAS (demos + Leads).
 *
 * Uso:
 *   npm run jarvis:setup-sprint1          # audit only
 *   npm run jarvis:setup-sprint1 -- --apply   # crear campos faltantes
 */
import "dotenv/config";

type FieldDef = {
  name: string;
  type: string;
  options?: Record<string, unknown>;
};

const TABLE_DEMOS = "demos";
const TABLE_LEADS = "Leads";

const REQUIRED: Record<string, FieldDef[]> = {
  [TABLE_DEMOS]: [
    { name: "autoreply_sent", type: "checkbox", options: { icon: "check", color: "greenBright" } },
    {
      name: "respondido_at",
      type: "dateTime",
      options: { dateFormat: { name: "iso" }, timeFormat: { name: "24hour" }, timeZone: "client" },
    },
    { name: "sla_alert_sent", type: "checkbox", options: { icon: "flag", color: "orangeBright" } },
  ],
  [TABLE_LEADS]: [
    { name: "score", type: "number", options: { precision: 0 } },
    {
      name: "etapa",
      type: "singleSelect",
      options: {
        choices: [
          { name: "hot", color: "redBright" },
          { name: "nurturing", color: "yellowBright" },
          { name: "descalificado", color: "grayBright" },
        ],
      },
    },
    { name: "cualificacion_razon", type: "multilineText" },
    { name: "cualificacion_brief", type: "multilineText" },
    {
      name: "respondido_at",
      type: "dateTime",
      options: { dateFormat: { name: "iso" }, timeFormat: { name: "24hour" }, timeZone: "client" },
    },
    { name: "sla_alert_sent", type: "checkbox", options: { icon: "flag", color: "orangeBright" } },
  ],
};

type MetaTable = { id: string; name: string; fields: { name: string }[] };

async function fetchTables(baseId: string, token: string): Promise<MetaTable[]> {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable meta API → HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { tables: MetaTable[] };
  return data.tables;
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
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`create ${field.name} → HTTP ${res.status}: ${err.slice(0, 300)}`);
  }
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_VENTAS;

  console.log(`ZENKAI Sprint 1 · Airtable schema ${apply ? "APPLY" : "check"}\n`);

  if (!token || !baseId) {
    console.log("Falta AIRTABLE_TOKEN o AIRTABLE_BASE_VENTAS en .env");
    console.log("Ver: docs/jarvis/airtable-sprint1-fields.md");
    process.exit(1);
  }

  const tables = await fetchTables(baseId, token);

  for (const [tableName, fields] of Object.entries(REQUIRED)) {
    const table = tables.find((t) => t.name === tableName);
    if (!table) {
      console.log(`Table: ${tableName} — NO ENCONTRADA`);
      continue;
    }

    const existing = new Set(table.fields.map((f) => f.name));
    console.log(`Table: ${tableName} (${existing.size} fields)`);

    for (const field of fields) {
      if (existing.has(field.name)) {
        console.log(`  ✓ ${field.name}`);
        continue;
      }
      console.log(`  ✗ FALTA: ${field.name}`);
      if (apply) {
        await createField(baseId, table.id, token, field);
        console.log(`    + creado ${field.name}`);
        existing.add(field.name);
      }
    }
    console.log("");
  }

  if (!apply) {
    console.log("Para crear campos: npm run jarvis:setup-sprint1 -- --apply");
  }
  console.log("Automations: docs/plans/2026-06-19-sprint1-automatizaciones-n8n.md §4");
  console.log("Leads usa campos ES existentes: Notas, Email, Fuente, Fecha Entrada");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
