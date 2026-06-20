import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerate = vi.fn();
const mockSynth = vi.fn();
const mockDispatch = vi.fn();

vi.mock('../../lib/proposal', () => ({ generateProposal: mockGenerate }));
vi.mock('../../lib/voice', () => ({ synthesizeSpeech: mockSynth }));
vi.mock('../../lib/n8n', () => ({ dispatchToN8n: mockDispatch }));

const validProposal = {
  sector_detectado: 'salud',
  tier_recomendado: 'Starter',
  propuesta: {
    headline: 'Tu clínica con WhatsApp 24/7',
    dolor_identificado: 'Perdés turnos.',
    solucion: 'Construimos un agente.',
    agentes_activos: ['ECHO', 'HERMES'],
    stack: ['WhatsApp Cloud API', 'Cal.com'],
    timeline_dias: 14,
    inversion_mensual_usd: 600,
    proyeccion_90d: 'Recuperás 80% de turnos.',
  },
};

beforeEach(() => {
  mockGenerate.mockReset();
  mockSynth.mockReset();
  mockDispatch.mockReset();
  vi.stubEnv('ZENKAI_API_KEY', 'test-secret');
  mockGenerate.mockResolvedValue({ ok: true, data: validProposal });
  mockSynth.mockResolvedValue({ ok: true, audio: new Uint8Array([1, 2, 3]).buffer, contentType: 'audio/mpeg' });
  mockDispatch.mockResolvedValue({ ok: true, status: 200, response: null });
});

const { POST } = await import('./orquestar');

const buildRequest = (init: RequestInit & { json?: unknown } = {}) => {
  const { json, ...rest } = init;
  return new Request('http://localhost/api/orquestar', {
    method: 'POST',
    body: json !== undefined ? JSON.stringify(json) : (rest.body as BodyInit | null | undefined),
    headers: { 'content-type': 'application/json', ...(rest.headers ?? {}) },
    ...rest,
  });
};

const TEXTO = 'Tengo una clínica dental en Medellín, 4 odontólogos. Perdemos turnos por no contestar WhatsApp a tiempo.';

describe('POST /api/orquestar', () => {
  it('401 sin auth', async () => {
    const res = await POST({ request: buildRequest({ json: { texto: TEXTO } }) } as any);
    expect(res.status).toBe(401);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('400 cuando texto no es string', async () => {
    const res = await POST({
      request: buildRequest({ json: { texto: 1 }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(400);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('200 solo propuesta · sin voz ni notify', async () => {
    const res = await POST({
      request: buildRequest({ json: { texto: TEXTO }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.proposal.sector_detectado).toBe('salud');
    expect(body.audioBase64).toBeUndefined();
    expect(body.n8n).toBeUndefined();
    expect(mockSynth).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('200 con voice:true · incluye audioBase64', async () => {
    const res = await POST({
      request: buildRequest({ json: { texto: TEXTO, voice: true }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.audioBase64).toBe('string');
    expect(body.audioBase64.length).toBeGreaterThan(0);
    expect(mockSynth).toHaveBeenCalledOnce();
  });

  it('200 con notify:true · llama a n8n y resume el resultado', async () => {
    const res = await POST({
      request: buildRequest({ json: { texto: TEXTO, notify: true }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.n8n).toEqual({ ok: true, status: 200 });
    expect(mockDispatch).toHaveBeenCalledOnce();
    expect(mockDispatch.mock.calls[0][0]).toBe('propuesta.generada');
  });

  it('voz best-effort · si falla, voiceError presente y la propuesta sigue OK', async () => {
    mockSynth.mockResolvedValueOnce({ ok: false, status: 500, error: 'ELEVENLABS_API_KEY missing' });
    const res = await POST({
      request: buildRequest({ json: { texto: TEXTO, voice: true }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.audioBase64).toBeUndefined();
    expect(body.voiceError).toBe('ELEVENLABS_API_KEY missing');
    expect(body.proposal).toBeDefined();
  });

  it('n8n best-effort · si falla, n8n.ok=false pero 200', async () => {
    mockDispatch.mockResolvedValueOnce({ ok: false, status: 500, error: 'N8N_WEBHOOK_URL missing' });
    const res = await POST({
      request: buildRequest({ json: { texto: TEXTO, notify: true }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.n8n).toEqual({ ok: false, status: 500, error: 'N8N_WEBHOOK_URL missing' });
  });

  it('502 cuando generateProposal falla', async () => {
    mockGenerate.mockResolvedValueOnce({ ok: false, status: 502, error: 'anthropic call failed' });
    const res = await POST({
      request: buildRequest({ json: { texto: TEXTO, voice: true }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(502);
    expect(mockSynth).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
