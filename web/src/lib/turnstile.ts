export interface TurnstileResult {
  success: boolean;
  /** True cuando Turnstile no está configurado · request se permite pero loggeamos warn */
  bypassed?: boolean;
  /** Códigos de error del response de Cloudflare cuando falla */
  errorCodes?: string[];
}

let warned = false;

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Valida token de Cloudflare Turnstile contra siteverify.
 * Si TURNSTILE_SECRET_KEY no está configurado → bypassed:true (UI puede no enviar token).
 * Si está configurado y token es vacío/inválido → success:false.
 */
export const verifyTurnstile = async (token: string | null, remoteIp?: string): Promise<TurnstileResult> => {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (!warned) {
      console.warn('[turnstile] TURNSTILE_SECRET_KEY missing · captcha disabled');
      warned = true;
    }
    return { success: true, bypassed: true };
  }
  if (!token) {
    return { success: false, errorCodes: ['missing-input-response'] };
  }
  const body = new URLSearchParams();
  body.append('secret', secret);
  body.append('response', token);
  if (remoteIp) body.append('remoteip', remoteIp);

  try {
    const res = await fetch(SITEVERIFY_URL, { method: 'POST', body });
    const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
    return {
      success: Boolean(data.success),
      errorCodes: data['error-codes'],
    };
  } catch (err) {
    return {
      success: false,
      errorCodes: ['network-error'],
    };
  }
};

export const _resetCache = () => {
  warned = false;
};
