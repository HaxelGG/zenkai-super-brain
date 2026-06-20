# JARVIS · Guía de uso y troubleshooting

ZENKAI tiene **dos interfaces JARVIS** distintas. No son lo mismo.

---

## 1 · ¿Cuál JARVIS necesitás?

| Interfaz | URL | Para qué sirve |
|----------|-----|----------------|
| **Command Center (HUD)** | https://jarvis.zenkai.systems | Dashboard operativo: finanzas, pipeline, agentes, voz por orb |
| **Command Center (panel)** | https://panel.zenkai.systems/jarvis | Mismo HUD, rutas con prefijo `/jarvis` |
| **Consola de propuestas** | https://zenkai.systems/jarvis | Brief de cliente → propuesta IA + voz + n8n + email |

Si buscás el **dashboard Iron Man** → `jarvis.zenkai.systems`.  
Si buscás **generar una propuesta comercial** → `zenkai.systems/jarvis`.

---

## 2 · Command Center (HUD + voz)

### Abrir

- Producción: https://jarvis.zenkai.systems
- Alternativa: https://panel.zenkai.systems/jarvis
- Local: `cd panel && npm run dev` → http://localhost:4321/jarvis

### Voz · orb (esquina superior derecha)

| Acción | Qué hace |
|--------|----------|
| **Clic simple** | Activa escucha con wake word («Jarvis despierta» / «Jarvis wake up») |
| **Doble clic** | Hablar directo (sin wake word) |
| **Botón ⋯** o **clic derecho** en orb | Abre panel de voz (API key, transcript, comandos por texto) |
| **Mantener pulsado (móvil)** | Abre panel de voz |

### Comandos de voz útiles

```
Jarvis despierta          → activa escucha
abrir finanzas            → navega a Finanzas
abrir pipeline            → CRM / leads
dame un resumen           → estado CRM (si Airtable está conectado)
```

También podés escribir el comando en el panel ⋯ → campo «Escribí un comando…» → **Enviar**.

### Requisitos para que la voz funcione

1. **Navegador:** Chrome o Edge (Firefox/Safari no soportan reconocimiento de voz web).
2. **Micrófono:** permitir acceso cuando el navegador lo pida.
3. **Primer clic en el orb:** desbloquea audio (política del navegador).
4. **API (opcional en producción):** en `jarvis.zenkai.systems` o `panel.zenkai.systems` la API acepta tu origen sin key. En **localhost** las llamadas van a `panel.zenkai.systems` (rama `cursor/jarvis-voice-pwa-branding` o superior).

### Panel de voz (⋯)

- **ZENKAI_API_KEY:** pega tu Bearer token si ves errores 401 o si probás desde un cliente externo.
- **Wake word activo:** enciende/apaga escucha continua.
- **Voz ElevenLabs:** si está OFF o el servidor no tiene key, usa voz del navegador (TTS).
- **Transcript / Últimos runs:** historial de la sesión (localStorage).

### Datos LIVE vs MOCK

- Badge **LIVE** (verde): Airtable/APIs conectadas.
- Badge **MOCK**: datos de demo; configurá `AIRTABLE_TOKEN` en Vercel proyecto **zenkaibrain**.
- Social requiere además `META_ACCESS_TOKEN` + IDs de Instagram/Ads (ver `docs/jarvis/vercel-env-setup.md`).

---

## 3 · Consola de propuestas (zenkai.systems/jarvis)

### Flujo

1. Pegar **ZENKAI_API_KEY** (Bearer).
2. Escribir **brief** del negocio del cliente.
3. (Opcional) Email, voz ElevenLabs, notificar n8n.
4. Clic **Activar JARVIS**.

### Variables en Vercel · proyecto `zenkai-web`

```
ZENKAI_API_KEY=...
LLM_PROVIDER=deepseek          # o anthropic
DEEPSEEK_API_KEY=sk-...        # si deepseek
ELEVENLABS_API_KEY=sk_...
N8N_WEBHOOK_URL=https://zenkai-growth-systems.app.n8n.cloud/webhook/zenkai
RESEND_API_KEY=re_...          # email opcional
```

### Local

```bash
cd web
cp .env.example .env   # rellenar valores
npm run dev            # http://localhost:4322/jarvis
```

Reiniciá el dev server después de editar `.env`.

---

## 4 · Por qué «no funciona» (checklist)

