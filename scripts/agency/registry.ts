/**
 * Registro canónico de los 12 agentes Master + JARVIS (director).
 */
import type { AgentDefinition, AgentId, DepartmentId } from "./types.js";

export const JARVIS_DIRECTOR = {
  id: "JARVIS" as const,
  role: "Director de Operaciones",
  department: "operations" as DepartmentId,
  orchestrates: [
    "marketing",
    "sales",
    "operations",
    "ia",
    "finance",
    "strategy",
  ] as DepartmentId[],
};

export const AGENT_REGISTRY: Record<AgentId, AgentDefinition> = {
  ARES: {
    id: "ARES",
    name: "ARES",
    department: "marketing",
    modelo: "sonnet",
    modeloLabel: "Claude Sonnet 4.6",
    subagentes: ["ARES-ADS", "ARES-SEO", "ARES-EMAIL", "ARES-REPORT"],
    n8nEvents: ["agency.marketing.campaign", "agency.marketing.ads"],
    mcpServers: ["n8n-mcp", "meta-ads"],
    purpose: "Adquisición · Meta/Google Ads · CAC · embudo de marketing",
  },
  MUSE: {
    id: "MUSE",
    name: "MUSE",
    department: "marketing",
    modelo: "sonnet",
    modeloLabel: "Claude Sonnet 4.6",
    subagentes: ["MUSE-COPY", "MUSE-SCRIPT", "MUSE-CALENDAR", "MUSE-ANALYTICS"],
    voiceProvider: "elevenlabs",
    n8nEvents: ["agency.marketing.content", "agency.marketing.publish"],
    mcpServers: ["n8n-mcp", "heygen", "elevenlabs"],
    purpose: "Contenido orgánico · calendario · copy · guiones · social",
  },
  APOLLO: {
    id: "APOLLO",
    name: "APOLLO",
    department: "design",
    modelo: "sonnet",
    modeloLabel: "Claude Sonnet 4.6",
    subagentes: ["APOLLO-BRAND", "APOLLO-UI", "APOLLO-ASSET"],
    n8nEvents: ["agency.design.brief"],
    mcpServers: ["cursor-ide"],
    purpose: "Branding · UI · assets visuales",
  },
  HERMES: {
    id: "HERMES",
    name: "HERMES",
    department: "sales",
    modelo: "sonnet",
    modeloLabel: "Claude Sonnet 4.6",
    subagentes: ["HERMES-QUALIFY", "HERMES-CLOSE", "HERMES-CRM"],
    n8nEvents: ["jarvis.lead_followup", "agency.sales.qualify", "agency.sales.followup"],
    mcpServers: ["n8n-mcp", "airtable"],
    purpose: "Ventas · CRM · cualificación · cierre",
  },
  ATLAS: {
    id: "ATLAS",
    name: "ATLAS",
    department: "operations",
    modelo: "sonnet",
    modeloLabel: "Claude Sonnet 4.6",
    subagentes: ["ATLAS-DELIVERY", "ATLAS-SLA", "ATLAS-CLIENT"],
    n8nEvents: ["agency.ops.task", "agency.ops.sla", "jarvis.recap"],
    mcpServers: ["n8n-mcp", "windmill", "airtable"],
    purpose: "Delivery · SLA · clientes · tareas operativas",
  },
  NEXUS: {
    id: "NEXUS",
    name: "NEXUS",
    department: "ia",
    modelo: "sonnet",
    modeloLabel: "Claude Sonnet 4.6",
    subagentes: ["NEXUS-FLOW", "NEXUS-AGENT", "NEXUS-INTEGRATE"],
    n8nEvents: ["agency.ia.automation", "agency.ia.agent"],
    mcpServers: ["n8n-mcp", "windmill", "cursor-ide"],
    purpose: "Automatización · agentes · integraciones IA",
  },
  FORGE: {
    id: "FORGE",
    name: "FORGE",
    department: "ia",
    modelo: "sonnet",
    modeloLabel: "Claude Sonnet 4.6",
    subagentes: ["FORGE-DEV", "FORGE-INFRA", "FORGE-DEPLOY"],
    n8nEvents: ["agency.ia.deploy"],
    mcpServers: ["cursor-ide", "vercel", "gitlab"],
    purpose: "Developer · infra · deploy · código",
  },
  ORACLE: {
    id: "ORACLE",
    name: "ORACLE",
    department: "finance",
    modelo: "sonnet",
    modeloLabel: "Claude Sonnet 4.6",
    subagentes: ["ORACLE-METRICS", "ORACLE-BILLING"],
    n8nEvents: ["agency.finance.report"],
    mcpServers: ["airtable"],
    purpose: "Finanzas · métricas · facturación",
  },
  HIVE: {
    id: "HIVE",
    name: "HIVE",
    department: "hr",
    modelo: "haiku",
    modeloLabel: "Claude Haiku 4.5",
    subagentes: ["HIVE-RECRUIT", "HIVE-ONBOARD"],
    n8nEvents: ["agency.hr.task"],
    mcpServers: ["airtable"],
    purpose: "RRHH · equipo · onboarding",
  },
  ECHO: {
    id: "ECHO",
    name: "ECHO",
    department: "support",
    modelo: "haiku",
    modeloLabel: "Claude Haiku 4.5",
    subagentes: ["ECHO-TICKET", "ECHO-WA"],
    n8nEvents: ["agency.support.ticket"],
    mcpServers: ["n8n-mcp", "twilio"],
    purpose: "Atención al cliente · tickets · WhatsApp",
  },
  LEX: {
    id: "LEX",
    name: "LEX",
    department: "legal",
    modelo: "sonnet",
    modeloLabel: "Claude Sonnet 4.6",
    subagentes: ["LEX-CONTRACT", "LEX-COMPLIANCE"],
    n8nEvents: ["agency.legal.review"],
    mcpServers: [],
    purpose: "Legal · contratos · compliance",
  },
  ZEUS: {
    id: "ZEUS",
    name: "ZEUS",
    department: "strategy",
    modelo: "opus",
    modeloLabel: "Claude Opus 4.7",
    subagentes: [],
    n8nEvents: ["agency.strategy.decision", "jarvis.recap"],
    mcpServers: ["n8n-mcp", "windmill"],
    purpose: "Estrategia · decisiones N3-N4 · orquestación superior",
  },
};

