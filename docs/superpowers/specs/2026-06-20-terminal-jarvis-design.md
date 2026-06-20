# Terminal REPL de JARVIS — Diseño
# Spec · 2026-06-20 · rama feat/jarvis-terminal-repl

## Objetivo

Transformar la interacción por comandos de JARVIS en una **terminal REPL a pantalla completa**: una consola
monospace donde el input es el protagonista, se escribe (o se dicta) en lenguaje natural o con slash-commands, y la
salida es estructurada (no solo texto). Reusa el cerebro (`/api/jarvis/run`) y la voz (`window.JarvisVoice`) que ya
existen. **No** se construye backend nuevo.

## Decisiones (cerradas en brainstorming)

- **Superficie:** página full-screen dedicada `panel/src/pages/jarvis/terminal.astro`, ruta `/terminal` en el
  subdominio `jarvis.zenkai.systems` (y `/jarvis/terminal` en `panel.zenkai.systems`). El orb de voz sigue en el
  resto del HUD; la terminal es una vista aparte.
- **Stack:** patrón del panel — Astro + script vanilla `panel/public/jarvis-terminal.js`. **Sin** framework island.
- **Capacidades (las 4):** lenguaje natural → orquestador; slash-commands con autocompletado; historial ↑↓
  persistido; salida rica (tarjetas, badges de run, links, errores).

## Arquitectura

```
panel/src/pages/jarvis/terminal.astro   → markup full-screen + carga de scripts
panel/src/lib/jarvis/terminal/
  parse-input.ts                         → parseInput() (puro, testeable)
  slash-commands.ts                      → registro de comandos (datos puros + resolución)
panel/public/jarvis-terminal.js          → runtime REPL (DOM, historial, autocompletado, bridge)
panel/src/styles/jarvis.css              → bloque .jvt-* (estética terminal)
```

Los dos `.ts` contienen la lógica pura y testeable; `jarvis-terminal.js` es el runtime que los usa (cargado como
módulo) y maneja DOM, fetch y voz. Separar permite testear `parseInput` y la resolución de comandos sin DOM.

## Módulos e interfaces

### 1. `parseInput(raw: string): ParsedInput`  (puro)
```ts
type ParsedInput =
  | { kind: "empty" }
  | { kind: "nl"; text: string }
  | { kind: "slash"; name: string; args: string[]; raw: string };
```
Regla: trim; vacío → `empty`; empieza con `/` → `slash` (name = primer token sin `/`, args = resto por espacios);
si no → `nl`.

### 2. `slash-commands.ts`  (datos puros + resolución)
```ts
type SlashCommand = {
  name: string;            // sin "/"
  aliases?: string[];
  description: string;
  usage?: string;
  kind: "nav" | "run" | "local";
  navKey?: JarvisRouteKey; // para kind "nav"
};
function listCommands(): SlashCommand[];
function resolveCommand(name: string): SlashCommand | null;  // por name o alias
function filterCommands(prefix: string): SlashCommand[];      // para autocompletar
```
Set inicial:
| Comando | kind | Acción |
|---------|------|--------|
| `/help` | local | Lista todos los comandos (bloque de ayuda) |
| `/clear` | local | Limpia el scrollback |
| `/finanzas` `/pipeline` `/clientes` `/agentes` `/tareas` `/social` `/sistemas` `/intel` `/goals` | nav | Navega a esa sección (resuelve ruta por host) |
| `/run <AGENTE> <instrucción>` | run | Ejecuta un agente vía orquestador |
| `/agente` | run | alias de `/run` |
| `/status` | local | Estado de la agencia (fetch `/api/agency/status`) → tarjeta |

### 3. Render de salida — tipos de bloque
```ts
type OutputBlock =
  | { type: "user"; text: string }
  | { type: "reply"; text: string; source?: string; model?: string; tier?: string }
  | { type: "card-kpis"; title?: string; items: { label: string; value: string }[] }
  | { type: "run-status"; agent: string; model?: string; tier?: string; note?: string }
  | { type: "nav-link"; label: string; href: string }
  | { type: "error"; text: string };
```
`renderBlock(block): HTMLElement`. El scrollback es una lista de bloques; se hace append y autoscroll al fondo.

### 4. Historial
Array en memoria + `localStorage` (`zenkai_jarvis_terminal_history`, máx. 100). ↑/↓ recorren comandos previos
cuando el autocompletado está cerrado. Índice se resetea al enviar.

### 5. Autocompletado
Al escribir un input que empieza con `/`, mostrar un menú flotante con `filterCommands(prefix)`. `Tab` completa el
resaltado; `Enter` con menú abierto ejecuta el resaltado; `↑/↓` navegan el menú (tienen prioridad sobre historial
mientras el menú está abierto); `Esc` cierra el menú.

