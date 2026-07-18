export interface DemoMetrics {
  employee_count: number;

  training_total: number;
  training_completed: number;

  inspection_total: number;
  inspection_completed: number;

  open_dof: number;

  accident_count: number;
  near_miss_count: number;

  health_total: number;
  health_current: number;

  document_total: number;
  document_current: number;

  overall_score: number;
  risk_score: number;
}

export interface DemoActivity {
  id: number;

  activity_type: string;

  title: string;

  description: string | null;

  status: string;

  occurred_at: string;
}

export interface DemoModuleRecords {
  accidents: number;

  inspections: number;

  cbs: number;

  errors: string[];
}

export interface DemoCompanyDataResponse {
  success: boolean;

  company?: {
    id: string;

    name: string;

    local_firm_id: number | null;
  };

  metrics?: DemoMetrics;

  activities?: number | DemoActivity[];

  moduleRecords?: DemoModuleRecords;

  error?: string;
}

async function parseResponse(
  response: Response
): Promise<DemoCompanyDataResponse> {
  const json =
    await response
      .json()
      .catch(() => ({
        success: false,
      }));

  if (
    response.status === 401 &&
    typeof window !== "undefined"
  ) {
    window.location.href =
      "/admin/login";
  }

  if (!response.ok) {
    throw new Error(
      json.error ||
        "Demo verileri oluşturulamadı."
    );
  }

  return json;
}

export async function createDemoCompanyData():
  Promise<DemoCompanyDataResponse> {
  const response =
    await fetch(
      "/api/admin/companies/demo",
      {
        method: "POST",
        credentials: "include",
      }
    );

  return parseResponse(
    response
  );
}

export async function getDemoCompanyData(
  companyId: string
): Promise<DemoCompanyDataResponse> {
  if (!companyId) {
    throw new Error(
      "Demo firma ID bilgisi eksik."
    );
  }

  const response =
    await fetch(
      `/api/admin/companies/demo?companyId=${encodeURIComponent(
        companyId
      )}`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      }
    );

  return parseResponse(
    response
  );
}