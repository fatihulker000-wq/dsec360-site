import type {
  AdvancedAnalyticsDashboardData,
  AdvancedAnalyticsResponse,
} from "./types";

export function mapAdvancedAnalytics(
  response?: AdvancedAnalyticsResponse | null
): AdvancedAnalyticsDashboardData {
  return {
    periods:
      response?.data?.periods || [],

    trends:
      response?.data?.trends || [],

    comparisons:
      response?.data?.comparisons || [],

    heatmap:
      response?.data?.heatmap || [],
  };
}