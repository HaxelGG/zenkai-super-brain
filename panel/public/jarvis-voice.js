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
  const API_KEY_LEGACY = "zenkai_api_key";
  const RUNS_KEY = "zenkai_jarvis_runs";
  const ELEVEN_KEY = "zenkai_jarvis_use_elevenlabs";

  const STATUS = {
    idle: "2 palmadas · o clic en orb",
    wake: "2 palmadas o «Jarvis despierta»…",
    listening: "Te escucho…",
    processing: "Procesando…",
    speaking: "Hablando…",
  };

  /** Espera silencio antes de enviar comando (no cortar al hablar largo) */
  const SILENCE_COMMIT_MS = 1600;
  /** Tiempo máximo escuchando sin actividad */
  const COMMAND_IDLE_MS = 45000;
  const COMMIT_TRIGGERS =
    /\b(listo|ya est[aá]|ejecut[aá]|dale jarvis|eso es todo|envi[aá]lo|proces[aá]|confirmo|mandale|mandalo)\b/i;

  const PANEL_API = "https://panel.zenkai.systems";

  function isJarvisHost() {
    const h = window.location.hostname.toLowerCase();
    return h === "jarvis.zenkai.systems" || h.endsWith(".jarvis.zenkai.systems");
  }

  /**
   * Vercel sirve /api/jarvis/* en panel.zenkai.systems (404 en jarvis subdomain).
   * jarvis + localhost → proxy panel; panel host → same-origin.
   */
  function getApiBase() {
    const h = window.location.hostname.toLowerCase();
    if (isJarvisHost() || h === "localhost" || h === "127.0.0.1") return PANEL_API;
    return "";
  }

  function apiUrl(path) {
    return `${getApiBase()}${path}`;
  }

  function normalizeNavPath(path) {
    if (!path) return path;
    if (isJarvisHost()) {
      const clean = path.replace(/^\/jarvis(\/|$)/, "/");
      return clean || "/";
    }
    return path;
  }

  function showVoiceToast(msg) {
    const toast = document.getElementById("jv-voice-toast");
    if (!toast || !msg) return;
    toast.textContent = msg;
    toast.classList.add("jv-voice-toast-visible");
    clearTimeout(showVoiceToast._t);
    showVoiceToast._t = setTimeout(() => toast.classList.remove("jv-voice-toast-visible"), 4500);
  }

  function unlockAudio() {
    if (window.__jvAudioUnlocked) return;
    window.__jvAudioUnlocked = true;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        ctx.resume();
      }
      if (window.speechSynthesis) window.speechSynthesis.getVoices();
    } catch {
      /* ignore */
    }
  }

  /** Evita colgar en «Hablando…» si ElevenLabs o la función Vercel tarda demasiado */
  async function fetchWithTimeout(url, options, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      return await fetch(url, {
        ...options,
        credentials: "same-origin",
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  /** Pide permiso de micrófono antes de STT (Chrome a veces no dispara onresult sin esto) */
  async function ensureMicPermission() {
    if (!navigator.mediaDevices?.getUserMedia) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      statusEl.textContent = "Micrófono requerido";
      showVoiceToast("Permití el micrófono en el navegador (candado en la barra)");
      return false;
    }
  }

  const WAKE_GREETINGS = [
    "Listo parce, JARVIS en línea. Contame.",
    "Qué tal, acá estoy. ¿En qué le ayudo?",
    "De una, sistemas activos. Hablame pues.",
    "Presente. Decime qué necesitás.",
  ];

  let state = "idle";
  let mode = "off";
  let recognition = null;
  let wakeEnabled = false;
  let pendingWake = false;
  let clickTimer = null;
  let commandTimeout = null;
  let synthUtterance = null;
  let currentAudio = null;
  let lastInterim = "";
  let commandBuffer = "";
  let silenceTimer = null;
  let recognitionStarting = false;
  let wakeArmGuard = false;
  const VOICE_JS_VER = "20260620f";

  const transcriptEl = document.getElementById("jv-voice-transcript");
  const runsEl = document.getElementById("jv-voice-runs");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function getApiKey() {
    try {
      return localStorage.getItem(API_KEY_STORAGE) || localStorage.getItem(API_KEY_LEGACY) || "";
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
      const tier = r.meta?.tier ? `<span class="jv-voice-tier jv-voice-tier-${r.meta.tier}">${r.meta.tier}</span>` : "";
      const model = r.meta?.model ? `<span class="jv-voice-model">${r.meta.model}</span>` : "";
      row.innerHTML = `<span class="jv-voice-log-dim">${new Date(r.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span>${tier}${model} · ${r.speech || r.reply || r.instruction}`;
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
      /^(despierta|despertar|despiertate|activa|wake\s*up|wakeup)\s+jarvis(?:\s+(.*))?$/,
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
      const label = STATUS[next] ?? next;
      statusEl.textContent = label;
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
    window.speechSynthesis.cancel();

    const run = () => {
      synthUtterance = new SpeechSynthesisUtterance(text.slice(0, 500));
      synthUtterance.lang = "es-CO";
      synthUtterance.rate = 0.98;
      synthUtterance.pitch = 0.95;
      const voices = window.speechSynthesis.getVoices();
      const esVoice =
        voices.find((v) => /es-CO/i.test(v.lang)) ||
        voices.find((v) => /es-MX/i.test(v.lang)) ||
        voices.find((v) => /es/i.test(v.lang));
      if (esVoice) synthUtterance.voice = esVoice;
      synthUtterance.onend = () => {
        synthUtterance = null;
        onDone?.();
      };
      synthUtterance.onerror = () => onDone?.();
      window.speechSynthesis.speak(synthUtterance);
    };

    if (window.speechSynthesis.getVoices().length) {
      run();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        run();
      };
      setTimeout(run, 120);
    }
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
        const res = await fetchWithTimeout(
          apiUrl("/api/jarvis/speak"),
          {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ text: text.slice(0, 500) }),
          },
          14000,
        );
        if (res.status === 401 || res.status === 403) {
          showVoiceToast("Sin autorización · pegá ZENKAI_API_KEY en panel ⋯");
        } else if (res.status === 503) {
          showVoiceToast("ElevenLabs no configurado · voz del navegador");
        } else if (res.ok && res.headers.get("content-type")?.includes("audio")) {
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
          try {
            await currentAudio.play();
            return;
          } catch {
            URL.revokeObjectURL(url);
            currentAudio = null;
            showVoiceToast("Audio bloqueado · voz del navegador");
          }
        } else if (!res.ok) {
          showVoiceToast(`TTS error ${res.status} · voz del navegador`);
        }
      } catch (err) {
        const timedOut = err instanceof Error && err.name === "AbortError";
        showVoiceToast(timedOut ? "ElevenLabs lento · voz del navegador" : "TTS falló · voz del navegador");
      }
    }
    speakBrowser(text, onDone);
  }

  async function runOrchestrator(instruction) {
    const res = await fetchWithTimeout(
      apiUrl("/api/jarvis/run"),
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ instruction }),
      },
      55000,
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error(err.error || `HTTP ${res.status}`);
      e.status = res.status;
      throw e;
    }
    return res.json();
  }

  function sourceLabel(source) {
    if (source === "deepseek") return "DeepSeek";
    if (source === "anthropic") return "Claude";
    if (source === "clasificar") return "clasificador";
    return "local";
  }

  function notifyRunSource(result) {
    if (!result?.source) return;
    if (result.source === "deepseek" || result.source === "anthropic") {
      const who = result.source === "anthropic" ? "Claude" : "DeepSeek";
      showVoiceToast(`${who} respondió`);
      if (result.dispatch?.event) {
        const d = result.dispatch.ok ? "enviado" : "falló";
        showVoiceToast(`n8n ${d} · ${result.dispatch.event}`);
      }
      return;
    }
    const reason = result.meta?.fallbackReason || sourceLabel(result.source);
    showVoiceToast(`Cerebro degradado · ${reason}`);
  }

  function localFallback(cmd, fromWake) {
    const lower = norm(cmd);
    let reply = "Listo, parce. Entendido.";
    let path = null;
    if (/recap|resumen|estado/.test(lower)) reply = "De una, vea el estado operativo.";
    else if (/finanzas|revenue|ingresos/.test(lower)) {
      reply = "Abro finanzas, parce.";
      path = normalizeNavPath("/jarvis/finanzas/");
    } else if (/pipeline|leads/.test(lower)) {
      reply = "Vamos al pipeline.";
      path = normalizeNavPath("/jarvis/pipeline/");
    } else if (/clientes/.test(lower)) {
      reply = "Abro clientes.";
      path = normalizeNavPath("/jarvis/clientes/");
    } else if (/agentes/.test(lower)) {
      reply = "Veámos los agentes.";
      path = normalizeNavPath("/jarvis/agentes/");
    } else if (/social|instagram/.test(lower)) {
      reply = "Abro social.";
      path = normalizeNavPath("/jarvis/social/");
    } else if (/tareas/.test(lower)) {
      reply = "Revisemos tareas.";
      path = normalizeNavPath("/jarvis/tareas/");
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

  async function deliverRun(result) {
    if (!result) return;
    unlockAudio();
    stopRecognition();
    stopAudio();
    setState("processing");
    const label = result.sourceChannel === "telegram" ? "Telegram" : "Remoto";
    logTranscript(`${label}: ${result.instruction || ""}`, "in");
    saveRun(result);
    if (result.action?.type === "navigate" && result.action.path) {
      const target = normalizeNavPath(result.action.path);
      setTimeout(() => {
        window.location.href = target;
      }, 900);
    }
    await speak(result.speech || result.reply, () => setState("idle"));
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
      notifyRunSource(result);
    } catch (err) {
      const status = err && typeof err === "object" ? err.status : 0;
      const msg = err instanceof Error ? err.message : "API offline";
      const authFail = status === 401 || status === 403 || /401|403|unauthorized/i.test(msg);
      if (authFail) {
        showVoiceToast("Sin autorización · abrí ⋯ y pegá ZENKAI_API_KEY");
        await speak("Necesito la clave ZENKAI API para conectar el cerebro.", resumeAfterCommand);
        return;
      }
      if (/failed to fetch|network|abort/i.test(msg)) {
        showVoiceToast("Sin conexión al cerebro · revisá red o Vercel");
        await speak("No puedo conectar con el cerebro JARVIS. Revisá la conexión.", resumeAfterCommand);
        return;
      }
      showVoiceToast(`${msg} · modo local`);
      result = localFallback(cmd, fromWake);
    }

    saveRun(result);
    if (result.action?.type === "navigate" && result.action.path) {
      const target = normalizeNavPath(result.action.path);
      setTimeout(() => {
        window.location.href = target;
      }, 900);
    }

    await speak(result.speech || result.reply, resumeAfterCommand);
  }

  function resumeAfterCommand() {
    clearTimeout(commandTimeout);
    clearTimeout(silenceTimer);
    clearCommandCapture();
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
    window.JarvisSounds?.playWakeChime?.();

    if (trailing) {
      handleTranscript(trailing, true);
      return;
    }
    speak(pickGreeting(), () => {
      setState("listening");
      mode = "command";
      clearCommandCapture();
      startRecognition("command");
      resetCommandIdleTimeout();
    });
  }

  function clearCommandCapture() {
    commandBuffer = "";
    lastInterim = "";
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }

  function updateListeningStatus() {
    const preview = `${commandBuffer} ${lastInterim}`.replace(/\s+/g, " ").trim();
    if (!preview || mode !== "command") return;
    statusEl.dataset.interim = "1";
    const short = preview.length > 52 ? `…${preview.slice(-49)}` : preview;
    statusEl.textContent = `Te escucho… ${short}`;
  }

  function resetCommandIdleTimeout() {
    clearTimeout(commandTimeout);
    commandTimeout = setTimeout(() => {
      if (mode !== "command" || state !== "listening") return;
      const pending = `${commandBuffer} ${lastInterim}`.replace(/\s+/g, " ").trim();
      if (pending) commitCommandTranscript(pending);
      else {
        showVoiceToast("No te escuché · tocá orb de nuevo");
        resumeAfterCommand();
      }
    }, COMMAND_IDLE_MS);
  }

  function scheduleSilenceCommit() {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      const pending = `${commandBuffer} ${lastInterim}`.replace(/\s+/g, " ").trim();
      if (pending && mode === "command" && state === "listening") {
        statusEl.textContent = "Enviando…";
        commitCommandTranscript(pending);
      }
    }, SILENCE_COMMIT_MS);
  }

  function appendToCommandBuffer(text) {
    const t = (text || "").trim();
    if (!t) return;
    commandBuffer = commandBuffer ? `${commandBuffer} ${t}` : t;
    lastInterim = "";
    resetCommandIdleTimeout();
    updateListeningStatus();

    if (COMMIT_TRIGGERS.test(t) || COMMIT_TRIGGERS.test(commandBuffer)) {
      const cleaned = commandBuffer.replace(COMMIT_TRIGGERS, "").replace(/\s+/g, " ").trim();
      commitCommandTranscript(cleaned || commandBuffer);
      return;
    }
    scheduleSilenceCommit();
  }

  function stopRecognition() {
    clearCommandCapture();
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
    recognitionStarting = false;
  }

  function resolveSpeechLang() {
    const nav = (navigator.language || "es-ES").toLowerCase();
    if (nav.startsWith("es")) return nav;
    return "es-ES";
  }

  function commitCommandTranscript(text) {
    const cmd = (text || "").trim();
    if (!cmd) return false;
    clearCommandCapture();
    clearTimeout(commandTimeout);
    stopRecognition();
    btn.classList.remove("jv-voice-active");
    mode = "off";
    showVoiceToast("Procesando…");
    void handleTranscript(cmd, false);
    return true;
  }

  function initRecognition() {
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.lang = resolveSpeechLang();
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = true;

    rec.onstart = () => {
      recognitionStarting = false;
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
        // Comando directo sin wake phrase (ej. «abre finanzas»)
        if (final.trim().length > 2) {
          commitCommandTranscript(final);
        }
      }
      if (mode === "wake" && interim) {
        statusEl.dataset.interim = "1";
        statusEl.textContent = `«${interim.slice(0, 36)}»`;
      }

      if (mode === "command") {
        if (interim) {
          lastInterim = interim;
          updateListeningStatus();
        }
        if (final) {
          appendToCommandBuffer(final);
        }
      }
    };

    rec.onerror = (ev) => {
      recognitionStarting = false;
      if (ev.error === "no-speech") {
        if (mode === "wake" || mode === "command") {
          setTimeout(() => {
            if (mode !== "off" && state !== "processing" && state !== "speaking") {
              startRecognition(mode);
            }
          }, 300);
        }
        return;
      }
      if (ev.error === "not-allowed") {
        statusEl.textContent = "Micrófono requerido";
        showVoiceToast("Permití el micrófono en el navegador");
        disableWakeMode();
        return;
      }
      if (ev.error === "audio-capture") {
        showVoiceToast("Micrófono no detectado · revisá dispositivo");
        resumeAfterCommand();
        return;
      }
      if (ev.error === "network") {
        showVoiceToast("Red STT · reintentando…");
      }
      if (ev.error !== "aborted" && (mode === "wake" || mode === "command")) {
        setTimeout(() => startRecognition(mode), 800);
      }
    };

    rec.onend = () => {
      recognitionStarting = false;
      if (state === "processing" || state === "speaking") return;

      if (mode === "command" && state === "listening") {
        if (lastInterim.trim() || commandBuffer.trim()) {
          scheduleSilenceCommit();
        }
        setTimeout(() => {
          if (mode === "command" && state === "listening") startRecognition("command");
        }, 300);
        return;
      }

      if (mode === "wake" && wakeEnabled) {
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
    if (recognitionStarting) return;
    if (!recognition) recognition = initRecognition();
    mode = nextMode;
    recognition.continuous = true;
    recognitionStarting = true;
    try {
      recognition.start();
    } catch {
      recognitionStarting = false;
      recognition = initRecognition();
      if (!recognition) return;
      mode = nextMode;
      try {
        recognition.start();
      } catch {
        showVoiceToast("Mic ocupado · clic de nuevo en orb");
      }
    }
  }

  function startClapWake() {
    if (!window.JarvisClapWake) return;
    window.JarvisClapWake.start(() => {
      if (!wakeEnabled || mode !== "wake") return;
      if (state === "processing" || state === "speaking") return;
      showVoiceToast("👏 Wake detectado");
      onWakeDetected("👏👏 palmadas", null);
    });
  }

  function stopClapWake() {
    window.JarvisClapWake?.stop?.();
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
    wakeArmGuard = true;
    setTimeout(() => {
      wakeArmGuard = false;
    }, 800);
    void ensureMicPermission().then((ok) => {
      if (ok) {
        startRecognition("wake");
        startClapWake();
      } else disableWakeMode();
    });
  }

  function disableWakeMode() {
    wakeEnabled = false;
    mode = "off";
    clearTimeout(commandTimeout);
    stopRecognition();
    stopClapWake();
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
    void (async () => {
      stopRecognition();
      stopAudio();
      lastInterim = "";
      unlockAudio();
      const micOk = await ensureMicPermission();
      if (!micOk) {
        mode = "off";
        setState("idle");
        return;
      }
      mode = "command";
      btn.classList.add("jv-voice-active");
      setState("listening");
      clearCommandCapture();
      startRecognition("command");
      resetCommandIdleTimeout();
    })();
  }

  function handleSingleClick() {
    if (!SpeechRecognition) {
      statusEl.textContent = "Usá Chrome o Edge";
      showVoiceToast("Usá Chrome o Edge para voz");
      return;
    }
    unlockAudio();
    // Si ya escucha, segundo clic = cancelar
    if (mode === "command" || state === "listening") {
      resumeAfterCommand();
      return;
    }
    if (wakeEnabled && mode === "wake") {
      if (wakeArmGuard) return;
      disableWakeMode();
      return;
    }
    // Clic en orb = hablar directo (siempre)
    startCommandMode();
  }

  btn.addEventListener("click", () => {
    clickTimer = setTimeout(() => {
      clickTimer = null;
      handleSingleClick();
    }, 280);
  });

  btn.addEventListener("dblclick", (e) => {
    e.preventDefault();
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
    unlockAudio();
    startCommandMode();
  });

  setState("idle");
  renderRuns();

  function initBrowserHints() {
    if (!SpeechRecognition) {
      statusEl.textContent = "Sin voz · Chrome/Edge";
      showVoiceToast("Voz solo en Chrome o Edge");
      return;
    }
    const ua = navigator.userAgent;
    if (/firefox/i.test(ua)) {
      statusEl.textContent = "Sin voz en Firefox";
      showVoiceToast("Usá Chrome o Edge para hablar con JARVIS");
      return;
    }
    if (/brave/i.test(ua)) {
      showVoiceToast("Brave: permití micrófono y desactivá Shields en zenkai.systems");
    }
    if (window.matchMedia("(display-mode: standalone)").matches || window.jarvisDesktop?.isDesktop) {
      showVoiceToast("App JARVIS · clic en orb y hablá");
    }
    try {
      if (!localStorage.getItem("zenkai_jarvis_voice_hint_shown")) {
        localStorage.setItem("zenkai_jarvis_voice_hint_shown", "1");
        setTimeout(() => showVoiceToast("Clic en orb → hablá · Chrome/Edge recomendado"), 1500);
      }
    } catch {
      /* ignore */
    }
  }

  function armPendingWake() {
    /* desactivado: el pointerdown competía con el clic del orb y apagaba el mic */
  }

  if (SpeechRecognition) {
    try {
      if (localStorage.getItem(WAKE_KEY) === "1") {
        statusEl.textContent = "Wake en panel ⋯";
      }
    } catch {
      /* ignore */
    }
  } else {
    statusEl.textContent = "Sin voz";
    showVoiceToast("Usá Chrome o Edge para JARVIS por voz");
  }

  function initAutoWake() {
    if (!SpeechRecognition) return;
    try {
      if (localStorage.getItem(WAKE_KEY) === "0") return;
      if (localStorage.getItem(WAKE_KEY) !== "1") {
        localStorage.setItem(WAKE_KEY, "1");
      }
    } catch {
      return;
    }
    setTimeout(() => {
      if (!wakeEnabled && mode === "off") enableWakeMode();
    }, 2600);
  }

  initBrowserHints();
  initAutoWake();

  window.JarvisVoice = {
    setState,
    speak,
    deliverRun,
    enableWakeMode,
    disableWakeMode,
    startCommandMode,
    submitTextCommand: (text) => handleTranscript(String(text || "").trim(), false),
    testVoice: () => speak("Parce, JARVIS en línea. Sistemas al peluche.", () => setState("idle")),
    getState: () => state,
    getMode: () => mode,
    version: VOICE_JS_VER,
  };
  window.dispatchEvent(new CustomEvent("jarvis-voice-ready"));
})();
