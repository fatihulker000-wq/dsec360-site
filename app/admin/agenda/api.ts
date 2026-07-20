import type {
  AgendaResponse,
  CompaniesResponse,
  CreateAgendaRequest,
  EmployeesResponse,
} from "./types";

async function parseJson<T>(response: Response): Promise<T> {
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error =
      typeof json?.error === "string"
        ? json.error
        : "Sunucu hatası oluştu.";

    throw new Error(error);
  }

  return json as T;
}

export async function getAgenda(): Promise<AgendaResponse> {
  const response = await fetch("/api/admin/agenda", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return parseJson<AgendaResponse>(response);
}

export async function getCompanies(): Promise<CompaniesResponse> {
  const response = await fetch("/api/admin/companies", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return parseJson<CompaniesResponse>(response);
}

export async function getEmployees(
  webFirmId: string
): Promise<EmployeesResponse> {
  const query = new URLSearchParams({
    firmId: webFirmId,
  });

  const response = await fetch(
    `/api/admin/employees?${query.toString()}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  return parseJson<EmployeesResponse>(response);
}

export async function createAgenda(
  payload: CreateAgendaRequest
) {
  const response = await fetch("/api/admin/agenda", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson<{ success: boolean }>(response);
}

export async function patchAgenda(
  id: string,
  payload: Record<string, unknown>
) {
  const response = await fetch(`/api/admin/agenda/${id}`, {
    method: "PATCH",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson<{ success: boolean }>(response);
}

export async function removeAgenda(id: string) {
  const response = await fetch(`/api/admin/agenda/${id}`, {
    method: "DELETE",
    credentials: "include",
    cache: "no-store",
  });

  return parseJson<{ success: boolean }>(response);
}
