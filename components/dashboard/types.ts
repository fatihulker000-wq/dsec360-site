export type Training = {
  id: string;
  title: string;
  assigned_count: number;
  not_started_count: number;
  in_progress_count: number;
  completed_count: number;
};

export type RiskUser = {
  assignment_id: string;
  user_id: string;
  training_id: string;
  full_name: string;
  email: string;
  company_id: string;
  training_title: string;
  status: "not_started" | "in_progress" | "completed";
};

export type DashboardSummary = {
  total_assignments: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
  completion_rate: number;
  in_progress_rate: number;
  risk_rate: number;
  risk_status: "KRITIK" | "ORTA" | "IYI";
};

export type CompanyDistributionItem = {
  name: string;
  count: number;
};

export type TrendItem = {
  label: string;
  value: number;
};

export type DashboardResponse = {
  success?: boolean;
  trainings?: Training[];
  risky_users?: RiskUser[];
  in_progress_users?: RiskUser[];
  completed_users?: RiskUser[];
  company_distribution?: CompanyDistributionItem[];
  company_list?: string[];
  trend?: TrendItem[];
  summary?: DashboardSummary;

  activities?: DashboardActivity[];
  upcoming_trainings?: UpcomingTraining[];
  upcoming_healths?: UpcomingHealth[];
  upcoming_inspections?: UpcomingInspection[];
  upcoming_periodic_controls?: UpcomingPeriodicControl[];
  dof_summary?: DofSummary;
  risk_summary?: RiskSummary;
  dora_summary?: DoraSummary;

  error?: string;
  detail?: string;
};

export type MeResponse = {
  success?: boolean;
  user?: {
    id?: string;
    full_name?: string;
    email?: string;
    role?: string;
    company_id?: string;
  };
  error?: string;
};

export type CbsSummary = {
  total: number;
  new: number;
  processing: number;
  read: number;
  closed: number;
  slaExceeded: number;
};

export type ExecutiveSummary = {
  totalTrainings: number;
  totalAssignments: number;
  totalCompleted: number;
  totalInProgress: number;
  totalNotStarted: number;

  cbsTotal: number;
  cbsOpen: number;
  cbsClosed: number;
  cbsSla: number;

  executiveRiskScore: number;

  healthLabel: string
};

export type StatusDonutProps = {
  label: string;
  value: number;
  total: number;
  color: string;
  softBg: string;
};

export type MiniBarChartItem = {
  label: string;
  value: number;
};

export type MiniBarChartProps = {
  items: MiniBarChartItem[];
  color: string;
  emptyText?: string;
};

export type EmptyStateProps = {
  text: string;
};

export type DashboardActivity = {
  id: string;
  type: string;
  title: string;
  company: string;
  created_at: string;
};

export type UpcomingTraining = {
  id: string;
  title: string;
  company: string;
  date: string;
};

export type UpcomingHealth = {
  id: string;
  employee: string;
  company: string;
  due_date: string;
};

export type UpcomingInspection = {
  id: string;
  title: string;
  company: string;
  due_date: string;
};

export type UpcomingPeriodicControl = {
  id: string;
  equipment: string;
  company: string;
  due_date: string;
};

export type DofSummary = {
  open: number;
  overdue: number;
  closed: number;
};

export type RiskSummary = {
  veryHigh: number;
  high: number;
  medium: number;
  low: number;
};

export type DoraSummary = {
  level: "İyi" | "Orta" | "Kritik";
  message: string;
};