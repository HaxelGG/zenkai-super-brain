# /clientes
## Estructura por cliente · plantilla en `_template-cliente/`

Cada cliente activo de ZENKAI tiene su propia carpeta dentro de `/clientes/`. La carpeta se crea **copiando `_template-cliente/`** al inicio del onboarding (paso 2 de `workflow-onboarding.md`).

## Convención de nombres

```
clientes/
├── _template-cliente/          ← plantilla maestra (NO modificar directamente)
├── 2026-05-clinica-dental-medellin/
├── 2026-05-restaurante-madrid/
├── 2026-06-ecommerce-moda-bogota/
└── ...
```

**Formato:** `YYYY-MM-slug-corto-descriptivo`

- `YYYY-MM` = mes y año en que firmaron contrato
- `slug-corto-descriptivo` = nombre breve sin tildes ni espacios

Esta convención hace que el ordenamiento alfabético sea cronológico.

## Crear nuevo cliente

```powershell
# En PowerShell (Windows)
Copy-Item -Recurse "clientes\_template-cliente" "clientes\YYYY-MM-slug"
```

```bash
# En bash (mac/linux)
cp -r clientes/_template-cliente clientes/YYYY-MM-slug
```

Automáticamente se llenan los archivos con los datos del cliente (ATLAS-ONBOARD lo hace vía Make en el workflow).

## Archivos de la plantilla

- `briefing.md` — respuestas del brief detallado
- `propuesta.md` — copia de la propuesta firmada
- `contrato.md` — link al PDF firmado y resumen
- `proyecto.md` — plan v1 vivo
- `reportes/` — reportes semanales y mensuales
- `assets/` — logos, fotos, brand del cliente
- `automatizaciones/` — documentación de cada flow Make

## Cuando termina un cliente

Mover a `/clientes/_archivados/YYYY-MM-slug/` después de:
1. Último reporte entregado
2. Datos del cliente devueltos o eliminados (según contrato cláusula 8)
3. Caso de estudio extraído (si autoriza)
