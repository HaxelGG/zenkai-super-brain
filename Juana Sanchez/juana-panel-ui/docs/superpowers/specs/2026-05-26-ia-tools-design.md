# Módulo IA Tools (`/ia`) — Panel de Control Grupo Juana Sánchez

**Fecha:** 2026-05-26
**Estado:** Diseño aprobado · pendiente de plan de implementación
**Módulo nº:** 11 (ROADMAP "Automatizaciones IA"; segundo subsistema: herramientas IA. El primero,
motor de alertas `/automatizaciones`, ya está en producción.)
**Alcance:** Asistente IA "analista de negocio" sobre los datos del panel + 3 generadores de texto,
usando OpenRouter (DeepSeek) **server-side**. Sin migraciones, sin estado persistido. No toca otros
módulos ni el `sidebar.tsx`.

---

## 1. Contexto y objetivo

El Panel tiene cimientos + 10 módulos en producción (incluido `/automatizaciones`). **IA Tools** es la
segunda mitad de "Automatizaciones IA": añade capacidades de IA generativa/analítica sobre los datos
existentes. La API key de OpenRouter ya está en `.env.local` como `OPENROUTER_API_KEY` (server-only).

**Objetivo:** (a) un chat "analista de negocio / data scientist" que responde preguntas sobre los datos
del panel con análisis accionable (vender más, mejorar producción, focos puntuales); (b) generadores de
texto puntuales (email a clienta, descripción de producto, copy para redes).

## 2. Stack y patrón

- **Next.js 16 + Supabase + Vercel + shadcn/ui + Atelier.** Nuevo: llamadas a OpenRouter (API compatible
  con OpenAI) vía `fetch` **server-side**; la key nunca llega al navegador. Sin AI SDK (fetch directo).
- Patrón de módulo: `src/lib/ia/`, `src/components/ia/`, rutas `src/app/(app)/ia/`. **Sin migraciones**
  (chat efímero en memoria; generadores sin estado).
- **Atelier-native:** tokens, sonner, Card/Button/Input/Textarea/Select.
- **NO tocar `sidebar.tsx`** — la entrada `/ia` la enciende la terminal de diseño.
- **Deploy:** integrar por `main` con `git pull` antes de empujar.

## 3. Decisiones tomadas (brainstorming 2026-05-26)

| Decisión | Elección |
|---|---|
| Alcance v1 | Chat analista **+** 3 generadores (comparten cliente OpenRouter). |
| Proveedor/modelo | **OpenRouter**, DeepSeek en dos tiers, configurables por env. |
| Respuesta | **No-streaming** (server action devuelve texto completo). Más simple, sin AI SDK. |
| Datos del chat | **Snapshot agregado** de la empresa activa (no tool-calling, no SQL generado). Seguro y barato. |
| Persistencia | **Ninguna** (chat efímero, generadores sin estado). Sin tabla/migración. |
| Privacidad | Los datos agregados salen a OpenRouter/DeepSeek (tercero). Aceptado al usar la key. |

## 4. Configuración de modelos (env)

- `OPENROUTER_API_KEY` — ya presente (server-only).
- `OPENROUTER_MODEL_PRO` — chat analista. Default `deepseek/deepseek-r1`.
- `OPENROUTER_MODEL_FAST` — generadores. Default `deepseek/deepseek-chat`.

Los modelos se leen de env con fallback al default en código. ⚠️ Los slugs exactos deben confirmarse en
openrouter.ai/models y actualizarse (p. ej. cuando haya DeepSeek v4) sin tocar código. Añadir las 3 vars
a `.env.local` (local) y a Vercel (producción).

## 5. Infraestructura común — `src/lib/ia/openrouter.ts` (server-only)

- `chatComplete(messages: ChatMessage[], model: string, maxTokens?: number): Promise<{ text: string } | { error: string }>`
  — `fetch` POST a `https://openrouter.ai/api/v1/chat/completions`, header `Authorization: Bearer ${process.env.OPENROUTER_API_KEY}`, body `{ model, messages, max_tokens }`. Parsea `choices[0].message.content`.
  Devuelve `{ error }` si falta la key, si la respuesta no es ok, o si el formato es inesperado.
