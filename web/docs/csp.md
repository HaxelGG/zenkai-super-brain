# CSP · por qué va en Report-Only y qué falta para poder aplicarla

**Estado:** `Content-Security-Policy-Report-Only` en `web/vercel.json`. No bloquea nada;
sólo reporta violaciones en la consola del navegador.

## Por qué no está aplicada todavía

La política declarada es la que **queremos** llegar a aplicar, no la que el sitio cumple
hoy. Si se aplicase ahora mismo, la home se rompería: Astro emite los `<script>` de los
componentes como bloques inline dentro del HTML (verificado en el build: la lógica del
conmutador de moneda y la de la demo salen inline, no como archivo), y `script-src 'self'`
sin `'unsafe-inline'` los bloquea todos.

Aplicarla añadiendo `'unsafe-inline'` habría sido peor que no ponerla: da la apariencia
de defensa sin la defensa, porque `'unsafe-inline'` es justo lo que un XSS necesita.

`style-src` sí lleva `'unsafe-inline'` de forma deliberada: hay atributos `style=` por todo
el markup y eliminarlos es trabajo del sistema de diseño, no de un parche de seguridad.
El riesgo de CSS inline es de otro orden que el de JS inline.

## Qué hace falta para pasar a enforcement

1. Sustituir `'unsafe-inline'` implícito de los scripts inline por **nonce por request**.
   Requiere que las páginas dejen de ser prerenderizadas o que Astro emita los scripts como
   archivos externos. Astro soporta `experimental.csp` con nonces; evaluarlo en la FASE 1.
2. Comprobar en la consola de producción qué violaciones reporta realmente (es la razón de
   ser de este Report-Only) y cerrar cada una antes de cambiar el nombre de la cabecera.
3. Repasar `connect-src`: hoy sólo `'self'` porque toda llamada del cliente va a `/api/*`.
   Si se añade cualquier analítica o endpoint externo, hay que declararlo aquí.

## Orígenes externos que el cliente usa hoy

| Origen | Para qué | Directiva |
|---|---|---|
| `challenges.cloudflare.com` | script + iframe de Turnstile (sólo si `PUBLIC_TURNSTILE_SITE_KEY` está definida) | `script-src`, `frame-src` |
| `/_vercel/insights/*` | Vercel Web Analytics · mismo origen | `script-src 'self'`, `connect-src 'self'` |

ElevenLabs, DeepSeek, Anthropic, Airtable y Resend se llaman **desde el servidor**, no desde
el navegador: no necesitan entrar en la CSP.

`wa.me` y `cal.com` son navegaciones (`<a href>`), no subrecursos. No los cubre `connect-src`
ni `form-action`.

## Cabeceras que sí van aplicadas

`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`,
`Cross-Origin-Opener-Policy`. Ninguna puede romper el sitio: no embebemos nada en iframes,
no usamos cámara, micrófono ni geolocalización, y no hay ventanas cruzadas.

HSTS lo pone Vercel automáticamente en dominios propios; no lo duplicamos aquí para no
arriesgarnos a fijar un `includeSubDomains` que afecte a `jarvis.zenkai.systems`, que es
otro proyecto.
