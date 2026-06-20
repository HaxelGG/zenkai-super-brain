/**
 * JARVIS Voice Orb · idle | wake | listening | processing | speaking
 * Wake word: "Jarvis despierta", "Jarvis wake up", "Hey Jarvis", etc.
 * Web Speech API (Chrome/Edge). TTS vía speechSynthesis.
 */
(function () {
  const widget = document.getElementById("jv-voice");
  const btn = document.getElementById("jv-voice-btn");
  const statusEl = document.getElementById("jv-voice-status");
  if (!widget || !btn || !statusEl) return;

  const WAKE_KEY = "zenkai_jarvis_wake_enabled";
  const STATUS = {
    idle: "En línea",
    wake: "Di «Jarvis despierta»…",
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
  let mode = "off"; // off | wake | command
  let recognition = null;
  let wakeEnabled = false;
  let commandTimeout = null;
  let synthUtterance = null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function norm(text) {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** Detecta frase de activación y devuelve el comando restante (string vacío = solo wake). */
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

  function stopSynth() {
    if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
    synthUtterance = null;
  }

  function pickGreeting() {
    return WAKE_GREETINGS[Math.floor(Math.random() * WAKE_GREETINGS.length)];
  }

  function speak(text, onDone) {
    if (!text?.trim() || !window.speechSynthesis) {
      setState(mode === "wake" ? "wake" : "idle");
      onDone?.();
      return;
    }
    stopRecognition();
    stopSynth();
    setState("speaking");
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

  function handleTranscript(text, fromWake) {
    const cmd = text.trim();
    if (!cmd) {
      resumeAfterCommand();
      return;
    }
    setState("processing");
    window.dispatchEvent(new CustomEvent("jarvis-voice-command", { detail: { text: cmd, wake: fromWake } }));

    const lower = norm(cmd);
    let reply = "Entendido.";
    if (/recap|resumen|estado/.test(lower)) {
      reply = "Revisando el estado operativo de ZENKAI.";
    } else if (/finanzas|revenue|ingresos/.test(lower)) {
      reply = "Abriendo métricas financieras.";
      window.location.href = "/jarvis/finanzas/";
    } else if (/pipeline|leads|clientes/.test(lower)) {
      reply = "Consultando pipeline y CRM.";
      window.location.href = "/jarvis/pipeline/";
    } else if (/agentes|equipo/.test(lower)) {
      reply = "Mostrando estado de agentes.";
      window.location.href = "/jarvis/agentes/";
    } else if (/social|instagram|meta/.test(lower)) {
      reply = "Abriendo métricas sociales.";
      window.location.href = "/jarvis/social/";
    } else if (/tareas|pendientes/.test(lower)) {
      reply = "Revisando tareas pendientes.";
      window.location.href = "/jarvis/tareas/";
    } else if (fromWake && /^(hola|hey|buenos|buenas)/.test(lower)) {
      reply = pickGreeting();
    }

    speak(reply, resumeAfterCommand);
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

  function onWakeDetected(raw, trailingCmd) {
    stopRecognition();
    mode = "command";
    btn.classList.add("jv-voice-active");

    if (trailingCmd) {
      handleTranscript(trailingCmd, true);
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

      const chunk = final || interim;
      if (mode === "wake" && chunk) {
        if (final) {
          const trailing = parseWakePhrase(final);
          if (trailing !== null) {
            onWakeDetected(final, trailing);
            return;
          }
        }
        if (interim && mode === "wake") {
          statusEl.dataset.interim = "1";
          statusEl.textContent = `«${interim.slice(0, 36)}»`;
        }
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
        statusEl.textContent = "Permiso de micrófono requerido";
        wakeEnabled = false;
        mode = "off";
        setState("idle");
        try {
          localStorage.removeItem(WAKE_KEY);
        } catch {
          /* ignore */
        }
        return;
      }
      if (ev.error !== "aborted") {
        if (mode === "wake") {
          setTimeout(() => startRecognition("wake"), 800);
        } else {
          statusEl.textContent = "Micrófono no disponible";
          mode = "off";
          setState("idle");
        }
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
    stopSynth();
    btn.classList.remove("jv-voice-active");
    try {
      localStorage.removeItem(WAKE_KEY);
    } catch {
      /* ignore */
    }
    setState("idle");
  }

  function startCommandMode() {
    stopRecognition();
    stopSynth();
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

  if (SpeechRecognition) {
    try {
      if (localStorage.getItem(WAKE_KEY) === "1") {
        statusEl.textContent = "Activando wake word…";
        setTimeout(enableWakeMode, 600);
      } else {
        statusEl.textContent = "Pulsa orb · «Jarvis despierta»";
      }
    } catch {
      statusEl.textContent = "Pulsa orb para activar voz";
    }
  } else {
    statusEl.textContent = "Voz: Chrome/Edge";
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
