export interface Company {
  id: string;
  name: string;

  local_firm_id?: number | null;
  localId?: number | null;

  yetkili?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;

  sektor?: string | null;
  nace_kodu?: string | null;
  tehlike_sinifi?: string | null;
  sgk_sicil_no?: string | null;

  isg_uzmani?: string | null;
  isyeri_hekimi?: string | null;
  dsp?: string | null;

  calisan_sayisi?: number | null;
  user_count?: number;

  created_at?: string | null;
  is_active?: boolean | null;
  is_demo?: boolean;
}

export interface CompanyResponse {
  data?: Company[];
  error?: string;
}

export interface CompanyFormData {
  id?: string;
  name: string;
  local_firm_id?: number | null;
  yetkili?: string;
  phone?: string;
  email?: string;
  address?: string;
  sektor?: string;
  nace_kodu?: string;
  tehlike_sinifi?: string;
  sgk_sicil_no?: string;
  isg_uzmani?: string;
  isyeri_hekimi?: string;
  dsp?: string;
  calisan_sayisi?: number;
  is_active?: boolean;
}

export type CompanyPerformanceStatus =
  | "GOOD"
  | "DEVELOP"
  | "HIGH"
  | "CRITICAL";

export type CompanyGrade =
  | "A+"
  | "A"
  | "B"
  | "C"
  | "D";

export type CompanyRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface CompanyModulePerformance {
  key: string;
  title: string;
  score: number;
  total: number;
  completed: number;
  missing: number;
  status: CompanyPerformanceStatus;
  detail: string;
  route?: string;
}

export interface CompanyPerformanceAlert {
  level:
    | "INFO"
    | "WARNING"
    | "CRITICAL";
  title: string;
  description: string;
  route?: string;
}

export interface CompanyPerformanceResponse {
  success: boolean;
  companyId: string;
  employeeCount: number;
  overallScore: number;
  grade: CompanyGrade;
  riskLevel: CompanyRiskLevel;
  criticalCount: number;
  generatedAt: string;
  modules: CompanyModulePerformance[];
  alerts: CompanyPerformanceAlert[];
  doraSummary: string[];
  warnings: string[];
  error?: string;
}