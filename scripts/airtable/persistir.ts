// Persiste un ProtocoloResult en VENTAS.propuestas.
// Schema de la tabla está documentado en conexiones/conexiones-airtable.md
// y en el spec de Fase 2 v0.1 (commit message del primer commit que la introduce).

import type { FieldSet } from "airtable";
import { renderPropuesta, type ProtocoloResult } from "../anthropic/protocolo.js";
import { getBaseVentas } from "./client.js";

export interface PersistirResult {
  airtable_record_id: string;
}

export async function persistirPropuesta(
  inputOriginal: string,
  result: ProtocoloResult,
  leadId?: string,
): Promise<PersistirResult> {
  const base = getBaseVentas();

  const fields: Partial<FieldSet> = {
    nombre_empresa: result.nombre_empresa_inferido || "(sin nombre inferido)",
    input_original: inputOriginal,
    tipo_input: result.clasificacion.tipo,
    sector: result.clasificacion.sector_detectado,
    tier: result.diagnostico.tier,
    nivel: result.diagnostico.nivel,
    celda_matriz: result.diagnostico.celda_matriz,
    ruta_recomendada: result.recomendacion.ruta,
    precio_a_USD: result.ruta_a_eco.precio_USD,
    precio_b_USD: result.ruta_b_pro.precio_USD,
    proximo_paso: result.proximo_paso,
    markdown_propuesta: renderPropuesta(result),
    json_completo: JSON.stringify(result, null, 2),
  };

  // Campo "lead" en Airtable es Link to record · acepta array de IDs (max 1
  // porque la UI tiene "Allow linking to multiple records" UNCHECKED).
  if (leadId) {
    fields.lead = [leadId];
  }

  const records = await base("propuestas").create([{ fields }]);

  const first = records[0];
  if (!first) {
    throw new Error("Airtable.create devolvió 0 registros (esperaba 1)");
  }
  return { airtable_record_id: first.id };
}
