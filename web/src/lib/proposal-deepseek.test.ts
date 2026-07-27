import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
  vi.unstubAllEnvs();
  vi.stubEnv('LLM_PROVIDER', 'deepseek');
  vi.stubEnv('DEEPSEEK_API_KEY', 'sk-deepseek-test');
});

const { generateProposal } = await import('./proposal');

const TEXTO =
  'Tengo una clínica dental en Medellín con 4 odontólogos. Atendemos 30 pacientes por día y perdemos turnos por no contestar WhatsApp a tiempo.';

const validJson = JSON.stringify({
  sector_detectado: 'salud',
  tier_recomendado: 'Starter',
  modulos_recomendados: ['customer-ai'],
  propuesta: {
    headline: 'Tu clínica con WhatsApp 24/7',
    dolor_identificado: 'Perdés turnos.',
    solucion: 'Construimos un agente.',
    stack: ['WhatsApp Cloud API', 'Cal.com'],
    timeline_dias: 14,
    proyeccion_90d: 'Recuperás 80% de turnos.',
  },
});

const deepseekResponse = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

describe('generateProposal · proveedor DeepSeek', () => {
  it('400 con texto inválido (no llama al proveedor)', async () => {
    const r = await generateProposal('corto');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('200 happy path · pega a api.deepseek.com con Bearer y devuelve propuesta', async () => {
    mockFetch.mockResolvedValueOnce(deepseekResponse(validJson));
    const r = await generateProposal(TEXTO);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.sector_detectado).toBe('salud');
      expect(r.data.tier_recomendado).toBe('Starter');
    }
    const [url, opts] = mockFetch.mock.calls[0];
    expect(String(url)).toBe('https://api.deepseek.com/chat/completions');
    expect((opts as RequestInit).headers).toMatchObject({ authorization: 'Bearer sk-deepseek-test' });
    const sent = JSON.parse((opts as RequestInit).body as string);
    expect(sent.model).toBe('deepseek-chat');
  });

  it('500 server misconfigured cuando falta DEEPSEEK_API_KEY', async () => {
    vi.stubEnv('DEEPSEEK_API_KEY', '');
    const r = await generateProposal(TEXTO);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(500);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('502 cuando DeepSeek responde error HTTP', async () => {
    mockFetch.mockResolvedValueOnce(new Response('rate limited', { status: 429 }));
    const r = await generateProposal(TEXTO);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(502);
      expect(r.error).toBe('deepseek call failed');
    }
  });

  it('502 schema inválido cuando el modelo devuelve sector inexistente', async () => {
    mockFetch.mockResolvedValueOnce(
      deepseekResponse(JSON.stringify({ sector_detectado: 'aerospace', tier_recomendado: 'Starter',
  modulos_recomendados: ['customer-ai'], propuesta: {} })),
    );
    const r = await generateProposal(TEXTO);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('schema del modelo inválido');
  });
});
