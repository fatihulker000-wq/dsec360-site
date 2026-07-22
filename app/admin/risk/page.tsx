"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RiskAnalyticsSection from "./dashboard/RiskAnalyticsSection";
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

type CompanyItem = {
  id: string;
  name: string;
  isActive: boolean;
};

type CompaniesResponse = {
  data?: Array<{
    id?: string | number | null;
    name?: string | null;
    title?: string | null;
    company_name?: string | null;
    is_active?: boolean | null;
  }>;
  message?: string;
  error?: string;
};

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

  const [companies, setCompanies] =
    useState<CompanyItem[]>([]);

  const [selectedCompanyId, setSelectedCompanyId] =
    useState("ALL");

  const [plans, setPlans] =
    useState<EmergencyPlan[]>([]);

  const [teams, setTeams] =
    useState<EmergencySupportMember[]>([]);

  const [drills, setDrills] =
    useState<EmergencyDrill[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingEmergency, setLoadingEmergency] = useState(false);
  const [error, setError] = useState("");

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) || null,
    [companies, selectedCompanyId]
  );

  const selectedFirmId = selectedCompany?.id || "";
  const selectedCompanyName = selectedCompany?.name || "";

  const filteredRecords = useMemo(() => {
    if (selectedCompanyId === "ALL") {
      return records;
    }

    return records.filter((record) => {
      if (String(record.firmId || "") === selectedCompanyId) return true;
      return normalizeCompany(record.company) === normalizeCompany(selectedCompanyName);
    });
  }, [records, selectedCompanyId, selectedCompanyName]);

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

  const loadCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      const response = await fetch("/api/admin/companies", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const json: CompaniesResponse = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.error || json.message || "Firmalar alınamadı.");
      }
      const rows = (Array.isArray(json.data) ? json.data : [])
        .map((row): CompanyItem => ({
          id: String(row.id || "").trim(),
          name: String(row.name || row.title || row.company_name || "").trim(),
          isActive: row.is_active !== false,
        }))
        .filter((company) => company.id && company.name && company.isActive)
        .sort((a, b) => a.name.localeCompare(b.name, "tr"));
      setCompanies(rows);
    } catch (companyError) {
      console.error("Company load error:", companyError);
      setCompanies([]);
      setError(companyError instanceof Error ? companyError.message : "Firmalar yüklenemedi.");
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

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
      setLoadingEmergency(true);
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
    } finally {
      setLoadingEmergency(false);
    }
  };

  const loadAll = async () => {
    await Promise.all([loadCompanies(), loadRiskData()]);
    if (selectedFirmId) await loadEmergencyData(selectedFirmId);
  };

  useEffect(() => {
    void Promise.all([loadCompanies(), loadRiskData()]);
  }, [loadCompanies]);

  useEffect(() => {
    void loadEmergencyData(selectedFirmId);
  }, [selectedFirmId]);

  const handleTabChange = (tab: MainTab) => {
    if (tab === "EMERGENCY" && selectedCompanyId === "ALL" && companies.length > 0) {
      setSelectedCompanyId(companies[0].id);
    }
    setMainTab(tab);
  };

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
                    handleTabChange(tab.value)
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
              value={selectedCompanyId}
              disabled={loadingCompanies}
              onChange={(event) =>
                setSelectedCompanyId(
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
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        {mainTab === "DASHBOARD" ? (
          <div style={{ display: "grid", gap: 16 }}>
            <DashboardCards
              risk={riskTotals}
              emergency={selectedCompany ? emergencyTotals : EMPTY_EMERGENCY_TOTALS}
              loading={loading || loadingCompanies}
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

            <RiskAnalyticsSection
  records={filteredRecords}
  loading={loading}
  onOpenRisks={() => setMainTab("RISKS")}
/>

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

              {selectedCompany ? (
              <EmergencySummary
                plans={plans}
                teams={teams}
                drills={drills}
                loading={loadingEmergency}
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
              ) : (
                <section style={{minHeight:360,borderRadius:22,border:"1px solid #e5e7eb",background:"#fff",display:"grid",placeItems:"center",padding:24,textAlign:"center",color:"#64748b"}}>
                  <div><Building2 size={36} color="#7f1d1d"/><h3 style={{margin:"12px 0 6px",color:"#0f172a"}}>Acil durum özeti için firma seçin</h3><p style={{margin:0}}>Plan, ekip ve tatbikat verileri firma bazında gösterilir.</p></div>
                </section>
              )}
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
          selectedCompany ? (
            <EmergencyWorkspace
              firmId={selectedFirmId}
              companyName={selectedCompanyName}
            />
          ) : (
            <section style={{minHeight:300,borderRadius:20,border:"1px solid #fde68a",background:"#fffbeb",color:"#92400e",display:"grid",placeItems:"center",padding:24,textAlign:"center"}}>
              <div><Building2 size={36}/><h3 style={{margin:"12px 0 6px"}}>Firma seçimi gerekli</h3><p style={{margin:0}}>Acil durum kayıtları için yukarıdan firma seçin.</p></div>
            </section>
          )
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