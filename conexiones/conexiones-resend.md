---
name: "Resend"
slug: resend
servicios_dependientes: [Vercel zenkai-web, Hostinger DNS]
criticidad: media
estado_conexion: activo
fase_conexion: 3
---

# CONEXIONES · RESEND
## Email transaccional para captura de leads + auto-reply

**Owner:** ATLAS · ECHO · HERMES
**Plan recomendado:** Free (3,000 emails/mes · 100 emails/día · dominio verified) → upgrade a Pro ($20/mes · 50k emails/mes) cuando pasen los 50 leads/día.
**Dominio verificado:** `zenkai.systems` (verified · Receiving OFF · ver `conexiones/credenciales.md`)
**Estado:** ✅ **activo desde 2026-05-13** · `RESEND_API_KEY` configurada en Vercel `zenkai-web` · smoke test `/api/lead-demo` con email opcional retorna 200 sin errores en Vercel logs · FROM = `ZENKAI <hola@zenkai.systems>` · ReplyTo = `hola@zenkai.systems`

---

## POR QUÉ LO NECESITAMOS

### Uso 1 · Auto-reply al visitor del demo (opcional)

`/api/lead-demo` ya está cableado para enviar la propuesta por email si el visitor llena el campo `email` opcional. La función `sendProposalByEmail()` en `web/src/lib/email.ts` usa el SDK oficial de Resend.

Sin `RESEND_API_KEY` configurada en Vercel, la captura sigue funcionando (el visitor ve la propuesta inline) pero **NO recibe copia en su inbox**. Esto rompe el compromiso comercial #3 publicado en landing: *"Te respondemos en menos de 4 horas hábiles"* — el primer touchpoint debería ser un acuse automático inmediato.

### Uso 2 · Auto-reply al form de contacto (futuro)

Cuando se construya el form `/contacto` o `/conversacion`, el flujo será:
1. Visitor envía form → handler crea Lead en Airtable
2. Resend dispara auto-reply en <1s desde `hola@zenkai.systems`
3. SOP humano: responder real desde Gmail/Outlook en <4h hábiles

### Uso 3 · Notificaciones a fundadores (futuro)

Cuando llega un lead "calificado" (criterios de scoring por definir en HERMES-CRM), Resend manda email a `jordycapital@gmail.com` con resumen + link al record Airtable.

---

## ESTADO ACTUAL DEL DOMINIO

✅ Dominio `zenkai.systems` agregado a Resend
✅ DNS records (SPF · DKIM · DMARC) verificados en Hostinger
✅ Status: **Verified**
✅ Receiving: OFF (solo enviamos · recepción va a Hostinger Email)

✅ `RESEND_API_KEY` configurada en Vercel `zenkai-web` desde 2026-05-13 · envío activo en producción.

---

## SETUP PASO A PASO (5 min · el dominio ya está verified)

### 1 · Generar API key

1. Dashboard Resend: `https://resend.com/api-keys`
2. Click `Create API Key`
3. Configuración:
   - **Name:** `zenkai-web-prod`
   - **Permission:** `Sending access` (suficiente · NO usar `Full access` salvo casos administrativos)
   - **Domain:** `zenkai.systems` (limita la key a este dominio · si se filtra, el blast radius queda contenido)
4. Click `Add`
5. Copiar la key (empieza con `re_`) — Resend solo la muestra UNA vez

### 2 · Copiar a Vercel `zenkai-web`

```
Dashboard Vercel → Projects → zenkai-web → Settings → Environment Variables → Add new
```

| Variable | Valor | Environments |
|----------|-------|--------------|
| `RESEND_API_KEY` | `re_...` (de paso 1) | Production + Preview + Development |

### 3 · Configurar FROM address verificado

`web/src/lib/email.ts` actualmente envía desde un FROM hardcoded (revisar valor). Asegurarse que:
- FROM = `ZENKAI <hola@zenkai.systems>` (formato `Nombre <email>`)
- Reply-To = `hola@zenkai.systems` (para que el visitor responda y caiga en Hostinger inbox)

