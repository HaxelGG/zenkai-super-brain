/**
 * JARVIS Jobs HITL · preview · approve · generate images
 */
(function () {
  const root = document.getElementById("jv-jobs-root");
  if (!root) return;

  const PANEL_API = "https://panel.zenkai.systems";
  const API_KEY_STORAGE = "zenkai_jarvis_api_key";

  function getApiBase() {
    const h = window.location.hostname.toLowerCase();
    if (h === "jarvis.zenkai.systems" || h.endsWith(".jarvis.zenkai.systems")) return PANEL_API;
    if (h === "localhost" || h === "127.0.0.1") return PANEL_API;
    return "";
  }

  function apiUrl(path) {
    return `${getApiBase()}${path}`;
  }

  function getApiKey() {
    try {
      return localStorage.getItem(API_KEY_STORAGE) || localStorage.getItem("zenkai_api_key") || "";
    } catch {
      return "";
    }
  }

  function authHeaders() {
    const key = getApiKey();
    const h = { Accept: "application/json", "Content-Type": "application/json" };
    if (key) h.Authorization = `Bearer ${key}`;
    return h;
  }

  function escapeHtml(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  let activeJobId = root.dataset.jobId || "";
  let activeJob = null;

  const queueEl = document.getElementById("jv-jobs-queue");
  const detailEl = document.getElementById("jv-jobs-detail");
  const emptyEl = document.getElementById("jv-jobs-empty");
  const gridEl = document.getElementById("jv-jobs-grid");
  const statusEl = document.getElementById("jv-jobs-status");
  const detailIdEl = document.getElementById("jv-jobs-detail-id");
  const detailMetaEl = document.getElementById("jv-jobs-detail-meta");

  function setStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.style.color = isError ? "#ff8888" : "var(--jv-text-dim)";
  }

  async function fetchJson(path, opts) {
    const res = await fetch(apiUrl(path), {
      ...opts,
      headers: { ...authHeaders(), ...(opts?.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  function renderQueue(jobs) {
    if (!queueEl) return;
    if (!jobs?.length) {
      queueEl.innerHTML = '<p class="text-[var(--jv-text-dim)]">Sin jobs pending_approval.</p>';
      return;
    }
    queueEl.innerHTML = jobs
      .map(
        (j) => `
      <button type="button" class="jv-job-queue-item${j.id === activeJobId ? " active" : ""}" data-job-id="${escapeHtml(j.id)}">
        <span class="text-[var(--jv-cyan)] w-16 shrink-0">${escapeHtml(j.client_slug)}</span>
        <span class="flex-1 truncate text-left">${escapeHtml(j.topic || j.instruction?.slice(0, 60))}</span>
        <span class="text-[10px] text-[var(--jv-text-dim)]">${j.count || 0} posts</span>
      </button>`,
      )
      .join("");

    queueEl.querySelectorAll("[data-job-id]").forEach((btn) => {
      btn.addEventListener("click", () => loadJob(btn.getAttribute("data-job-id")));
    });
  }

  function renderGrid(job) {
    if (!gridEl) return;
    const posts = job?.artifacts?.posts || [];
    gridEl.innerHTML = posts
      .map((p) => {
        const imgSrc = p.image_url || p.image_preview || "";
        const provider = p.image_provider ? `<span class="text-[9px] text-[var(--jv-cyan)]">${escapeHtml(p.image_provider)}</span>` : "";
        const imgBlock = imgSrc
          ? `<img src="${escapeHtml(imgSrc)}" alt="Post ${p.index}" loading="lazy" />`
          : `<div class="flex items-center justify-center aspect-[4/5] bg-[#0a1220] text-[10px] text-[var(--jv-text-dim)] p-4 text-center">${p.image_error ? escapeHtml(p.image_error) : "Sin imagen"}</div>`;
        const tags = (p.hashtags || []).map((t) => `#${escapeHtml(String(t).replace(/^#/, ""))}`).join(" ");
        return `
        <article class="jv-job-card" data-post-index="${p.index}">
          ${imgBlock}
          <div class="jv-job-card-body">
            <div class="flex justify-between gap-2 mb-2">
              <span class="jv-display text-[10px] text-[var(--jv-text-dim)]">#${p.index}</span>
              ${provider}
            </div>
            <p class="font-medium text-[13px] leading-snug mb-2">${escapeHtml(p.hook)}</p>
            <p class="text-[11px] text-[var(--jv-text-muted)] line-clamp-4 mb-2">${escapeHtml(p.caption)}</p>
            <p class="jv-mono text-[9px] text-[var(--jv-text-dim)]">${tags}</p>
          </div>
        </article>`;
      })
      .join("");
  }

  function showDetail(job) {
    activeJob = job;
    activeJobId = job.id;
    if (detailEl) detailEl.classList.remove("hidden");
    if (emptyEl) emptyEl.classList.add("hidden");
    if (detailIdEl) detailIdEl.textContent = job.id;
    if (detailMetaEl) {
      detailMetaEl.textContent = `${job.client_slug} · ${job.channel} · ${job.count} piezas · ${job.status}`;
    }
    renderGrid(job);
    setStatus("");
  }

  async function loadQueue() {
    try {
      const data = await fetchJson("/api/agency/jobs");
      renderQueue(data.jobs || []);
    } catch (e) {
      if (queueEl) queueEl.textContent = e.message || "Error cargando cola";
    }
  }

  async function loadJob(id) {
    if (!id) return;
    setStatus("Cargando job…");
    try {
      const job = await fetchJson(`/api/agency/jobs?id=${encodeURIComponent(id)}`);
      showDetail(job);
      const url = new URL(window.location.href);
      url.searchParams.set("job", id);
      window.history.replaceState({}, "", url);
      await loadQueue();
    } catch (e) {
      setStatus(e.message || "Error", true);
    }
  }

  async function postAction(body) {
    setStatus("Procesando…");
    try {
      const data = await fetchJson("/api/agency/jobs", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (body.action === "approve") {
        setStatus(`Publicados: ${data.published} · omitidos: ${data.skipped}${data.errors?.length ? " · errores: " + data.errors.join("; ") : ""}`);
      } else if (body.action === "generate_images") {
        setStatus(`Imágenes generadas: ${data.generated}${data.errors?.length ? " · " + data.errors.join("; ") : ""}`);
        await loadJob(body.jobId);
      } else if (body.action === "reject") {
        setStatus("Job rechazado");
        activeJobId = "";
        if (detailEl) detailEl.classList.add("hidden");
        if (emptyEl) emptyEl.classList.remove("hidden");
        await loadQueue();
      } else {
        setStatus("OK");
      }
      return data;
    } catch (e) {
      setStatus(e.message || "Error", true);
      throw e;
    }
  }

  document.getElementById("jv-jobs-refresh")?.addEventListener("click", loadQueue);
  document.getElementById("jv-jobs-approve")?.addEventListener("click", () => {
    if (!activeJobId) return;
    if (!confirm("¿Aprobar y publicar en Instagram? Solo posts con image_url se publican.")) return;
    postAction({ action: "approve", jobId: activeJobId, approvedBy: "founder" });
  });
  document.getElementById("jv-jobs-reject")?.addEventListener("click", () => {
    if (!activeJobId) return;
    const reason = prompt("Motivo de rechazo (opcional):") || "rejected from HUD";
    postAction({ action: "reject", jobId: activeJobId, reason });
  });
  document.getElementById("jv-jobs-gen-images")?.addEventListener("click", () => {
    if (!activeJobId) return;
    postAction({ action: "generate_images", jobId: activeJobId });
  });

  loadQueue().then(() => {
    if (activeJobId) loadJob(activeJobId);
  });
})();
