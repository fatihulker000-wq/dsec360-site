"use client";

import Link from "next/link";
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
  RecentHealthExam,
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

    const [recentExaminations, setRecentExaminations] =
  useState<RecentHealthExam[]>([]);

  const [alerts, setAlerts] =
    useState<HealthAlert[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/health-dashboard", {
          cache: "no-store",
          credentials: "include",
        });

        const json: HealthDashboardResponse = await res.json();

        if (!res.ok) return;

        setSummary(json.summary || emptyHealthSummary());
        setUpcomingExams(json.upcomingExams || []);
        setRecentPrescriptions(json.recentPrescriptions || []);
        setRecentEk2(json.recentEk2 || []);
        setRecentExaminations(json.recentExaminations || []);
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

        {/* Çalışan Sağlık Kartları */}
        <Link
          href="/admin/health/employees"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            marginBottom: 28,
            padding: 28,
            borderRadius: 22,
            background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
            color: "#fff",
            textDecoration: "none",
            boxShadow: "0 18px 40px rgba(127,29,29,.20)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                opacity: .85,
              }}
            >
              HEKİM ÇALIŞMA ALANI
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                marginTop: 8,
              }}
            >
              Çalışan Sağlık Kartları
            </div>

            <div
              style={{
                marginTop: 10,
                opacity: .9,
                fontSize: 15,
              }}
            >
              Muayene, EK-2, reçete, laboratuvar, odyometri,
              SFT, aşı ve tüm sağlık geçmişini tek ekrandan yönetin.
            </div>
          </div>

          <div
            style={{
              padding: "14px 22px",
              borderRadius: 14,
              background: "rgba(255,255,255,.18)",
              border: "1px solid rgba(255,255,255,.25)",
              fontWeight: 900,
              whiteSpace: "nowrap",
              fontSize: 18,
            }}
          >
            Aç →
          </div>
        </Link>

        <HealthKpiCards
          summary={summary}
          isMobile={false}
        />

        <HealthListsSection
  isMobile={false}
  upcomingExams={upcomingExams}
  recentExaminations={recentExaminations}
  recentPrescriptions={recentPrescriptions}
  recentEk2={recentEk2}
  alerts={alerts}
/>
      </div>
    </main>
  );
}