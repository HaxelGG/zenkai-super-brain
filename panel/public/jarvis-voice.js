/**
 * JARVIS Orquestador · voz + wake word + API run/speak (ElevenLabs)
 */
(function () {
  const widget = document.getElementById("jv-voice");
  const btn = document.getElementById("jv-voice-btn");
  const statusEl = document.getElementById("jv-voice-status");
  if (!widget || !btn || !statusEl) return;

  const WAKE_KEY = "zenkai_jarvis_wake_enabled";
  const API_KEY_STORAGE = "zenkai_jarvis_api_key";
  const RUNS_KEY = "zenkai_jarvis_runs";
  const ELEVEN_KEY = "zenkai_jarvis_use_elevenlabs";

  const STATUS = {
    idle: "En línea",
    wake: "Escuchando wake…",
    listening: "Escuchando…",
    processing: "Procesando…",
    speaking: "Hablando…",
  };

  const WAKE_GREETINGS = [
    "Sí, señor. JARVIS en línea.",
    "Buenos días. Sistemas operativos.",
    "Presente. ¿En qué puedo ayudarle?",
  ];

  let state = "idle";
  let mode = "off";
  let recognition = null;
  let wakeEnabled = false;
  let commandTimeout = null;
  let synthUtterance = null;
  let currentAudio = null;

  const transcriptEl = document.getElementById("jv-voice-transcript");
  const runsEl = document.getElementById("jv-voice-runs");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function getApiKey() {
    try {
      return localStorage.getItem(API_KEY_STORAGE) || "";
    } catch {
      return "";
    }
  }

  function useElevenLabs() {
    try {
      return localStorage.getItem(ELEVEN_KEY) !== "0";
    } catch {
      return true;
    }
  }

  function authHeaders() {
    const h = { "Content-Type": "application/json" };
    const key = getApiKey();
    if (key) h.Authorization = `Bearer ${key}`;
    return h;
  }

  function logTranscript(line, kind) {
    if (!transcriptEl) return;
    const row = document.createElement("div");
    row.className = `jv-voice-log-line jv-voice-log-${kind || "info"}`;
    row.textContent = line;
    transcriptEl.prepend(row);
    while (transcriptEl.children.length > 24) transcriptEl.lastChild?.remove();
  }

  function saveRun(run) {
    try {
      const prev = JSON.parse(localStorage.getItem(RUNS_KEY) || "[]");
      prev.unshift(run);
      localStorage.setItem(RUNS_KEY, JSON.stringify(prev.slice(0, 20)));
    } catch {
      /* ignore */
    }
    renderRuns();
  }

  function renderRuns() {
    if (!runsEl) return;
    let runs = [];
    try {
      runs = JSON.parse(localStorage.getItem(RUNS_KEY) || "[]");
    } catch {
      runs = [];
    }
    runsEl.innerHTML = "";
    if (!runs.length) {
      runsEl.innerHTML = '<div class="jv-voice-log-line jv-voice-log-dim">Sin runs aún.</div>';
      return;
    }
    runs.slice(0, 8).forEach((r) => {
      const row = document.createElement("div");
      row.className = "jv-voice-log-line";
      row.innerHTML = `<span class="jv-voice-log-dim">${new Date(r.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span> · ${r.speech || r.reply || r.instruction}`;
      runsEl.appendChild(row);
    });
  }

  function norm(text) {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseWakePhrase(raw) {
    const t = norm(raw);
    if (!t) return null;
    const patterns = [
      /^jarvis\s+(wake\s*up|wakeup|despierta|despertar|despiertate|activa|activate|online|en linea)(?:\s+(.*))?$/,
      /^(wake\s*up|wakeup)\s+jarvis(?:\s+(.*))?$/,
      /^(hey|hola|oye|ok)\s+jarvis(?:\s+(.*))?$/,
      /^jarvis\s+(.+)$/,
      /^jarvis$/,
    ];
    for (let i = 0; i < patterns.length; i++) {
      const m = t.match(patterns[i]);
      if (!m) continue;
      if (i === 3) {
        const rest = m[1];
        if (/^(wake|wakeup|despierta|despertar|hola|hey|oye)$/.test(rest)) continue;
        return rest;
      }
      return m[2]?.trim() || "";
    }
    return null;
  }

  function setState(next) {
    state = next;
    widget.dataset.state = next;
    document.body.classList.remove(
      "jv-voice-idle",
      "jv-voice-wake",
      "jv-voice-listening",
      "jv-voice-processing",
      "jv-voice-speaking",
    );
    document.body.classList.add(`jv-voice-${next}`);
    if (next !== "listening" || !statusEl.dataset.interim) {
      statusEl.textContent = STATUS[next] ?? next;
      delete statusEl.dataset.interim;
    }
    btn.setAttribute("aria-pressed", next === "listening" || next === "wake" ? "true" : "false");
  }

  function stopAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
    synthUtterance = null;
  }

  function pickGreeting() {
    return WAKE_GREETINGS[Math.floor(Math.random() * WAKE_GREETINGS.length)];
  }

  function speakBrowser(text, onDone) {
    if (!text?.trim() || !window.speechSynthesis) {
      onDone?.();
      return;
    }
    synthUtterance = new SpeechSynthesisUtterance(text.slice(0, 500));
    synthUtterance.lang = "es-CO";
    synthUtterance.rate = 1;
    synthUtterance.onend = () => {
      synthUtterance = null;
      onDone?.();
    };
    synthUtterance.onerror = () => onDone?.();
    window.speechSynthesis.speak(synthUtterance);
  }

  async function speak(text, onDone) {
    if (!text?.trim()) {
      onDone?.();
      return;
    }
    stopRecognition();
    stopAudio();
    setState("speaking");
    logTranscript(`JARVIS: ${text}`, "out");

    if (useElevenLabs()) {
      try {
        const res = await fetch("/api/jarvis/speak", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ text: text.slice(0, 500) }),
        });
        if (res.ok && res.headers.get("content-type")?.includes("audio")) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          currentAudio = new Audio(url);
          currentAudio.onended = () => {
            URL.revokeObjectURL(url);
            currentAudio = null;
            onDone?.();
          };
          currentAudio.onerror = () => {
            URL.revokeObjectURL(url);
            speakBrowser(text, onDone);
          };
          await currentAudio.play();
          return;
        }
      } catch {
        /* fallback */
      }
    }
    speakBrowser(text, onDone);
  }

  async function runOrchestrator(instruction) {
    const res = await fetch("/api/jarvis/run", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ instruction }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  function localFallback(cmd, fromWake) {
    const lower = norm(cmd);
    let reply = "Entendido.";
    let path = null;
    if (/recap|resumen|estado/.test(lower)) reply = "Revisando el estado operativo.";
    else if (/finanzas|revenue|ingresos/.test(lower)) {
      reply = "Abriendo finanzas.";
      path = "/jarvis/finanzas/";
    } else if (/pipeline|leads/.test(lower)) {
      reply = "Abriendo pipeline.";
      path = "/jarvis/pipeline/";
    } else if (/clientes/.test(lower)) {
      reply = "Abriendo clientes.";
      path = "/jarvis/clientes/";
    } else if (/agentes/.test(lower)) {
      reply = "Abriendo agentes.";
      path = "/jarvis/agentes/";
    } else if (/social|instagram/.test(lower)) {
      reply = "Abriendo social.";
      path = "/jarvis/social/";
    } else if (/tareas/.test(lower)) {
      reply = "Abriendo tareas.";
      path = "/jarvis/tareas/";
    } else if (fromWake && /^(hola|hey|buenos)/.test(lower)) reply = pickGreeting();

    return {
      id: `local_${Date.now()}`,
      instruction: cmd,
      reply,
      speech: reply,
      action: path ? { type: "navigate", path } : undefined,
      source: "local",
      timestamp: new Date().toISOString(),
    };
  }

  async function handleTranscript(text, fromWake) {
    const cmd = text.trim();
    if (!cmd) {
      resumeAfterCommand();
      return;
    }
    setState("processing");
    logTranscript(`Tú: ${cmd}`, "in");
    window.dispatchEvent(new CustomEvent("jarvis-voice-command", { detail: { text: cmd, wake: fromWake } }));

    let result;
    try {
      result = await runOrchestrator(cmd);
    } catch {
      result = localFallback(cmd, fromWake);
    }

    saveRun(result);
    if (result.action?.type === "navigate" && result.action.path) {
      setTimeout(() => {
        window.location.href = result.action.path;
      }, 900);
    }

    await speak(result.speech || result.reply, resumeAfterCommand);
  }

  function resumeAfterCommand() {
    clearTimeout(commandTimeout);
    if (wakeEnabled) {
      mode = "wake";
      setState("wake");
      startRecognition("wake");
    } else {
      mode = "off";
      setState("idle");
    }
  }

  function onWakeDetected(final, trailing) {
    stopRecognition();
    mode = "command";
    btn.classList.add("jv-voice-active");
    logTranscript(`Wake: ${final}`, "wake");

    if (trailing) {
      handleTranscript(trailing, true);
      return;
    }
    speak(pickGreeting(), () => {
      setState("listening");
      mode = "command";
      startRecognition("command");
      commandTimeout = setTimeout(() => {
        if (mode === "command") resumeAfterCommand();
      }, 12000);
    });
  }

  function stopRecognition() {
    if (!recognition) return;
    try {
      recognition.abort();
    } catch {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    }
  }

  function initRecognition() {
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.lang = "es-CO";
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      if (mode === "command") setState("listening");
      else if (mode === "wake") setState("wake");
    };

    rec.onresult = (ev) => {
      let interim = "";
      let final = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) final += t;
        else interim += t;
      }

      if (mode === "wake" && final) {
        const trailing = parseWakePhrase(final);
        if (trailing !== null) {
          onWakeDetected(final, trailing);
          return;
        }
      }
      if (mode === "wake" && interim) {
        statusEl.dataset.interim = "1";
        statusEl.textContent = `«${interim.slice(0, 36)}»`;
      }

      if (mode === "command" && final) {
        stopRecognition();
        btn.classList.remove("jv-voice-active");
        handleTranscript(final, true);
      } else if (mode === "command" && interim) {
        statusEl.dataset.interim = "1";
        statusEl.textContent = `«${interim.slice(0, 40)}»`;
      }
    };

    rec.onerror = (ev) => {
      if (ev.error === "no-speech") {
        if (mode === "wake" || mode === "command") {
          setTimeout(() => {
            if (mode !== "off") startRecognition(mode);
          }, 300);
        }
        return;
      }
      if (ev.error === "not-allowed") {
        statusEl.textContent = "Micrófono requerido";
        disableWakeMode();
        return;
      }
      if (ev.error !== "aborted" && mode === "wake") {
        setTimeout(() => startRecognition("wake"), 800);
      }
    };

    rec.onend = () => {
      if (mode === "wake" && wakeEnabled && state !== "speaking" && state !== "processing") {
        setTimeout(() => {
          if (mode === "wake") startRecognition("wake");
        }, 200);
      }
    };

    return rec;
  }

  function startRecognition(nextMode) {
    if (!SpeechRecognition) {
      statusEl.textContent = "Usá Chrome o Edge";
      return;
    }
    if (!recognition) recognition = initRecognition();
    mode = nextMode;
    recognition.continuous = nextMode === "wake";
    try {
      recognition.start();
    } catch {
      /* already running */
    }
  }

  function enableWakeMode() {
    wakeEnabled = true;
    try {
      localStorage.setItem(WAKE_KEY, "1");
    } catch {
      /* ignore */
    }
    mode = "wake";
    btn.classList.add("jv-voice-active");
    setState("wake");
    startRecognition("wake");
  }

  function disableWakeMode() {
    wakeEnabled = false;
    mode = "off";
    clearTimeout(commandTimeout);
    stopRecognition();
    stopAudio();
    btn.classList.remove("jv-voice-active");
    try {
      localStorage.setItem(WAKE_KEY, "0");
    } catch {
      /* ignore */
    }
    setState("idle");
  }

  function startCommandMode() {
    stopRecognition();
    stopAudio();
    mode = "command";
    btn.classList.add("jv-voice-active");
    setState("listening");
    startRecognition("command");
    commandTimeout = setTimeout(() => {
      if (mode === "command") resumeAfterCommand();
    }, 15000);
  }

  btn.addEventListener("click", () => {
    if (!SpeechRecognition) {
      statusEl.textContent = "Usá Chrome o Edge";
      return;
    }
    if (wakeEnabled && mode === "wake") {
      disableWakeMode();
      return;
    }
    if (mode === "command" || state === "listening") {
      resumeAfterCommand();
      return;
    }
    enableWakeMode();
  });

  btn.addEventListener("dblclick", (e) => {
    e.preventDefault();
    startCommandMode();
  });

  setState("idle");
  renderRuns();

  if (SpeechRecognition) {
    try {
      if (localStorage.getItem(WAKE_KEY) === "1") {
        setTimeout(enableWakeMode, 800);
      }
    } catch {
      /* ignore */
    }
  }

  window.JarvisVoice = {
    setState,
    speak,
    enableWakeMode,
    disableWakeMode,
    startCommandMode,
    getState: () => state,
    getMode: () => mode,
  };
})();
