import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import type {
  CbsSummary,
  DashboardActivity,
  TrendItem,
} from "@/components/dashboard/types";

export type DashboardMetricColor =
  | "red"
  | "green"
  | "blue"
  | "orange"
  | "purple";

export type DashboardMetric = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  change?: number;
  color?: DashboardMetricColor;
  description?: string;
  href?: string;
  sparkline?: number[];
  statusLabel?: string;
};

export type DashboardAlert = {
  title: string;
  value: string | number;
  description?: string;
  variant?: "critical" | "warning" | "info" | "success";
  href?: string;
};

export type HeroStat = {
  label: string;
  value: string | number;
};

export type QuickActionItem = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type CompanyPerformanceItem = {
  name: string;
  score: number;
  completed: number;
  total: number;
};

export type DashboardV3Props = {
  loading: boolean;
  isMobile: boolean;
  error?: string;

  title: string;
  subtitle: string;

  heroTitle: string;
  heroDescription: string;
  heroStats: HeroStat[];

  metrics: DashboardMetric[];
  alerts: DashboardAlert[];
  doraInsights: string[];

  onRefresh: () => void;
  onExportPDF: () => void;

  trendData: TrendItem[];

  pieData: {
    name: string;
    value: number;
  }[];

  riskCompanies: {
    name: string;
    count: number;
  }[];

  completionRate: number;
  inProgressRate: number;
  riskRate: number;

  cbsSummary: CbsSummary | null;

  inspectionSummary?: {
    total?: number;
    completed?: number;
    planned?: number;
    overdue?: number;
  } | null;

  quickActions?: QuickActionItem[];

  activities: DashboardActivity[];

  riskMatrix: number[][];

  companyPerformance: CompanyPerformanceItem[];

  companies: string[];

  selectedCompany: string;

  onCompanyChange: (value: string) => void;

  searchValue: string;

  onSearchChange: (value: string) => void;

  companyLocked?: boolean;

  criticalCount: number;

  executiveRecommendation?: string;

  legacyExecutive?: ReactNode;

  legacyLists?: ReactNode;
};