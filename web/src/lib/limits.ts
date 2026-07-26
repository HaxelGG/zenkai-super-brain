/**
 * Límites del brief de la demo. Fuente de verdad única.
 *
 * Vive en su propio módulo sin dependencias a propósito: lo consumen tanto el
 * servidor (lib/proposal, /api/lead-demo) como el frontmatter de DemoSection.astro,
 * y este último no debe arrastrar el SDK de Anthropic al grafo de build de la home.
 *
 * El mínimo es 25, no 80. Con 80 el botón sólo se habilitaba tras dos frases
 * completas, y un brief como "Clínica dental, 3 sedes, perdemos turnos" (42
 * caracteres) —perfectamente cualificable— no llegaba a habilitarlo. El coste de
 * un brief flojo es una propuesta genérica; el coste de un umbral alto es no
 * recibir el brief.
 */
export const MIN_TEXTO = 25;
export const MAX_TEXTO = 600;
