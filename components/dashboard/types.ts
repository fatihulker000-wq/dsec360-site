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