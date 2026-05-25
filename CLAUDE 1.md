# CLAUDE.md — Manual de operación de MIDAS

> Este archivo se auto-carga en cada sesión de Claude Code abierta en este repo.
> Es la fuente de orientación para cualquier socio o agente. Mantenerlo corto y al día.

## Qué es MIDAS
Fondo cuantitativo automatizado (Zenithstone Holding). Principio rector: **drawdown-first**
(sobrevivir antes que rentar). **La IA propone; el Veto dispone.**
Estado honesto: infraestructura **excelente**; **edge probado y track record = pendientes**.

## Principios inviolables (no romper sin un DEC)
1. **Veto absoluto** — el Risk Manager (`core/risk`) no se afloja. Reglas de Magister y DD-gates
   solo RESTRINGEN (veto / size_down / sizing_mult ≤ 1).
2. **Stack lockdown (DEC-001)** — NO añadir dependencias fuera de `pyproject.toml` sin un DEC nuevo.
3. **Audit chain = fuente de verdad** — `infra/audit/chain.ndjson` (texto, en git). El `.db` es vista
   local reconstruible (`scripts/init_db.py`). NUNCA editar la cadena a mano.
4. **Obsidian asíncrono** — el `vault/` nunca en el hot path.
5. **CPCV → DSR → PBO** antes de promover cualquier sleeve. No confiar en un backtest sin esto.
6. **Atribución:** commits como `Sad1mus <286475977+Sad1mus@users.noreply.github.com>`, **sin** trailer
   Co-Authored-By (`includeCoAuthoredBy: false`). GitHub atribuye por EMAIL, no por nombre.

## Mapa del repo
`core/` (riesgo, modelos, config, knowledge/retrieval) · `agents/` (advisory: magister) ·
`sleeves/` (estrategias) · `research/` (cpcv, deflated_sharpe, pbo, cost_model) · `data/` (loaders) ·
`infra/` (audit chain, sqlite, obsidian_sync) · `scripts/` (init_db, decision_log, verify_chain) ·
`vault/` (Obsidian: decisiones, ontología, regímenes) · `tests/`.

## Cómo retomar el trabajo (ritual diario)
```bash
cd ~/midas && git pull
source .venv/bin/activate           # o: python -m venv .venv && pip install -e ".[dev]"
python scripts/init_db.py           # reconstruye el .db desde el chain
pytest -q                           # confirmar verde antes de empezar
```
Para continuar una sesión previa: `claude --continue` (retoma la última) o `claude --resume` (elegir).

## Megagoals (cola autónoma)
El backlog del round vive en `.claude/goal-queue.md`. Para correrlo, lanzar
`claude --dangerously-skip-permissions` y pegar un meta-goal que procese la cola tarea por tarea
(commit+push por tarea, marcar [blocked] si algo se traba).

## Trabajo en paralelo (sin pisarse)
- **Dos sesiones en la misma carpeta SE PISAN.** Para paralelo: un **git worktree** por frente.
  ```bash
  git worktree add ../midas-<frente> -b <frente>-stream
  ```
- Regla: **una sola sesión es dueña de `main`**; las demás trabajan en ramas y mergean después.
- NUNCA reescribir historia / force-push mientras otra sesión esté commiteando.

## Roadmap de rounds
- ✅ R1 — Mente portable + Magister
- ✅ R2 — Recuperación (grafo+FTS5) + Variable 𝒳 (TDA) + CPCV/DSR/PBO
- ✅ R3 — DD-gates + cost model + sleeve e2e + validación (sleeve v1 → NO-GO, PBO 0.95)
- ✅ R4 — Cockpit (projector read-only SQLite→Obsidian + Dataview) para ver MIDAS
- ✅ R5 — Datos reales (yfinance: GLD→GC, QQQ→NQ). Veredicto honesto: GLD GO, QQQ NO-GO; PnL negativo (sin edge aún)
- ✅ R6 — Infra BMA Bayesiano (`agents/signal/bma.py` + tabla `bma_weights`) + gate de hipótesis humana. Sleeves oro/NASDAQ [BLOCKED]: faltó la tesis humana vía `/magister` → 0 sleeves nuevos, 0 GO, **edge aún pendiente** (ver [[DEC-014]]). El agente NO inventó la hipótesis de entrada (anti-overfitting estructural)
- ⏳ R7 — Harness paper trading audit-grade (Track B) + Track A (TopStep)

## Punteros
- Decisiones: `python scripts/decision_log.py list`
- Integridad: `python scripts/verify_chain.py`
- Cockpit (ver MIDAS en Obsidian): `python scripts/cockpit.py` → `vault/00_System/cockpit/MIDAS — Cockpit.md`
- Datos reales (poblar el chain): `python scripts/run_real_data.py` (GLD/QQQ vía yfinance, offline-first)
- Inyectar conocimiento/reglas: skill `/magister` o `python -m agents.advisory.magister`
- BMA (combinar señales de sleeves, R6): `agents/signal/bma.py` → tabla `bma_weights` (solo se invoca sobre sleeves GO; no decide tamaño, pasa por el Veto)
- Guía de onboarding para socios: `docs/ONBOARDING.md`
