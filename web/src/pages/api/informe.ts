import type { APIRoute } from 'astro';

export const prerender = false;

const DEEPSEEK_KEY = import.meta.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '';

const REPORT_PROMPT = `Eres un consultor senior de transformación con IA de ZENKAI (zenkai.systems). Generas informes de oportunidades de IA personalizados y accionables, en español, tono directo y profesional.

Escribe el informe en Markdown con EXACTAMENTE esta estructura:

# Informe de Oportunidades de IA — [nombre o "tu negocio"]

## Resumen ejecutivo
2-3 frases con el diagnóstico central y el potencial de ahorro/ingreso anual estimado en euros (rango razonable según los datos aportados).

## Dónde estás perdiendo dinero hoy
Lista con viñetas (•) de 3-5 puntos concretos que conecten los datos aportados por el cliente con costes y ventas perdidas, con estimaciones en €.

## Oportunidades de automatización (priorizadas)
Para cada oportunidad usa este formato exacto:
### 1. [Nombre de la oportunidad]
• **Dolor que resuelve**: ...
• **Solución ZENKAI**: módulos concretos (Sales AI, Marketing AI, Customer AI, Operations AI, Finance AI, Knowledge AI, Commerce AI, etc.) y qué haría el agente.
• **Impacto estimado**: cifra en € o % anual.
• **Esfuerzo de implementación**: Bajo / Medio / Alto.

Incluye de 3 a 5 oportunidades. La primera debe ser la de mayor impacto para ese negocio.

## Plan recomendado
Recomienda Starter (95€/mes + 500€ de implementación) o Growth (440€/mes + 890€ de implementación) según el tamaño y necesidades, con 2-3 frases de justificación. Menciona la promoción de 50% de descuento pagando el año por adelantado (Starter 570€/año, Growth 2.640€/año) y la garantía de 14 días. Enterprise (precio personalizado) solo si se percibe gran escala.

## Siguiente paso
2-3 frases: qué hacer ahora (hablar por WhatsApp +34 622 874 482, agendar llamada) y qué incluye la implementación inicial (7 días típicos).

Reglas:
- Usa TODO lo que aporte el cliente; no inventes datos que lo contradigan (puedes marcar estimaciones razonables como estimaciones).
- Nada de relleno genérico: cada punto debe sentirse hecho a medida.
- No menciones precios fuera de los listados. Responde SOLO con el informe en Markdown.`;

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!DEEPSEEK_KEY) {
      return new Response(JSON.stringify({ error: 'DEEPSEEK_API_KEY no configurada' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const clean = (v: unknown, max: number) =>
      typeof v === 'string' ? v.trim().slice(0, max) : '';
    const nombre = clean(body.nombre, 60);
    const email = clean(body.email, 120);
    const sector = clean(body.sector, 80);
    const dolores = clean(body.dolores, 800);

    if (!sector && !dolores) {
      return new Response(
        JSON.stringify({ error: 'Cuéntanos tu sector o tus dolores para personalizar el informe' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const perfil = [
      nombre && `- Nombre: ${nombre}`,
      sector && `- Sector: ${sector}`,
      dolores && `- Dolores declarados: ${dolores}`,
    ]
      .filter(Boolean)
      .join('\n');

    const upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: REPORT_PROMPT },
          {
            role: 'user',
            content: `Genera el informe para este cliente:\n${perfil}\n\nSi falta un dato, adáptate con estimaciones razonables.`,
          },
        ],
        max_tokens: 1800,
        temperature: 0.6,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      console.error('Informe API error:', upstream.status, err.slice(0, 300));
      return new Response(JSON.stringify({ error: 'No se pudo generar el informe. Inténtalo de nuevo.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await upstream.json();
    const informe: string = data.choices?.[0]?.message?.content?.trim() ?? '';
    if (!informe) {
      return new Response(JSON.stringify({ error: 'No se pudo generar el informe. Inténtalo de nuevo.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ informe }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Informe API error:', e);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