Si el FROM hardcoded usa otro dominio o subdominio, Resend rechaza el envío con `403 The domain is not verified`.

### 4 · Trigger redeploy

Igual que con Turnstile · Vercel no auto-redeploya en env vars nuevas. Forzar redeploy desde UI o commit dummy.

### 5 · Verificación post-setup

```bash
# Disparar con email opcional · debe llegar al inbox del visitor + Airtable persistir
curl -i -X POST "https://zenkai-web-rho.vercel.app/api/lead-demo" \
  -H "Content-Type: application/json" \
  -d '{"texto":"[CLIENTE] Test con email para verificar que Resend envia la propuesta al inbox del visitor en menos de 10 segundos.","email":"jordycapital+resend-test@gmail.com"}'

# Verificar:
# 1. HTTP 200 + x-airtable-record-id presente
# 2. Email llega a jordycapital+resend-test@gmail.com en <10s
# 3. FROM = "ZENKAI <hola@zenkai.systems>"
# 4. HTML body = propuesta renderizada (no JSON crudo)
```

Si el email no llega:
- Revisar logs Vercel: `console.error('[lead-demo] resend send failed:', err)` en el handler
- Revisar dashboard Resend → Activity → buscar el envío reciente
- Causas comunes: API key sin permiso de send, FROM mal configurado, dominio caducado en DNS

---

## COSTO

| Plan Resend | Precio | Quota | Cuándo usarlo |
|-------------|--------|-------|---------------|
| Free | $0 | 3k emails/mes · 100/día | hasta los primeros 50 leads/día (ZENKAI hoy) |
| Pro | $20/mes | 50k emails/mes | escala 2026-2027 cuando se abran auto-replies + notifs + tier Lite tenga ≥50 clientes activos |
| Scale | $90+/mes | 100k+ emails/mes | nunca aplicará para ZENKAI Capa 1 (servicios B2B · no email blast) |

**Decisión:** Free hasta cuándo llegamos a ~80 emails/día sostenidos · upgrade a Pro a la primera semana que se acerque a 100 emails (umbral). Registrar gasto en `FINANZAS · gastos` cuando se haga el upgrade.

---

## RIESGOS Y MITIGACIONES

| Riesgo | Mitigación |
|--------|------------|
| Email cae en spam · visitor no ve la propuesta | SPF + DKIM + DMARC ya configurados · usar texto humano (no marketing-y) · evitar palabras gatillo en el subject ("GRATIS", "OFERTA"). Subject sugerido: *"Tu propuesta ZENKAI · [sector_detectado]"* |
| Resend cae · auto-reply no llega · cliente desconfía | `sendProposalByEmail()` es best-effort: si falla, el response 200 sigue intacto con la propuesta inline. Visitor SIEMPRE ve algo. Ideal: agregar reintento con backoff (futuro · cuando sea crítico) |
| API key filtrada · spam masivo desde nuestro dominio | Key scoped a dominio `zenkai.systems` y permiso solo `Sending access`. Si se filtra, atacante solo puede enviar desde nuestro dominio (limita reputación blast). Rotación: nueva key cada 6 meses + revocación inmediata si se sospecha filtración |
| Receiving OFF · cliente responde y se pierde | Inbox real está en Hostinger Email (`hola@zenkai.systems`). Reply-To bien configurado redirige respuestas ahí. Verificar 2026-06-01 que `hola@zenkai.systems` siga recibiendo correctamente en Hostinger |
| Quota Free agotada · envíos rechazados sin alerta | Sumar webhook Resend → Slack/email cuando quota mensual >80% · alerta proactiva antes de hitting el cap |

---

## REFERENCIAS

- Docs Resend: https://resend.com/docs
- Dashboard: `https://resend.com/emails`
- Lib local: `web/src/lib/email.ts`
- Endpoint que lo consume: `web/src/pages/api/lead-demo.ts`
- DNS records verificados: dashboard Hostinger → DNS → zenkai.systems
