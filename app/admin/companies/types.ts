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

  calisan_sayisi?: number;

  user_count?: number;

  created_at?: string | null;

  is_active?: boolean;

  is_demo?: boolean;
}

export interface CompanyResponse {
  data: Company[];
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

export interface CompanyStatistic {

  title: string;

  value: number | string;

  color: string;

  icon: string;
}

export interface CompanyModulePerformance {

  key: string;

  title: string;

  score: number;

  total: number;

  completed: number;

  missing: number;

  status:
    | "GOOD"
    | "DEVELOP"
    | "HIGH"
    | "CRITICAL";

  detail: string;
}

export interface CompanyPerformanceResponse {

  success: boolean;

  companyId: string;

  overallScore: number;

  employeeCount: number;

  modules: CompanyModulePerformance[];

  warnings: string[];
}