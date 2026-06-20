# Flow M-03 / LEADS-05 · Cualificación automática

- **Plataforma:** n8n Cloud
- **Export:** `jarvis/n8n/LEADS-05-qualify-on-create.json`
- **Estado:** STAGING
- **Owner:** HERMES · NEXUS

## Disparador

Airtable automation → webhook `leads-qualify` al crear lead.

## Pasos

1. Get lead en Airtable
2. Anthropic Sonnet con rúbrica `skill-cualificar-lead`
3. Update `score`, `etapa`, `cualificacion_*`
4. Si score ≥ 6 → webhook M-04

## Costo

~$0.02 por lead (Sonnet)
