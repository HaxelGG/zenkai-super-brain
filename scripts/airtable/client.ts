// Cliente Airtable compartido · auth con Personal Access Token (AIRTABLE_TOKEN)
// y resolución lazy del Base ID (no falla en import · sólo cuando se usa).
//
// Dos tipos de bases:
//
//   INTERNAS · datos operativos de ZENKAI (§5 CLAUDE.md + conexiones-airtable.md)
//     VENTAS · OPERACIONES · FINANZAS · MARKETING · SOPORTE · EQUIPO · LEGAL
//
//   SECTOR TEMPLATES · schemas de referencia por vertical (Capa 2)
//     SALUD · FOOD · ECOMMERCE · SERVICIOS · EDUCACION · INMOBILIARIA
//     (cuando llegue un cliente nuevo, se clona la base del sector relevante)

import "dotenv/config";
import Airtable from "airtable";

let cachedAirtable: Airtable | null = null;

function getClient(): Airtable {
  if (cachedAirtable) return cachedAirtable;
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    throw new Error(
      "Falta AIRTABLE_TOKEN en .env. Generá uno en https://airtable.com/create/tokens",
    );
  }
  cachedAirtable = new Airtable({ apiKey: token });
  return cachedAirtable;
}

export const INTERNAL_BASE_NAMES = [
  "VENTAS",
  "OPERACIONES",
  "FINANZAS",
  "MARKETING",
  "SOPORTE",
  "EQUIPO",
  "LEGAL",
] as const;

export const SECTOR_BASE_NAMES = [
  "SALUD",
  "FOOD",
  "ECOMMERCE",
  "SERVICIOS",
  "EDUCACION",
  "INMOBILIARIA",
] as const;

export type InternalBaseName = (typeof INTERNAL_BASE_NAMES)[number];
export type SectorBaseName = (typeof SECTOR_BASE_NAMES)[number];
export type BaseName = InternalBaseName | SectorBaseName;

// Devuelve el handler para una base, lookup por env var AIRTABLE_BASE_<NAME>.
// Lanza error claro si la env var no está seteada.
export function getBase(name: BaseName): Airtable.Base {
  const envKey = `AIRTABLE_BASE_${name}` as const;
  const baseId = process.env[envKey];
  if (!baseId) {
    throw new Error(
      `Falta ${envKey} en .env. Crear la base "${name}" en Airtable y copiar el ID 'app...' de la URL.`,
    );
  }
  return getClient().base(baseId);
}

// Backward-compat con código que ya usa getBaseVentas() · delegamos al genérico.
// Eventualmente migrar a getBase("VENTAS") y deprecar este export.
export function getBaseVentas(): Airtable.Base {
  return getBase("VENTAS");
}

// Mapeo de sector_detectado del clasificador → SectorBaseName del template.
// El clasificador devuelve nombres en kebab-case lowercase (§7 CLAUDE.md);
// los Base IDs usan SCREAMING_SNAKE_CASE. Devuelve null si el sector no
// tiene base template (ej. "manufactura" no fue creada todavía).
const SECTOR_TO_BASE_MAP: Record<string, SectorBaseName> = {
  salud: "SALUD",
  restaurantes: "FOOD", // user nombró la base FOOD aunque el clasificador devuelve "restaurantes"
  ecommerce: "ECOMMERCE",
  "servicios-profesionales": "SERVICIOS",
  educacion: "EDUCACION",
  inmobiliaria: "INMOBILIARIA",
};

export function sectorToBaseName(sector: string): SectorBaseName | null {
  return SECTOR_TO_BASE_MAP[sector] ?? null;
}
