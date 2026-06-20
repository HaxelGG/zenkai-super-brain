export type Semaphore = "green" | "yellow" | "red";

export type TaskStatus = "backlog" | "pending" | "working" | "review" | "done";

export type TaskPriority = "high" | "medium" | "low";

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

export type Agent = {
  id: AgentId;
  name: string;
  department: string;
  color: string;
};

export type Delta = {
  value: number;
  label: string;
  direction: "up" | "down" | "flat";
};

export type KpiMetric = {
  id: string;
  label: string;
  value: string;
  caption?: string;
  delta?: Delta;
  sparkline?: number[];
};

export type Task = {
  id: string;
  title: string;
  agent: AgentId;
  client?: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress?: number;
  deadline: string;
  tags?: string[];
};

export type Project = {
  id: string;
  client: string;
  status: string;
  progress: number;
  risk: Semaphore;
  tier: "Eco" | "Pro" | "Premium";
};

export type SocialPost = {
  id: string;
  platform: "instagram" | "linkedin" | "tiktok";
  hook: string;
  reach: number;
  engagement: number;
  saves?: number;
};

export type SocialChannel = {
  platform: "instagram" | "linkedin" | "tiktok" | "meta_ads";
  label: string;
  reach: number;
  engagement: number;
  metricLabel: string;
  secondaryLabel: string;
  secondaryValue: string;
  trend: number[];
  delta: Delta;
};

export type Alert = {
  id: string;
  level: "critical" | "important" | "info";
  message: string;
  action?: string;
};

export type WeeklyDataPoint = {
  week: string;
  leads: number;
  closes: number;
};

export type MonthlyRevenue = {
  month: string;
  actual?: number;
  projected?: number;
};

export type FinanceSnapshot = {
  revenueWeek: number;
  revenueMonth: number;
  revenueYtd: number;
  goal2026: number;
  runRateMonthly: number;
  runRateNeeded: number;
  pipelineWeighted: number;
  accountsReceivable: { client: string; amount: number; days: number }[];
  expensesMonth: number;
  expensesBudget: number;
  marginByProject: { client: string; revenue: number; cost: number; margin: number }[];
  revenueByTier: { tier: string; amount: number; color: string }[];
  monthlyRevenue: MonthlyRevenue[];
};

export type Goal = {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: "usd" | "count" | "percent";
  deadline: string;
  status: Semaphore;
};

export type Okr = {
  id: string;
  department: string;
  objective: string;
  keyResults: { label: string; progress: number }[];
};

export type ContentCalendarItem = {
  id: string;
  date: string;
  platform: "instagram" | "linkedin" | "tiktok";
  title: string;
  status: "scheduled" | "draft" | "published";
};

export type AgentStatus = {
  id: AgentId;
  state: "active" | "idle" | "offline";
  currentTask?: string;
  load: number;
  model: string;
  opsToday: number;
};

export type ActivityEvent = {
  id: string;
  time: string;
  agent: AgentId;
  type: "task" | "lead" | "alert" | "deploy" | "social";
  message: string;
};

export type PipelineLead = {
  id: string;
  name: string;
  company: string;
  sector: string;
  stage: "nuevo" | "cualificado" | "propuesta" | "negociación" | "cerrado";
  score: number;
  valueUsd: number;
  owner: AgentId;
  lastContact: string;
};

export type PipelineFunnelStage = {
  stage: string;
  count: number;
  valueUsd: number;
};

export type SystemConnection = {
  id: string;
  name: string;
  status: "online" | "degraded" | "offline" | "pending";
  latencyMs?: number;
  uptime: number;
  phase: number;
};

export type ClientOverview = {
  id: string;
  name: string;
  tier: "Eco" | "Pro" | "Premium";
  sector: string;
  mrr: number;
  health: Semaphore;
  agentLead: AgentId;
  since: string;
};

export type AiUsage = {
  tokensToday: number;
  tokensMonth: number;
  costTodayUsd: number;
  costMonthUsd: number;
  callsToday: number;
  modelSplit: { model: string; pct: number; color: string }[];
};

export type DataSource = "mock" | "live";

export type JarvisMeta = {
  dataSource: DataSource;
  liveRecords?: {
    leads: number;
    clients: number;
  };
};

export type JarvisData = {
  agencySemaphore: Semaphore;
  greeting: string;
  dateLabel: string;
  kpis: KpiMetric[];
  tasks: Task[];
  projects: Project[];
  socialChannels: SocialChannel[];
  topPosts: SocialPost[];
  alerts: Alert[];
  priorities: string[];
  weeklyLeads: WeeklyDataPoint[];
  finance: FinanceSnapshot;
  goals: Goal[];
  okrs: Okr[];
  contentCalendar: ContentCalendarItem[];
  agents: Agent[];
  agentStatuses: AgentStatus[];
  activityFeed: ActivityEvent[];
  pipelineLeads: PipelineLead[];
  pipelineFunnel: PipelineFunnelStage[];
  systemConnections: SystemConnection[];
  clients: ClientOverview[];
  aiUsage: AiUsage;
  intelligence: IntelligenceBrief;
  sectorPerformance: SectorPerformance[];
  meta?: JarvisMeta;
};

export type IntelligenceBrief = {
  headline: string;
  summary: string;
  insights: string[];
  risks: string[];
  opportunities: string[];
  generatedAt: string;
  agent: AgentId;
  weekNumber: number;
};

export type SectorPerformance = {
  sector: string;
  leads: number;
  revenue: number;
  growth: number;
};
