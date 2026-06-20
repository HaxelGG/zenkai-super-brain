/**
 * JARVIS · benchmark inteligencia, autonomía y routing de modelos
 * Uso: npm run jarvis:benchmark [-- --live]
 */
import "dotenv/config";
import { classifyJarvisInstruction, routeJarvisModel } from "./model-router.js";
import { askJarvisBrain, isJarvisBrainEnabled } from "./brain.js";
import { executeJarvisInstruction } from "./orchestrator.js";

type BenchCase = {
  id: string;
  instruction: string;
  expectTier: "simple" | "complex";
  expectAgent?: string;
  expectNavigate?: string;
  expectDispatch?: boolean;
  category: "routing" | "autonomy" | "personality" | "latency";
};

const CASES: BenchCase[] = [
  {
    id: "nav-pipeline",
    instruction: "Abre el pipeline de leads",
    expectTier: "simple",
    expectNavigate: "/jarvis/pipeline/",
    category: "routing",
  },
  {
    id: "saludo",
    instruction: "Hola parce, ¿cómo estamos?",
    expectTier: "simple",
    category: "personality",
  },
  {
    id: "recap-simple",
    instruction: "Dame un recap rápido del CRM",
    expectTier: "simple",
    category: "autonomy",
  },
  {
    id: "estrategia-compleja",
    instruction:
      "Analizá la estrategia multi-departamento para llegar a 100K USD: priorizá marketing, ventas e IA, con roadmap trimestral y riesgos",
    expectTier: "complex",
    expectAgent: "ZEUS",
    category: "autonomy",
  },
  {
    id: "automation-complex",
    instruction:
      "Diseñá un flujo n8n que conecte Airtable leads con WhatsApp follow-up y dispare alerta si el score baja de 60",
    expectTier: "complex",
    expectAgent: "NEXUS",
    expectDispatch: true,
    category: "autonomy",
  },
  {
    id: "agente-tag",
    instruction: "[AGENTE HERMES] ¿Cuántos leads calientes hay y quién hay que llamar hoy?",
    expectTier: "complex",
    category: "autonomy",
  },
];

function pass(label: string, ok: boolean, detail?: string) {
  const icon = ok ? "✓" : "✗";
  console.log(`  ${icon} ${label}${detail ? ` · ${detail}` : ""}`);
  return ok;
}

function runRoutingBench() {
  console.log("\n── Routing de complejidad (local, sin API) ──");
  let ok = 0;
  for (const c of CASES) {
    const route = routeJarvisModel(c.instruction);
    const tierOk = route.tier === c.expectTier;
    if (tierOk) ok++;
    pass(
      c.id,
      tierOk,
      `tier=${route.tier} score=${route.score} model=${route.deepseekModel}/${route.anthropicModel}`,
    );
  }
  return { total: CASES.length, ok };
}

async function runLiveBench() {
  if (!isJarvisBrainEnabled()) {
    console.log("\n⚠ Live bench omitido: sin DEEPSEEK_API_KEY ni ANTHROPIC_API_KEY");
    return { total: 0, ok: 0 };
  }

  console.log("\n── Cerebro JARVIS (live API) ──");
  let ok = 0;
  const subset = CASES.slice(0, 4);

  for (const c of subset) {
    const t0 = Date.now();
    try {
      const result = await executeJarvisInstruction(c.instruction);
      const ms = Date.now() - t0;
      const route = routeJarvisModel(c.instruction);

      let caseOk = true;
      caseOk = pass(`${c.id} · respuesta`, !!result.reply?.trim(), `${ms}ms · ${result.source}`) && caseOk;
      caseOk =
        pass(`${c.id} · speech corto`, (result.speech?.length ?? 0) <= 240, `${result.speech?.length} chars`) &&
        caseOk;

      if (c.expectNavigate) {
        caseOk =
          pass(
            `${c.id} · navigate`,
            result.action?.path === c.expectNavigate,
            result.action?.path ?? "sin action",
          ) && caseOk;
      }

      if (c.expectAgent) {
        caseOk =
          pass(`${c.id} · agente`, result.agent === c.expectAgent, result.agent ?? "ninguno") && caseOk;
      }

      if (result.meta?.tier) {
        pass(`${c.id} · tier meta`, result.meta.tier === route.tier, result.meta.tier);
      }

      if (caseOk) ok++;
    } catch (e) {
      pass(c.id, false, e instanceof Error ? e.message : String(e));
    }
  }

  return { total: subset.length, ok };
}

async function runBrainJsonBench() {
  if (!isJarvisBrainEnabled()) return { total: 0, ok: 0 };

  console.log("\n── JSON estructurado (brain directo) ──");
  const ctx = "[CONTEXTO OPERATIVO · benchmark · DEMO]\nCRM: 12 leads · 3 clientes activos";
  const t0 = Date.now();
  const brain = await askJarvisBrain("Parce, ¿cómo vamos con los leads?", ctx);
  const ms = Date.now() - t0;

  if (!brain.ok) {
    pass("brain-json", false, brain.error);
    return { total: 1, ok: 0 };
  }

  const hasSpeech = brain.data.speech.length > 0 && brain.data.speech.length <= 220;
  const paisaHint = /parce|pues|¿cierto|listo|mirá|vea|bacano|qué tal/i.test(
    brain.data.speech + brain.data.reply,
  );

  pass("brain-json", true, `${ms}ms · ${brain.provider}/${brain.model}`);
  pass("speech-length", hasSpeech, `${brain.data.speech.length} chars`);
  pass("tono-paisa", paisaHint, brain.data.speech.slice(0, 80));

  return { total: 3, ok: (hasSpeech ? 1 : 0) + (paisaHint ? 1 : 0) + 1 };
}

async function main() {
  const live = process.argv.includes("--live");

  console.log("JARVIS Benchmark · inteligencia · autonomía · routing");
  console.log(`Brain enabled: ${isJarvisBrainEnabled()} · live: ${live}`);

  const routing = runRoutingBench();
  const brain = live ? await runBrainJsonBench() : { total: 0, ok: 0 };
  const orch = live ? await runLiveBench() : { total: 0, ok: 0 };

  const total = routing.total + brain.total + orch.total;
  const passed = routing.ok + brain.ok + orch.ok;

  console.log(`\n══ Resultado: ${passed}/${total} checks (${live ? "live" : "routing only"}) ══`);

  if (!live) {
    console.log("Tip: npm run jarvis:benchmark -- --live  (requiere API keys en .env)");
  }

  process.exit(passed >= Math.floor(total * 0.6) ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
