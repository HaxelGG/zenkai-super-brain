// Orquestador "Jarvis" del Super Cerebro · une las 3 capas en una sola llamada:
//   1. genera la propuesta (proposal.ts · Anthropic)
//   2. opcional: la lee en voz alta (voice.ts · ElevenLabs)
//   3. opcional: dispara un evento a n8n (n8n.ts · automatización)
//
// Voz y n8n son best-effort: si fallan, NO rompen la respuesta — se reporta el
// error en su campo y la propuesta se devuelve igual.

import { generateProposal, type ProposalOutput } from './proposal';
import { synthesizeSpeech } from './voice';
import { dispatchToN8n } from './n8n';
import { sendProposalByEmail } from './email';

export interface OrchestrateOptions {
  voice?: boolean;
  notify?: boolean;
  voiceId?: string;
  email?: string;
}

export interface N8nSummary {
  ok: boolean;
  status: number;
  error?: string;
}

export interface EmailSummary {
  ok: boolean;
  id?: string;
  error?: string;
}

export type OrchestrateResult =
  | {
      ok: true;
      proposal: ProposalOutput;
      audioBase64?: string;
      voiceError?: string;
      n8n?: N8nSummary;
      email?: EmailSummary;
    }
  | { ok: false; status: number; error: string; detail?: unknown };

/** Convierte una propuesta en un guion corto, natural, para leer en voz alta. */
export const proposalToSpeechText = (p: ProposalOutput): string =>
  [
    p.propuesta.headline + '.',
    p.propuesta.dolor_identificado,
    p.propuesta.solucion,
    `Proyección a 90 días: ${p.propuesta.proyeccion_90d}`,
  ].join(' ');

export const orchestrate = async (
  texto: string,
  opts: OrchestrateOptions = {},
): Promise<OrchestrateResult> => {
  const gen = await generateProposal(texto);
  if (!gen.ok) {
    return { ok: false, status: gen.status, error: gen.error, detail: gen.detail };
  }
  const proposal = gen.data;

  const result: Extract<OrchestrateResult, { ok: true }> = { ok: true, proposal };

  if (opts.voice) {
    const speech = await synthesizeSpeech(proposalToSpeechText(proposal), opts.voiceId);
    if (speech.ok) {
      result.audioBase64 = Buffer.from(speech.audio).toString('base64');
    } else {
      result.voiceError = speech.error;
    }
  }

  if (opts.notify) {
    const d = await dispatchToN8n('propuesta.generada', {
      sector: proposal.sector_detectado,
      tier: proposal.tier_recomendado,
      headline: proposal.propuesta.headline,
      inversion_mensual_usd: proposal.propuesta.inversion_mensual_usd,
    });
    result.n8n = d.ok
      ? { ok: true, status: d.status }
      : { ok: false, status: d.status, error: d.error };
  }

  if (opts.email) {
    try {
      const sent = await sendProposalByEmail({
        to: opts.email,
        sector: proposal.sector_detectado,
        tier: proposal.tier_recomendado,
        propuesta: proposal.propuesta,
      });
      result.email = { ok: true, id: sent.id };
    } catch (err) {
      result.email = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  return result;
};
