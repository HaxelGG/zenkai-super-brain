# Frontend / Sistema de marca — Panel de Control Grupo Juana Sánchez

**Objetivo:** llevar el panel de "shadcn genérico neutro" a la **identidad editorial del Grupo**,
reutilizando los tokens EXACTOS de la landing (`juana-sanchez-landing/src/app/globals.css`).
**Ejecución:** en la ventana de integración (cuando aterrice Cotizaciones y yo tenga la carpeta),
tematizando los 3+ módulos de una vez y desplegando todo junto. Este doc vive fuera del repo del panel.

---

## 1. Tokens de color (portar desde la landing, oklch)

```css
/* Cremas / superficies */
--color-cream:      oklch(0.945 0.018 88);   /* fondo app */
--color-cream-warm: oklch(0.910 0.030 85);   /* secondary / muted */
--color-paper:      oklch(0.974 0.015 87);   /* card / popover */
--color-bone:       oklch(0.962 0.018 88);
/* Tinta (texto) */
--color-ink:        oklch(0.225 0.012 70);   /* foreground */
--color-ink-soft:   oklch(0.450 0.015 75);   /* muted-foreground */
--color-ink-faint:  oklch(0.640 0.018 78);
/* Marca */
--color-mauve:      oklch(0.700 0.038 12);   /* accent (Juana Sánchez) */
--color-mauve-deep: oklch(0.610 0.045 10);   /* primary / ring */
--color-gold:       oklch(0.728 0.107 78);   /* acento Lolikas */
--color-tabaco:     oklch(0.235 0.030 66);   /* acento Printellar (#281b0e) */
--color-mint:       oklch(0.808 0.038 175);  /* éxito / activo */
--color-rose-dust:  oklch(0.805 0.045 18);
--destructive:      oklch(0.577 0.245 27.325);
```

### Mapeo shadcn (en `src/app/globals.css` del panel, bloque `:root`)
Igual que la landing:
```
--background: cream · --foreground: ink · --card/popover: paper
--primary: mauve-deep · --primary-foreground: cream
--secondary/--muted: cream-warm · --muted-foreground: ink-soft
--accent: mauve · --ring: mauve-deep
--border/--input: oklch(0.225 0.012 70 / 0.14)
--destructive: oklch(0.577 0.245 27.325)
```

### Acento por empresa (selector de empresa + badges)
- **Juana Sánchez** → mauve
- **Lolikas** → gold
- **Printellar** → tabaco
Exponer como `data-company` en el shell para teñir acentos contextualmente.

## 2. Tipografía (next/font/google, reemplaza Geist)

```ts
// layout.tsx
import { Italiana, Cormorant, Jost, JetBrains_Mono } from "next/font/google";
// --font-display: Italiana (títulos de página, login)
// --font-serif:   Cormorant (subtítulos editoriales, números grandes de KPIs)
// --font-sans:    Jost (UI, tablas, formularios)  ← font por defecto del body
// --font-mono:    JetBrains Mono (SKU, IDs, importes monoespaciados)
```
Subset `latin`, pesos mínimos usados (la auditoría pedía aligerar fuentes — limitar a 2-3 pesos por familia).

## 3. Cambios por pantalla

1. **`globals.css` + `layout.tsx`**: tokens + fuentes. (Cambio de mayor impacto — todo shadcn hereda.)
2. **Login** (`(auth)/login/page.tsx`): tratamiento editorial — fondo crema, título en Italiana,
   tarjeta `paper` con borde sutil, quizá imagen/lateral de marca. Hoy es una tarjeta sosa.
3. **App shell** (`(app)/layout.tsx` + `app-shell/`):
   - Sidebar: logotipo "Grupo Juana Sánchez" en Italiana, secciones, ítems con estado activo en mauve.
   - Topbar con migas/título de sección + selector de empresa rediseñado (con punto de color por firma).
   - **Drawer móvil** real (hoy solo se apila verticalmente). ⚠️ `sidebar.tsx` lo edita también el otro
     terminal (entrada de Cotizaciones) → integrar con cuidado / hacer este cambio tras el merge.
4. **Home `/`** (hoy solo `redirect('/inventario')`): convertir en **Dashboard** real con KPIs de los
   módulos (productos, valor de stock, clientes, leads, cotizaciones…) en tarjetas editoriales.
5. **Tablas** (product-table, customer-table, futura quote-table): densidad, cabeceras en ink-soft,
   hover sutil, números/SKU en mono, badges de estado con la paleta (lead=mauve, activo=mint, etc.).
6. **Toasts**: usar `sonner` (ya instalado, `<Toaster/>` en layout) en vez de `alert()` en los forms
   (product-form, stock-adjust-form, customer-form, interaction-form).
7. **Empty states** con intención (icono + texto + CTA) en vez de "No hay … todavía".
8. **Estados de carga**: `loading.tsx` por ruta con skeletons.

## 4. Accesibilidad (la auditoría marcó contraste)
- Verificar contraste de textos tenues (ink-faint sobre cream ≥ 4.5:1; si no, subir a ink-soft).
- Foco visible (ring mauve) en todos los interactivos. Labels/aria en selects (el otro terminal ya añadió aria-labels en CRM).

## 5. Orden de ejecución (en la ventana de integración)
1. Tokens + fuentes (`globals.css`, `layout.tsx`) → re-verificar build.
2. App shell + login.
3. Dashboard home.
4. Toasts + empty states + skeletons.
5. Pulido de tablas/badges por módulo (incluido Cotizaciones).
6. QA navegador (responsive + contraste) → commit por bloque → merge a `main` → deploy → verificar producción.

## Notas de coordinación
- NO editar la carpeta del panel mientras el otro terminal construye (mismo working tree).
- `sidebar.tsx` y `globals.css`/`layout.tsx` son los archivos de posible colisión → hacerlos en mi
  ventana, después del merge de Cotizaciones.
