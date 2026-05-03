// Test del Protocolo §8 · 4 casos representativos.
// Asserciones estructurales automáticas + impresión de markdown para revisión humana.
// Costo: ~$0.30 por corrida completa (Sonnet 4.6 · 4 calls largos).

import { protocolo, render, type ProtocoloResult } from "./protocolo.js";
import type { Sector, TipoInput } from "./types.js";

interface TestCase {
  nombre: string;
  input: string;
  esperado: {
    tipo: TipoInput;
    sector: Sector;
  };
}

const CASOS: TestCase[] = [
  {
    nombre: "01 · CLIENTE clínica dental Medellín",
    input: "[CLIENTE] Tengo una clínica dental en Medellín, 4 odontólogos, agendamiento por WhatsApp manual, queremos automatizar.",
    esperado: { tipo: "CLIENTE", sector: "salud" },
  },
  {
    nombre: "02 · BUILD landing restaurante Madrid",
    input: "[BUILD] Crear landing para restaurante en Madrid, menú degustación, reservas vía Cal.com.",
    esperado: { tipo: "BUILD", sector: "restaurantes" },
  },
  {
    nombre: "03 · CLIENTE ecommerce ropa Bogotá",
    input: "[CLIENTE] E-commerce de ropa femenina en Bogotá, vendiendo bien por Shopify pero sin retargeting ni recuperación de carrito abandonado.",
    esperado: { tipo: "CLIENTE", sector: "ecommerce" },
  },
  {
    nombre: "04 · DIAGNOSTICO manufactura Bucaramanga",
    input: "[DIAGNÓSTICO] Fábrica metalmecánica en Bucaramanga, 30 empleados, todo en planillas Excel y WhatsApp, quieren digitalizarse de cero.",
    esperado: { tipo: "DIAGNOSTICO", sector: "manufactura" },
  },
];

const TIER_TO_CELDAS: Record<string, string[]> = {
  ECO: ["A", "B", "C", "D"],
  PRO: ["E", "F", "G", "H"],
  PREMIUM: ["I", "J", "K", "L"],
};

const VERBO_INFINITIVO = /\b(agendar|enviar|llamar|cotizar|cerrar|validar|contactar|redactar|preparar|coordinar|programar|presentar|entregar|configurar|implementar|definir|revisar|confirmar|escribir|crear|armar|construir|investigar|escalar|proponer|invitar|solicitar|verificar|firmar|ejecutar|publicar|subir|levantar|montar)\w*/i;

function evaluar(caso: TestCase, r: ProtocoloResult): { ok: boolean; fallos: string[] } {
  const fallos: string[] = [];

  // Clasificación
  if (r.clasificacion.tipo !== caso.esperado.tipo) {
    fallos.push(`clasificacion.tipo: esperaba ${caso.esperado.tipo}, recibí ${r.clasificacion.tipo}`);
  }
  if (r.clasificacion.sector_detectado !== caso.esperado.sector) {
    fallos.push(`clasificacion.sector: esperaba ${caso.esperado.sector}, recibí ${r.clasificacion.sector_detectado}`);
  }

  // Diagnóstico · coherencia tier ↔ celda
  const celdasValidas = TIER_TO_CELDAS[r.diagnostico.tier];
  if (!celdasValidas || !celdasValidas.includes(r.diagnostico.celda_matriz)) {
    fallos.push(`diagnostico: celda ${r.diagnostico.celda_matriz} no coherente con tier ${r.diagnostico.tier}`);
  }
  if (r.diagnostico.costo_operativo_mensual_USD <= 0) {
    fallos.push(`diagnostico: costo_operativo_mensual_USD debería ser >0`);
  }
  if (r.diagnostico.precio_minimo_servicio_USD <= 0) {
    fallos.push(`diagnostico: precio_minimo_servicio_USD debería ser >0`);
  }

  // Ruta A
  if (r.ruta_a_eco.stack.length === 0) fallos.push("ruta_a_eco.stack vacío");
  if (r.ruta_a_eco.precio_USD <= 0) fallos.push("ruta_a_eco.precio_USD <=0");
  if (!r.ruta_a_eco.tiempo_implementacion.trim()) fallos.push("ruta_a_eco.tiempo_implementacion vacío");

  // Ruta B
  if (r.ruta_b_pro.stack.length === 0) fallos.push("ruta_b_pro.stack vacío");
  if (r.ruta_b_pro.precio_USD <= 0) fallos.push("ruta_b_pro.precio_USD <=0");
  if (!r.ruta_b_pro.tiempo_implementacion.trim()) fallos.push("ruta_b_pro.tiempo_implementacion vacío");
  if (r.ruta_b_pro.precio_USD < r.ruta_a_eco.precio_USD) {
    fallos.push(`ruta_b_pro.precio (${r.ruta_b_pro.precio_USD}) < ruta_a_eco.precio (${r.ruta_a_eco.precio_USD}) — sospechoso`);
  }

  // Recomendación
  if (!["A", "B"].includes(r.recomendacion.ruta)) {
    fallos.push(`recomendacion.ruta inválida: ${r.recomendacion.ruta}`);
  }
  if (r.recomendacion.justificacion.length < 20) {
    fallos.push(`recomendacion.justificacion muy corta (${r.recomendacion.justificacion.length} chars)`);
  }

  // Próximo paso · debe empezar con verbo en infinitivo (lista amplia)
  if (!r.proximo_paso.trim()) {
    fallos.push("proximo_paso vacío");
  } else if (!VERBO_INFINITIVO.test(r.proximo_paso)) {
    fallos.push(`proximo_paso no contiene verbo de acción reconocible: "${r.proximo_paso.slice(0, 80)}"`);
  }

  return { ok: fallos.length === 0, fallos };
}

async function main(): Promise<void> {
  console.log(`\n🧠 Test del Protocolo §8 · ${CASOS.length} casos · modelo Sonnet 4.6\n`);

  let okCount = 0;
  let failCount = 0;
  const renders: { caso: string; markdown: string }[] = [];

  for (const caso of CASOS) {
    process.stdout.write(`${caso.nombre.padEnd(50)} ... `);

    try {
      const r = await protocolo(caso.input);
      const { ok, fallos } = evaluar(caso, r);

      if (ok) {
        console.log(
          `✓  tier=${r.diagnostico.tier} N${r.diagnostico.nivel} celda=${r.diagnostico.celda_matriz} ruta=${r.recomendacion.ruta} precio_A=${r.ruta_a_eco.precio_USD} precio_B=${r.ruta_b_pro.precio_USD}`,
        );
        okCount++;
      } else {
        console.log(`✗`);
        for (const f of fallos) console.log(`     · ${f}`);
        failCount++;
      }

      renders.push({ caso: caso.nombre, markdown: render(r) });
    } catch (e) {
      console.log(`✗ ERROR: ${e instanceof Error ? e.message : String(e)}`);
      failCount++;
    }
  }

  console.log(`\n──────────────────────────────────────────────`);
  console.log(`Resultado: ${okCount}/${CASOS.length} OK · ${failCount} fallos`);
  console.log(`──────────────────────────────────────────────\n`);

  console.log("\n========== RENDERS PARA REVISIÓN HUMANA ==========\n");
  for (const { caso, markdown } of renders) {
    console.log(`\n┌─────────────────────────────────────────────────`);
    console.log(`│ ${caso}`);
    console.log(`└─────────────────────────────────────────────────\n`);
    console.log(markdown);
  }

  process.exit(failCount === 0 ? 0 : 1);
}

await main();
