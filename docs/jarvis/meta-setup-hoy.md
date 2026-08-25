# Meta · Setup HOY (15 min) · ROAS + Engagement IG

Objetivo: pasar `/api/jarvis/social` de `mock` → `live` en **zenkaibrain**.

---

## Paso 1 · Token en Meta (5 min)

1. Entrá a [Meta Business Suite](https://business.facebook.com) con la cuenta de ZENKAI
2. [developers.facebook.com](https://developers.facebook.com) → tu App de negocio
3. **Instagram Graph API** + **Marketing API** activos en la app
4. **System Users** → generar token con permisos:
   - `instagram_basic`
   - `instagram_manage_insights`
   - `ads_read`
5. Copiá el token (`EAAG...`) — guardalo en 1Password, **no en el repo**

---

## Paso 2 · Descubrir IDs (2 min)

En PowerShell, desde la raíz del repo:

```powershell
$env:META_ACCESS_TOKEN = "EAAG...tu_token..."
npm run meta:discover
```

El script imprime:

- `INSTAGRAM_BUSINESS_ACCOUNT_ID=178414...`
- `META_AD_ACCOUNT_ID=act_...`

Si no aparece IG: vinculá Instagram Business a la página de Facebook en Business Suite.

---

## Paso 3 · Pegar en Vercel (5 min)

1. [Vercel → zenkaibrain → Settings → Environment Variables](https://vercel.com/mrhaxel26-sketchs-projects/zenkaibrain/settings/environment-variables)
2. Agregar **Production** (+ Preview opcional):

| Name | Value |
|------|-------|
| `META_ACCESS_TOKEN` | `EAAG...` |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | `178414...` |
| `META_AD_ACCOUNT_ID` | `act_...` |

O por CLI:

```powershell
cd "C:\Users\jordy\Desktop\ZENKAI\Zenkai Super Brain"
vercel env add META_ACCESS_TOKEN production
vercel env add INSTAGRAM_BUSINESS_ACCOUNT_ID production
vercel env add META_AD_ACCOUNT_ID production
```

3. **Deployments → Redeploy** (sin cache) en zenkaibrain

---

## Paso 4 · Verificar (2 min)

```powershell
# Local (con vars en .env.vercel.local o env)
npm run jarvis:social:smoke

# Producción
curl -sH "Origin: https://panel.zenkai.systems" https://panel.zenkai.systems/api/jarvis/social
```

Esperado: `"source": "live"` + bloques `instagram` y `metaAds`.

En el HUD: KPIs **ROAS Meta Ads** y **Engagement IG** dejan de decir «Sin dato».

---

## Bonus · Revenue real en Airtable

En base **Ventas** → tabla **leads**, completá `valor_estimado_USD` en leads activos. Sin eso, Revenue YTD y Pipeline siguen en $0 aunque CRM esté live.

---

Ver también: `docs/jarvis/vercel-env-setup.md` · `scripts/meta/jarvis-social.ts`
