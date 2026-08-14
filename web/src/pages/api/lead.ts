import type { APIRoute } from 'astro';

export const prerender = false;

const N8N_WEBHOOK = import.meta.env.N8N_LEAD_WEBHOOK || '';
const RESEND_KEY = import.meta.env.RESEND_API_KEY || '';
const DEEPSEEK_KEY = import.meta.env.DEEPSEEK_API_KEY || '';
const NOTIFY_EMAIL = 'hola@zenkai.systems';

const ipAttempts = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000;

async function generateReport(nombre: string): Promise<string | null> {
  if (!DEEPSEEK_KEY) return null;
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Eres el Analista de Oportunidades de IA de ZENKAI. Genera un Informe de Oportunidades de IA personalizado para un lead empresarial.
Formato HTML limpio (usa <h3>, <p>, <ul>, <li>, <strong>, sin markdown).
El informe debe incluir:
1. Saludo personalizado con el nombre del lead
2. Las 3 principales oportunidades de IA para su empresa
3. Areas de impacto estimadas (tiempo ahorrado, potencial de ingresos, reduccion de costes) usando rangos realistas como "tipicamente 10-20 horas ahorradas por semana", nunca metricas exactas inventadas
4. Soluciones ZENKAI recomendadas
5. CTA claro para el siguiente paso

Contexto de planes: Starter (95€/mes) = web, CRM, 1 agente IA, diagnosticos. Growth (440€/mes) = 4 agentes IA, 2 campanas publicitarias incluidas, 12 piezas de contenido, SEO, gestor de resenas, analisis competitivo. Enterprise = custom.
Menos de 500 palabras. Profesional, en espanol.`,
          },
          {
            role: 'user',
            content: `Genera un informe para: Nombre: ${nombre}`,
          },
        ],
        max_tokens: 900,
        temperature: 0.7,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error('Report generation error:', e);
    return null;
  }
}

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

    const cleanNombre = String(nombre).trim();
    const lead = {
      nombre: cleanNombre,
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

    // Generar informe IA
    const report = await generateReport(cleanNombre);

    if (RESEND_KEY) {
      // Email al equipo
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from: 'Zenkai Leads <leads@zenkai.systems>',
          to: [NOTIFY_EMAIL],
          subject: `Nuevo lead: ${lead.nombre}`,
          html: `<h2>Nuevo lead desde la web</h2><p><strong>Nombre:</strong> ${lead.nombre}</p><p><strong>Email:</strong> ${lead.email}</p><p><strong>Fuente:</strong> ${lead.fuente}</p><p><strong>Informe IA generado:</strong> ${report ? 'Si' : 'No (fallback)'}</p>`,
        }),
      }).catch(() => {});

      // Email al lead con el informe IA
      const leadHtml = report
        ? `<div style="font-family:system-ui,sans-serif;max-width:540px;margin:0 auto;padding:24px;color:#e4e4e7;background:#0d0d1a;border-radius:12px;border:1px solid #1f1f2c">
            <h2 style="color:#f5f5fa;margin:0 0 4px">Tu Informe de Oportunidades de IA</h2>
            <p style="color:#a1a1aa;margin:0 0 20px;font-size:14px">Preparado por ZENKAI para ${lead.nombre}</p>
            ${report}
            <hr style="border:none;border-top:1px solid #1f1f2c;margin:20px 0" />
            <p style="color:#a1a1aa;font-size:12px">ZENKAI · Infraestructura de IA Empresarial · hola@zenkai.systems</p>
          </div>`
        : `<div style="font-family:system-ui,sans-serif;max-width:540px;margin:0 auto;padding:24px;color:#e4e4e7;background:#0d0d1a;border-radius:12px">
            <h2 style="color:#f5f5fa">Gracias por tu interes, ${lead.nombre}!</h2>
            <p style="color:#a1a1aa">Hemos recibido tus datos. Nuestro equipo te contactara en menos de 4 horas laborables.</p>
          </div>`;

      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from: 'Zenkai <hola@zenkai.systems>',
          to: [lead.email],
          subject: 'Tu Informe de Oportunidades de IA',
          html: leadHtml,
        }),
      }).catch(() => {});
    }

    console.log(JSON.stringify({ event: 'lead_capturado', ...lead, reportGenerated: !!report }));

    return new Response(JSON.stringify({ success: true, message: 'Lead registrado', reportGenerated: !!report }), {
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