- `type ChatMessage = { role: "system" | "user" | "assistant"; content: string }`.

## 6. Lógica pura (TDD) — `src/lib/ia/prompts.ts`

Constructores de mensajes puros (sin red), testeables:
- `buildAnalystMessages(snapshot: string, question: string): ChatMessage[]` — system (rol analista de
  negocio de una maison de moda; usar las cifras del snapshot; respuestas accionables y concisas en
  español) + user (snapshot + pregunta).
- `buildEmailMessages(input: { customerName: string; goal: string; notes?: string }): ChatMessage[]`.
- `buildProductDescriptionMessages(input: { name: string; category: string | null; price: number }): ChatMessage[]`.
- `buildSocialCopyMessages(input: { topic: string; platform: string; tone: string }): ChatMessage[]`.
- Tests verifican: estructura `{role, content}[]`, presencia de los datos de entrada y de la instrucción
  de idioma/rol. (No se prueba la red.)

## 7. Capa de datos / acciones

- **`queries.ts`**: `buildBusinessSnapshot(companyFilter): Promise<string>` — agrega, reutilizando queries
  existentes, un resumen compacto de la empresa activa: ingresos/gastos/margen (finanzas), ventas por
  canal, top productos, stock bajo, cotizaciones pendientes, clientas activas/inactivas, tareas vencidas.
  Solo **agregados** (cifras/conteos), formateado como texto legible. Respeta RLS (solo datos accesibles).
- **`actions.ts`** (server actions):
  - `askAnalyst(question: string, companyFilter): Promise<{ text } | { error }>` — snapshot +
    `buildAnalystMessages` + `chatComplete(..., MODEL_PRO)`.
  - `generateCustomerEmail(formData)`, `generateProductDescription(formData)`, `generateSocialCopy(formData)`
    — construyen el prompt con su builder y llaman `chatComplete(..., MODEL_FAST)`. Devuelven `{ text }` o `{ error }`.

## 8. Pantallas (Atelier-native)

1. **`/ia`** — chat analista: lista de mensajes en memoria (client), input + enviar (llama `askAnalyst`),
   chips de ejemplos ("¿qué clientas reactivar?", "¿qué producto empujar este mes?"). Estado de carga.
   Requiere empresa concreta o "Todas" (usa `getActiveCompany`).
2. **`/ia/generadores`** — tres tarjetas/formularios (email, descripción, copy). Cada uno: inputs →
   "Generar" → muestra el texto con botón "Copiar". Selección de clienta/producto vía listas existentes.

## 9. Estructura de archivos

```
src/lib/ia/{openrouter.ts, prompts.ts, prompts.test.ts, queries.ts, actions.ts}
src/components/ia/
  analyst-chat.tsx       # client: chat efímero (askAnalyst)
  generated-output.tsx   # muestra texto + botón copiar
  generator-email.tsx    # client: form email a clienta
  generator-product.tsx  # client: form descripción de producto
  generator-social.tsx   # client: form copy social
src/app/(app)/ia/{page.tsx, generadores/page.tsx}
```

## 10. Criterios de éxito

- Pregunto al analista sobre mis datos y obtengo análisis accionable citando cifras reales de la empresa
  activa; genero email/descripción/copy utilizables y los copio.
- La key y los modelos se leen server-side; nada se expone al navegador.
- `prompts.ts` tiene tests verdes; `npm run build` y `npm test` limpios.
- UI en lenguaje Atelier; no toca `sidebar.tsx` ni archivos de otros módulos; sin migraciones.
- Errores de OpenRouter (sin key, HTTP fallido) se muestran como toast/aviso, sin romper la página.

## 11. Fuera de alcance

- Streaming de respuestas; persistir conversaciones/historial.
- Tool-calling / SQL generado por el modelo (el chat se ancla a un snapshot seguro).
- Generación de imágenes; RAG sobre 2º Cerebro; fine-tuning.
- Límite de gasto/cuotas por usuario (se confía en el control de OpenRouter).
