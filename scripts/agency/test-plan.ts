import assert from "node:assert/strict";
import {
  extractJsonObject,
  parseProposal,
  parseClassification,
  planProject,
  type PlanDeps,
} from "./plan.js";

let passed = 0;
const ok = (name: string): void => {
  console.log(`  ✓ ${name}`);
  passed++;
};

async function main(): Promise<void> {
  assert.deepEqual(extractJsonObject('```json\n{"a":1}\n```'), { a: 1 });
  ok("extractJsonObject desenvuelve fences");

  const p = parseProposal(
    '{"sector_detectado":"salud","tier_recomendado":"Growth","propuesta":{"headline":"H","dolor_identificado":"D","solucion":"S","agentes_activos":["ATLAS"],"stack":["Airtable"],"timeline_dias":21,"inversion_mensual_usd":900,"proyeccion_90d":"P"}}',
  );
  assert.equal(p.headline, "H");
  assert.equal(p.tier_recomendado, "Growth");
  assert.equal(p.timeline_dias, 21);
  ok("parseProposal aplana la propuesta");

  const c = parseClassification(
    '{"tipo":"CLIENTE","sector_detectado":"salud","departamentos_involucrados":["IA"],"agentes_a_activar":["NEXUS"],"confianza":0.86,"razonamiento":"R"}',
  );
  assert.equal(c.tipo, "CLIENTE");
  assert.deepEqual(c.agentes, ["NEXUS"]);
  assert.equal(c.confianza, 0.86);
  ok("parseClassification mapea campos");

  let createdStatus = "";
  let createdIntent = "";
  const deps: PlanDeps = {
    classify: async () => c,
    propose: async () => p,
    createJob: async (input) => {
      createdStatus = input.status;
      createdIntent = input.intent;
      return { id: "rec_fake_1" };
    },
  };
  const r = await planProject(
    "Tengo una clínica dental en Madrid sin sistema de citas ni seguimiento de pacientes.",
    deps,
  );
  assert.equal(r.ok, true);
  assert.equal(r.job.id, "rec_fake_1");
  assert.equal(r.job.status, "pending_approval");
  assert.equal(r.job.intent, "PROJECT_PROPOSAL");
  assert.equal(createdStatus, "pending_approval");
  assert.equal(createdIntent, "PROJECT_PROPOSAL");
  assert.equal(r.proposal.headline, "H");
  assert.equal(r.classification.tipo, "CLIENTE");
  ok("planProject compone sin ejecutar");

  console.log(`\n${passed} checks passed`);
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
