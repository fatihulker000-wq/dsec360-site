"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Siren,
} from "lucide-react";

import DashboardCards from "./dashboard/DashboardCards";
import RiskTrendChart from "./dashboard/RiskTrendChart";
import RiskDistributionChart from "./dashboard/RiskDistributionChart";
import HeatMapCard from "./dashboard/HeatMapCard";
import EmergencySummary from "./dashboard/EmergencySummary";
import RecentRisks from "./dashboard/RecentRisks";

import RiskWorkspace from "./components/RiskWorkspace";
import EmergencyWorkspace from "./components/EmergencyWorkspace";

import type {
  EmergencyDashboard,
  EmergencyDrill,
  EmergencyPlan,
  EmergencySupportMember,
  RiskDashboardTotals,
  RiskRecord,
} from "./types";

import {
  getEmergencyDrills,
  getEmergencyPlans,
  getRisks,
  getSupportTeams,
} from "./services";

type MainTab = "DASHBOARD" | "RISKS" | "EMERGENCY";

const EMPTY_RISK_TOTALS: RiskDashboardTotals = {
  totalRisk: 0,
  criticalRisk: 0,
  intolerableRisk: 0,
  highRisk: 0,
  mediumRisk: 0,
  lowRisk: 0,
  averageScore: 0,
  openDof: 0,
  closedDof: 0,
};

const EMPTY_EMERGENCY_TOTALS: EmergencyDashboard = {
  totalPlans: 0,
  expiredPlans: 0,
  totalMembers: 0,
  pendingSignatures: 0,
  totalDrills: 0,
  upcomingDrills: 0,
};

function normalizeCompany(value?: string | null) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

