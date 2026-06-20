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
};
