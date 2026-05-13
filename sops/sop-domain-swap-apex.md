---
name: "Domain Swap Apex zenkai.systems"
slug: sop-domain-swap-apex
sla: "30-45 min activos + 5-30 min propagación DNS"
agentes_responsables: [FORGE, ATLAS]
frecuencia: por_evento
criticidad: alta
---

# SOP · Domain Swap Apex zenkai.systems
## Mover apex del panel interno a la landing comercial sin downtime

**Owner:** FORGE-DEPLOY + ATLAS-QA
**Última revisión:** 2026-05-13
**Tarea bloqueante de:** apertura de tráfico orgánico a `zenkai.systems`
**Plan de referencia:** `docs/plans/2026-05-10-landing-zenkai-implementation.md` Tareas 5.3-pre + 5.3

---

## OBJETIVO

Hoy `https://zenkai.systems` sirve el panel interno (proyecto Vercel `zenkaibrain`). La landing comercial vive en `https://zenkai-web-rho.vercel.app` (URL fea · proyecto Vercel `zenkai-web`). Este SOP intercambia los destinos sin downtime visible para usuarios externos:

| Antes | Después |
|-------|---------|
| `zenkai.systems` → panel | `zenkai.systems` → landing |
| sin acceso público a panel | `panel.zenkai.systems` → panel (con auth) |
| `zenkai-web-rho.vercel.app` → landing | sigue funcionando como alias secundario |

---

## DATOS DE INFRAESTRUCTURA (verificados 2026-05-13)

| Campo | Valor |
|-------|-------|
| Team Vercel | `mrhaxel26-sketchs-projects` (`team_Zy4UDnbxRqU9SqD02b8uulQq`) |
| Project panel | `zenkaibrain` (`prj_VhWbxLoekQRoxw22CBlGKrxvJhdb`) |
| Project landing | `zenkai-web` (`prj_Ct9A96VniiBmECzUTeaNgTGFuSr7`) |
| DNS registrar | Hostinger · zona `zenkai.systems` |
| Email comercial | `hola@zenkai.systems` (Hostinger MX records · NO TOCAR) |
| Vercel A record IP | Vercel rota IPs · usar el valor exacto que muestre la UI en Step 4 |
| Vercel CNAME target | `cname.vercel-dns.com` (estándar) |

⚠️ **Antes de empezar:** verificar que los MX records de Hostinger para email NO se toquen. Solo tocar A record `@` (apex) y CNAME `www` + `panel`.

---

## ORDEN OPTIMIZADO (zero-downtime · 30 min)

El plan original (Tarea 5.3-pre) hace: 1) remove apex panel → 2) add subdomain panel → 3) add apex landing. Esto deja un gap de ~5 min sin apex servido. Este SOP **invierte el orden** para minimizar el gap a <30 segundos:

```
1. Add panel.zenkai.systems al project zenkaibrain (paralelo al apex)
2. Crear CNAME panel → cname.vercel-dns.com en Hostinger
3. Esperar propagación + SSL del subdominio (5-15 min)
4. Verificar https://panel.zenkai.systems sirve el panel OK
5. ← AQUÍ el panel ya vive en dos URLs: apex (legacy) + subdomain (nuevo)
6. Remove zenkai.systems del project zenkaibrain
7. Add zenkai.systems al project zenkai-web (Vercel acepta inmediato porque está liberado)
8. Actualizar A record apex en Hostinger (si cambia · ver Step 7)
9. Esperar SSL emisión Vercel (~30s con DNS ya en su sitio)
10. Verificar https://zenkai.systems sirve la landing OK
```

Durante steps 6-10 el panel queda accesible vía `panel.zenkai.systems` y vía URL fallback Vercel · sin downtime real.

---

## CHECKLIST EJECUTABLE

### Pre-flight (5 min)

- [ ] **Confirmar quién accede al panel actualmente.** Si solo Jordy + socio, deployment protection (Vercel Authentication) sigue ON · sin riesgo de tráfico real interrumpido. Verificar en Vercel `zenkaibrain` → Settings → Deployment Protection.
- [ ] **Backup mental del estado DNS actual.** Tomar screenshot de Hostinger DNS panel de `zenkai.systems` para rollback rápido si algo sale mal.
- [ ] **Tener abierta** en pestañas separadas: (a) Vercel zenkaibrain Settings → Domains, (b) Vercel zenkai-web Settings → Domains, (c) Hostinger panel → DNS Zone Editor.

### Fase A · Crear panel subdomain (10 min)