### A · Veo consola de micrófono vieja, no el HUD

**Causa:** el dominio `jarvis.zenkai.systems` apunta al proyecto Vercel equivocado (`zenkai-jarvis` legacy).

**Fix:** Vercel → **zenkaibrain** → Settings → Domains → agregar `jarvis.zenkai.systems`. Quitar el dominio de `zenkai-jarvis`. Ver `sops/sop-jarvis-domain.md`.

---

### B · El orb no escucha / no habla

| Síntoma | Causa | Solución |
|---------|-------|----------|
| «Usá Chrome o Edge» | Navegador sin Speech API | Cambiar a Chrome/Edge |
| «Micrófono requerido» | Permiso denegado | Configuración del sitio → Micrófono → Permitir |
| No pasa nada al hablar | Wake word apagado | Clic en orb o activar en panel ⋯ |
| Sin voz ElevenLabs | Key no configurada | Normal: usa TTS del navegador; o configurar `ELEVENLABS_API_KEY` en zenkaibrain |
| «Audio bloqueado» | Autoplay del navegador | Clic en orb antes de hablar |

---

### C · Localhost (`npm run dev`) · voz o LIVE

| Host | Comportamiento API |
|------|-------------------|
| `jarvis.zenkai.systems` | Proxy a `https://panel.zenkai.systems/api/jarvis/*` (CORS) |
| `panel.zenkai.systems` | Same-origin `/api/jarvis/*` |
| `localhost:4321` | Proxy a `panel.zenkai.systems` (astro dev no sirve APIs) |
| Raíz + `vercel dev` | APIs locales en el mismo puerto |

**Opción recomendada para probar voz:** https://jarvis.zenkai.systems (producción).

**Full local:** desde la raíz del repo, `vercel dev` (sirve panel + APIs).

---

### D · Consola propuestas devuelve error 401 / 500

| HTTP | Causa |
|------|-------|
| **401** | `ZENKAI_API_KEY` incorrecta o ausente |
| **500** | Falta `DEEPSEEK_API_KEY` o `ANTHROPIC_API_KEY` en Vercel `zenkai-web` |
| **n8n falló** | `N8N_WEBHOOK_URL` mal configurada (la propuesta igual se genera) |
| **email falló** | `RESEND_API_KEY` ausente (opcional) |

---

### E · Badge sigue en MOCK

- Falta `AIRTABLE_TOKEN` en **zenkaibrain** (Vercel).
- O estás en local sin `vercel dev` (esperado).

---

## 5 · Smoke tests rápidos

### HUD · API CRM (desde terminal)

```bash
curl -sH "Origin: https://panel.zenkai.systems" \
  https://panel.zenkai.systems/api/jarvis/crm | jq .source
```

Esperado: `"live"` (con Airtable configurado).

### Voz · orquestador

```bash
curl -s -X POST "https://panel.zenkai.systems/api/jarvis/run" \
  -H "Origin: https://panel.zenkai.systems" \
  -H "Content-Type: application/json" \
  -d '{"instruction":"abrir finanzas"}' | jq .
```

Esperado: `action.path` y `speech` con respuesta de navegación.

### Propuestas

```bash
curl -s -X POST "https://zenkai.systems/api/orquestar" \
  -H "Authorization: Bearer TU_ZENKAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"texto":"Clínica dental en Medellín, 4 odontólogos","voice":false,"notify":false}' | jq .proposal.sector
```

---

## 6 · App de escritorio (opcional)

```bash
cd jarvis/desktop
npm install
npm run start          # abre jarvis.zenkai.systems en Electron
npm run start:local    # abre localhost:4321/jarvis
```

Requiere micrófono permitido en Windows.

---

## 7 · Cambios recientes (bugs corregidos)

- **CORS/origen:** validación estricta (sin `startsWith` vulnerable)
- **jarvis.zenkai.systems:** APIs same-origin (no cross-origin a panel)
- **Nav activo:** rutas `/finanzas` y `/jarvis/finanzas` equivalentes
- **Wake word:** toggle alineado con runtime (`=== "1"`)
- **API key:** unificada `zenkai_api_key` ↔ `zenkai_jarvis_api_key`
- **PWA:** manifest separado para subdominio (`start_url: /`)
- **Pipeline live:** escape HTML en nombres de leads (XSS)

---

ZENKAI Growth Systems · JARVIS · FORGE + NEXUS
