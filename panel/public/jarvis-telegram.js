/**
 * Cliente Telegram bridge · entrega mensajes del bot al Command Center (voz + UI).
 */
(function () {
  const BRIDGE = localStorage.getItem("zenkai_jarvis_bridge_url") || "http://127.0.0.1:8765";
  const badge = document.getElementById("jv-telegram-badge");
  const POLL_MS = 2500;
  const seen = new Set();

  function showToast(msg) {
    const toast = document.getElementById("jv-sync-toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("jv-sync-visible");
    setTimeout(() => toast.classList.remove("jv-sync-visible"), 4200);
  }

  function setBadge(online) {
    if (!badge) return;
    badge.dataset.state = online ? "online" : "offline";
    badge.title = online
      ? "Telegram conectado · mensajes llegan a JARVIS"
      : "Telegram offline · ejecutá npm run jarvis:telegram en la laptop";
  }

  async function ackRun(id) {
    try {
      await fetch(`${BRIDGE}/inbox/ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      /* ignore */
    }
  }

  function deliverRun(run) {
    showToast(`Telegram · ${run.instruction?.slice(0, 48) || "mensaje"}`);
    window.dispatchEvent(new CustomEvent("jarvis:telegram-run", { detail: run }));

    if (window.JarvisVoice?.deliverRun) {
      window.JarvisVoice.deliverRun(run);
      return;
    }

    // Fallback si jarvis-voice.js aún no cargó
    window.addEventListener(
      "jarvis-voice-ready",
      () => window.JarvisVoice?.deliverRun?.(run),
      { once: true },
    );
  }

  async function pollInbox() {
    try {
      const res = await fetch(`${BRIDGE}/inbox`, { cache: "no-store" });
      if (!res.ok) {
        setBadge(false);
        return;
      }
      const data = await res.json();
      setBadge(true);

      for (const run of data.pending || []) {
        if (!run?.id || seen.has(run.id)) continue;
        seen.add(run.id);
        deliverRun(run);
        void ackRun(run.id);
      }
    } catch {
      setBadge(false);
    }
  }

  pollInbox();
  setInterval(pollInbox, POLL_MS);
})();
