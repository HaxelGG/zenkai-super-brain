import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
  };
});

beforeEach(() => {
  mockCreate.mockReset();
  vi.stubEnv('ZENKAI_API_KEY', 'test-secret');
  vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test');
});

const { POST } = await import('./protocolo');

const TEXTO_VALIDO =
  'Tengo una clínica dental en Medellín con 4 odontólogos. Atendemos 30 pacientes por día y perdemos turnos por no contestar WhatsApp a tiempo.';

const buildRequest = (init: RequestInit & { json?: unknown } = {}) => {
  const { json, ...rest } = init;
  return new Request('http://localhost/api/protocolo', {
    method: 'POST',
    body: json !== undefined ? JSON.stringify(json) : (rest.body as BodyInit | null | undefined),
    ...rest,
  });
};

const validModelResponse = {
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        sector_detectado: 'salud',
        tier_recomendado: 'Starter',
        propuesta: {
          headline: 'Tu clínica con WhatsApp 24/7 y agenda automática',
          dolor_identificado: 'Perdés turnos por no contestar a tiempo.',
          solucion: 'Construimos un agente que califica leads y agenda en Cal.com.',
          agentes_activos: ['ECHO', 'HERMES', 'ATLAS'],
          stack: ['WhatsApp Cloud API', 'Cal.com', 'Airtable'],
          timeline_dias: 14,
          inversion_mensual_usd: 600,
          proyeccion_90d: 'Recuperás 80% de turnos perdidos en 90 días.',
        },
      }),
    },
  ],
};

describe('POST /api/protocolo', () => {
  it('401 sin x-zenkai-key', async () => {
    const res = await POST({
      request: buildRequest({ json: { texto: TEXTO_VALIDO } }),
    } as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('unauthorized');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('401 con x-zenkai-key incorrecta', async () => {
    const res = await POST({
      request: buildRequest({
        json: { texto: TEXTO_VALIDO },
        headers: { 'x-zenkai-key': 'wrong' },
      }),
    } as any);
    expect(res.status).toBe(401);
  });

  it('400 con texto menor a 80 chars', async () => {
    const res = await POST({
      request: buildRequest({
        json: { texto: 'corto' },
        headers: { 'x-zenkai-key': 'test-secret' },
      }),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid input');
  });

  it('400 con JSON inválido en body', async () => {
    const res = await POST({
      request: buildRequest({
        body: 'no es json',
        headers: { 'x-zenkai-key': 'test-secret' },
      }),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid json');
  });

  it('200 con respuesta válida del modelo', async () => {
    mockCreate.mockResolvedValueOnce(validModelResponse);
    const res = await POST({
      request: buildRequest({
        json: { texto: TEXTO_VALIDO },
        headers: { 'x-zenkai-key': 'test-secret' },
      }),
    } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sector_detectado).toBe('salud');
    expect(body.tier_recomendado).toBe('Starter');
    expect(body.propuesta.agentes_activos).toContain('ECHO');
    expect(mockCreate).toHaveBeenCalledOnce();
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe('claude-sonnet-4-6');
  });

  it('502 cuando el modelo devuelve JSON inválido', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'esto no es JSON parseable {{ broken' }],
    });
    const res = await POST({
      request: buildRequest({
        json: { texto: TEXTO_VALIDO },
        headers: { 'x-zenkai-key': 'test-secret' },
      }),
    } as any);
    expect(res.status).toBe(502);
  });

  it('502 cuando el modelo devuelve schema inválido (sector inexistente)', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            sector_detectado: 'aerospace',
            tier_recomendado: 'Starter',
            propuesta: validModelResponse.content[0].text
              ? JSON.parse(validModelResponse.content[0].text).propuesta
              : {},
          }),
        },
      ],
    });
    const res = await POST({
      request: buildRequest({
        json: { texto: TEXTO_VALIDO },
        headers: { 'x-zenkai-key': 'test-secret' },
      }),
    } as any);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('schema del modelo inválido');
  });
});