- [ ] **Step 1 — Add `panel.zenkai.systems` al project `zenkaibrain`:**
  ```
  Vercel UI → zenkaibrain → Settings → Domains → Add → panel.zenkai.systems → Add
  ```
  Vercel mostrará: `Set the CNAME record to cname.vercel-dns.com.` **Copiar el target exacto** (suele ser `cname.vercel-dns.com` pero verificar).

- [ ] **Step 2 — Crear registro CNAME en Hostinger:**
  ```
  Hostinger → Domains → zenkai.systems → DNS Zone Editor → Add new record
    Type:  CNAME
    Name:  panel
    Target: cname.vercel-dns.com  (← valor exacto del Step 1)
    TTL:   14400 (4h · default)
  ```

- [ ] **Step 3 — Esperar propagación (5-15 min · suele ser <5 min con TTL bajo).** Comando para verificar:
  ```bash
  dig panel.zenkai.systems +short
  # Debe devolver el CNAME y resolver eventualmente a una IP de Vercel
  ```

- [ ] **Step 4 — Verificar SSL + servicio:** abrir `https://panel.zenkai.systems` en browser.
  - Esperado: panel responde igual que el apex actual (puede pedir Vercel auth si está activado).
  - Si HTTPS da error de certificado, esperar 2-5 min más · Vercel emite Let's Encrypt automático.
  - Si 404, verificar DNS propagación con `dig` arriba.

### Fase B · Swap del apex (10 min)

🚨 **A partir de acá empieza la ventana crítica de <30s** mientras el apex queda sin dueño en Vercel.

- [ ] **Step 5 — Remover `zenkai.systems` del project `zenkaibrain`:**
  ```
  Vercel UI → zenkaibrain → Settings → Domains → zenkai.systems → menú "..." → Remove
  ```
  Vercel pedirá confirmación. Confirmar. El panel sigue accesible vía `panel.zenkai.systems` y el alias `*.vercel.app`.

- [ ] **Step 6 — Add `zenkai.systems` al project `zenkai-web`:**
  ```
  Vercel UI → zenkai-web → Settings → Domains → Add → zenkai.systems → Add
  ```
  Vercel mostrará uno o más A records requeridos para el apex (típicamente `76.76.21.21` u otro IP que Vercel decide en el momento). **Copiar el valor exacto.**

- [ ] **Step 7 — Verificar/actualizar A record apex en Hostinger:**
  ```
  Hostinger → DNS Zone Editor → buscar registro tipo A con Name = @
    Si la IP ya coincide con la que mostró Vercel en Step 6: dejar como está
    Si no coincide: editar el valor a la nueva IP · TTL 14400
  ```

- [ ] **Step 8 — Add `www.zenkai.systems` al project `zenkai-web` (opcional · recomendado):**
  ```
  Vercel UI → zenkai-web → Settings → Domains → Add → www.zenkai.systems → Add
    → marcar "Redirect to zenkai.systems"
  ```
  Asegurar que en Hostinger existe `CNAME www → cname.vercel-dns.com`. Si no existe, crearlo.

- [ ] **Step 9 — Marcar `zenkai.systems` como Production Domain en `zenkai-web`:**
  ```
  Vercel UI → zenkai-web → Settings → Domains → zenkai.systems → "..." → Set as Production Domain
  ```
  Esto sustituye al `zenkai-web-rho.vercel.app` autogenerado como dominio canónico.

### Fase C · Verificación end-to-end (10 min)

- [ ] **Step 10 — DNS propagación:**
  ```bash
  dig zenkai.systems +short         # debe devolver IP Vercel (típico 76.76.21.21)
  dig www.zenkai.systems +short     # debe devolver alias cname.vercel-dns.com
  dig panel.zenkai.systems +short   # debe seguir resolviendo a Vercel
  ```

- [ ] **Step 11 — HTTPS válido:**
  ```bash
  curl -sI https://zenkai.systems/         | head -5
  curl -sI https://www.zenkai.systems/     | head -5
  curl -sI https://panel.zenkai.systems/   | head -5
  ```
  Los 3 deben retornar `200` (o `301/302` para www) con headers `strict-transport-security` y `x-vercel-cache`.

- [ ] **Step 12 — Browser smoke check:**
  - `https://zenkai.systems` → landing comercial v3.3 visible (hero + demo + planes)
  - `https://www.zenkai.systems` → redirect a apex sin error
  - `https://panel.zenkai.systems` → panel interno (con auth Vercel si activada)
  - Demo en landing funciona end-to-end (textarea → submit → propuesta renderizada)
  - Cal.com link funciona desde landing

