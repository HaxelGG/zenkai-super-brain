# JARVIS · Telegram Bot

Puente entre Telegram y el Command Center en tu laptop. Escribís al bot → JARVIS responde en Telegram **y** habla en el panel (voz ElevenLabs + navegación).

## Arquitectura

```
Telegram (tu móvil)
       │
       ▼
telegram-bridge.ts  ← corre en la laptop (long polling)
       │
       ├── POST reply → Telegram
       └── inbox HTTP :8765
                │
                ▼
         jarvis-telegram.js (panel abierto en browser)
                │
                ▼
         JarvisVoice.deliverRun → TTS + toast + navegación
```

## Setup (una vez)

### 1. Crear bot

1. Telegram → @BotFather → `/newbot`
2. Nombre: `JARVIS ZENKAI` · username: `tu_bot_bot`
3. Copiá el token

### 2. Variables en `.env` (raíz del repo)

```bash
TELEGRAM_BOT_TOKEN=123456789:AAF...
TELEGRAM_ALLOWED_CHAT_IDS=987654321   # tu chat id (recomendado)
ANTHROPIC_API_KEY=...                 # orquestador IA
AIRTABLE_TOKEN=...                    # opcional · CRM live
ZENKAI_API_KEY=...                    # TTS ElevenLabs en panel
ELEVENLABS_API_KEY=...
```

Obtener tu chat id: escribile `/start` al bot con el bridge corriendo y mirá la consola, o usá @userinfobot.

### 3. Verificar

```bash
npm run jarvis:telegram:setup
```

### 4. Iniciar puente (laptop encendida)

```bash
npm run jarvis:telegram
```

### 5. Abrir JARVIS

- Producción: https://panel.zenkai.systems/jarvis/
- Local: `cd panel && npm run dev` → http://localhost:4321/jarvis/

El badge **TG** en el header pasa a cyan cuando el bridge está conectado.

## Uso

| Comando Telegram | Qué hace |
|------------------|----------|
| `/start` | Mensaje de bienvenida |
| `/help` | Ayuda |
| `recap` / `estado` | Resumen CRM |
| `abre finanzas` | Navega + voz en laptop |
| Texto libre | Clasificador ZENKAI → respuesta |

## Variables opcionales

| Variable | Default | Descripción |
|----------|---------|-------------|
| `JARVIS_BRIDGE_PORT` | `8765` | Puerto HTTP local del inbox |
| `JARVIS_BRIDGE_HOST` | `127.0.0.1` | Host del bridge |

## Seguridad

- Usá siempre `TELEGRAM_ALLOWED_CHAT_IDS` en producción.
- El bridge solo escucha en localhost; el panel hace poll local.
- No commitees `TELEGRAM_BOT_TOKEN`.

## Troubleshooting

| Problema | Solución |
|----------|----------|
| TG gris en panel | `npm run jarvis:telegram` debe estar corriendo |
| Bot no responde | `npm run jarvis:telegram:setup` · token válido |
| Voz no suena | Pegá `ZENKAI_API_KEY` en panel ⋯ · clic en pantalla (autoplay) |
| «Chat no autorizado» | Agregá tu id a `TELEGRAM_ALLOWED_CHAT_IDS` |
