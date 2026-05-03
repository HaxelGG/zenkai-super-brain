// Test runner del clasificador · 10 casos: 6 ejemplos de §12 CLAUDE.md + 4 edge cases.
// Cada caso declara expectativas mínimas (tipo, sector). El resto se inspecciona visualmente.
// Costo aprox: ~$0.02 por corrida completa (Haiku 4.5 · 10 calls cortos).

import { clasificar } from "./clasificar.js";
import type {
  Agente,
  ClasificacionResult,
  Sector,
  TipoInput,
} from "./types.js";

interface TestCase {
  nombre: string;
  input: string;
  esperado: {
    tipo: TipoInput;
    sector?: Sector;
    incluyeAgente?: Agente;
    confianzaMin?: number;
  };
}

const CASOS: TestCase[] = [
  // ── Casos directos de §12 CLAUDE.md (con tag explícito) ─────────────────
  {
    nombre: "01 · CLIENTE clínica dental Medellín",
    input: "[CLIENTE] Tengo una clínica dental en Medellín, 4 odontólogos, agendamiento por WhatsApp manual, queremos automatizar.",
    esperado: { tipo: "CLIENTE", sector: "salud", incluyeAgente: "ATLAS" },
  },
  {
    nombre: "02 · BUILD landing restaurante Madrid",
    input: "[BUILD] Crear landing para restaurante en Madrid, menú degustación, reservas vía Cal.com.",
    esperado: { tipo: "BUILD", sector: "restaurantes", incluyeAgente: "APOLLO" },
  },
  {
    nombre: "03 · AGENTE Apollo landing ecommerce ropa",
    input: "[AGENTE] Activar APOLLO-LANDING para e-commerce de ropa femenina en Bogotá.",
    esperado: { tipo: "AGENTE", sector: "ecommerce", incluyeAgente: "APOLLO" },
  },
  {
    nombre: "04 · DIAGNOSTICO construcción Bogotá",
    input: "[DIAGNÓSTICO] Construcción en Bogotá, 30 empleados, todo en papel y WhatsApp, quieren digitalizarse.",
    esperado: { tipo: "DIAGNOSTICO" },
  },
  {
    nombre: "05 · INTERNO calcular costo proyecto",
    input: "[INTERNO] Calcular costo operativo del proyecto Cliente X para los próximos 3 meses.",
    esperado: { tipo: "INTERNO", incluyeAgente: "ORACLE" },
  },
  {
    nombre: "06 · ESTRATEGIA expansión manufactura",
    input: "[ESTRATEGIA] ¿Expandir a sector manufactura antes del mes 6 o esperar al mes 9?",
    esperado: { tipo: "ESTRATEGIA", incluyeAgente: "ZEUS" },
  },

  // ── Edge cases (sin tag explícito o ambiguos) ───────────────────────────
  {
    nombre: "07 · CLIENTE inferido sin tag (restaurante WhatsApp)",
    input: "Tengo un restaurante en Pereira y quiero recibir pedidos por WhatsApp con menú interactivo.",
    esperado: { tipo: "CLIENTE", sector: "restaurantes" },
  },
  {
    nombre: "08 · CONSULTA puntual sobre Make",
    input: "¿Cuánto cuesta el plan Pro de Make y cuántas operaciones incluye?",
    esperado: { tipo: "CONSULTA" },
  },
  {
    nombre: "09 · ESCALADA budget insuficiente",
    input: "Cliente Eco con budget de $200 USD/mes pide construir SAP completo + IA + dashboards en 2 semanas.",
    esperado: { tipo: "ESCALADA" },
  },
  {
    nombre: "10 · BUILD inferido clínica fertilidad",
    input: "Necesitamos una landing para una clínica de fertilidad en Barcelona, premium, con simulador de costos.",
    esperado: { tipo: "BUILD", sector: "salud" },
  },
];

function evaluar(caso: TestCase, r: ClasificacionResult): {
  ok: boolean;
  fallos: string[];
} {
  const fallos: string[] = [];

  if (r.tipo !== caso.esperado.tipo) {
    fallos.push(`tipo: esperaba ${caso.esperado.tipo}, recibí ${r.tipo}`);
  }
  if (caso.esperado.sector && r.sector_detectado !== caso.esperado.sector) {
    fallos.push(
      `sector: esperaba ${caso.esperado.sector}, recibí ${r.sector_detectado}`,
    );
  }
  if (
    caso.esperado.incluyeAgente &&
    !r.agentes_a_activar.includes(caso.esperado.incluyeAgente)
  ) {
    fallos.push(
      `agentes: esperaba incluir ${caso.esperado.incluyeAgente}, recibí [${r.agentes_a_activar.join(", ")}]`,
    );
  }
  if (
    caso.esperado.confianzaMin !== undefined &&
    r.confianza < caso.esperado.confianzaMin
  ) {
    fallos.push(
      `confianza: esperaba >=${caso.esperado.confianzaMin}, recibí ${r.confianza}`,
    );
  }

  return { ok: fallos.length === 0, fallos };
}

async function main(): Promise<void> {
  console.log(
    `\n🧠 Test del clasificador ZENKAI · ${CASOS.length} casos · modelo Haiku 4.5\n`,
  );

  let okCount = 0;
  let failCount = 0;
  const errores: { caso: string; error: unknown }[] = [];

  for (const caso of CASOS) {
    process.stdout.write(`${caso.nombre.padEnd(50)} ... `);

    try {
      const r = await clasificar(caso.input);
      const { ok, fallos } = evaluar(caso, r);

      if (ok) {
        console.log(
          `✓  tipo=${r.tipo} sector=${r.sector_detectado} agentes=[${r.agentes_a_activar.join(",")}] conf=${r.confianza}`,
        );
        okCount++;
      } else {
        console.log(`✗`);
        for (const f of fallos) console.log(`     · ${f}`);
        console.log(`     → razonamiento: ${r.razonamiento}`);
        failCount++;
      }
    } catch (e) {
      console.log(`✗ ERROR`);
      errores.push({ caso: caso.nombre, error: e });
      failCount++;
    }
  }

  console.log(`\n──────────────────────────────────────────────`);
  console.log(`Resultado: ${okCount}/${CASOS.length} OK · ${failCount} fallos`);

  if (errores.length > 0) {
    console.log(`\nErrores capturados:`);
    for (const { caso, error } of errores) {
      console.log(`  · ${caso}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  process.exit(failCount === 0 ? 0 : 1);
}

await main();
