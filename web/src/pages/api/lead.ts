import type { APIRoute } from 'astro';

export const prerender = false;

const N8N_WEBHOOK = import.meta.env.N8N_LEAD_WEBHOOK || '';

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
    }

    console.log('Lead capturado:', JSON.stringify(lead));

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
