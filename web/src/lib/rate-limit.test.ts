import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks de las dependencias Upstash · controlamos qué hace limiter.limit().
const mockLimit = vi.fn();
const mockSlidingWindow = vi.fn(() => 'sliding-window-config');

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({})),
}));
vi.mock('@upstash/ratelimit', () => {
  const Ratelimit = vi.fn(() => ({ limit: mockLimit }));
  // slidingWindow es método estático usado en getLimiter()
  (Ratelimit as unknown as { slidingWindow: typeof mockSlidingWindow }).slidingWindow =
    mockSlidingWindow;
  return { Ratelimit };
});

const { checkRateLimit, _resetCache } = await import('./rate-limit');

const configure = () => {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://fake-upstash.example');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'fake-token');
};

beforeEach(() => {
  mockLimit.mockReset();
  mockSlidingWindow.mockReset();
  mockSlidingWindow.mockReturnValue('sliding-window-config');
  _resetCache();
  vi.unstubAllEnvs();
});

describe('checkRateLimit', () => {
  it('FAIL-OPEN: si limiter.limit() lanza (Upstash caído/credenciales inválidas), NO propaga el throw · degrada como "no configurado"', async () => {
    configure();
    mockLimit.mockRejectedValueOnce(new Error('upstash unreachable'));

    // No debe rechazar: debe resolver con success:true bypassed:true (igual que el no-op).
    const res = await checkRateLimit('deadbeef'.repeat(8));

    expect(res.success).toBe(true);
    expect(res.bypassed).toBe(true);
  });

  it('bypassed:true cuando Upstash NO está configurado (sin env)', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    const res = await checkRateLimit('hash');

    expect(res.success).toBe(true);
    expect(res.bypassed).toBe(true);
    expect(mockLimit).not.toHaveBeenCalled();
  });

  it('pass-through cuando el limiter permite la request', async () => {
    configure();
    mockLimit.mockResolvedValueOnce({ success: true, limit: 5, remaining: 4, reset: 123 });

    const res = await checkRateLimit('hash');

    expect(res.success).toBe(true);
    expect(res.remaining).toBe(4);
    expect(res.bypassed).toBeFalsy();
  });

  it('pass-through cuando el limiter excede el límite (success:false → 429 aguas arriba)', async () => {
    configure();
    mockLimit.mockResolvedValueOnce({ success: false, limit: 5, remaining: 0, reset: 999 });

    const res = await checkRateLimit('hash');

    expect(res.success).toBe(false);
    expect(res.remaining).toBe(0);
  });
});
