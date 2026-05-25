# SKILLS · Mapa de Integración
## Skills existentes + skills nativos de ZENKAI

---

## 1 · SKILLS EXISTENTES (no duplicar — integrar)

ZENKAI **no reemplaza** ningún skill existente. Los integra al flujo de los 12 agentes.

### Skills del plugin `superpowers` (v5.0.7)

| Skill | Tipo | Cuándo usar | Agentes ZENKAI que lo usan |
|-------|------|-------------|----------------------------|
| `using-superpowers` | bootstrap | Auto-carga al inicio de cada sesión | TODOS |
| `brainstorming` | rigid | Antes de crear features, productos, propuestas | ZEUS · APOLLO · ARES · MUSE |
| `writing-plans` | rigid | Antes de implementaciones N3-N4 (multi-step) | ZEUS · NEXUS · ATLAS · FORGE |
| `executing-plans` | rigid | Ejecutar planes con review checkpoints en sesión separada | ATLAS · FORGE · NEXUS |
| `subagent-driven-development` | rigid | Cuando hay tasks paralelas independientes | NEXUS · FORGE |
| `dispatching-parallel-agents` | rigid | 2+ tareas que no comparten state | TODOS (cuando aplique) |
| `systematic-debugging` | rigid | Cualquier bug · test failure · comportamiento inesperado | NEXUS · FORGE · ECHO |
| `test-driven-development` | rigid | Antes de escribir cualquier feature/bugfix | FORGE · NEXUS |
| `verification-before-completion` | rigid | Antes de declarar algo completo | TODOS |
| `requesting-code-review` | rigid | Antes de mergear código | FORGE · NEXUS |
| `receiving-code-review` | rigid | Cuando recibes feedback de review | FORGE · NEXUS |
| `using-git-worktrees` | rigid | Features aisladas o entornos sucios | FORGE |
| `finishing-a-development-branch` | rigid | Al terminar una rama de desarrollo | FORGE |
| `writing-skills` | rigid | Crear/editar skills | (uso interno ZENKAI) |

### Skills del plugin `frontend-design` (oficial Anthropic)

| Skill | Cuándo usar | Agentes ZENKAI que lo usan |
|-------|-------------|----------------------------|
| `frontend-design` | Cualquier UI · landing · web · component | APOLLO (siempre) · FORGE-FRONTEND |

### Skills del plugin `code-review` (oficial Anthropic)

| Skill | Cuándo usar | Agentes ZENKAI que lo usan |
|-------|-------------|----------------------------|
| `code-review` | PR review de código | FORGE-CODE · NEXUS |

### Skills del plugin `security-guidance`

| Hook / skill | Cuándo aplica | Agentes ZENKAI |
|--------------|---------------|----------------|
| Hook automático de seguridad | Cualquier código que toque datos sensibles | LEX · FORGE |
| `security-review` | Review de seguridad antes de deploy | LEX · FORGE |

---

## 2 · REGLAS DE INTEGRACIÓN

### Regla 1 — Antes de invocar un skill nativo de ZENKAI, verificar si un skill existente lo cubre
Si `frontend-design` ya cubre la creación de UI, no creamos `skill-crear-ui-zenkai.md`. Solo creamos skills nativos cuando llenan **un gap real** de los skills existentes.

### Regla 2 — Los skills rigid no se modifican
TDD, debugging, brainstorming, code-review son skills rigid. ZENKAI los usa **al pie de la letra**. No agregamos pasos. No los "adaptamos al sector". Si necesitamos algo distinto, creamos un skill nuevo, no modificamos los existentes.

### Regla 3 — Skills nativos de ZENKAI son "flexible"
Los `skill-*.md` que creamos en este directorio son **flexibles** — se adaptan al sector y tier del cliente. Su estructura interna es estándar pero el contenido se ajusta.

### Regla 4 — Cada agente Master declara qué skills usa por defecto
Está en cada `agentes/<NOMBRE>.md` en la sección "Skills activados por defecto" o en el Prompt Ejecutable. La lista NO es exhaustiva — un agente puede invocar cualquier skill cuando aplique.

---

## 3 · SKILLS NATIVOS DE ZENKAI (este directorio)

Skills que llenan gaps específicos del flujo ZENKAI:

| Skill | Para qué | Agente principal |
|-------|---------|------------------|
| [`skill-diagnostico-empresa.md`](skill-diagnostico-empresa.md) | Diagnóstico estructurado de empresa para [DIAGNÓSTICO] | ZEUS · ATLAS · HERMES |
| [`skill-calcular-precio.md`](skill-calcular-precio.md) | Aplicar la fórmula de precio correctamente y consistente | ORACLE |
| [`skill-crear-landing.md`](skill-crear-landing.md) | Protocolo APOLLO-LANDING en 5 fases | APOLLO |
| [`skill-cualificar-lead.md`](skill-cualificar-lead.md) | Score 1-10 con rúbrica y handoff a humano | HERMES |
| [`skill-generar-propuesta.md`](skill-generar-propuesta.md) | Estructura de propuesta comercial profesional | LEX · HERMES |
| [`skill-onboarding-cliente.md`](skill-onboarding-cliente.md) | Protocolo de 48h post-firma | ATLAS |
| [`skill-hormozi-roadmap.md`](skill-hormozi-roadmap.md) | Diagnóstico de etapa + roadmap a $100K (basado en Hormozi) | ZEUS · ORACLE · HERMES |

---

## 4 · CUÁNDO CREAR UN SKILL NUEVO

Solo cuando se cumple **TODO**:

1. ✅ Hay un patrón que se repite ≥3 veces
2. ✅ Sin el skill, hay riesgo real de inconsistencia o error
3. ✅ Ningún skill existente lo cubre
4. ✅ El "cómo" del skill es estable (no cambia cada semana)
5. ✅ El beneficio supera el costo de mantener un skill más

Si dudas, **no crear**. Mejor un skill grande bien usado que diez pequeños olvidados.

---

## 5 · TESTING DE SKILLS

Cuando creamos o modificamos un skill nativo de ZENKAI, **siempre** invocamos el skill `writing-skills` para validar:
- Estructura correcta (frontmatter · description · cuándo usar · cómo usar)
- Eval con casos reales del agente que lo usa
- Pressure testing en sesiones distintas
- No conflicto con skills existentes
