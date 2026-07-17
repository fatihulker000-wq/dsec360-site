import type {
  ReportEnterpriseSummaryResponse,
} from "./types";

export async function fetchReportEnterpriseSummary(
  companyId: string
): Promise<ReportEnterpriseSummaryResponse> {

  if (!companyId) {
    return {
      success: false,
      error: "Firma seçimi bulunamadı.",
    };
  }

  try {

    const response = await fetch(

      `/api/admin/reports/enterprise-summary?companyId=${encodeURIComponent(
        companyId
      )}`,

      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      }

    );

    const json =
      await response
        .json()
        .catch(() => ({}));

    if (!response.ok) {

      return {
        success: false,
        error:
          json?.error ||
          "Kurumsal rapor verileri alınamadı.",
      };

    }

    return json;

  } catch (errorValue: unknown) {

    return {
      success: false,
      error:
        errorValue instanceof Error
          ? errorValue.message
          : "Kurumsal rapor verileri alınamadı.",
    };

  }

}