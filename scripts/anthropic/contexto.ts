// Helpers para cargar contexto del repo en el system prompt.
// Lectura síncrona: estos archivos son markdown chicos (<10KB) y se invocan
// una vez al inicio de cada call a protocolo(). No vale la pena async.

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Sector } from "./types.js";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPTS_DIR, "..", "..");

// Devuelve el contenido del módulo de sector, o null si sector="ninguno"
// o si el archivo no existe (fallback gracioso).
export function loadSectorContext(sector: Sector): string | null {
  if (sector === "ninguno") return null;
  const path = join(REPO_ROOT, "sectores", `${sector}.md`);
  try {
    return readFileSync(path, "utf-8");
  } catch (e) {
    console.warn(`[contexto] No se pudo cargar ${path}: ${(e as Error).message}`);
    return null;
  }
}

// Devuelve los stacks Eco y Pro como bloque único.
// Premium se omite (en v0.1 protocolo solo genera 2 rutas: Eco y Pro).
export function loadStackContext(): { eco: string; pro: string } {
  const ecoPath = join(REPO_ROOT, "finanzas", "stack-eco.md");
  const proPath = join(REPO_ROOT, "finanzas", "stack-pro.md");
  return {
    eco: readFileSync(ecoPath, "utf-8"),
    pro: readFileSync(proPath, "utf-8"),
  };
}
