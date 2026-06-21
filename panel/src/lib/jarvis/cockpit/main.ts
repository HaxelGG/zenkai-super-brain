import { apiBase, authHeaders, fetchWithTimeout, readApiKey } from "../api";
import {
  classificationHtml,
  proposalHtml,
  execLineHtml,
  type PlanResponse,
} from "./stages";

const $ = (id: string): HTMLElement | null => document.getElementById(id);
const input = $("jvc-input") as HTMLTextAreaElement | null;
const goBtn = $("jvc-go") as HTMLButtonElement | null;
const resetBtn = $("jvc-reset") as HTMLButtonElement | null;
if (!input || !goBtn) throw new Error("cockpit: faltan #jvc-input / #jvc-go");

let currentJobId: string | null = null;

function setStage(id: string, cls: "" | "is-active" | "is-done" | "is-rej"): void {
  const el = $(id);
  if (el) el.className = `jvc-stage${cls ? " " + cls : ""}`;
}
function setNote(id: string, text: string): void {
  const el = $(id);
  if (el) el.textContent = text;
}
function setDetail(id: string, html: string): void {
  const el = $(id);
  if (el) el.innerHTML = html;
}

function reset(): void {
  currentJobId = null;
  ["jvc-s1", "jvc-s2", "jvc-s3", "jvc-s4", "jvc-s5"].forEach((s) => setStage(s, ""));
  setNote("jvc-s1-note", "listo");
  ["jvc-s2-note", "jvc-s3-note", "jvc-s4-note", "jvc-s5-note"].forEach((n) => setNote(n, "—"));
  ["jvc-s2-detail", "jvc-s3-detail", "jvc-s4-detail", "jvc-s5-detail"].forEach((d) => setDetail(d, ""));
}

async function decide(action: "approve" | "reject"): Promise<void> {
  if (!currentJobId) return;
  if (action === "approve" && !currentJobId.startsWith("rec")) {
    setStage("jvc-s4", "is-done");
    setNote("jvc-s4-note", "modo demo");
    setStage("jvc-s5", "is-done");
    setDetail("jvc-s5-detail", execLineHtml("Sin AIRTABLE_TOKEN · job demo, no se persiste", true));
    return;
  }
  setStage("jvc-s4", "is-done");
  setNote("jvc-s4-note", action === "approve" ? "aprobado" : "rechazado");
  if (action === "reject") {
    setStage("jvc-s4", "is-rej");
    setDetail("jvc-s4-detail", `<div class="jvc-proj" style="color:#ff5470">Rechazado · JARVIS reformula. No se ejecutó nada.</div>`);
    return;
  }
  setStage("jvc-s5", "is-active");
  setNote("jvc-s5-note", "ejecutando…");
  try {
    const res = await fetchWithTimeout(
      `${apiBase(location.hostname)}/api/agency/jobs`,
      {
        method: "POST",
        headers: authHeaders(readApiKey()),
        body: JSON.stringify({ action: "approve", jobId: currentJobId }),
      },
      60000,
    );
    const data = (await res.json()) as { ok?: boolean; built?: boolean; phase?: string; error?: string };
    if (!res.ok || data.ok === false) {
      setDetail("jvc-s5-detail", execLineHtml(`Error: ${data.error ?? res.status}`, false));
      return;
    }
    const msg = data.built === false
      ? "Propuesta aprobada · build real llega en Fase 2"
      : "Ejecución completa";
    setDetail("jvc-s5-detail", execLineHtml(msg, true));
    setStage("jvc-s5", "is-done");
    setNote("jvc-s5-note", "done");
  } catch {
    setDetail("jvc-s5-detail", execLineHtml("Sin conexión con el cerebro JARVIS", false));
  }
}

function renderGate(jobId: string): void {
  currentJobId = jobId;
  const safeId = jobId.replace(/[^\w-]/g, "");
  setStage("jvc-s4", "is-active");
  setNote("jvc-s4-note", "esperando tu decisión");
  setDetail(
    "jvc-s4-detail",
    `<div class="jvc-detail">Job <code>${safeId}</code> · <code>pending_approval</code>. Nada se ejecuta hasta que aprobás.</div>
     <div class="jvc-gate">
       <button class="jvc-btn" id="jvc-approve" type="button">✓ Aprobar</button>
       <button class="jvc-btn jvc-btn-ghost" id="jvc-reject" type="button">✕ Rechazar</button>
     </div>`,
  );
  $("jvc-approve")?.addEventListener("click", () => void decide("approve"));
  $("jvc-reject")?.addEventListener("click", () => void decide("reject"));
}

async function process(): Promise<void> {
  const text = (input!.value || "").trim();
  if (text.length < 12) {
    setNote("jvc-s1-note", "escribí algo más concreto");
    return;
  }
  reset();
  goBtn!.disabled = true;
  setStage("jvc-s1", "is-done");
  setNote("jvc-s1-note", "recibido");
  setStage("jvc-s2", "is-active");
  setNote("jvc-s2-note", "analizando…");
  try {
    const res = await fetchWithTimeout(
      `${apiBase(location.hostname)}/api/agency/plan`,
      { method: "POST", headers: authHeaders(readApiKey()), body: JSON.stringify({ instruction: text }) },
      45000,
    );
    if (res.status === 401 || res.status === 403) {
      setStage("jvc-s2", "is-rej");
      setNote("jvc-s2-note", "sin autorización");
      setDetail("jvc-s2-detail", `<div class="jvc-detail">Pegá tu ZENKAI_API_KEY en la consola de voz (⋯) del header.</div>`);
      return;
    }
    if (!res.ok) {
      setStage("jvc-s2", "is-rej");
      setNote("jvc-s2-note", `error ${res.status}`);
      return;
    }
    const data = (await res.json()) as PlanResponse;
    setStage("jvc-s2", "is-done");
    setNote("jvc-s2-note", `confianza ${Math.round(data.classification.confianza * 100)}%`);
    setDetail("jvc-s2-detail", classificationHtml(data.classification));
    setStage("jvc-s3", "is-active");
    setNote("jvc-s3-note", "redactando…");
    setStage("jvc-s3", "is-done");
    setNote("jvc-s3-note", `tier ${data.proposal.tier_recomendado}`);
    setDetail("jvc-s3-detail", proposalHtml(data.proposal));
    renderGate(data.job.id);
  } catch {
    setStage("jvc-s2", "is-rej");
    setNote("jvc-s2-note", "sin conexión");
    setDetail("jvc-s2-detail", `<div class="jvc-detail">Sin conexión con el cerebro JARVIS.</div>`);
  } finally {
    goBtn!.disabled = false;
  }
}

goBtn.addEventListener("click", () => void process());
resetBtn?.addEventListener("click", reset);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    void process();
  }
});
window.addEventListener("jarvis-voice-command", (e) => {
  const detail = (e as CustomEvent<{ text?: string }>).detail;
  if (detail?.text && input) {
    input.value = detail.text;
    void process();
  }
});
reset();
