export type MetricState = "good" | "warning" | "critical" | "neutral" | "no_data";

export type DashboardMetric = {
  key: string;
  label: string;
  value: number | null;
  unit?: "%" | "adet" | "puan";
  state: MetricState;
  href: string;
  detail?: string;
};

export type ScoreInput = {
  risk?: { total: number; critical: number; high: number };
  inspection?: { total: number; compliant: number; partial: number };
  training?: { assigned: number; completed: number };
  dof?: { total: number; closed: number; overdue: number };
  incident?: { total: number; lostTime: number; openInvestigations: number };
  health?: { totalEmployees: number; valid: number; overdue: number };
  periodic?: { total: number; valid: number; overdue: number };
  environment?: { total: number; valid: number; overdue: number };
  cbs?: { total: number; open: number; critical: number; slaExceeded: number };
};

export type ScoreComponent = {
  key: string;
  label: string;
  score: number | null;
  weight: number;
  weightedScore: number | null;
  available: boolean;
};

export type HsePerformanceResult = {
  score: number | null;
  coverage: number;
  grade: "A" | "B" | "C" | "D" | "E" | "NO_DATA";
  components: ScoreComponent[];
  availableWeight: number;
};

export type PriorityAction = {
  id: string;
  severity: "critical" | "high" | "medium";
  title: string;
  description: string;
  count: number;
  href: string;
  source: string;
};
