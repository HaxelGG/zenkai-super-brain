/**
 * JARVIS · detección de 2 palmadas para wake
 */
(function () {
  const CLAP_THRESHOLD = 0.62;
  const CLAP_SPIKE = 0.14;
  const CLAP_MIN_GAP = 90;
  const CLAP_PAIR_MAX = 950;
  const CLAP_COOLDOWN = 2800;
  const SILENCE_FLOOR = 0.04;

  let stream = null;
  let analyser = null;
  let source = null;
  let raf = null;
  let active = false;
  let prevRms = 0;
  let lastClap = 0;
  let clapsInPair = 0;
  let cooldownUntil = 0;
  let onWake = null;

  function rmsFromAnalyser(analyserNode) {
    const buf = new Float32Array(analyserNode.fftSize);
    analyserNode.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    return Math.sqrt(sum / buf.length);
  }

  function tick() {
    if (!active || !analyser) return;
    const rms = rmsFromAnalyser(analyser);
    const now = performance.now();

    if (rms > CLAP_THRESHOLD && rms - prevRms > CLAP_SPIKE && rms > SILENCE_FLOOR) {
      const gap = now - lastClap;
      if (gap > CLAP_MIN_GAP) {
        if (gap < CLAP_PAIR_MAX && clapsInPair === 1) {
          clapsInPair = 2;
          if (now >= cooldownUntil) {
            cooldownUntil = now + CLAP_COOLDOWN;
            clapsInPair = 0;
            lastClap = 0;
            onWake?.();
          }
        } else {
          clapsInPair = 1;
          lastClap = now;
        }
      }
    }

    prevRms = rms * 0.65 + prevRms * 0.35;
    raf = requestAnimationFrame(tick);
  }

  async function start(wakeCb) {
    if (active) {
      onWake = wakeCb;
      return true;
    }
    if (!navigator.mediaDevices?.getUserMedia) return false;
    onWake = wakeCb;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.15;
      source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      active = true;
      prevRms = 0;
      clapsInPair = 0;
      raf = requestAnimationFrame(tick);
      return true;
    } catch {
      stop();
      return false;
    }
  }

  function stop() {
    active = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    try {
      source?.disconnect();
    } catch {
      /* ignore */
    }
    source = null;
    analyser = null;
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    onWake = null;
    clapsInPair = 0;
    lastClap = 0;
  }

  window.JarvisClapWake = { start, stop, isActive: () => active };
})();
