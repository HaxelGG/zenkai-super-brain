import { Resend } from 'resend';

export interface PropuestaEmailPayload {
  to: string;
  sector: string;
  tier: string;
  propuesta: {
    headline: string;
    dolor_identificado: string;
    solucion: string;
    agentes_activos: string[];
    stack: string[];
    timeline_dias: number;
    inversion_mensual_usd: number;
    proyeccion_90d: string;
  };
}

let cachedClient: Resend | null = null;

const getClient = (): Resend => {
  if (cachedClient) return cachedClient;
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('email not configured · RESEND_API_KEY missing');
  cachedClient = new Resend(apiKey);
  return cachedClient;
};

const renderHtml = (p: PropuestaEmailPayload): string => `
<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"/><title>Tu propuesta · ZENKAI</title></head>
<body style="font-family: -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; background: #ffffff;">
  <h1 style="color: #1E6FFF; font-size: 24px; margin: 0 0 8px;">Tu propuesta personalizada</h1>
  <p style="color: #666; margin: 0 0 24px; font-size: 14px;">Sector detectado: <strong>${p.sector}</strong> · Tier recomendado: <strong>${p.tier}</strong></p>

  <h2 style="font-size: 18px; margin: 24px 0 8px;">${p.propuesta.headline}</h2>

  <div style="background: #f5f7fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <div style="font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 0.1em;">Dolor identificado</div>
    <div style="margin-top: 4px;">${p.propuesta.dolor_identificado}</div>
  </div>

  <div style="background: #f5f7fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <div style="font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 0.1em;">Solución</div>
    <div style="margin-top: 4px;">${p.propuesta.solucion}</div>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr><td style="padding: 8px 0; color: #666;">Agentes activos:</td><td style="padding: 8px 0;"><strong>${p.propuesta.agentes_activos.join(' · ')}</strong></td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Stack:</td><td style="padding: 8px 0;"><strong>${p.propuesta.stack.join(' · ')}</strong></td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Timeline:</td><td style="padding: 8px 0;"><strong>${p.propuesta.timeline_dias} días</strong></td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Inversión:</td><td style="padding: 8px 0;"><strong>$${p.propuesta.inversion_mensual_usd} USD/mes</strong></td></tr>
  </table>

  <div style="background: #1E6FFF; color: #fff; padding: 16px; border-radius: 8px; margin: 24px 0;">
    <div style="font-size: 12px; text-transform: uppercase; opacity: 0.8; letter-spacing: 0.1em;">Proyección a 90 días</div>
    <div style="margin-top: 4px; font-size: 16px;">${p.propuesta.proyeccion_90d}</div>
  </div>

  <p style="font-size: 12px; color: #888; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee;">
    Generado por ZENKAI Growth Systems · Si querés discutirla, agendá 30 min: <a href="https://cal.com/zenkai-growth-systems/strategy-call" style="color: #1E6FFF;">cal.com/zenkai-growth-systems/strategy-call</a>
  </p>
</body></html>`;

export const sendProposalByEmail = async (payload: PropuestaEmailPayload): Promise<{ id: string }> => {
  const client = getClient();
  // Override via ZENKAI_FROM_EMAIL acepta formato "Nombre <email>" o solo "email"
  const from = import.meta.env.ZENKAI_FROM_EMAIL ?? 'ZENKAI <hola@zenkai.systems>';
  const result = await client.emails.send({
    from,
    to: payload.to,
    replyTo: 'hola@zenkai.systems',
    subject: `Tu propuesta personalizada · ZENKAI · ${payload.tier}`,
    html: renderHtml(payload),
  });
  if (result.error) throw new Error(`resend send failed: ${result.error.message}`);
  if (!result.data?.id) throw new Error('resend did not return an id');
  return { id: result.data.id };
};

export const _resetCache = () => {
  cachedClient = null;
};
