/**
 * JARVIS runtime refresh · CRM + Finance + Social sin redeploy.
 */
(function () {
  const badge = document.getElementById("jv-data-badge");
  if (!badge) return;

  function getApiBase() {
    const h = window.location.hostname.toLowerCase();
    if (
      h === "jarvis.zenkai.systems" ||
      h.endsWith(".jarvis.zenkai.systems") ||
      h === "panel.zenkai.systems"
    ) {
      return "";
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

  async function refreshAll() {
    await Promise.all([refreshCrm(), refreshFinance(), refreshSocial()]);
  }

  refreshAll();
  setInterval(refreshCrm, 5 * 60 * 1000);
  setInterval(refreshFinance, 8 * 60 * 1000);
  setInterval(refreshSocial, 10 * 60 * 1000);
})();
