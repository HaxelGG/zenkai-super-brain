# Spec — Usuarios y roles del panel

**Fecha:** 2026-05-27
**Terminal:** Frontend/Atelier (`frontend-atelier`)
**Estado:** Diseño aprobado — pendiente de revisión del usuario.

## 1. Resumen

Pantalla de administración (owner-only) para **invitar, gestionar y revocar** usuarios del
panel y asignarles **rol** y **acceso por empresa**. Se apoya en la infraestructura de auth/RLS
que ya existe; **no requiere migración**.

Infra existente (verificada):
- `profiles(id, full_name, role: user_role, created_at)` — `id` = `auth.users.id`.
- `user_role` enum: `owner · admin · staff` (default `staff`).
- `user_companies(user_id, company_id)` — acceso por empresa.
- `is_owner()` → `profiles.role = 'owner'`.
- `accessible_company_ids()` → owner ve todas las empresas; el resto, las de `user_companies`.
- Trigger `handle_new_user()` → crea `profiles` (full_name desde metadata; role default `staff`) al crear el usuario en `auth`.

## 2. Ubicación y acceso

- Ruta **`/ajustes/usuarios`** (administración; **no** va en el sidebar editorial). Enlace desde `/ajustes`.
- **Owner-only**: la página verifica `is_owner()` de la sesión; si no, `redirect("/ajustes")`.

## 3. Modelo de roles (sin migración)

- **owner**: acceso total; único rol que gestiona usuarios.
- **admin / staff**: acceso por empresa (vía `user_companies`). En v1 el rol es **informativo**
  (no cambia el RLS de los módulos, que sigue: owner = todo, resto = sus empresas). Queda listo
  para permisos finos en el futuro.

## 4. Cliente admin (service-role, server-only)

- `src/lib/supabase/admin.ts` → `createAdminClient()` con `SUPABASE_SERVICE_ROLE_KEY` y
  `NEXT_PUBLIC_SUPABASE_URL`, `auth: { persistSession: false, autoRefreshToken: false }`.
- **server-only** (`import "server-only"` al inicio). Nunca se importa desde componentes cliente.
- Toda server action que lo use **verifica primero** que la sesión actual es owner:
  `requireOwner()` → lee `profiles.role` del `auth.uid()` con el cliente de servidor normal;
  si no es owner, devuelve `{ error: "No autorizado." }` y no toca el admin client.

## 5. Server actions (`src/lib/usuarios/actions.ts`, "use server")

Todas empiezan por `requireOwner()`.
- `inviteUser(formData)`: lee email, full_name, role (`admin|staff`), companies[]. Llama
  `admin.auth.admin.inviteUserByEmail(email, { data: { full_name }, redirectTo: <APP_URL>/login })`.
  Con el `user.id` devuelto: `update profiles set role` + `insert user_companies` (filas por empresa).
- `updateUser(userId, formData)`: cambia `profiles.role` y reemplaza filas de `user_companies`
  (borra las del usuario e inserta las nuevas).
- `revokeUser(userId)`: `admin.auth.admin.deleteUser(userId)` (cascada borra profile/user_companies por FK).
  **Guarda**: no permite borrar ni degradar al último `owner`.
- `resendInvite(email)`: re-invita por email.

## 6. Lecturas (`src/lib/usuarios/queries.ts`)

- `listPanelUsers()` (server, owner-only): `admin.auth.admin.listUsers()` (email, id, estado de
  confirmación, last_sign_in) **cruzado** con `profiles` (role, full_name) y `user_companies` (empresas).
  Devuelve `{ id, email, fullName, role, confirmed, companyIds }[]`.

## 7. UI

- **`/ajustes/usuarios/page.tsx`** (server, owner-only): cabecera editorial + tabla/lista de usuarios
  (nombre, email, rol con `StatusPill`, empresas, estado pendiente/activo) + formulario **Invitar**.
- Componentes (`src/components/usuarios/`):
  - `invite-form.tsx` (client): email, nombre, rol (select admin/staff), empresas (checkboxes), validación inline.
  - `user-row-actions.tsx` (client): editar rol/empresas (drawer o inline), reenviar invitación, revocar (con confirmación, reusa patrón `<DeleteButton>`).
- Enlace desde `/ajustes`: nueva sección "Equipo del panel" → botón a `/ajustes/usuarios` (solo visible para owner).

## 8. Lógica pura testeable (`src/lib/usuarios/policy.ts` + test)

- `canRemoveOwner(users, targetId)`: false si el objetivo es el único owner.
- `roleLabel(role)`, `roleTone(role)` para la UI.
- Tests: no se puede borrar/degradar al último owner; etiquetas.

## 9. Seguridad

- `SUPABASE_SERVICE_ROLE_KEY` solo en `admin.ts` (server-only); ausente del bundle cliente.
- Cada action: `requireOwner()` antes de cualquier operación admin.
- Página redirige a no-owners.
- Protección "último owner" en revoke/downgrade.

## 10. Sin migración / coordinación

- profiles/user_companies/user_role ya existen. Escrituras de gestión vía **admin client**
  (bypassa RLS de forma controlada y owner-guarded) → **no altero políticas RLS compartidas**;
  huella nula sobre la otra terminal. Se le avisa de que existe la pantalla.

## 11. Dependencias (usuario)

- Añadir `SUPABASE_SERVICE_ROLE_KEY` en Vercel (server-only). **Bloqueante** para invitar/listar.
- Configurar envío de email en Supabase Auth (remitente por defecto con límites bajos; SMTP propio
  recomendado para producción). **Bloqueante** para que llegue la invitación.

## 12. Fuera de alcance v1

- Permisos finos por módulo (el rol admin/staff es informativo en v1).
- Auto-registro público (no hay signup abierto; es herramienta interna).
- SMTP propio (configuración del usuario en Supabase, no código).

## 13. Testing

- `policy.test.ts`: último owner, etiquetas de rol.
- Build + verificación manual del flujo de invitación cuando estén la key y el email.