### 6. Bridge al orquestador
`runInstruction(instruction): Promise<JarvisRunResult>` — POST a `/api/jarvis/run` reusando el patrón de
`jarvis-voice.js`: base de API por host (`getApiBase`), `Authorization: Bearer` desde
`localStorage["zenkai_jarvis_api_key"]`, `fetchWithTimeout` (45s). Devuelve el `JarvisRunResult` para mapear a
bloques.

## Contrato de datos

`POST /api/jarvis/run` devuelve (ya existe, ver `scripts/jarvis/orchestrator.ts`):
```ts
{ id, instruction, reply, speech, source: "deepseek"|"anthropic"|"local"|"clasificar",
  timestamp, action?: { type: "navigate"; path: string },
  meta?: { tier?, model?, fallbackReason?, ... }, dispatch?: { event, ok, error } }
```
Mapeo a bloques:
- siempre → `{ type:"reply", text: reply, source, model: meta?.model, tier: meta?.tier }`
- si `action.type === "navigate"` → además `{ type:"nav-link", label: "ir a "+path, href: normalizeNavPath(path) }`
  (no redirige automáticamente; el usuario hace clic — la terminal no debe saltar de página sola).
- error de red/401 → `{ type:"error", text }`.

Slash-commands:
- `nav` → emite `{ type:"nav-link" }` con la ruta resuelta por host (reusar `normalizeNavPath`/`resolveJarvisRoutes`).
- `/run <AGENTE> <inst>` → `runInstruction("[AGENTE:" + AGENTE + "] " + inst)` (el director resuelve el agente) →
  `{ type:"run-status", agent, model, tier, note }` + `reply`.
- `/status` → fetch `/api/agency/status` → `{ type:"card-kpis", title:"Agencia", items:[director, agentes, keys ready] }`.

## Estética

Reusar variables de `jarvis.css` (`--jv-bg`, `--jv-cyan`, `--jv-border`, `--jv-text`, `--jv-text-dim`). Fondo
oscuro, monospace (`--jv-mono`), prompt `jarvis ❯` en cyan, cursor de bloque. Top bar mínima (marca + estado +
botón "volver al HUD"). Scanline opcional reusando la del HUD. Layout full-viewport (input fijo abajo, scrollback
arriba con scroll propio). Sin sidebar.

## Integración de voz

La terminal carga `jarvis-voice.js`. Un botón de micrófono llama `window.JarvisVoice.startCommandMode()`. La
terminal escucha el evento `jarvis-voice-command` (que `jarvis-voice.js` ya emite) e inyecta el texto dictado como
un comando NL en la terminal (lo muestra como `user` y lo ejecuta). Las respuestas se hablan vía el flujo de voz
existente; en la terminal se renderizan como bloques. No se duplica STT/TTS.

## Testing

- `parse-input.ts` y `slash-commands.ts` son puros → **tests vitest** (añadir config mínima de vitest a `panel/`,
  siguiendo el patrón de `web/`). Cubrir: parseo nl/slash/empty/espacios; resolución por alias; filtrado de
  autocompletado.
- Runtime (`jarvis-terminal.js`), render e integración → **smoke manual** en navegador (Chrome/Edge): cargar
  `/jarvis/terminal`, ejecutar NL, `/finanzas`, `/run`, `/help`, `/clear`, historial ↑↓, autocompletado.
- Los `.ts` nuevos viven en `panel/`, que está **excluido** del `tsconfig.json` raíz. Se verifican con el toolchain
  de `panel/` (`cd panel && npx astro check`). El `tsc` raíz (`npx tsc --noEmit -p tsconfig.json`) cubre
  `scripts/`+`api/` (sin cambios aquí) y debe seguir verde. Mantener ambos verdes.

## Criterios de aceptación

1. `/jarvis/terminal` (y `/terminal` en subdominio jarvis) carga una terminal full-screen monospace.
2. Texto NL + Enter → llama al orquestador → renderiza `reply` con badges `source/model/tier`.
3. `/finanzas` (y demás nav) → emite un link de navegación clicable (no auto-redirige).
4. `/run HERMES <inst>` → ejecuta el agente → renderiza `run-status` con badges + `reply`.
5. `/status` → tarjeta con estado de la agencia (director, nº agentes, keys ready).
6. `/help` lista comandos; `/clear` limpia el scrollback.
7. ↑/↓ recorren historial (persistido); escribir `/` abre autocompletado navegable con Tab/Enter/Esc.
8. Botón de micrófono dicta un comando vía `JarvisVoice` y se ejecuta como NL.
9. Tests de `parse-input` y `slash-commands` pasan; typecheck verde.

## Fuera de alcance (YAGNI · v1)

- Multi-sesión / pestañas de terminal. Una sola sesión.
- Streaming token-a-token de la respuesta (el orquestador responde completo).
- Ejecución de comandos de shell reales o código arbitrario.
- Autenticación nueva (reusa el Bearer existente).
- Recolección de videos HeyGen desde la terminal (eso es del Plan A / scheduler).
```
