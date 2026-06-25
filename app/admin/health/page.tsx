"use client";

import { useEffect, useState } from "react";

import { BRAND } from "@/components/dashboard/styles";

import HealthKpiCards from "@/components/health/HealthKpiCards";
import HealthListsSection from "@/components/health/HealthListsSection";

import type {
  HealthDashboardResponse,
  HealthKpiSummary,
  UpcomingHealthExam,
  RecentPrescription,
  RecentEk2,
  HealthAlert,
} from "@/components/health/types";

import { emptyHealthSummary } from "@/components/health/healthHelpers";

export default function HealthDashboardPage() {
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] =
    useState<HealthKpiSummary>(emptyHealthSummary());

  const [upcomingExams, setUpcomingExams] =
    useState<UpcomingHealthExam[]>([]);

  const [recentPrescriptions, setRecentPrescriptions] =
    useState<RecentPrescription[]>([]);

  const [recentEk2, setRecentEk2] =
    useState<RecentEk2[]>([]);

  const [alerts, setAlerts] =
    useState<HealthAlert[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/health-dashboard", {
          cache: "no-store",
          credentials: "include",
        });

        const json: HealthDashboardResponse =
          await res.json();

        if (!res.ok) return;

        setSummary(json.summary || emptyHealthSummary());

        setUpcomingExams(json.upcomingExams || []);

        setRecentPrescriptions(
          json.recentPrescriptions || []
        );

        setRecentEk2(json.recentEk2 || []);

        setAlerts(json.alerts || []);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: BRAND.bg,
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 1450,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: 28,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 900,
            }}
          >
            Sağlık Dashboard
          </h1>

          <div
            style={{
              marginTop: 8,
              color: BRAND.muted,
            }}
          >
            İşyeri hekimi yönetim ekranı
          </div>
        </div>

        <HealthKpiCards
          summary={summary}
          isMobile={false}
        />

        <HealthListsSection
          isMobile={false}
          upcomingExams={upcomingExams}
          recentPrescriptions={recentPrescriptions}
          recentEk2={recentEk2}
          alerts={alerts}
        />
      </div>
    </main>
  );
}