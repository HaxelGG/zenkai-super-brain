# CREDENCIALES · ZENKAI
## Registro de qué credencial existe, dónde vive, quién la administra
## ⚠️ ESTE ARCHIVO NO CONTIENE VALORES · solo metadata

---

## REGLA INQUEBRANTABLE

**Las credenciales reales NUNCA viven aquí.**
**Las credenciales reales NUNCA viven en archivos del repositorio.**
**Las credenciales reales NUNCA viven en mensajes de Claude Code o emails.**

Las credenciales reales viven en **uno** de estos lugares:
1. **1Password / Bitwarden / proton pass** (preferido · vault personal)
2. **Variables de entorno** del sistema operativo (`.env` local · NO commiteado)
3. **Make Connections** (encriptadas en Make · no se exportan)
4. **GitHub Secrets** (si se usa Actions)
5. **Vercel/Netlify Environment Variables**

---

## REGISTRO

| Servicio | Tipo | Dónde vive | Owner | Última rotación | Próxima rotación |
|----------|------|------------|-------|-----------------|------------------|
| Anthropic Claude API | API key | 1Password ZENKAI · `.env` local · Make Connection | NEXUS | _pendiente_ | trimestral |
| Airtable | Personal Access Token | 1Password · Make Connection | ATLAS · NEXUS | _pendiente_ | trimestral |
| Make | API key (read-only) | 1Password | NEXUS | _pendiente_ | trimestral |
| WhatsApp Cloud API | App ID · Phone Number ID · Token | Make Connection · 1Password | HERMES · NEXUS | _pendiente_ | mensual (token expira) |
| Meta Business | App credentials | 1Password | ARES · HERMES | _pendiente_ | semestral |
| Cal.com | API key | 1Password · Make Connection | HERMES · ATLAS | _pendiente_ | trimestral |
| Stripe | Secret key (live) · Webhook secret | 1Password · Make Connection | ORACLE | _pendiente_ | semestral |
| Wompi | Public + Private key · Events secret | 1Password · Make Connection | ORACLE | _pendiente_ | semestral |
| Klaviyo | API key | 1Password · Make Connection | ARES | _pendiente_ | trimestral |
| Docuseal | API key + webhook secret | 1Password · Make Connection | LEX | _pendiente_ | trimestral |
| Notion | Internal Integration Secret | 1Password | ATLAS · ZEUS | _pendiente_ | semestral |
| Google Drive / Workspace | OAuth Service Account JSON | 1Password (JSON cifrado) | ATLAS | _pendiente_ | anual |
| Sentry | DSN + Auth Token | 1Password · `.env` por proyecto | FORGE | _pendiente_ | trimestral |
| BetterStack | API Token | 1Password | NEXUS-MONITOR | _pendiente_ | trimestral |
| Resend / Postmark | API key | 1Password · Make Connection | ATLAS · ECHO | _pendiente_ | trimestral |
| GitHub | Personal Access Token (ZENKAI) | 1Password | FORGE | _pendiente_ | trimestral |
| Vercel | API Token | 1Password | FORGE | _pendiente_ | trimestral |

---

## CHECKLIST AL CREAR UNA CUENTA NUEVA

Cada vez que ZENKAI abre una cuenta nueva en un servicio:

- [ ] Email corporativo (NO personal): `contacto@zenkai.[dominio]` o equivalente
- [ ] 2FA / MFA activado (Authy o Google Authenticator)
- [ ] Recovery codes guardados en 1Password
- [ ] Plan correcto contratado (no free si es para producción)
- [ ] Webhook URLs registradas (si aplica)
- [ ] API key generada con scope mínimo necesario (no admin si no hace falta)
- [ ] API key guardada en 1Password
- [ ] API key cargada en Make Connection (si aplica)
- [ ] API key probada con curl o Make test
- [ ] Esta tabla actualizada con nueva fila

---

## CHECKLIST DE ROTACIÓN

Cada API key se rota según frecuencia indicada arriba:

- [ ] Generar nueva key en el servicio
- [ ] Actualizar 1Password
- [ ] Actualizar Make Connection
- [ ] Actualizar `.env` local si aplica
- [ ] Actualizar Vercel/Netlify env vars si aplica
- [ ] Test que todo sigue funcionando
- [ ] Revocar key vieja (no antes de validar la nueva)
- [ ] Actualizar fecha en esta tabla

---

## EN CASO DE BRECHA / KEY FILTRADA

**Protocolo de emergencia:**

1. **Revocar la key inmediatamente** en el servicio
2. **Generar key nueva**
3. **Actualizar todos los lugares** donde se usaba (Make · Vercel · `.env`)
4. **Auditar logs** del servicio: ¿se usó la key filtrada? ¿desde dónde?
5. **Notificar a humano de ZENKAI** (escalada a ZEUS)
6. **Si datos sensibles afectados:** notificar al cliente · LEX evalúa obligación legal de notificación
7. **Postmortem en Notion** · qué pasó · cómo se previene

---

## COMANDOS ÚTILES (PowerShell · Windows)

```powershell
# Setear variable de entorno persistente para el usuario
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-...", "User")

# Ver una variable de entorno
$env:ANTHROPIC_API_KEY

# Listar todas
Get-ChildItem env:

# Borrar variable
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $null, "User")
```

```bash
# Equivalente en bash (en proyectos · NO global)
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
# .env debe estar en .gitignore SIEMPRE
```

---

## DOMINIOS CORPORATIVOS DE ZENKAI

> Pendiente de definir / verificar:

- [ ] Dominio principal: `zenkai.co` · `zenkai.io` · otro
- [ ] Email corporativo: `contacto@[dominio]`
- [ ] DNS administrado en: Cloudflare (recomendado) · Namecheap · GoDaddy

Una vez definido, todas las cuentas de servicios usan emails de este dominio. Esto:
- Centraliza recuperación de cuentas
- Permite usar Google Workspace o equivalente
- Da imagen profesional al cliente