export default function RiskManagementPage() {
  const [mainTab, setMainTab] =
    useState<MainTab>("DASHBOARD");

  const [records, setRecords] =
    useState<RiskRecord[]>([]);

  const [plans, setPlans] =
    useState<EmergencyPlan[]>([]);

  const [teams, setTeams] =
    useState<EmergencySupportMember[]>([]);

  const [drills, setDrills] =
    useState<EmergencyDrill[]>([]);

  const [selectedCompany, setSelectedCompany] =
    useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const companies = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((record) => record.company?.trim())
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b, "tr")
    );
  }, [records]);

  const selectedCompanyRecord = useMemo(() => {
    if (selectedCompany === "ALL") {
      return records[0] || null;
    }

    return (
      records.find(
        (record) =>
          normalizeCompany(record.company) ===
          normalizeCompany(selectedCompany)
      ) || null
    );
  }, [records, selectedCompany]);

  const selectedFirmId = String(
    selectedCompanyRecord?.firmId || ""
  ).trim();

  const selectedCompanyName =
    selectedCompany === "ALL"
      ? selectedCompanyRecord?.company || ""
      : selectedCompany;

  const filteredRecords = useMemo(() => {
    if (selectedCompany === "ALL") {
      return records;
    }

    return records.filter(
      (record) =>
        normalizeCompany(record.company) ===
        normalizeCompany(selectedCompany)
    );
  }, [records, selectedCompany]);

  const riskTotals = useMemo<RiskDashboardTotals>(
    () => {
      if (filteredRecords.length === 0) {
        return EMPTY_RISK_TOTALS;
      }

      const totalRisk = filteredRecords.length;

      const intolerableRisk = filteredRecords.filter(
        (record) =>
          record.level === "INTOLERABLE"
      ).length;

      const veryHighRisk = filteredRecords.filter(
        (record) =>
          record.level === "VERY_HIGH"
      ).length;

      const criticalRisk =
        veryHighRisk + intolerableRisk;

      const highRisk = filteredRecords.filter(
        (record) => record.level === "HIGH"
      ).length;

      const mediumRisk = filteredRecords.filter(
        (record) =>
          record.level === "MEDIUM"
      ).length;

      const lowRisk = filteredRecords.filter(
        (record) => record.level === "LOW"
      ).length;

      const averageScore = Math.round(
        filteredRecords.reduce(
          (sum, record) =>
            sum + Number(record.score || 0),
          0
        ) / totalRisk
      );

      const openDof = filteredRecords.filter(
        (record) => !record.completed
      ).length;

      const closedDof = filteredRecords.filter(
        (record) => record.completed
      ).length;

      return {
        totalRisk,
        criticalRisk,
        intolerableRisk,
        highRisk,
        mediumRisk,
        lowRisk,
        averageScore,
        openDof,
        closedDof,
      };
    },
    [filteredRecords]
  );

  const emergencyTotals =
    useMemo<EmergencyDashboard>(() => {
      const now = Date.now();

      return {
        totalPlans: plans.length,
        expiredPlans: plans.filter(
          (plan) =>
            plan.validUntilMillis !== null &&
            plan.validUntilMillis < now
        ).length,
        totalMembers: teams.length,
        pendingSignatures: teams.filter(
          (member) =>
            member.signatureStatus ===
            "IMZA_BEKLIYOR"
        ).length,
        totalDrills: drills.length,
        upcomingDrills: drills.filter(
          (drill) =>
            drill.nextDrillDueMillis !== null &&
            drill.nextDrillDueMillis >= now
        ).length,
      };
    }, [plans, teams, drills]);

  const loadRiskData = async () => {
    try {
      setLoading(true);
      setError("");

      const riskRows = await getRisks();

      setRecords(
        Array.isArray(riskRows)
          ? riskRows
          : []
      );
    } catch (loadError) {
      console.error(
        "Risk management load error:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Risk verileri yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadEmergencyData = async (
    firmId: string
  ) => {
    if (!firmId) {
      setPlans([]);
      setTeams([]);
      setDrills([]);
      return;
    }

    try {
      const [
        planRows,
        teamRows,
        drillRows,
      ] = await Promise.all([
        getEmergencyPlans(firmId),
        getSupportTeams(firmId),
        getEmergencyDrills(firmId),
      ]);

      setPlans(
        Array.isArray(planRows)
          ? planRows
          : []
      );

      setTeams(
        Array.isArray(teamRows)
          ? teamRows
          : []
      );

      setDrills(
        Array.isArray(drillRows)
          ? drillRows
          : []
      );
    } catch (loadError) {
      console.error(
        "Emergency management load error:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Acil durum verileri yüklenemedi."
      );
    }
  };

  const loadAll = async () => {
    await loadRiskData();
  };

  useEffect(() => {
    void loadRiskData();
  }, []);

  useEffect(() => {
    void loadEmergencyData(selectedFirmId);
  }, [selectedFirmId]);

  const tabs: Array<{
    value: MainTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      value: "DASHBOARD",
      label: "Dashboard",
      icon: <LayoutDashboard size={17} />,
    },
    {
      value: "RISKS",
      label: "Risk Analizleri",
      icon: <ShieldAlert size={17} />,
    },
    {
      value: "EMERGENCY",
      label: "Acil Durum Yönetimi",
      icon: <Siren size={17} />,
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 1540,
          margin: "0 auto",
          display: "grid",
          gap: 18,
        }}
      >
        <section
          style={{
            overflow: "hidden",
            borderRadius: 28,
            background:
              "linear-gradient(135deg, #3f0d18 0%, #111827 55%, #8b1e2d 100%)",
            padding: 24,
            color: "#ffffff",
            boxShadow:
              "0 24px 60px rgba(63,13,24,0.22)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 18,
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ maxWidth: 780 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 999,
                  padding: "7px 11px",
                  background:
                    "rgba(255,255,255,0.12)",
                  marginBottom: 14,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                <ShieldAlert size={16} />
                D-SEC Risk Yönetim Merkezi
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 34,
                  lineHeight: 1.12,
                  fontWeight: 950,
                  letterSpacing: "-0.03em",
                }}
              >
                Kurumsal Risk ve Acil Durum
                Yönetimi
              </h1>

              <p
                style={{
                  margin: "10px 0 0",
                  maxWidth: 740,
                  color:
                    "rgba(255,255,255,0.84)",
                  lineHeight: 1.6,
                  fontSize: 15,
                }}
              >
                Fine-Kinney, 5x5 matris, DÖF,
                acil durum planları, destek
                ekipleri ve tatbikatları tek
                çalışma alanından yönetin.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadAll()}
              disabled={loading}
              style={{
                minHeight: 44,
                borderRadius: 14,
                border:
                  "1px solid rgba(255,255,255,0.24)",
                background:
                  "rgba(255,255,255,0.13)",
                color: "#ffffff",
                padding: "0 15px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 850,
                cursor: loading
                  ? "wait"
                  : "pointer",
              }}
            >
              {loading ? (
                <Loader2
                  size={17}
                  className="riskPageSpin"
                />
              ) : (
                <RefreshCw size={17} />
              )}

              Yenile
            </button>
          </div>

          <div
            style={{
              marginTop: 20,
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 10,
            }}
          >
            {[
              [
                "Toplam Risk",
                riskTotals.totalRisk,
              ],
              [
                "Kritik Risk",
                riskTotals.criticalRisk,
              ],
              ["Açık DÖF", riskTotals.openDof],
              [
                "Acil Durum Planı",
                emergencyTotals.totalPlans,
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  borderRadius: 18,
                  padding: 14,
                  background:
                    "rgba(255,255,255,0.1)",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color:
                      "rgba(255,255,255,0.68)",
                    fontWeight: 800,
                  }}
                >
                  {label}
                </div>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 23,
                    fontWeight: 950,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {error ? (
          <section
            style={{
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              borderRadius: 16,
              padding: 14,
              display: "flex",
              gap: 10,
              alignItems: "center",
              fontWeight: 800,
            }}
          >
            <AlertTriangle size={18} />
            {error}
          </section>
        ) : null}

        <section
          style={{
            borderRadius: 18,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            padding: 10,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            boxShadow:
              "0 10px 28px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {tabs.map((tab) => {
              const active =
                mainTab === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() =>
                    setMainTab(tab.value)
                  }
                  style={{
                    minHeight: 43,
                    borderRadius: 12,
                    border: active
                      ? "1px solid #6b1020"
                      : "1px solid transparent",
                    background: active
                      ? "#6b1020"
                      : "#f8fafc",
                    color: active
                      ? "#ffffff"
                      : "#475569",
                    padding: "0 15px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          <label
            style={{
              minWidth: 250,
              height: 43,
              borderRadius: 12,
              border: "1px solid #dbe3ec",
              padding: "0 11px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#ffffff",
              color: "#64748b",
            }}
          >
            <Building2 size={16} />

            <select
              value={selectedCompany}
              onChange={(event) =>
                setSelectedCompany(
                  event.target.value
                )
              }
              style={{
                width: "100%",
                border: 0,
                outline: 0,
                background: "transparent",
                color: "#334155",
                fontWeight: 800,
              }}
            >
              <option value="ALL">
                Tüm Firmalar
              </option>

              {companies.map((company) => (
                <option
                  key={company}
                  value={company}
                >
                  {company}
                </option>
              ))}
            </select>
          </label>
        </section>

        {mainTab === "DASHBOARD" ? (
          <div style={{ display: "grid", gap: 16 }}>
            <DashboardCards
              risk={riskTotals}
              emergency={emergencyTotals}
              loading={loading}
            />

            <div
              className="dashboardTwoColumn"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1.15fr) minmax(360px, 0.85fr)",
                gap: 16,
                alignItems: "start",
              }}
            >
              <RiskTrendChart
                records={filteredRecords}
                loading={loading}
              />

              <RiskDistributionChart
                totals={riskTotals}
                loading={loading}
              />
            </div>

            <div
              className="dashboardTwoColumn"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1fr) minmax(0, 1fr)",
                gap: 16,
                alignItems: "start",
              }}
            >
              <HeatMapCard
                records={filteredRecords}
                onCellClick={(
                  probability,
                  severity,
                  selectedRecords
                ) => {
                  if (
                    selectedRecords.length > 0
                  ) {
                    setMainTab("RISKS");
                  }
                }}
              />

              <EmergencySummary
                plans={plans}
                teams={teams}
                drills={drills}
                loading={loading}
                onOpenPlans={() =>
                  setMainTab("EMERGENCY")
                }
                onOpenTeams={() =>
                  setMainTab("EMERGENCY")
                }
                onOpenDrills={() =>
                  setMainTab("EMERGENCY")
                }
              />
            </div>

            <RecentRisks
              records={filteredRecords}
              loading={loading}
              onSelect={() =>
                setMainTab("RISKS")
              }
            />
          </div>
        ) : null}

        {mainTab === "RISKS" ? (
          <RiskWorkspace
            records={filteredRecords}
            loading={loading}
            firmId={selectedFirmId}
            onReload={loadRiskData}
          />
        ) : null}

        {mainTab === "EMERGENCY" ? (
          <EmergencyWorkspace
            firmId={selectedFirmId}
            companyName={selectedCompanyName}
          />
        ) : null}
      </div>

      <style jsx>{`
        .riskPageSpin {
          animation: risk-page-spin 0.9s
            linear infinite;
        }

        @keyframes risk-page-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1000px) {
          .dashboardTwoColumn {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 700px) {
          main {
            padding: 12px !important;
          }
        }
      `}</style>
    </main>
  );
}