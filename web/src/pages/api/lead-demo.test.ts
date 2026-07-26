import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerate = vi.fn();
const mockCreateDemo = vi.fn();
const mockSendEmail = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockVerifyTurnstile = vi.fn();

vi.mock('../../lib/proposal', () => ({ generateProposal: mockGenerate }));
vi.mock('../../lib/airtable', () => ({ createDemo: mockCreateDemo }));
vi.mock('../../lib/email', () => ({ sendProposalByEmail: mockSendEmail }));
vi.mock('../../lib/rate-limit', () => ({ checkRateLimit: mockCheckRateLimit }));
vi.mock('../../lib/turnstile', () => ({ verifyTurnstile: mockVerifyTurnstile }));

const TEXTO = 'Tengo una clínica dental en Medellín, 4 odontólogos. Perdemos turnos por no contestar WhatsApp a tiempo.';

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
  mockCreateDemo.mockReset();
  mockSendEmail.mockReset();
  mockCheckRateLimit.mockReset();
  mockVerifyTurnstile.mockReset();
  // Defaults: captcha + rate limit pasan
  mockVerifyTurnstile.mockResolvedValue({ success: true, bypassed: true });
  mockCheckRateLimit.mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 0, bypassed: true });
  mockCreateDemo.mockResolvedValue({ id: 'rec123' });
  mockSendEmail.mockResolvedValue({ id: 'email123' });
});

const { POST, MIN_TEXTO, MAX_TEXTO } = await import('./lead-demo');

const buildRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/lead-demo', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...headers },
  });

describe('POST /api/lead-demo', () => {
  it('200 happy path · sin email · persiste en Airtable, no envía email', async () => {
    mockGenerate.mockResolvedValueOnce({ ok: true, data: validProposal });
    const res = await POST({ request: buildRequest({ texto: TEXTO }) } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sector_detectado).toBe('salud');
    expect(body.tier_recomendado).toBe('Starter');
    expect(mockCreateDemo).toHaveBeenCalledOnce();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('200 con email · llama a sendProposalByEmail', async () => {
    mockGenerate.mockResolvedValueOnce({ ok: true, data: validProposal });
    const res = await POST({
      request: buildRequest({ texto: TEXTO, email: 'jordy@test.com' }),
    } as any);
    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledOnce();
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.to).toBe('jordy@test.com');
    expect(call.sector).toBe('salud');
  });

  it(`400 con texto por debajo del mínimo (${MIN_TEXTO} chars)`, async () => {
    const res = await POST({ request: buildRequest({ texto: 'corto' }) } as any);
    expect(res.status).toBe(400);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('200 con un brief corto pero cualificable (antes el mínimo de 80 lo rechazaba)', async () => {
    const breve = 'Clínica dental, 3 sedes, perdemos turnos'; // 40 chars
    expect(breve.length).toBeGreaterThanOrEqual(MIN_TEXTO);
    expect(breve.length).toBeLessThan(80);
    mockGenerate.mockResolvedValueOnce({ ok: true, data: validProposal });
    const res = await POST({ request: buildRequest({ texto: breve }) } as any);
    expect(res.status).toBe(200);
    expect(mockGenerate).toHaveBeenCalledWith(breve);
  });

  it(`400 con texto por encima del máximo (${MAX_TEXTO} chars)`, async () => {
    const res = await POST({ request: buildRequest({ texto: 'a'.repeat(MAX_TEXTO + 1) }) } as any);
    expect(res.status).toBe(400);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('400 con JSON inválido', async () => {
    const res = await POST({ request: buildRequest('not json') } as any);
    expect(res.status).toBe(400);
  });

  it('429 cuando rate limit se excede', async () => {
    mockCheckRateLimit.mockResolvedValueOnce({ success: false, limit: 5, remaining: 0, reset: 12345 });
    const res = await POST({ request: buildRequest({ texto: TEXTO }) } as any);
    expect(res.status).toBe(429);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('403 cuando captcha falla', async () => {
    mockVerifyTurnstile.mockResolvedValueOnce({ success: false, errorCodes: ['invalid-input-response'] });
    const res = await POST({
      request: buildRequest({ texto: TEXTO, turnstileToken: 'bad-token' }),
    } as any);
    expect(res.status).toBe(403);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('502 cuando generateProposal falla (modelo)', async () => {
    mockGenerate.mockResolvedValueOnce({ ok: false, status: 502, error: 'anthropic call failed' });
    const res = await POST({ request: buildRequest({ texto: TEXTO }) } as any);
    expect(res.status).toBe(502);
  });

  it('200 aunque falle Airtable (best-effort, no bloquea)', async () => {
    mockGenerate.mockResolvedValueOnce({ ok: true, data: validProposal });
    mockCreateDemo.mockRejectedValueOnce(new Error('airtable down'));
    const res = await POST({ request: buildRequest({ texto: TEXTO }) } as any);
    expect(res.status).toBe(200);
  });

  it('expone x-airtable-record-id en response headers cuando persistencia OK', async () => {
    mockGenerate.mockResolvedValueOnce({ ok: true, data: validProposal });
    mockCreateDemo.mockResolvedValueOnce({ id: 'recABC123' });
    const res = await POST({ request: buildRequest({ texto: TEXTO }) } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-airtable-record-id')).toBe('recABC123');
  });

  it('NO expone x-airtable-record-id cuando persistencia falla (best-effort)', async () => {
    mockGenerate.mockResolvedValueOnce({ ok: true, data: validProposal });
    mockCreateDemo.mockRejectedValueOnce(new Error('airtable down'));
    const res = await POST({ request: buildRequest({ texto: TEXTO }) } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-airtable-record-id')).toBeNull();
  });

  // Regresión del bug real: el rate-limiter contra un Upstash caído tiraba, el throw
  // escapaba de la ruta y Vercel devolvía 500 con cuerpo VACÍO. El cliente hacía r.json()
  // sobre ese cuerpo y reventaba. El guard debe convertir cualquier throw en JSON parseable.
  it('500 con JSON parseable (no cuerpo vacío) cuando algo tira inesperadamente', async () => {
    mockCheckRateLimit.mockRejectedValueOnce(new Error('upstash unreachable'));
    const res = await POST({ request: buildRequest({ texto: TEXTO }) } as any);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe('unexpected');
    expect(typeof body.requestId).toBe('string');
    expect(body.requestId.length).toBeGreaterThan(0);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('todas las respuestas de error llevan code + requestId y el header x-request-id', async () => {
    const res = await POST({ request: buildRequest({ texto: 'corto' }) } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('invalid_input');
    expect(body.requestId).toBe(res.headers.get('x-request-id'));
  });

  it('200 también expone x-request-id para correlacionar con los logs', async () => {
    mockGenerate.mockResolvedValueOnce({ ok: true, data: validProposal });
    const res = await POST({ request: buildRequest({ texto: TEXTO }) } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-request-id')).toMatch(/^\S+$/);
  });

  it('extrae IP de x-forwarded-for y la hashea para rate limit', async () => {
    mockGenerate.mockResolvedValueOnce({ ok: true, data: validProposal });
    await POST({
      request: buildRequest({ texto: TEXTO }, { 'x-forwarded-for': '203.0.113.42' }),
    } as any);
    const ipHashArg = mockCheckRateLimit.mock.calls[0][0];
    expect(typeof ipHashArg).toBe('string');
    expect(ipHashArg).toHaveLength(64); // sha256 hex
    // No debe contener la IP en claro
    expect(ipHashArg).not.toContain('203.0.113.42');
  });
});
