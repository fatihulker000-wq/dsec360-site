import type { HealthKpiSummary } from "./types";

export function emptyHealthSummary(): HealthKpiSummary {
  return {
    todayExams: 0,
    upcomingExams: 0,
    overdueExams: 0,
    todayPrescriptions: 0,
    openAccidents: 0,
    upcomingVaccines: 0,
    criticalAlerts: 0,
    riskyEmployees: 0,
  };
}

export function healthStatusColor(value: number) {
  if (value <= 5) {
    return {
      color: "#16a34a",
      background: "#f0fdf4",
    };
  }

  if (value <= 15) {
    return {
      color: "#d97706",
      background: "#fff7ed",
    };
  }

  return {
    color: "#dc2626",
    background: "#fef2f2",
  };
}

export function formatHealthDate(value?: string) {
  if (!value) return "-";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("tr-TR");
}