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
  risk?: {
    total: number;
    critical: number;
    intolerable: number;
    veryHigh: number;
    high: number;
    medium: number;
    low: number;
  };
  inspection?: { total: number; compliant: number; partial: number; nonCompliant: number };
  training?: {
    totalEmployees: number;
    compliantEmployees: number;
    nonCompliantEmployees: number;
    requiredMinutes: number;
    hazardClass: string;
  };
  dof?: {
    total: number;
    open: number;
    closed: number;
    overdue: number;
    riskTotal: number;
    riskOpen: number;
    riskClosed: number;
    inspectionTotal: number;
    inspectionOpen: number;
    inspectionClosed: number;
  };
  incident?: { total: number; lostTime: number; openInvestigations: number };
  health?: {
    totalEmployees: number;
    valid: number;
    approaching: number;
    overdue: number;
    missing: number;
    ek2Employees: number;
  };
  periodic?: { total: number; valid: number; overdue: number };
  environment?: { total: number; valid: number; overdue: number };
  cbs?: { total: number; open: number; critical: number; slaExceeded: number; actionRequired?: number };
};

export type ScoreComponent = {
  key: string;
  label: string;
  score: number | null;
  weight: number;
  weightedScore: number | null;
  normalizedContribution: number | null;
  available: boolean;
};

export type HsePerformanceResult = {
  score: number | null;
  coverage: number;
  grade: "A" | "B" | "C" | "D" | "E" | "NO_DATA";
  components: ScoreComponent[];
  availableWeight: number;
  availableComponents: number;
  totalComponents: number;
  formula: "AVAILABLE_WEIGHT_NORMALIZED";
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
