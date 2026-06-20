/**
 * JARVIS · audio boot + wake chimes
 * Tema boot: sintetizado estilo HUD Iron Man · override opcional en /sounds/jarvis-boot.mp3
 */
(function () {
  const BOOT_KEY = "zenkai_jarvis_boot_sound";
  const BOOT_URL_KEY = "zenkai_jarvis_boot_url";
  const DEFAULT_BOOT_URL = "/sounds/jarvis-boot.mp3";

  let audioCtx = null;
  let bootAudio = null;
  let bootPending = false;

  function getCtx() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx?.state === "suspended") audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  function bootEnabled() {
    try {
      return localStorage.getItem(BOOT_KEY) !== "0";
    } catch {
      return true;
    }
  }

  function resolveBootUrl() {
    try {
      return localStorage.getItem(BOOT_URL_KEY)?.trim() || DEFAULT_BOOT_URL;
    } catch {
      return DEFAULT_BOOT_URL;
    }
  }

  function playMp3Boot() {
    return new Promise((resolve) => {
      if (!bootEnabled()) {
        resolve(false);
        return;
      }
      const url = resolveBootUrl();
      if (!bootAudio || bootAudio.src !== new URL(url, location.href).href) {
        bootAudio = new Audio(url);
        bootAudio.preload = "auto";
      }
      bootAudio.currentTime = 0;
      bootAudio.volume = 0.72;
      const done = () => resolve(true);
      bootAudio.onended = done;
      bootAudio.onerror = () => resolve(false);
      bootAudio.play().then(done).catch(() => resolve(false));
    });
  }

  /** Secuencia sintetizada · inspirada en arranque HUD (original, sin copyright) */
  function playSynthBoot() {
    const ctx = getCtx();
    if (!ctx || !bootEnabled()) return;

    const t0 = ctx.currentTime + 0.02;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.55, t0 + 0.08);
    master.gain.exponentialRampToValueAtTime(0.38, t0 + 1.8);
    master.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.6);
    master.connect(ctx.destination);

    const notes = [
      { f: 110, at: 0.0, dur: 0.35, type: "sine", g: 0.22 },
      { f: 164.81, at: 0.12, dur: 0.28, type: "triangle", g: 0.18 },
      { f: 220, at: 0.22, dur: 0.32, type: "sine", g: 0.2 },
      { f: 329.63, at: 0.38, dur: 0.45, type: "triangle", g: 0.16 },
      { f: 440, at: 0.55, dur: 0.55, type: "sine", g: 0.24 },
      { f: 554.37, at: 0.72, dur: 0.6, type: "sawtooth", g: 0.08 },
      { f: 659.25, at: 0.9, dur: 0.75, type: "sine", g: 0.2 },
      { f: 880, at: 1.15, dur: 1.4, type: "triangle", g: 0.14 },
    ];

    notes.forEach(({ f, at, dur, type, g }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(900, t0 + at);
      filter.frequency.exponentialRampToValueAtTime(4800, t0 + at + 0.12);
      filter.frequency.exponentialRampToValueAtTime(1200, t0 + at + dur);
      osc.type = type;
      osc.frequency.setValueAtTime(f, t0 + at);
      gain.gain.setValueAtTime(0.0001, t0 + at);
      gain.gain.exponentialRampToValueAtTime(g, t0 + at + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.start(t0 + at);
      osc.stop(t0 + at + dur + 0.05);
    });

    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.type = "sawtooth";
    sweep.frequency.setValueAtTime(55, t0);
    sweep.frequency.exponentialRampToValueAtTime(180, t0 + 1.2);
    sweepGain.gain.setValueAtTime(0.0001, t0);
    sweepGain.gain.exponentialRampToValueAtTime(0.06, t0 + 0.15);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.5);
    sweep.connect(sweepGain);
    sweepGain.connect(master);
    sweep.start(t0);
    sweep.stop(t0 + 1.6);
  }

  function playWakeChime() {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime + 0.01;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, t);
    osc.frequency.exponentialRampToValueAtTime(783.99, t + 0.18);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  function armBootOnGesture() {
    if (!bootPending) return;
    const run = () => {
      bootPending = false;
      void playBoot(true);
    };
    document.addEventListener("pointerdown", run, { once: true, capture: true });
    document.addEventListener("keydown", run, { once: true, capture: true });
  }

  async function playBoot(fromGesture) {
    if (!bootEnabled()) return false;
    getCtx();
    const mp3Ok = await playMp3Boot();
    if (mp3Ok) return true;
    try {
      playSynthBoot();
      return true;
    } catch {
      if (!fromGesture) {
        bootPending = true;
        armBootOnGesture();
      }
      return false;
    }
  }

  window.JarvisSounds = {
    playBoot,
    playWakeChime,
    unlock: getCtx,
    setBootEnabled(enabled) {
      try {
        localStorage.setItem(BOOT_KEY, enabled ? "1" : "0");
      } catch {
        /* ignore */
      }
    },
    setBootUrl(url) {
      try {
        if (url?.trim()) localStorage.setItem(BOOT_URL_KEY, url.trim());
        else localStorage.removeItem(BOOT_URL_KEY);
        bootAudio = null;
      } catch {
        /* ignore */
      }
    },
    version: "20260620f",
  };

  window.dispatchEvent(new CustomEvent("jarvis-sounds-ready"));
})();
