/**
 * JARVIS runtime refresh · CRM + Finance + Social sin redeploy.
 */
(function () {
  const badge = document.getElementById("jv-data-badge");
  if (!badge) return;

  function getApiBase() {
    const h = window.location.hostname.toLowerCase();
    if (h === "jarvis.zenkai.systems" || h.endsWith(".jarvis.zenkai.systems")) {
      return "https://panel.zenkai.systems";
    }
    if (h === "localhost" || h === "127.0.0.1") {
      return "https://panel.zenkai.systems";
    }
    return "";
  }

  function apiUrl(path) {
    return `${getApiBase()}${path}`;
  }

  const fetchOpts = getApiBase()
    ? { headers: { Accept: "application/json" }, credentials: "omit" }
    : { headers: { Accept: "application/json" }, credentials: "same-origin" };

  const stageColors = {
    nuevo: "#6B8CAE",
    cualificado: "#1E6FFF",
    propuesta: "#00D4FF",
    negociación: "#FFB800",
    cerrado: "#00FFAA",
  };

  function mapStage(stage) {
    const s = String(stage || "").toLowerCase();
    if (s.includes("cerrado") || s.includes("won")) return "cerrado";
    if (s.includes("negoci")) return "negociación";
    if (s.includes("propuesta")) return "propuesta";
    if (s.includes("cualif") || s.includes("llamada")) return "cualificado";
    return "nuevo";
  }

  function showToast(msg) {
    const toast = document.getElementById("jv-sync-toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("jv-sync-visible");
    setTimeout(() => toast.classList.remove("jv-sync-visible"), 3200);
  }

  function setBadgeLive(leads, clients, extra) {
    badge.dataset.source = "live";
    badge.className =
      "inline-flex items-center gap-2 px-2.5 py-1 rounded border text-[10px] font-mono uppercase tracking-wider border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
    badge.title = "Datos en vivo · Airtable + APIs";
    badge.innerHTML =
      '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>' +
      "LIVE" +
      `<span class="text-white/40 normal-case tracking-normal"> · ${leads}L · ${clients}C${extra ? ` · ${extra}` : ""}</span>`;
  }

  function patchText(selector, value) {
    const empty = !value || value === "—";
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = empty ? "Sin dato" : value;
      el.classList.toggle("jv-metric-empty", empty);
      el.classList.toggle("jv-metric-value", !empty);
    });
  }

  function fmtUsd(n, live) {
    if (!n || n <= 0) return live ? "$0" : "—";
    if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
    return `$${Math.round(n).toLocaleString("en-US")}`;
  }

  function escapeHtml(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function patchPipelineTable(leads) {
    const tbody = document.getElementById("jv-pipeline-leads");
    if (!tbody || !Array.isArray(leads) || leads.length === 0) return;

    tbody.innerHTML = leads
      .slice(0, 12)
      .map((lead) => {
        const stage = mapStage(lead.stage);
        const color = stageColors[stage] || "#00D4FF";
        const score = lead.score > 0 ? lead.score : 5;
        const scoreClass =
          score >= 7
            ? "text-[var(--jv-success)]"
            : score >= 5
              ? "text-[var(--jv-warning)]"
              : "text-[var(--jv-text-dim)]";
        const val = lead.valueUsd ? `$${Number(lead.valueUsd).toLocaleString("en-US")}` : "—";
        const name = escapeHtml(lead.name);
        const company = escapeHtml(lead.company);
        return `<tr>
          <td class="py-2.5"><div class="font-medium text-[var(--jv-text-sm)]">${name}</div><div class="jv-mono text-[var(--jv-text-2xs)] text-[var(--jv-text-dim)]">${company}</div></td>
          <td class="py-2.5 text-[var(--jv-text-muted)] text-[var(--jv-text-sm)]">—</td>
          <td class="py-2.5"><span class="jv-mono text-[var(--jv-text-2xs)] px-1.5 py-0.5 rounded-sm border" style="border-color:${color};color:${color}">${stage}</span></td>
          <td class="py-2.5"><span class="jv-mono font-semibold text-[var(--jv-text-sm)] ${scoreClass}">${score}/10</span></td>
          <td class="py-2.5 jv-mono text-[var(--jv-text-sm)]">${val}</td>
          <td class="py-2.5"><span class="jv-mono text-[var(--jv-text-2xs)] text-[var(--jv-cyan)]">HERMES</span></td>
        </tr>`;
      })
      .join("");
  }

  function patchFunnel(funnel) {
    if (!Array.isArray(funnel)) return;
    funnel.forEach((stage, i) => {
      const countEl = document.querySelector(`[data-jv-funnel-count="${i}"]`);
      const valueEl = document.querySelector(`[data-jv-funnel-value="${i}"]`);
      if (countEl) countEl.textContent = String(stage.count);
      if (valueEl) {
        const v = stage.valueUsd || 0;
        valueEl.textContent = v >= 1000 ? `$${Math.round(v / 1000)}K` : v > 0 ? `$${v}` : "—";
      }
    });
  }

  function formatCompact(n) {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  }

  async function refreshCrm() {
    try {
      badge?.classList.add("jv-badge-loading");
      const res = await fetch(apiUrl("/api/jarvis/crm"), fetchOpts);
      if (!res.ok) return;
      const data = await res.json();
      if (data.source !== "live") return;

      const leads = data.liveRecords?.leads ?? data.leads?.length ?? 0;
      const clients = data.liveRecords?.clients ?? data.clientes?.length ?? 0;
      setBadgeLive(leads, clients);

      patchText('[data-jv-live="leads-count"]', String(leads));
      patchText('[data-jv-live="clients-count"]', String(clients));
      patchText('[data-jv-live="pipeline-leads"]', String(data.leads?.length ?? leads));

      const conversion = leads > 0 && clients > 0 ? `${Math.round((clients / leads) * 100)}%` : "—";
      patchText('[data-jv-live="conversion-rate"]', conversion);
      patchText('[data-jv-live="deals-total"]', String(data.liveRecords?.deals ?? data.dealsTotal ?? "—"));
      patchText('[data-jv-live="capacity-pct"]', clients > 0 ? `${Math.round((clients / 5) * 100)}%` : "—");

      patchPipelineTable(data.leads);
      patchFunnel(data.pipelineFunnel);

      window.dispatchEvent(new CustomEvent("jarvis:crm", { detail: data }));
    } catch {
      /* silent */
    } finally {
      badge?.classList.remove("jv-badge-loading");
    }
  }

  async function refreshFinance() {
    try {
      const res = await fetch(apiUrl("/api/jarvis/finance"), fetchOpts);
      if (!res.ok) return;
      const data = await res.json();
      if (data.source !== "live") return;

      patchText('[data-jv-live="revenue-ytd"]', fmtUsd(data.revenueYtd, true));
      patchText('[data-jv-live="pipeline-weighted"]', fmtUsd(data.pipelineWeighted, true));
      patchText('[data-jv-live="run-rate"]', fmtUsd(data.runRateMonthly, true));
      if (data.dealsCount > 0) {
        patchText('[data-jv-live="deals-total"]', String(data.dealsCount));
      }

      const leads = document.querySelector('[data-jv-live="leads-count"]')?.textContent;
      const clients = document.querySelector('[data-jv-live="clients-count"]')?.textContent;
      if (leads && clients) setBadgeLive(leads, clients, "fin");

      window.dispatchEvent(new CustomEvent("jarvis:finance", { detail: data }));
      showToast(`Finanzas · YTD ${fmtUsd(data.revenueYtd, true)} · Pipeline ${fmtUsd(data.pipelineWeighted, true)}`);
    } catch {
      /* silent */
    }
  }

  async function refreshSocial() {
    if (!document.querySelector("[data-jv-social-root], [data-jv-social], [data-jv-live='roas'], [data-jv-live='ig-engagement']")) return;
    try {
      const res = await fetch(apiUrl("/api/jarvis/social"), fetchOpts);
      if (!res.ok) return;
      const data = await res.json();
      if (data.source !== "live") return;

      if (data.instagram) {
        patchText('[data-jv-social="ig-reach"]', formatCompact(data.instagram.followers ?? data.instagram.reach));
        patchText('[data-jv-social="ig-reach"]', formatCompact(data.instagram.reach7d));
        patchText('[data-jv-social="ig-engagement"]', `${data.instagram.engagementRate}%`);
        patchText('[data-jv-live="ig-engagement"]', `${data.instagram.engagementRate}%`);
      }
      if (data.metaAds) {
        patchText('[data-jv-social="roas"]', `${data.metaAds.roas.toFixed(1)}x`);
        patchText('[data-jv-social="spend"]', `$${Math.round(data.metaAds.spend7d)}`);
        patchText('[data-jv-live="roas"]', `${data.metaAds.roas.toFixed(1)}x`);
      }

      window.dispatchEvent(new CustomEvent("jarvis:social", { detail: data }));
      showToast("Social sincronizado · Instagram + Meta Ads");
    } catch {
      /* silent */
    }
  }

  function setBrainBadge(state, label, title) {
    const brain = document.getElementById("jv-brain-badge");
    if (!brain) return;
    brain.dataset.state = state;
    brain.textContent = label;
    brain.title = title;
  }

  async function refreshBrainStatus() {
    try {
      const res = await fetch(apiUrl("/api/jarvis/status"), fetchOpts);
      if (!res.ok) {
        setBrainBadge("offline", "BRAIN", "Cerebro no disponible · HTTP " + res.status);
        window.__jvBrainOnline = false;
        return;
      }
      const data = await res.json();
      window.__jvBrainOnline = !!data.ok;
      if (data.ok) {
        const provider = (data.capabilities?.brainProvider || "llm").toUpperCase();
        setBrainBadge("online", provider, data.message || "Cerebro activo");
      } else {
        setBrainBadge(
          "offline",
          "BRAIN",
          data.message || "Configurá DEEPSEEK_API_KEY o ANTHROPIC_API_KEY en Vercel",
        );
        showToast(data.message || "Cerebro JARVIS offline");
      }
    } catch {
      setBrainBadge("offline", "BRAIN", "No se pudo consultar /api/jarvis/status");
      window.__jvBrainOnline = false;
    }
  }

  async function refreshAgencyStatus() {
    try {
      const res = await fetch(apiUrl("/api/agency/status"), fetchOpts);
      if (!res.ok) return;
      const data = await res.json();
      window.__jvAgencyOnline = !!data.ok;
      const badge = document.getElementById("jv-agency-badge");
      if (!badge) return;
      const configured = (data.providers || []).filter((p) => p.configured).length;
      const total = (data.providers || []).length;
      badge.dataset.state = data.ok ? "online" : "offline";
      badge.textContent = "AGENCY";
      badge.title = data.message || `Proveedores ${configured}/${total}`;
    } catch {
      /* silent */
    }
  }

  function escG(s) {
    const d = document.createElement("div");
    d.textContent = String(s == null ? "" : s);
    return d.innerHTML;
  }

  function goalSemaphore(status) {
    const color =
      status === "green" ? "var(--jv-success)" : status === "red" ? "var(--jv-danger)" : "var(--jv-warning)";
    const text = status === "green" ? "Operativo" : status === "red" ? "Crítico" : "Atención";
    return (
      '<span class="inline-flex items-center gap-2 rounded-sm border font-medium jv-mono px-2 py-0.5 text-[10px]" ' +
      `style="border-color: ${color}; color: ${color}; background: color-mix(in srgb, ${color} 10%, transparent)">` +
      `<span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background: ${color}; box-shadow: 0 0 6px ${color}"></span>${text}</span>`
    );
  }

  function goalValueText(current, target, unit) {
    const c = Number(current) || 0;
    const t = Number(target) || 0;
    const u = String(unit || "").toLowerCase();
    if (u === "usd") return `$${c.toLocaleString("en-US")} / $${t.toLocaleString("en-US")}`;
    if (u === "percent") return `${c}% / ${t}%`;
    return `${c} / ${t}`;
  }

  function goalCard(goal, i) {
    const target = Number(goal.target) || 0;
    const pct = target > 0 ? Math.min(100, Math.round((Number(goal.current) / target) * 100)) : 0;
    return (
      `<div class="hud-panel p-4" data-jv-animate="${i + 3}"><div class="hud-panel-inner">` +
      '<div class="flex items-start justify-between gap-2 mb-3">' +
      `<h3 class="font-semibold text-sm leading-snug">${escG(goal.title)}</h3>${goalSemaphore(goal.status)}</div>` +
      `<p class="jv-mono text-[11px] text-[var(--jv-text-muted)] mb-3">${goalValueText(goal.current, goal.target, goal.unit)}</p>` +
      `<div class="jv-progress-bar h-2"><div class="jv-progress-fill" style="width: ${pct}%"></div></div>` +
      `<p class="jv-mono text-[10px] text-[var(--jv-text-dim)] mt-2">${escG(goal.caption || "")}</p>` +
      "</div></div>"
    );
  }

  async function refreshGoals() {
    const grid = document.getElementById("jv-goals-grid");
    if (!grid) return;
    try {
      const res = await fetch(apiUrl("/api/agency/tasks"), fetchOpts);
      if (!res.ok) return;
      const data = await res.json();
      const goals = Array.isArray(data.goals) ? data.goals : [];
      if (!goals.length) return;
      grid.innerHTML = goals.map((g, i) => goalCard(g, i)).join("");
    } catch {
      /* silent */
    }
  }

  function agentColor(id) {
    let h = 0;
    const s = String(id || "");
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return `hsl(${h}, 65%, 55%)`;
  }

  function avatarHtml(agent) {
    const initials = escG(String(agent || "?").slice(0, 2));
    return (
      '<div class="rounded-full flex items-center justify-center font-semibold text-white shrink-0 jv-display w-6 h-6 text-[9px]" ' +
      `style="background: ${agentColor(agent)}" title="${escG(agent)}">${initials}</div>`
    );
  }

  function priorityDotClass(p) {
    if (p === "high") return "bg-[var(--jv-danger)] shadow-[0_0_6px_var(--jv-danger)]";
    if (p === "low") return "bg-[var(--jv-text-dim)]";
    return "bg-[var(--jv-warning)]";
  }

  function taskCardHtml(task, compact) {
    const pad = compact ? "p-2.5" : "p-3";
    const titleSize = compact ? "text-[13px]" : "text-sm";
    let inner =
      '<div class="flex items-start gap-2.5">' +
      `<span class="w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${priorityDotClass(task.priority)}"></span>` +
      '<div class="flex-1 min-w-0"><div class="flex items-start justify-between gap-2">' +
      `<p class="font-medium text-[var(--jv-text)] leading-snug ${titleSize}">${escG(task.title)}</p>` +
      avatarHtml(task.agent) +
      "</div>";
    if (!compact) {
      inner +=
        '<div class="mt-1.5 flex flex-wrap items-center gap-2 jv-mono text-[10px] text-[var(--jv-text-dim)]">' +
        `<span class="px-1.5 py-0.5 border border-[var(--jv-border)] rounded-sm text-[var(--jv-cyan)]">${escG(task.status)}</span></div>`;
    }
    inner += "</div></div>";
    return `<div class="jv-task ${pad}">${inner}</div>`;
  }

  function kanbanColHtml(status, label, tasks) {
    const filtered = tasks.filter((t) => t.status === status);
    const body =
      filtered.length === 0
        ? '<div class="jv-mono text-[10px] text-[var(--jv-text-dim)] text-center py-6 border border-dashed border-[var(--jv-border)] rounded-sm">Sin tareas</div>'
        : filtered.map((t) => taskCardHtml(t, true)).join("");
    return (
      '<div class="hud-panel p-3 flex-1 min-w-[180px]"><div class="hud-panel-inner">' +
      '<div class="jarvis-kanban-col flex flex-col min-h-[200px]">' +
      `<div class="flex items-center justify-between mb-3 px-1"><h3 class="jv-label text-[10px]">${escG(label)}</h3>` +
      `<span class="jv-mono text-[10px] text-[var(--jv-cyan)] px-2 py-0.5 border border-[var(--jv-border)] rounded-sm">${filtered.length}</span></div>` +
      `<div class="space-y-2 flex-1">${body}</div></div></div></div>`
    );
  }

  async function refreshTasks() {
    const kanban = document.getElementById("jv-tasks-kanban");
    if (!kanban) return;
    try {
      const res = await fetch(apiUrl("/api/agency/tasks"), fetchOpts);
      if (!res.ok) return;
      const data = await res.json();
      const tasks = data.tasks && Array.isArray(data.tasks.tasks) ? data.tasks.tasks : [];
      const cols = [
        ["backlog", "Backlog"],
        ["pending", "Pendiente"],
        ["working", "Working"],
        ["review", "Review"],
        ["done", "Done"],
      ];
      kanban.innerHTML = cols.map((c) => kanbanColHtml(c[0], c[1], tasks)).join("");

      const stats = document.getElementById("jv-tasks-stats");
      if (stats) {
        const active = tasks.filter((t) => t.status !== "done").length;
        const working = tasks.filter((t) => t.status === "working").length;
        const done = tasks.filter((t) => t.status === "done").length;
        stats.textContent = `${active} tareas activas · ${working} en working · ${done} completadas`;
      }

      const order = { high: 0, medium: 1, low: 2 };
      const list = document.getElementById("jv-tasks-list");
      if (list) {
        const lt = tasks
          .filter((t) => t.status !== "done")
          .sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));
        list.innerHTML = lt.length
          ? lt.map((t) => taskCardHtml(t, false)).join("")
          : '<div class="jv-mono text-[10px] text-[var(--jv-text-dim)]">Sin tareas activas</div>';
      }

      const load = document.getElementById("jv-tasks-agentload");
      if (load) {
        const counts = {};
        tasks
          .filter((t) => t.status !== "done")
          .forEach((t) => {
            counts[t.agent] = (counts[t.agent] || 0) + 1;
          });
        const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        load.innerHTML = entries.length
          ? entries
              .map(
                (e) =>
                  '<div class="flex items-center gap-2 px-3 py-2 rounded-sm border border-[var(--jv-border)] text-[13px]">' +
                  avatarHtml(e[0]) +
                  `<span class="font-medium text-[var(--jv-text)]">${escG(e[0])}</span>` +
                  `<span class="jv-mono text-[10px] text-[var(--jv-cyan)] ml-auto px-2 py-0.5 border border-[var(--jv-border)] rounded-sm">${e[1]}</span></div>`,
              )
              .join("")
          : '<div class="jv-mono text-[10px] text-[var(--jv-text-dim)]">Sin carga asignada</div>';
      }
    } catch {
      /* silent */
    }
  }

  async function refreshAll() {
    await Promise.all([
      refreshBrainStatus(),
      refreshAgencyStatus(),
      refreshGoals(),
      refreshTasks(),
      refreshCrm(),
      refreshFinance(),
      refreshSocial(),
    ]);
  }

  refreshAll();
  setInterval(refreshCrm, 5 * 60 * 1000);
  setInterval(refreshFinance, 8 * 60 * 1000);
  setInterval(refreshSocial, 10 * 60 * 1000);
  setInterval(refreshAgencyStatus, 12 * 60 * 1000);
  setInterval(refreshGoals, 9 * 60 * 1000);
  setInterval(refreshTasks, 7 * 60 * 1000);
})();
