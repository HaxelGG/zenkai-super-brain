// Generador del Protocolo §8 de CLAUDE.md (cliente)
// Toma input [CLIENTE]/[BUILD]/[DIAGNÓSTICO] y devuelve los 6 pasos
// como JSON estructurado. Modelo: Sonnet 4.6.

import type { ClasificacionResult } from "./types.js";

export const TIERS = ["ECO", "PRO", "PREMIUM"] as const;
export type Tier = (typeof TIERS)[number];

export const NIVELES = [1, 2, 3, 4] as const;
export type Nivel = (typeof NIVELES)[number];

export const CELDAS_MATRIZ = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
] as const;
export type CeldaMatriz = (typeof CELDAS_MATRIZ)[number];

export interface RutaPropuesta {
  stack: string[];
  agentes_activos: string[];
  tiempo_implementacion: string;
  precio_USD: number;
  precio_COP: number;
}

export interface RutaEco extends RutaPropuesta {
  limitaciones: string[];
}

export interface RutaPro extends RutaPropuesta {
  capacidades_extra: string[];
}

export interface Diagnostico {
  tier: Tier;
  nivel: Nivel;
  celda_matriz: CeldaMatriz;
  costo_operativo_mensual_USD: number;
  costo_operativo_mensual_COP: number;
  precio_minimo_servicio_USD: number;
  precio_minimo_servicio_COP: number;
}

export interface Recomendacion {
  ruta: "A" | "B";
  justificacion: string;
}

// El JSON que devuelve Sonnet (sin la clasificación, que se inyecta después)
export interface ProtocoloLLMOutput {
  diagnostico: Diagnostico;
  ruta_a_eco: RutaEco;
  ruta_b_pro: RutaPro;
  recomendacion: Recomendacion;
  proximo_paso: string;
}

// El resultado completo que devuelve protocolo() al consumidor
export interface ProtocoloResult extends ProtocoloLLMOutput {
  clasificacion: ClasificacionResult;
}

// JSON schema enforced por output_config.format
export const PROTOCOLO_SCHEMA = {
  type: "object",
  properties: {
    diagnostico: {
      type: "object",
      properties: {
        tier: { type: "string", enum: [...TIERS] },
        nivel: { type: "number", enum: [...NIVELES] },
        celda_matriz: { type: "string", enum: [...CELDAS_MATRIZ] },
        costo_operativo_mensual_USD: { type: "number" },
        costo_operativo_mensual_COP: { type: "number" },
        precio_minimo_servicio_USD: { type: "number" },
        precio_minimo_servicio_COP: { type: "number" },
      },
      required: [
        "tier", "nivel", "celda_matriz",
        "costo_operativo_mensual_USD", "costo_operativo_mensual_COP",
        "precio_minimo_servicio_USD", "precio_minimo_servicio_COP",
      ],
      additionalProperties: false,
    },
    ruta_a_eco: {
      type: "object",
      properties: {
        stack: { type: "array", items: { type: "string" } },
        agentes_activos: { type: "array", items: { type: "string" } },
        limitaciones: { type: "array", items: { type: "string" } },
        tiempo_implementacion: { type: "string" },
        precio_USD: { type: "number" },
        precio_COP: { type: "number" },
      },
      required: [
        "stack", "agentes_activos", "limitaciones",
        "tiempo_implementacion", "precio_USD", "precio_COP",
      ],
      additionalProperties: false,
    },
    ruta_b_pro: {
      type: "object",
      properties: {
        stack: { type: "array", items: { type: "string" } },
        agentes_activos: { type: "array", items: { type: "string" } },
        capacidades_extra: { type: "array", items: { type: "string" } },
        tiempo_implementacion: { type: "string" },
        precio_USD: { type: "number" },
        precio_COP: { type: "number" },
      },
      required: [
        "stack", "agentes_activos", "capacidades_extra",
        "tiempo_implementacion", "precio_USD", "precio_COP",
      ],
      additionalProperties: false,
    },
    recomendacion: {
      type: "object",
      properties: {
        ruta: { type: "string", enum: ["A", "B"] },
        justificacion: { type: "string" },
      },
      required: ["ruta", "justificacion"],
      additionalProperties: false,
    },
    proximo_paso: { type: "string" },
  },
  required: [
    "diagnostico", "ruta_a_eco", "ruta_b_pro",
    "recomendacion", "proximo_paso",
  ],
  additionalProperties: false,
} as const;
