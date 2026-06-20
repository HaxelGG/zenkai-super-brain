/**
 * Sprint 1 · checklist campos Airtable VENTAS (demos + leads).
 * No modifica schema automáticamente — imprime lo que falta crear manualmente.
 *
 * Uso: npm run jarvis:setup-sprint1
 */
import "dotenv/config";

const REQUIRED: Record<string, { table: string; type: string; note?: string }[]> = {
  demos: [
    { table: "demos", type: "Checkbox", note: "autoreply_sent" },
    { table: "demos", type: "Date/time", note: "respondido_at" },
    { table: "demos", type: "Checkbox", note: "sla_alert_sent" },
  ],
  leads: [
    { table: "leads", type: "Number", note: "score" },
    { table: "leads", type: "Single select", note: "etapa (hot|nurturing|descalificado)" },
    { table: "leads", type: "Long text", note: "cualificacion_razon" },
    { table: "leads", type: "Long text", note: "cualificacion_brief" },
    { table: "leads", type: "Date/time", note: "respondido_at" },
    { table: "leads", type: "Checkbox", note: "sla_alert_sent" },
    { table: "leads", type: "Date/time", note: "created_at (si no existe)" },
  ],
};

async function fetchTableFields(baseId: string, tableName: string): Promise<Set<string>> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error("Falta AIRTABLE_TOKEN en .env");

  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Airtable meta API → HTTP ${res.status}`);
  const data = (await res.json()) as {
    tables: { name: string; fields: { name: string }[] }[];
  };
  const table = data.tables.find((t) => t.name === tableName);
  if (!table) return new Set();
  return new Set(table.fields.map((f) => f.name));
}

async function main(): Promise<void> {
  const baseId = process.env.AIRTABLE_BASE_VENTAS;
  console.log("ZENKAI Sprint 1 · Airtable schema check\n");

  if (!baseId) {
    console.log("⚠ AIRTABLE_BASE_VENTAS no configurado — lista manual:\n");
    for (const [table, fields] of Object.entries(REQUIRED)) {
      console.log(`## ${table}`);
      for (const f of fields) console.log(`  - ${f.note ?? f.type} (${f.type})`);
    }
    console.log("\nVer: docs/jarvis/airtable-sprint1-fields.md");
    return;
  }

  for (const [tableName, required] of Object.entries(REQUIRED)) {
    const existing = await fetchTableFields(baseId, tableName);
    console.log(`Table: ${tableName} (${existing.size} fields)`);
    for (const req of required) {
      const fieldName = req.note?.split(" ")[0] ?? req.type;
      const names = [...existing];
      const found = names.some(
        (n) => n === fieldName || n.toLowerCase().replace(/\s/g, "_") === fieldName,
      );
      console.log(found ? `  ✓ ${fieldName}` : `  ✗ CREAR: ${req.note ?? req.type}`);
    }
    console.log("");
  }

  console.log("Automations: docs/plans/2026-06-19-sprint1-automatizaciones-n8n.md §4");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
