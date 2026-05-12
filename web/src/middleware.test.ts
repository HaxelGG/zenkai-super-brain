import { describe, it, expect, vi } from 'vitest';

// astro:middleware es un módulo virtual de Astro · stub para vitest standalone
vi.mock('astro:middleware', () => ({
  defineMiddleware: <T>(fn: T) => fn,
}));

const { onRequest } = await import('./middleware');

const buildContext = (headers: Record<string, string>, pathname = '/api/test') => {
  const request = new Request(`http://localhost${pathname}`, { method: 'GET', headers });
  return {
    request,
    url: new URL(`http://localhost${pathname}`),
    cookies: {} as any,
    locals: {},
    redirect: vi.fn(),
    rewrite: vi.fn(),
    site: undefined,
    generator: 'test',
    params: {},
    props: {},
    routePattern: '/test',
    originPathname: '/test',
    isPrerendered: false,
    preferredLocale: undefined,
    preferredLocaleList: undefined,
    currentLocale: undefined,
    routeData: {} as any,
    getActionResult: vi.fn(),
    callAction: vi.fn(),
    session: undefined,
    insertDirective: vi.fn(),
    insertScriptHash: vi.fn(),
    insertScriptResource: vi.fn(),
    insertStyleHash: vi.fn(),
    insertStyleResource: vi.fn(),
    clientAddress: '127.0.0.1',
  };
};

describe('middleware · CVE x-astro-path mitigation', () => {
  it('filtra header x-astro-path (con guión)', async () => {
    const ctx = buildContext({ 'x-astro-path': '/admin', 'x-other': 'keep' });
    const next = vi.fn().mockResolvedValue(new Response('ok'));
    await onRequest(ctx as any, next);
    expect(ctx.request.headers.get('x-astro-path')).toBeNull();
    expect(ctx.request.headers.get('x-other')).toBe('keep');
  });

  it('filtra header x_astro_path (con underscore · variante)', async () => {
    const ctx = buildContext({ 'x_astro_path': '/admin', 'authorization': 'Bearer token' });
    const next = vi.fn().mockResolvedValue(new Response('ok'));
    await onRequest(ctx as any, next);
    expect(ctx.request.headers.get('x_astro_path')).toBeNull();
    expect(ctx.request.headers.get('authorization')).toBe('Bearer token');
  });

  it('llama a next() siempre (sin bloquear request)', async () => {
    const ctx = buildContext({ 'x-astro-path': '/admin' });
    const next = vi.fn().mockResolvedValue(new Response('ok'));
    await onRequest(ctx as any, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('passthrough sin tocar headers cuando no hay forbidden', async () => {
    const ctx = buildContext({ 'authorization': 'Bearer abc', 'content-type': 'application/json' });
    const originalRequest = ctx.request;
    const next = vi.fn().mockResolvedValue(new Response('ok'));
    await onRequest(ctx as any, next);
    expect(ctx.request).toBe(originalRequest);
  });

  it('skip filter cuando pathname no empieza con /api/ (páginas estáticas)', async () => {
    const ctx = buildContext({ 'x-astro-path': '/admin' }, '/');
    const next = vi.fn().mockResolvedValue(new Response('ok'));
    await onRequest(ctx as any, next);
    // No filtra · header sigue presente porque la ruta no es /api/*
    expect(ctx.request.headers.get('x-astro-path')).toBe('/admin');
    expect(next).toHaveBeenCalledOnce();
  });
});
