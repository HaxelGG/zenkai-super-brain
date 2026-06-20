# Windmill · ZENKAI workspace `zenkai`

Complemento a n8n/Make. SSOT sigue siendo Airtable.

## Dos tokens distintos

| Uso | Dónde crear | Para qué |
|-----|-------------|----------|
| **MCP URL** | Account settings → Tokens → **Generate MCP URL** (scope `mcp:all`) | Cursor / agentes · ejecutar scripts y flows |
| **API token** | Account settings → Tokens → Create token (scopes workspace) | `wmill` CLI · `sync pull` / `sync push` |

El token del MCP URL **no funciona** con `wmill workspace add` (401/403).

## MCP en Cursor

`.cursor/mcp.json` (local, no commitear secretos):

```json
{
  "mcpServers": {
    "windmill-mcp": {
      "type": "http",
      "url": "https://app.windmill.dev/api/mcp/w/zenkai/mcp?token=TU_MCP_TOKEN",
      "headers": {
        "Accept": "application/json, text/event-stream"
      }
    }
  }
}
```

Plantilla: `.cursor/mcp.json.example`

Verificado: MCP responde **200** con header `Accept: application/json, text/event-stream`.

Tras añadir el server: **Cursor → Settings → MCP → Reload**.

## CLI (sync Git ↔ Windmill)

```powershell
npm install -g windmill-cli
wmill init   # ya hecho en este repo
```

Con **API token** (no MCP):

```powershell
$token = $env:WINDMILL_API_TOKEN   # o desde .env
wmill workspace add zenkai zenkai https://app.windmill.dev --token $token
wmill workspace switch zenkai
wmill workspace bind
wmill sync pull --token $token
```

Scripts npm: `npm run wmill:pull` · `npm run wmill:push`

## Repo layout

| Path | Qué es |
|------|--------|
| `wmill.yaml` | Config sync · workspace `zenkai` |
| `wmill-lock.yaml` | Lock dependencias |
| `f/` | Scripts/flows (aparece tras `sync pull`) |
| `AGENTS.wmill.md` | Instrucciones agente (regenerado por CLI) |

## Sprint 1 · candidatos Windmill

| Flow n8n | Equivalente |
|----------|-------------|
| M-03 LEADS-05 | Script TS + HTTP trigger |
| M-04 hot-lead | Flow · Resend alert |
| S-01 SLA 3h | Schedule + Airtable |

## Seguridad

- Regenerar token si se expuso en chat o commit
- `skipSecrets: true` en `wmill.yaml` (default)
- Human-in-the-loop: igual que n8n
