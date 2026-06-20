import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
  vi.stubEnv('ZENKAI_API_KEY', 'test-secret');
  vi.stubEnv('ELEVENLABS_API_KEY', 'el-test-key');
  vi.stubEnv('ELEVENLABS_VOICE_ID', '');
  vi.stubEnv('ELEVENLABS_MODEL_ID', '');
});

const { POST } = await import('./voz');

const TEXTO = 'Tu clínica con WhatsApp 24/7 y agenda automática. Recuperás el 80% de los turnos perdidos.';

const buildRequest = (init: RequestInit & { json?: unknown } = {}) => {
  const { json, ...rest } = init;
  return new Request('http://localhost/api/voz', {
    method: 'POST',
    body: json !== undefined ? JSON.stringify(json) : (rest.body as BodyInit | null | undefined),
    ...rest,
  });
};

const audioResponse = () =>
  new Response(new Uint8Array([0x49, 0x44, 0x33, 0x04]).buffer, {
    status: 200,
    headers: { 'content-type': 'audio/mpeg' },
  });

describe('POST /api/voz', () => {
  it('401 sin auth', async () => {
    const res = await POST({ request: buildRequest({ json: { texto: TEXTO } }) } as any);
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('401 con Bearer incorrecto', async () => {
    const res = await POST({
      request: buildRequest({ json: { texto: TEXTO }, headers: { authorization: 'Bearer wrong' } }),
    } as any);
    expect(res.status).toBe(401);
  });

  it('400 con JSON inválido', async () => {
    const res = await POST({
      request: buildRequest({ body: 'no json', headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid json');
  });

  it('400 cuando texto no es string', async () => {
    const res = await POST({
      request: buildRequest({ json: { texto: 123 }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('400 cuando texto está vacío (validación de schema)', async () => {
    const res = await POST({
      request: buildRequest({ json: { texto: '' }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('200 con audio mpeg en happy path (Authorization Bearer)', async () => {
    mockFetch.mockResolvedValueOnce(audioResponse());
    const res = await POST({
      request: buildRequest({ json: { texto: TEXTO }, headers: { authorization: 'Bearer test-secret' } }),
    } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('audio/mpeg');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.length).toBe(4);
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(String(url)).toContain('api.elevenlabs.io/v1/text-to-speech/');
    expect((opts as RequestInit).headers).toMatchObject({ 'xi-api-key': 'el-test-key' });
  });

  it('usa voiceId del body cuando se provee', async () => {
    mockFetch.mockResolvedValueOnce(audioResponse());
    await POST({
      request: buildRequest({
        json: { texto: TEXTO, voiceId: 'CUSTOMVOICE123' },
        headers: { 'x-zenkai-key': 'test-secret' },
      }),
    } as any);
    const [url] = mockFetch.mock.calls[0];
    expect(String(url)).toContain('/CUSTOMVOICE123');
  });

  it('500 cuando falta ELEVENLABS_API_KEY', async () => {
    vi.stubEnv('ELEVENLABS_API_KEY', '');
    const res = await POST({
      request: buildRequest({ json: { texto: TEXTO }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('ELEVENLABS_API_KEY missing');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('502 cuando ElevenLabs responde con error', async () => {
    mockFetch.mockResolvedValueOnce(new Response('quota exceeded', { status: 429 }));
    const res = await POST({
      request: buildRequest({ json: { texto: TEXTO }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('elevenlabs call failed');
  });

  it('502 cuando fetch lanza (red caída)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network down'));
    const res = await POST({
      request: buildRequest({ json: { texto: TEXTO }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(502);
  });
});
