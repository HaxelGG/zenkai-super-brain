---
type: dashboard
tags: [home, dataview, navegacion]
---

# 00 · DASHBOARD · ZENKAI Super Cerebro

> Vista en vivo del vault — todas las queries son Dataview.
> Requiere el plugin **Dataview** instalado y activo en Obsidian (Settings → Community plugins).

---

## 🤖 12 Agentes Master

```dataview
LIST
FROM "agentes"
WHERE file.name != "README"
SORT file.name ASC
```

---

## 🏭 11 Sectores

```dataview
LIST
FROM "sectores"
WHERE file.name != "README"
SORT file.name ASC
```

---

## 🔁 Workflows

```dataview
TABLE
  default(name, file.name) AS "Workflow",
  default(tiempo_objetivo, "—") AS "Tiempo",
  default(categoria, "—") AS "Categoría",
  default(agentes_principales, "—") AS "Agentes"
FROM "workflows"
WHERE file.name != "README"
SORT file.name ASC
```

---

## 🧪 Skills nativos

```dataview
TABLE
  default(name, file.name) AS "Skill",
  default(tipo, "—") AS "Tipo",
  default(agentes_que_usan, "—") AS "Agentes que usan"
FROM "skills"
WHERE name
SORT file.name ASC
```

---

## 🔌 Conexiones (estado real)

```dataview
TABLE
  default(name, file.name) AS "Conexión",
  default(estado_conexion, "(sin valor)") AS "Estado",
  default(criticidad, "—") AS "Criticidad",
  default(fase_conexion, "—") AS "Fase",
  default(servicios_dependientes, "—") AS "Depende de"
FROM "conexiones"
WHERE file.name != "README" AND file.name != "mapa-sistema" AND file.name != "credenciales"
SORT estado_conexion DESC, file.name ASC
```

---

## ✏️ Cambios recientes (últimos 7 días)

```dataview
LIST file.mtime
FROM ""
WHERE file.mtime >= date(today) - dur(7 days)
  AND !contains(file.folder, "node_modules")
  AND !contains(file.folder, "web")
  AND !contains(file.folder, "panel")
  AND !contains(file.folder, "api")
  AND !contains(file.folder, "scripts")
SORT file.mtime DESC
LIMIT 20
```

---

## 📋 Templates

```dataview
LIST
FROM "templates"
WHERE file.name != "README"
SORT file.name ASC
```

---

## 📂 Clientes activos

```dataview
LIST
FROM "clientes"
WHERE file.name = "briefing" OR file.name = "proyecto"
SORT file.path ASC
```

---

## 🛠 SOPs

```dataview
LIST
FROM "sops"
WHERE file.name != "README"
SORT file.name ASC
```

---

*Tip: si una query queda en blanco, verificá que el plugin Dataview esté activo y que el frontmatter del archivo tenga los campos esperados.*
