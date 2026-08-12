import type { APIRoute } from 'astro';

export const prerender = false;

const N8N_WEBHOOK = import.meta.env.N8N_LEAD_WEBHOOK || '';
const RESEND_KEY = import.meta.env.RESEND_API_KEY || '';
const NOTIFY_EMAIL = 'hola@zenkai.systems';

const ipAttempts = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000;

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const record = ipAttempts.get(ip);

    if (record && now < record.reset) {
      if (record.count >= RATE_LIMIT) {
        return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Espera un momento.' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil((record.reset - now) / 1000)) },
        });
      }
      record.count++;
    } else {
      ipAttempts.set(ip, { count: 1, reset: now + RATE_WINDOW });
    }

    if (ipAttempts.size > 10000) ipAttempts.clear();

    const body = await request.json();
    const { nombre, email, fuente, pagina } = body;

    if (!nombre || !email) {
      return new Response(JSON.stringify({ error: 'nombre y email requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lead = {
      nombre: String(nombre).trim(),
      email: String(email).trim().toLowerCase(),
      fuente: String(fuente || 'web-oferta-sorpresa'),
      pagina: String(pagina || ''),
      timestamp: new Date().toISOString(),
      ip,
    };

    if (N8N_WEBHOOK) {
      fetch(N8N_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      }).catch(() => {});
    }

    if (RESEND_KEY) {
      // Email al equipo
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from: 'Zenkai Leads <leads@zenkai.systems>',
          to: [NOTIFY_EMAIL],
          subject: `Nuevo lead: ${lead.nombre}`,
          html: `<h2>Nuevo lead desde la web</h2><p><strong>Nombre:</strong> ${lead.nombre}</p><p><strong>Email:</strong> ${lead.email}</p><p><strong>Fuente:</strong> ${lead.fuente}</p><p><strong>Pagina:</strong> ${lead.pagina}</p><p><strong>Fecha:</strong> ${lead.timestamp}</p>`,
        }),
      }).catch(() => {});

      // Email de bienvenida al lead
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from: 'Zenkai <hola@zenkai.systems>',
          to: [lead.email],
          subject: 'Tu oferta sorpresa de Zenkai',
          html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;color:#e4e4e7;background:#0d0d1a;border-radius:12px;border:1px solid #1f1f2c">
            <h2 style="color:#f5f5fa">Hola ${lead.nombre},</h2>
            <p style="color:#a1a1aa;line-height:1.6">Gracias por dejar tus datos en zenkai.systems. Como prometido, aqui tienes tu <strong style="color:#f5f5fa">oferta sorpresa</strong>:</p>
            <div style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.05));border:1px solid rgba(99,102,241,0.2);border-radius:8px;padding:20px;margin:16px 0">
              <p style="font-size:24px;font-weight:700;color:#f5f5fa;margin:0 0 8px">Plan Zenkai por 450€</p>
              <p style="color:#a1a1aa;margin:0;font-size:14px">50€ de descuento sobre el precio normal de implementacion. Solo por haber llegado hasta aqui.</p>
            </div>
            <p style="color:#a1a1aa;line-height:1.6">El plan incluye <strong style="color:#f5f5fa">todo</strong>: web, CRM, agente de ventas IA, atencion al cliente, facturacion, agenda y diagnosticos.</p>
            <p style="color:#a1a1aa;line-height:1.6">Si quieres activarlo, solo tienes que responder a este email o escribirnos por WhatsApp al <strong style="color:#22c55e">+34 622 874 482</strong>.</p>
            <p style="color:#a1a1aa;line-height:1.6">La oferta expira en 48 horas. Luego el precio vuelve a 500€.</p>
            <p style="color:#71717a;font-size:12px;margin-top:20px">Zenkai Growth Systems · Sin spam, sin llamadas · Te das de baja cuando quieras</p>
          </div>`,
        }),
      }).catch(() => {});
    }

    console.log(JSON.stringify({ event: 'lead_capturado', ...lead }));

    return new Response(JSON.stringify({ success: true, message: 'Lead registrado' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Lead API error:', e);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