export const DEPARTMENT_AGENTS: Record<DepartmentId, AgentId[]> = {
  marketing: ["ARES", "MUSE", "APOLLO"],
  sales: ["HERMES"],
  operations: ["ATLAS"],
  ia: ["NEXUS", "FORGE"],
  design: ["APOLLO"],
  finance: ["ORACLE"],
  hr: ["HIVE"],
  support: ["ECHO"],
  legal: ["LEX"],
  strategy: ["ZEUS"],
};

const AGENT_ALIASES: Record<string, AgentId> = {
  jarvis: "ATLAS",
  marketing: "ARES",
  ventas: "HERMES",
  sales: "HERMES",
  contenido: "MUSE",
  social: "MUSE",
  ops: "ATLAS",
  operaciones: "ATLAS",
  ia: "NEXUS",
  dev: "FORGE",
  finanzas: "ORACLE",
  legal: "LEX",
  estrategia: "ZEUS",
};

export function resolveAgentId(input?: string): AgentId | null {
  if (!input) return null;
  const up = input.trim().toUpperCase();
  if (up in AGENT_REGISTRY) return up as AgentId;
  const alias = AGENT_ALIASES[input.trim().toLowerCase()];
  return alias ?? null;
}

export function resolveDepartment(input?: string): DepartmentId | null {
  if (!input) return null;
  const key = input.trim().toLowerCase() as DepartmentId;
  if (key in DEPARTMENT_AGENTS) return key;
  return null;
}

export function getAgent(id: AgentId): AgentDefinition {
  return AGENT_REGISTRY[id];
}

export function pickLeadAgent(department: DepartmentId): AgentId {
  const lead = DEPARTMENT_AGENTS[department]?.[0];
  return lead ?? "ATLAS";
}
