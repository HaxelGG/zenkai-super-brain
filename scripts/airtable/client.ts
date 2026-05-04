// Cliente Airtable compartido · auth con Personal Access Token (AIRTABLE_TOKEN)
// y resolución lazy del Base ID (no falla en import · sólo cuando se usa).

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

// Devuelve el handler para la base VENTAS (la única configurada en Fase 2 v0.1).
// Lanza error claro si AIRTABLE_BASE_VENTAS no está seteada.
export function getBaseVentas(): Airtable.Base {
  const baseId = process.env.AIRTABLE_BASE_VENTAS;
  if (!baseId) {
    throw new Error(
      "Falta AIRTABLE_BASE_VENTAS en .env. Crear la base en Airtable y copiar el ID 'app...' de la URL.",
    );
  }
  return getClient().base(baseId);
}
