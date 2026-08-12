import type { APIRoute } from 'astro';

export const prerender = false;

const N8N_WEBHOOK = import.meta.env.N8N_LEAD_WEBHOOK || '';
const RESEND_KEY = import.meta.env.RESEND_API_KEY || '';
const NOTIFY_EMAIL = 'hola@zenkai.systems';

export const POST: APIRoute = async ({ request }) => {
  try {
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
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
    };

    // Enviar a n8n si hay webhook configurado
    if (N8N_WEBHOOK) {
      try {
        await fetch(N8N_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        });
      } catch (e) {
        console.error('n8n webhook error:', e);
      }
    } else {
      console.warn('N8N_LEAD_WEBHOOK no configurado. El lead solo se guarda en logs.');
    }

    // Enviar notificacion por email con Resend (fallback)
    if (RESEND_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_KEY}`,
          },
          body: JSON.stringify({
            from: 'Zenkai Leads <leads@zenkai.systems>',
            to: [NOTIFY_EMAIL],
            subject: `Nuevo lead: ${lead.nombre}`,
            html: `<h2>Nuevo lead desde la web</h2>
              <p><strong>Nombre:</strong> ${lead.nombre}</p>
              <p><strong>Email:</strong> ${lead.email}</p>
              <p><strong>Fuente:</strong> ${lead.fuente}</p>
              <p><strong>Pagina:</strong> ${lead.pagina}</p>
              <p><strong>Fecha:</strong> ${lead.timestamp}</p>`,
          }),
        });
      } catch (e) {
        console.error('Resend email error:', e);
      }
    }

    // Log estructurado para Vercel Logs
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
