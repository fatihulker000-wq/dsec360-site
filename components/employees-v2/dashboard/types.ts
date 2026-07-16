export type EmployeeDashboardEmployee = {
  id: string;

  firm_id?: string | null;

  full_name: string;

  job_title?: string | null;

  phone?: string | null;

  email?: string | null;

  registry_no?: string | null;

  tc_no?: string | null;

  start_date?: string | null;

  exit_date?: string | null;

  gender?: string | null;

  disability_status?: string | null;

  birth_date?: string | null;

  education_level?: string | null;

  blood_type?: string | null;

  active: boolean;
};

export type EmployeeDashboardStats = {
  total: number;

  active: number;

  passive: number;

  male: number;

  female: number;

  disabled: number;

  incomplete: number;

  visible: number;
};

export type EmployeeDashboardDistributionItem = {
  label: string;

  count: number;
};

export type EmployeeDashboardAlert = {
  id: string;

  employeeId: string;

  employeeName: string;

  title: string;

  description: string;

  severity:
    | "LOW"
    | "MEDIUM"
    | "HIGH";
};