# AGENTS.md

## Cursor Cloud specific instructions

This repo is an Obsidian vault (the ZENKAI "Super Cerebro" markdown knowledge base) **plus** three runnable code units that live alongside the markdown:

| Unit | Path | What it is | Dev command | Port |
|------|------|------------|-------------|------|
| Panel | `panel/` | Astro 5 **static** internal dashboard. Renders the `agentes/`, `sectores/`, `workflows/`, etc. markdown via content collections (glob loaders point at `../<folder>`). | `npm run dev` (in `panel/`) | 4321 |
| Web | `web/` | Astro 5 **SSR** public landing (`output: 'server'`, Vercel adapter). Has Vitest unit tests. | `npm run dev` (in `web/`) | 4322 |
| Scripts + API | root (`scripts/`, `api/`) | TypeScript run with `tsx`; `api/*.ts` are Vercel serverless functions that call the Anthropic + Airtable SDKs. | `npm run clasificar` / `npm run protocolo` (root) | — |

Standard commands live in each `package.json` and the per-folder `README.md` (`panel/README.md`, `web/README.md`). Don't duplicate them; read those.

### Non-obvious caveats

- **Each unit has its own `node_modules`.** The root, `panel/`, and `web/` are installed independently (`vercel.json` does `npm install && cd panel && npm install`). The update script installs all three.
- **Secrets are optional for local dev/build/test.** Nothing here is set by default in the cloud VM.
  - `panel` and `web` **build and run without any secrets** — they degrade gracefully (panel shows a "🔌 conecta Airtable" placeholder; web lead capture is best-effort).
  - `web` Vitest tests mock Anthropic/Airtable/Resend, so `npm test` passes with **no secrets**.
- **Live AI features need `ANTHROPIC_API_KEY`.** The root `npm run test:clasificar` / `test:protocolo`, the panel `/sandbox` page, and the web `/api/lead-demo` + `/api/protocolo` endpoints make **real, paid** Anthropic calls. They return 5xx without the key. Optional companions: `ZENKAI_API_KEY` (Bearer auth for the API endpoints) and `AIRTABLE_TOKEN` (persistence).
- **The panel's `/sandbox` calls `/api/clasificar` and `/api/protocolo`, which are root-level Vercel functions — NOT served by `astro dev`.** Those endpoints only exist under `vercel dev` / a Vercel deploy, so the sandbox button 404s under a plain `panel` dev server. This is expected, not a bug.
- **Root `tsconfig.json` excludes `panel/`.** Typecheck the root with `npx tsc --noEmit`; build the panel with its own `npm run build` (`astro check && astro build`).
- **`web` build/cache quirk:** if a content-collection edit triggers a "Duplicate id" warning, run `rm -rf web/.astro web/dist` then rebuild (documented in `web/README.md`).

### Integrations roadmap ("clone & improve" — Jarvis / ElevenLabs / n8n / Cursor)

This is an N3–N4 program (per `CLAUDE.md` §3); built incrementally as self-contained, env-gated modules that degrade gracefully and are unit-tested with mocks (no live keys needed to run the test suite).

- **Voice ("Jarvis") — DONE (increment 1):** `web/src/lib/voice.ts` + `web/src/pages/api/voz.ts` synthesize text → MP3 via ElevenLabs. Gated behind `ELEVENLABS_API_KEY` (+ optional `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`); same `ZENKAI_API_KEY` Bearer auth as `/api/protocolo`. Tests: `web/src/pages/api/voz.test.ts` (mock `fetch`).
- **n8n automation dispatch — DONE (increment 2):** `web/src/lib/n8n.ts` + `web/src/pages/api/n8n-dispatch.ts` POST an event envelope `{ event, payload, source, ts }` to a n8n Webhook node. Gated behind `N8N_WEBHOOK_URL` (+ optional `N8N_API_KEY` → `x-n8n-api-key` header); same `ZENKAI_API_KEY` Bearer auth. Tests: `web/src/pages/api/n8n-dispatch.test.ts` (mock `fetch`).
- **Unified orchestration ("Jarvis") — DONE (increment 3):** `web/src/lib/orchestrator.ts` + `web/src/pages/api/orquestar.ts` chain proposal → (optional) voice → (optional) n8n in one call. Body `{ texto, voice?, notify?, voiceId? }`; voice/n8n are best-effort (failures reported per-field, never break the proposal). Tests: `web/src/pages/api/orquestar.test.ts` (mock the three libs).
- **Pending (need design + provider keys):** any Cursor-style agentic features. Add each as its own `web/src/lib/*` module + `/api/*` route + mocked test, gated behind its own env var.

**Provider keys/accounts cannot be created by the agent**, and the agent **cannot create new GitHub repos or Vercel/Airtable/n8n connections** — those need each provider's dashboard and are user-only external actions. The git remote token is scoped to this repo only; `gh` is read-only. The only credential generated in-repo is the app's own `ZENKAI_API_KEY` (random bearer token; set it as a secret, never commit it).
