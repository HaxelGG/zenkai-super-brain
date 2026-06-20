# JARVIS Desktop

App de escritorio nativa para el Command Center JARVIS. Envuelve el panel web en una ventana Electron con tema oscuro, sin barra de menú visible y enlaces externos abiertos en el navegador.

## Requisitos

- Node.js 20+
- Windows 10/11 (también macOS / Linux con los mismos comandos)

## Uso rápido

```bash
cd jarvis/desktop
npm install
npm start          # producción → panel.zenkai.systems/jarvis/
npm run start:local # dev local → localhost:4321/jarvis/
```

## Instalador Windows

```bash
npm run dist:win
```

Genera el ejecutable portable en `jarvis/desktop/dist/`.

## Variables

| Variable | Default | Descripción |
|----------|---------|-------------|
| `JARVIS_URL` | `https://panel.zenkai.systems/jarvis/` | URL base del Command Center |

## Alternativa web (PWA)

En Chrome/Edge, abre JARVIS y usa **Instalar app** (icono en la barra de direcciones) o el botón **Instalar** en el header del panel.
