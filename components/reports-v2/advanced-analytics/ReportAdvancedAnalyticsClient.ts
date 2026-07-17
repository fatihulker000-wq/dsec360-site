import type {
  AdvancedAnalyticsResponse,
} from "./types";

export async function fetchAdvancedAnalytics(
  companyId: string,
  months = 12
): Promise<AdvancedAnalyticsResponse> {
  try {
    const response = await fetch(
      `/api/admin/reports/analytics-trends?companyId=${encodeURIComponent(
        companyId
      )}&months=${months}`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      }
    );

    const json = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error:
          json?.error ||
          "Gelişmiş analitik verileri alınamadı.",
      };
    }

    return json;
  } catch (errorValue: unknown) {
    return {
      success: false,
      error:
        errorValue instanceof Error
          ? errorValue.message
          : "Gelişmiş analitik verileri alınamadı.",
    };
  }
}