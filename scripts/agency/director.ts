/**
 * JARVIS · Director de Operaciones · enruta instrucciones a departamentos
 */
import { runAgent } from "./agent-runner.js";
import { logRun } from "./activity.js";
import { runFinancePipeline } from "./departments/finance.js";
import { runForgeDevTask, runIaPipeline } from "./departments/ia.js";
import { runMarketingCalendarPipeline } from "./departments/marketing-calendar.js";
import { runMarketingPublishPipeline } from "./departments/marketing-publish.js";
import { runMarketingContentPipeline } from "./departments/marketing.js";
import { runContentBatchPipeline } from "./departments/content-batch.js";
import { routeOperationalIntent } from "./intent-router.js";
import { getOpsGoals, listOpsTasks } from "./departments/operations.js";
import { runSalesPipeline } from "./departments/sales.js";
import { runStrategyPipeline } from "./departments/strategy.js";
import {
  AGENT_REGISTRY,
  DEPARTMENT_AGENTS,
  JARVIS_DIRECTOR,
  getAgent,
  pickLeadAgent,
  resolveAgentId,
  resolveDepartment,
} from "./registry.js";
import type { AgencyRunInput, AgencyRunResult, DepartmentId, DepartmentRunResult } from "./types.js";

const DEPT_KEYWORDS: Record<DepartmentId, RegExp> = {
  marketing: /marketing|contenido|post|reel|instagram|tiktok|ads|campana|campaña|publicar|muse|ares|calendario/i,
  sales: /ventas|lead|pipeline|crm|hermes|cierre|propuesta|seguimiento|follow/i,
  operations: /operaciones|tarea|task|goal|meta|sla|delivery|atlas|recap|prioridad/i,
  ia: /automatiz|n8n|agente|integracion|integración|forge|nexus|codigo|código|deploy|mcp|windmill|cursor|claude code/i,
  design: /diseño|brand|apollo|landing|ui|visual/i,
  finance: /finanza|revenue|factura|oracle|margen|ingreso/i,
  hr: /equipo|rrhh|hive|contrat/i,
  support: /soporte|ticket|echo|whatsapp/i,
  legal: /legal|contrato|lex|compliance/i,
  strategy: /estrategia|zeus|decision|decisión|roadmap|expansion|expansión/i,
};

function detectDepartment(instruction: string): DepartmentId | null {
  const explicit = instruction.match(/\[DEPARTAMENTO[:\s]+(\w+)\]/i);
  if (explicit?.[1]) return resolveDepartment(explicit[1]);

  const agentTag = instruction.match(/\[AGENTE[:\s]+(\w+)\]/i);
  if (agentTag?.[1]) {
    const agent = resolveAgentId(agentTag[1]);
    if (agent) return getAgent(agent).department;
  }

  for (const [dept, re] of Object.entries(DEPT_KEYWORDS) as [DepartmentId, RegExp][]) {
    if (re.test(instruction)) return dept;
  }
  return null;
}

export function shouldDelegateToAgency(instruction: string): boolean {
  if (/\[AGENTE[:\s]/i.test(instruction)) return true;
  if (/\[DEPARTAMENTO[:\s]/i.test(instruction)) return true;
  if (isContentBatchRequest(instruction)) return true;
  if (isContentRequest(instruction)) return true;
  if (isCalendarRequest(instruction)) return true;
  if (isPublishRequest(instruction)) return true;
  return detectDepartment(instruction) !== null;
}

function isContentBatchRequest(instruction: string): boolean {
  return /(?:sub(?:e|í)?me|publica|programa|genera|crea)\s+(?:me\s+)?\d{1,2}\s+(?:publicaciones?|posts?|piezas?|contenidos?)/i.test(
    instruction,
  );
}

function isContentRequest(instruction: string): boolean {
  return /crear contenido|generar (post|reel|video)|guion|guión/i.test(instruction);
}

function isCalendarRequest(instruction: string): boolean {
  return /calendario editorial|calendario semana|planificar contenido|7 días de contenido/i.test(instruction);
}

function isPublishRequest(instruction: string): boolean {
  return /publicar (ahora|en instagram|calendario|programado)|publish now/i.test(instruction);
}

export async function directorRoute(
  instruction: string,
  input: Partial<AgencyRunInput> = {},
): Promise<DepartmentRunResult> {
  const trimmed = instruction.trim();
  const explicitAgent =
    input.agentId ||
    resolveAgentId(trimmed.match(/\b(ARES|HERMES|ATLAS|NEXUS|APOLLO|MUSE|FORGE|ORACLE|HIVE|ECHO|LEX|ZEUS)\b/i)?.[1]);
  const department =
    input.department ||
    (explicitAgent ? getAgent(explicitAgent).department : detectDepartment(trimmed));

  const results: AgencyRunResult[] = [];
  const opRoute = routeOperationalIntent(trimmed);

  if (opRoute.intent === "CONTENT_BATCH" && opRoute.contentBatch) {
    results.push(await runContentBatchPipeline(trimmed, opRoute.contentBatch));
  } else if (department === "marketing") {
    if (isPublishRequest(trimmed)) {
      results.push(await runMarketingPublishPipeline());
    } else if (isCalendarRequest(trimmed)) {
      results.push(await runMarketingCalendarPipeline(trimmed));
    } else if (isContentRequest(trimmed)) {
      results.push(
        await runMarketingContentPipeline({
          brief: trimmed,
          voice: input.media?.voice,
          video: input.media?.video,
          platform: input.media?.platforms?.[0],
        }),
      );
    } else {
      results.push(
        await runAgent({ ...input, instruction: trimmed, agentId: explicitAgent || "ARES" }, { logActivity: false }),
      );
    }
  } else if (department === "sales") {
    results.push(await runSalesPipeline(trimmed));
  } else if (department === "finance") {
    results.push(await runFinancePipeline(trimmed));
  } else if (department === "strategy") {
    results.push(await runStrategyPipeline(trimmed));
  } else if (department === "ia") {
    if (/forge|cursor|claude code|deploy|pull request|pr\b/i.test(trimmed)) {
      results.push(await runForgeDevTask(trimmed));
    } else {
      results.push(await runIaPipeline(trimmed, explicitAgent || undefined));
    }
  } else if (department === "operations" && /tasks?|tareas|goals?|metas/i.test(trimmed)) {
    const [tasks, goals] = await Promise.all([listOpsTasks(), getOpsGoals()]);
    results.push(
      await runAgent(
        {
          instruction: `${trimmed}\n\n[TAREAS]\n${JSON.stringify(tasks.tasks.slice(0, 8))}\n[GOALS]\n${JSON.stringify(goals)}`,
          agentId: "ATLAS",
        },
        { logActivity: false },
      ),
    );
  } else {
    const agentId = explicitAgent || (department ? pickLeadAgent(department) : "ATLAS");
    results.push(await runAgent({ ...input, instruction: trimmed, agentId }, { logActivity: false }));
  }

  // Persistir cada run del orquestador en el feed (best-effort, no bloquea).
  await Promise.allSettled(results.map((r) => logRun(r, "director")));

  return {
    department: department || results[0]?.department || "operations",
    agents: results.map((r) => r.agent),
    results,
    orchestratedBy: "JARVIS",
  };
}

export function getDirectorStatus() {
  return {
    director: JARVIS_DIRECTOR,
    departments: Object.keys(DEPARTMENT_AGENTS),
    agents: Object.keys(AGENT_REGISTRY),
  };
}
