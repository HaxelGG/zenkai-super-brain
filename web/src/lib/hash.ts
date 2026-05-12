import { createHash } from 'node:crypto';

export const sha256 = (input: string): string =>
  createHash('sha256').update(input).digest('hex');

/** Extrae IP del request priorizando x-forwarded-for, fallback x-real-ip, último resort 'unknown'. */
export const getClientIp = (request: Request): string => {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xri = request.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return 'unknown';
};

export const ipHash = (request: Request): string => sha256(getClientIp(request));
