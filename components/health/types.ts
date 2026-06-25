export type HealthKpiSummary = {
  todayExams: number;
  upcomingExams: number;
  overdueExams: number;
  todayPrescriptions: number;
  openAccidents: number;
  upcomingVaccines: number;
  criticalAlerts: number;
  riskyEmployees: number;
};

export type UpcomingHealthExam = {
  id: string;
  employeeName: string;
  companyName: string;
  examType: string;
  dueDate: string;
};

export type RecentPrescription = {
  id: string;
  employeeName: string;
  companyName: string;
  medicineCount: number;
  createdAt: string;
};

export type RecentEk2 = {
  id: string;
  employeeName: string;
  companyName: string;
  decision: string;
  createdAt: string;
};

export type HealthAlert = {
  id: string;
  level: "Kritik" | "Uyarı" | "Bilgi";
  title: string;
  desc: string;
};

export type HealthDashboardResponse = {
  success?: boolean;
  summary?: HealthKpiSummary;
  upcomingExams?: UpcomingHealthExam[];
  recentPrescriptions?: RecentPrescription[];
  recentEk2?: RecentEk2[];
  alerts?: HealthAlert[];
  error?: string;
};
export type HealthEmployee = {
  id: string;

  full_name: string;

  email: string;

  company_id: string;

  company_name: string;

  job_title: string;

  start_date: string;

  phone?: string;

  identity_number?: string;

  birth_date?: string;

  gender?: string;

  blood_group?: string;

  photo_url?: string;
};

export type HealthSummary = {
  ek2_count: number;

  examination_count: number;

  prescription_count: number;

  laboratory_count: number;

  vaccination_count: number;

  accident_count: number;

  health_score: number;

  risk_level: "LOW" | "MEDIUM" | "HIGH";
};

