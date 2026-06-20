/**
 * JARVIS runtime refresh · CRM + Social sin redeploy.
 * Carga en JarvisLayout · endpoints /api/jarvis/*
 */
(function () {
  const badge = document.getElementById("jv-data-badge");
  if (!badge) return;

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

  function setBadgeLive(leads, clients) {
    badge.dataset.source = "live";
    badge.className =
      "inline-flex items-center gap-2 px-2.5 py-1 rounded border text-[10px] font-mono uppercase tracking-wider border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
    badge.title = "Datos CRM desde Airtable · refrescado en vivo";
    badge.innerHTML =
      '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>' +
      "LIVE" +
      `<span class="text-white/40 normal-case tracking-normal"> · ${leads}L · ${clients}C</span>`;
  }

  function patchText(selector, value) {
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value;
    });
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
        return `<tr>
          <td class="py-3"><div class="font-medium">${lead.name}</div><div class="jv-mono text-[10px] text-[var(--jv-text-dim)]">${lead.company}</div></td>
          <td class="py-3 text-[var(--jv-text-muted)]">—</td>
          <td class="py-3"><span class="jv-mono text-[10px] px-2 py-0.5 rounded-sm border" style="border-color:${color};color:${color}">${stage}</span></td>
          <td class="py-3"><span class="jv-mono font-bold ${scoreClass}">${score}/10</span></td>
          <td class="py-3 jv-mono">$0</td>
          <td class="py-3"><span class="jv-mono text-[10px] text-[var(--jv-cyan)]">HERMES</span></td>
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
      if (valueEl) valueEl.textContent = `$${Math.round(stage.valueUsd / 1000)}K`;
    });
  }

  function formatCompact(n) {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  }

  async function refreshCrm() {
    try {
      const res = await fetch("/api/jarvis/crm", {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.source !== "live") return;

      const leads = data.liveRecords?.leads ?? data.leads?.length ?? 0;
      const clients = data.liveRecords?.clients ?? data.clientes?.length ?? 0;
      setBadgeLive(leads, clients);

      patchText('[data-jv-live="leads-count"]', String(leads));
      patchText('[data-jv-live="clients-count"]', String(clients));
      patchText('[data-jv-live="pipeline-leads"]', String(data.leads?.length ?? leads));

      patchPipelineTable(data.leads);
      patchFunnel(data.pipelineFunnel);

      window.dispatchEvent(new CustomEvent("jarvis:crm", { detail: data }));
    } catch {
      /* silent · static mock remains */
    }
  }

  async function refreshSocial() {
    if (!document.querySelector("[data-jv-social-root]")) return;
    try {
      const res = await fetch("/api/jarvis/social", {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.source !== "live") return;

      if (data.instagram) {
        patchText('[data-jv-social="ig-followers"]', formatCompact(data.instagram.followers));
        patchText('[data-jv-social="ig-reach"]', formatCompact(data.instagram.reach7d));
        patchText('[data-jv-social="ig-engagement"]', `${data.instagram.engagementRate}%`);
      }
      if (data.metaAds) {
        patchText('[data-jv-social="roas"]', `${data.metaAds.roas.toFixed(1)}x`);
        patchText('[data-jv-social="spend"]', `$${Math.round(data.metaAds.spend7d)}`);
      }

      window.dispatchEvent(new CustomEvent("jarvis:social", { detail: data }));
    } catch {
      /* silent */
    }
  }

  refreshCrm();
  refreshSocial();
  setInterval(refreshCrm, 5 * 60 * 1000);
  setInterval(refreshSocial, 10 * 60 * 1000);
})();
