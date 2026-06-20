# JARVIS · Voz · Navegador y escritorio

## Recomendación oficial

| Uso | Plataforma | Notas |
|-----|------------|-------|
| **Mejor para voz** | **Chrome o Edge** (web) | Web Speech API nativa · menos fricción |
| Acceso rápido | PWA instalada desde Chrome/Edge | Misma calidad que web · icono en escritorio |
| Ventana dedicada | Electron `jarvis/desktop` | `npm start` · mic auto-permitido |
| Evitar para voz | Firefox, Safari | Sin `SpeechRecognition` |
| Con cuidado | Brave | Permitir micrófono · Shields off en `zenkai.systems` |

## URLs

- Producción: https://panel.zenkai.systems/jarvis/
- Clean URL: https://jarvis.zenkai.systems/
- Local dev: http://localhost:4321/jarvis/

## Cómo hablar con JARVIS

1. Abrí en **Chrome o Edge**
2. Permití **micrófono** cuando lo pida
3. **Clic en el orb** → debe decir **«Escuchando…»**
4. Decí el comando (ej. «abre finanzas», «dame un recap»)
5. JARVIS responde por voz (ElevenLabs) y opcionalmente navega

### Wake word (opcional)

Panel **⋯** → activar **Wake word** → decí «Jarvis despierta» o «Hey Jarvis».

### Sin micrófono

Panel **⋯** → escribí el comando en el campo de texto → **Enviar**.

## PWA (Instalar app)

1. Chrome/Edge en `panel.zenkai.systems/jarvis/`
2. Icono **Instalar** en barra de direcciones (o botón Instalar en header)
3. Se abre como app standalone · scope `/jarvis/`

No mejora la calidad de voz vs pestaña normal; solo comodidad.

## Electron (escritorio)

```bash
cd jarvis/desktop
npm install
npm start              # producción
npm run start:local    # apunta a localhost:4321
```

## APIs (backend)

- `POST /api/jarvis/run` — orquestador
- `POST /api/jarvis/speak` — ElevenLabs TTS

Auth: origen dashboard **o** `Authorization: Bearer ZENKAI_API_KEY`.

## Troubleshooting

| Síntoma | Causa | Solución |
|---------|-------|----------|
| No escucha | Orb en idle | Clic en orb primero |
| «Micrófono requerido» | Permiso denegado | Config del navegador → permitir mic |
| «Sin voz» | Firefox/Safari | Usar Chrome o Edge |
| Orb anima pero no habla | Audio bloqueado | Clic en orb antes de hablar · fallback TTS navegador |
| Brave no responde | Shields | Desactivar para `zenkai.systems` |
| Localhost sin API | Astro dev sin `/api` | Las llamadas van a `panel.zenkai.systems` automáticamente |
