---
name: "Domain Setup JARVIS jarvis.zenkai.systems"
slug: sop-jarvis-domain
sla: "15 min Vercel + 5-30 min propagación DNS"
agentes_responsables: [FORGE, ATLAS]
frecuencia: por_evento
criticidad: media
---

# SOP · Domain Setup · jarvis.zenkai.systems

**Owner:** FORGE · ATLAS  
**Proyecto Vercel:** `zenkaibrain` (mismo deploy que el panel)  
**URL canónica:** https://jarvis.zenkai.systems  
**Rutas públicas (subdominio):** `/`, `/finanzas`, `/social`, `/tareas`, `/goals`, `/agentes`, `/pipeline`, `/clientes`, `/sistemas`, `/intel`  
**Rutas internas (panel):** `/jarvis`, `/jarvis/finanzas`, …

---

## Resumen

JARVIS comparte el build estático del panel (`panel/dist`). No requiere un proyecto Vercel separado. Solo hay que:

1. Añadir el subdominio en Vercel project `zenkaibrain`
2. Crear el registro DNS en Hostinger
3. Verificar SSL y rewrites `/` → contenido JARVIS (URL limpia, sin `/jarvis` en barra)

---

## Checklist DNS + Vercel

### 1 · Vercel — añadir dominio

```
Vercel UI → zenkaibrain → Settings → Domains → Add
  → jarvis.zenkai.systems → Add
```

Vercel mostrará el valor CNAME requerido (típicamente `cname.vercel-dns.com`).

### 2 · Hostinger — registro DNS

```
Hostinger → Domains → zenkai.systems → DNS Zone Editor → Add new record

Type:  CNAME
Name:  jarvis
Value: cname.vercel-dns.com   (usar el valor exacto que muestre Vercel)
TTL:   300 (o default)
```

**No tocar** registros MX de `hola@zenkai.systems`.

### 3 · Verificar propagación

```bash
dig jarvis.zenkai.systems +short
# debe resolver a cname.vercel-dns.com o IP Vercel

curl -sI https://jarvis.zenkai.systems/ | head -5
# HTTP/2 200 — sirve Command Center sin redirect visible a /jarvis

curl -sI https://jarvis.zenkai.systems/finanzas | head -5
# HTTP/2 200 — rewrite interno a /jarvis/finanzas
```

### 4 · Smoke test funcional

- [ ] `https://jarvis.zenkai.systems/` carga Command Center (URL limpia)
- [ ] `https://jarvis.zenkai.systems/finanzas` carga Finanzas
- [ ] `/jarvis/*` en subdominio JARVIS redirige a URL limpia (301)
- [ ] Command Center carga con KPIs y bento grid
- [ ] Navegación sidebar: Finanzas · Social · Tareas · Goals
- [ ] Link "Volver al Panel" apunta a `https://panel.zenkai.systems`
- [ ] SSL válido (candado verde)
- [ ] `noindex, nofollow` en meta (panel privado)

---

## Config en repo

| Archivo | Qué hace |
|---------|----------|
| `vercel.json` (raíz) | Rewrites host `jarvis.zenkai.systems` → `/jarvis/*` · redirects legacy `/jarvis` → URL limpia |
| `panel/src/lib/jarvis/config.ts` | URLs canónicas `JARVIS_URL` · `PANEL_URL` |
| `panel/src/layouts/JarvisLayout.astro` | `<link rel="canonical">` apunta a jarvis.zenkai.systems |

---

## Mapa de subdominios ZENKAI

| Subdominio | Proyecto Vercel | Contenido |
|------------|-----------------|-----------|
| `zenkai.systems` | `zenkai-web` | Landing comercial pública |
| `panel.zenkai.systems` | `zenkaibrain` | Super Cerebro (agentes, workflows…) |
| `jarvis.zenkai.systems` | `zenkaibrain` | JARVIS command center |

Ver también: `sops/sop-domain-swap-apex.md` para el swap del apex.

---

## Rollback

```
Vercel UI → zenkaibrain → Settings → Domains → jarvis.zenkai.systems → Remove
Hostinger → eliminar registro CNAME jarvis
```

El panel y JARVIS siguen accesibles vía URL Vercel fallback y `panel.zenkai.systems`.

---

## Auth recomendada

JARVIS es **interno** (Jordy + socio). Opciones:

- **Vercel Deployment Protection** ON en project `zenkaibrain` (protege todo el deploy incluyendo JARVIS)
- **Password protection** por dominio en Vercel Pro
- Restringir por IP (enterprise)

No indexar en buscadores (`noindex` ya configurado en JarvisLayout).
