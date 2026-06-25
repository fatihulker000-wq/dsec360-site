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