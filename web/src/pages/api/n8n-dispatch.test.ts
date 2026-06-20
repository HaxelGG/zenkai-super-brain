import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
  vi.stubEnv('ZENKAI_API_KEY', 'test-secret');
  vi.stubEnv('N8N_WEBHOOK_URL', 'https://n8n.example.com/webhook/zenkai');
  vi.stubEnv('N8N_API_KEY', '');
});

const { POST } = await import('./n8n-dispatch');

const buildRequest = (init: RequestInit & { json?: unknown } = {}) => {
  const { json, ...rest } = init;
  return new Request('http://localhost/api/n8n-dispatch', {
    method: 'POST',
    body: json !== undefined ? JSON.stringify(json) : (rest.body as BodyInit | null | undefined),
    ...rest,
  });
};

const okResponse = (body = '{"received":true}') =>
  new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });

describe('POST /api/n8n-dispatch', () => {
  it('401 sin auth', async () => {
    const res = await POST({ request: buildRequest({ json: { event: 'lead.nuevo' } }) } as any);
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('400 con JSON inválido', async () => {
    const res = await POST({
      request: buildRequest({ body: 'no json', headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid json');
  });

  it('400 cuando event no es string', async () => {
    const res = await POST({
      request: buildRequest({ json: { event: 42 }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('200 happy path · postea al webhook con envelope correcto', async () => {
    mockFetch.mockResolvedValueOnce(okResponse());
    const res = await POST({
      request: buildRequest({
        json: { event: 'lead.nuevo', payload: { empresa: 'Clinica X' } },
        headers: { authorization: 'Bearer test-secret' },
      }),
    } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toEqual({ received: true });
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(String(url)).toBe('https://n8n.example.com/webhook/zenkai');
    const sent = JSON.parse((opts as RequestInit).body as string);
    expect(sent.event).toBe('lead.nuevo');
    expect(sent.payload).toEqual({ empresa: 'Clinica X' });
    expect(sent.source).toBe('zenkai-superbrain');
    expect(typeof sent.ts).toBe('string');
  });

  it('manda header x-n8n-api-key cuando N8N_API_KEY está presente', async () => {
    vi.stubEnv('N8N_API_KEY', 'n8n-secret');
    mockFetch.mockResolvedValueOnce(okResponse());
    await POST({
      request: buildRequest({
        json: { event: 'propuesta.generada' },
        headers: { 'x-zenkai-key': 'test-secret' },
      }),
    } as any);
    const [, opts] = mockFetch.mock.calls[0];
    expect((opts as RequestInit).headers).toMatchObject({ 'x-n8n-api-key': 'n8n-secret' });
  });

  it('500 cuando falta N8N_WEBHOOK_URL', async () => {
    vi.stubEnv('N8N_WEBHOOK_URL', '');
    const res = await POST({
      request: buildRequest({ json: { event: 'lead.nuevo' }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('N8N_WEBHOOK_URL missing');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('502 cuando n8n responde con error', async () => {
    mockFetch.mockResolvedValueOnce(new Response('workflow error', { status: 500 }));
    const res = await POST({
      request: buildRequest({ json: { event: 'lead.nuevo' }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('n8n call failed');
  });

  it('502 cuando fetch lanza (red caída)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network down'));
    const res = await POST({
      request: buildRequest({ json: { event: 'lead.nuevo' }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(502);
  });

  it('200 con cuerpo vacío del webhook (response=null)', async () => {
    mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));
    const res = await POST({
      request: buildRequest({ json: { event: 'ping' }, headers: { 'x-zenkai-key': 'test-secret' } }),
    } as any);
    expect(res.status).toBe(200);
    expect((await res.json()).response).toBeNull();
  });
});
