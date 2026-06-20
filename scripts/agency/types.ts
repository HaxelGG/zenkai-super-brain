/**
 * ZENKAI Agency Platform · tipos compartidos
 */

export type AgentId =
  | "ARES"
  | "HERMES"
  | "ATLAS"
  | "NEXUS"
  | "APOLLO"
  | "MUSE"
  | "FORGE"
  | "ORACLE"
  | "HIVE"
  | "ECHO"
  | "LEX"
  | "ZEUS";

export type DepartmentId =
  | "marketing"
  | "sales"
  | "operations"
  | "ia"
  | "design"
  | "finance"
  | "hr"
  | "support"
  | "legal"
  | "strategy";

export type LlmTier = "opus" | "sonnet" | "haiku" | "deepseek";

export type MediaProvider = "elevenlabs" | "heygen" | "higgsfield" | "none";

export type AgentDefinition = {
  id: AgentId;
  name: string;
  department: DepartmentId;
  modelo: LlmTier;
  modeloLabel: string;
  subagentes: string[];
  voiceProvider?: MediaProvider;
  n8nEvents: string[];
  mcpServers: string[];
  purpose: string;
};

export type AgencyRunInput = {
  instruction: string;
  agentId?: AgentId;
  department?: DepartmentId;
  context?: Record<string, unknown>;
  media?: {
    voice?: boolean;
    video?: boolean;
    platforms?: ("instagram" | "linkedin" | "tiktok")[];
  };
};

export type AgencyRunResult = {
  id: string;
  agent: AgentId;
  department: DepartmentId;
  reply: string;
  speech?: string;
  provider: "deepseek" | "anthropic" | "haiku";
  model: string;
  timestamp: string;
  tasks?: AgencyTask[];
  media?: MediaJob[];
  dispatch?: { event: string; ok: boolean; error?: string };
  meta?: Record<string, unknown>;
};

export type AgencyTask = {
  id: string;
  title: string;
  agent: AgentId;
  department: DepartmentId;
  priority: "high" | "medium" | "low";
  status: "pending" | "working" | "review" | "done";
  deadline?: string;
};

export type MediaJob = {
  provider: MediaProvider;
  status: "queued" | "processing" | "done" | "skipped" | "error";
  artifactUrl?: string;
  error?: string;
};

export type DepartmentRunResult = {
  department: DepartmentId;
  agents: AgentId[];
  results: AgencyRunResult[];
  orchestratedBy: "JARVIS";
};
