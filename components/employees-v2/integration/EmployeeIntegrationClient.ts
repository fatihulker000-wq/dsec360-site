import type {
  EmployeeIntegrationData,
  EmployeeIntegrationResponse,
} from "./types";

export async function fetchEmployeeIntegration(
  employeeId: string
): Promise<EmployeeIntegrationData> {

  const response = await fetch(
    `/api/admin/employees/${encodeURIComponent(employeeId)}/profile`,
    {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    }
  );

  const json = (
  await response.json().catch(() => ({}))
) as EmployeeIntegrationResponse;

  if (
    !response.ok ||
    !json.success ||
    !json.data
  ) {
    throw new Error(
      json.error ||
      "Çalışan entegrasyon verileri alınamadı."
    );
  }

  return json.data;
}