import type {
  Company,
  CompanyFormData,
  CompanyPerformanceResponse,
  CompanyResponse,
} from "../types";

async function readJson<T>(
  response: Response
): Promise<T> {
  return response
    .json()
    .catch(() => ({} as T));
}

function redirectUnauthorized(
  response: Response
) {
  if (
    response.status === 401 &&
    typeof window !== "undefined"
  ) {
    window.location.href =
      "/admin/login";
  }
}

export async function getCompanies(): Promise<Company[]> {
  const response = await fetch(
    "/api/admin/companies",
    {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    }
  );

  redirectUnauthorized(response);

  const json =
    await readJson<CompanyResponse>(
      response
    );

  if (!response.ok) {
    throw new Error(
      json.error ||
        "Firmalar alınamadı."
    );
  }

  return Array.isArray(json.data)
    ? json.data
    : [];
}

export async function saveCompany(
  mode: "CREATE" | "EDIT",
  form: CompanyFormData
) {
  const response = await fetch(
    "/api/admin/companies",
    {
      method:
        mode === "CREATE"
          ? "POST"
          : "PUT",
      credentials: "include",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        ...form,
        name: form.name.trim(),
        calisan_sayisi: Number(
          form.calisan_sayisi || 0
        ),
      }),
    }
  );

  redirectUnauthorized(response);

  const json =
    await readJson<{
      success?: boolean;
      error?: string;
    }>(response);

  if (!response.ok) {
    throw new Error(
      json.error ||
        "Firma kaydedilemedi."
    );
  }

  return json;
}

export async function disableCompany(
  company: Company
) {
  const response = await fetch(
    `/api/admin/companies?id=${encodeURIComponent(
      company.id
    )}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  redirectUnauthorized(response);

  const json =
    await readJson<{
      success?: boolean;
      error?: string;
      message?: string;
    }>(response);

  if (!response.ok) {
    throw new Error(
      json.error ||
        "Firma pasife alınamadı."
    );
  }

  return json;
}

export async function getCompanyPerformance(
  companyId: string
): Promise<CompanyPerformanceResponse> {
  const response = await fetch(
    `/api/admin/companies/performance?companyId=${encodeURIComponent(
      companyId
    )}`,
    {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    }
  );

  redirectUnauthorized(response);

  const json =
    await readJson<
      CompanyPerformanceResponse & {
        error?: string;
      }
    >(response);

  if (
    !response.ok ||
    !json.success
  ) {
    throw new Error(
      json.error ||
        "Firma performansı alınamadı."
    );
  }

  return json;
}