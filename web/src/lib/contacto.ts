/**
 * Contacto · fuente de verdad única del teléfono comercial.
 *
 * ── Por qué existe ────────────────────────────────────────────────────────
 * El número estaba escrito a mano en cuatro sitios: WhatsAppCTA.astro,
 * DemoSection.astro (dos veces — una en el frontmatter y otra dentro del
 * script del cliente) y privacy.astro. Cuatro copias significan que cambiar
 * de número deja tres puestas, y el fallo no se ve: el enlace sigue
 * funcionando, sólo que abre una conversación con un teléfono que ya no
 * atiende nadie. Es exactamente la clase de error que no da error.
 *
 * ── Un solo número comercial ──────────────────────────────────────────────
 * ZENKAI opera desde España como cara comercial (Barcelona y Murcia) con
 * equipo también en Pereira. Se muestra el número español en navegación, pie,
 * enlaces de WhatsApp y aviso legal, en las tres monedas y en todas las
 * rutas. Un visitante que ve un prefijo en la barra y otro en el pie no
 * concluye "tienen dos oficinas": concluye que la web está mal.
 */

/** Formato E.164 sin '+' · es lo que espera wa.me. */
export const WA_NUMERO = import.meta.env.PUBLIC_WA_NUMBER ?? '34622874482';

/** Para enseñar a un humano. Derivado, nunca escrito a mano. */
export const WA_VISIBLE = `+${WA_NUMERO.slice(0, 2)} ${WA_NUMERO.slice(2, 5)} ${WA_NUMERO.slice(5, 8)} ${WA_NUMERO.slice(8)}`;

/**
 * Construye el enlace de WhatsApp.
 *
 * Vive aquí y no en el componente porque el diálogo de error de la demo
 * también necesita generarlo desde el cliente, y esa era la cuarta copia.
 */
export const waHref = (texto: string): string =>
  `https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(texto)}`;