- [ ] **Step 13 — Smoke test API:**
  ```bash
  curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" \
    -X POST "https://zenkai.systems/api/lead-demo" \
    -H "Content-Type: application/json" \
    -d '{"texto":"[CLIENTE] Smoke test post-domain swap apex 2026-05-XX · debe responder 200 con la propuesta generada y persistencia Airtable activa."}'
  ```
  Esperado: `200 ~8-13s` (idéntico al smoke test pre-swap).

- [ ] **Step 14 — Actualizar referencias internas:**
  - `conexiones/conexiones-airtable.md` · si hace mención a URLs del demo
  - `conexiones/conexiones-resend.md` · si hace mención a URLs del demo
  - `ESTADO-ACTUAL.md` · marcar Fase 5.3 como ✅ + cambiar URLs canónicas de `zenkai-web-rho.vercel.app` a `zenkai.systems`
  - `web/src/layouts/WebLayout.astro` · verificar `<meta property="og:url">` apunta a `https://zenkai.systems/` (no al URL Vercel)
  - Bookmarks personales y herramientas (analytics, etc.) actualizadas

---

## ROLLBACK PLAN (si algo sale mal)

### Síntoma: apex devuelve 404 / SSL inválido > 5 min después del swap

```
Vercel UI → zenkai-web → Settings → Domains → zenkai.systems → Remove
Vercel UI → zenkaibrain → Settings → Domains → Add → zenkai.systems
```
Restaura el panel en el apex. DNS no necesita cambiar (sigue apuntando a IPs Vercel).

### Síntoma: panel.zenkai.systems no resuelve

Verificar CNAME en Hostinger. Si está mal:
```
Hostinger → DNS Zone Editor → editar CNAME panel
  Target: cname.vercel-dns.com   (corregir si está distinto)
```

### Síntoma: emails a hola@zenkai.systems dejan de llegar

🚨 **No se debería tocar los MX records.** Verificar en Hostinger DNS Zone Editor que los registros tipo MX siguen apuntando a los servers de Hostinger (típico `mx1.hostinger.com` priority 10 + `mx2.hostinger.com` priority 20). Si por error se borraron, restaurar desde el screenshot pre-flight.

---

## CRITERIOS DE DONE

- ✅ `https://zenkai.systems` sirve la landing comercial v3.3 (no el panel · no 404 · no error SSL)
- ✅ `https://www.zenkai.systems` redirige a `https://zenkai.systems`
- ✅ `https://panel.zenkai.systems` sirve el panel interno (con o sin auth · según preferencia)
- ✅ `https://zenkai-web-rho.vercel.app` sigue funcionando como alias secundario (Vercel lo mantiene · puede deprecarse en 2026-Q3 una vez consolidado el apex)
- ✅ Demo end-to-end funcional desde `zenkai.systems` (`/api/lead-demo` 200 OK + Airtable persistencia OK)
- ✅ Email `hola@zenkai.systems` sigue recibiendo correctamente (verificar enviándole un mail desde Gmail externo)
- ✅ Vercel Web Analytics empieza a registrar visitas con dominio `zenkai.systems` en lugar del `*.vercel.app`
- ✅ ESTADO-ACTUAL.md actualizado · Tarea 5.3-pre + 5.3 marcadas como completas

---

## TIEMPOS REALES (instrumentar después de ejecutar)

| Fase | Estimado | Real |
|------|----------|------|
| Pre-flight | 5 min | _llenar al ejecutar_ |
| Fase A (subdomain panel) | 10 min | _llenar_ |
| Fase B (swap apex) | 10 min | _llenar_ |
| Fase C (verificación) | 10 min | _llenar_ |
| **Total** | **35 min** | _llenar_ |
| Ventana crítica sin apex | <30s | _llenar_ |

Estos datos sirven para SOPs futuros de domain swap (clientes que migran de sub-Vercel a su apex).

---

## NOTAS

- **Vercel auto-emite Let's Encrypt SSL** una vez DNS propaga. No requiere acción manual.
- **TTL 14400 (4h)** es seguro. Si necesitás iterar más rápido, bajalo a 600 (10 min) ANTES de empezar el swap y subílo de vuelta después.
- **Vercel rota IPs ocasionalmente.** No hardcodear ningún IP fuera del DNS · siempre consultar la UI en el momento.
- **www.zenkai.systems es opcional** pero buena práctica para SEO (canonical) y para usuarios que tipean con `www`.
- **El panel queda con auth de Vercel** (deployment protection). Si en el futuro se quiere exponer públicamente el panel como herramienta interna sin auth, esa es una decisión separada.
