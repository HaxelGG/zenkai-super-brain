import { defineMiddleware } from 'astro:middleware';

/**
 * Mitigación CVE @astrojs/vercel · header injection vía x-astro-path.
 * Filtra cualquier header que matchee la variante (case-insensitive · acepta - o _).
 * Doc: docs/security/2026-05-10-cve-astrojs-vercel-x-astro-path.md
 */
const FORBIDDEN_HEADER_PATTERN = /^x[-_]astro[-_]path$/i;

export const onRequest = defineMiddleware(async (context, next) => {
  // Solo filtrar en endpoints /api/* (donde el header injection es exploitable).
  // Las pages prerendered (index, 404) no leen request en runtime, no necesitan filtro.
  if (!context.url.pathname.startsWith('/api/')) return next();

  const { request } = context;
  const headersArray = Array.from(request.headers.entries());
  const hasForbidden = headersArray.some(([name]) => FORBIDDEN_HEADER_PATTERN.test(name));

  if (hasForbidden) {
    // Reconstruimos request sin los headers forbidden y reemplazamos el request en context
    const cleanHeaders = new Headers();
    for (const [name, value] of headersArray) {
      if (!FORBIDDEN_HEADER_PATTERN.test(name)) {
        cleanHeaders.append(name, value);
      }
    }
    const cleanRequest = new Request(request.url, {
      method: request.method,
      headers: cleanHeaders,
      body: request.body,
      // @ts-expect-error duplex required for Node 18+ when body is present
      duplex: 'half',
    });
    Object.defineProperty(context, 'request', { value: cleanRequest, configurable: true });
  }

  return next();
});
