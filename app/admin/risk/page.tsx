"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
import RiskAnalyticsSection from "./dashboard/RiskAnalyticsSection";

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

type MainTab =
  | "DASHBOARD"
  | "RISKS"
  | "EMERGENCY";

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

const EMPTY_BUCKET = {
  open: 0,
  closed: 0,
  total: 0,
};

const EMPTY_RISK_TOTALS: RiskDashboardTotals = {
  totalRisk: 0,
  total: { ...EMPTY_BUCKET },
  low: { ...EMPTY_BUCKET },
  medium: { ...EMPTY_BUCKET },
  high: { ...EMPTY_BUCKET },
  veryHigh: { ...EMPTY_BUCKET },
  intolerable: { ...EMPTY_BUCKET },
  criticalIntervention: 0,
  overdueAction: 0,
  closureRate: 0,
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

export default function RiskManagementPage() {
  const [mainTab, setMainTab] =
    useState<MainTab>("DASHBOARD");

  const [records, setRecords] =
    useState<RiskRecord[]>([]);

  const [companies, setCompanies] =
    useState<CompanyItem[]>([]);

  const [
    selectedCompanyId,
    setSelectedCompanyId,
  ] = useState("ALL");

  const [plans, setPlans] =
    useState<EmergencyPlan[]>([]);

  const [teams, setTeams] =
    useState<EmergencySupportMember[]>([]);

  const [drills, setDrills] =
    useState<EmergencyDrill[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    loadingCompanies,
    setLoadingCompanies,
  ] = useState(true);

  const [
    loadingEmergency,
    setLoadingEmergency,
  ] = useState(false);

  const [error, setError] =
    useState("");

  /* =========================================================
     SELECTED COMPANY
  ========================================================= */

  const selectedCompany = useMemo(
    () =>
      companies.find(
        (company) =>
          company.id === selectedCompanyId
      ) || null,
    [companies, selectedCompanyId]
  );

  const selectedFirmId =
    selectedCompany?.id || "";

  const selectedCompanyName =
    selectedCompany?.name || "";

  /* =========================================================
     FIRM FILTER
  ========================================================= */

  const filteredRecords = useMemo(() => {
    if (selectedCompanyId === "ALL") {
      return records;
    }

    return records.filter(
      (record) =>
        String(record.firmId || "") ===
        selectedCompanyId
    );
  }, [records, selectedCompanyId]);

  /* =========================================================
     RISK TOTALS
  ========================================================= */

  const riskTotals =
    useMemo<RiskDashboardTotals>(() => {
      if (filteredRecords.length === 0) {
        return EMPTY_RISK_TOTALS;
      }

      const now = Date.now();

      const bucket = (
        level?: RiskRecord["level"]
      ) => {
        const rows = level
          ? filteredRecords.filter(
              (record) =>
                record.level === level
            )
          : filteredRecords;

        const open = rows.filter(
          (record) =>
            (record.riskStatus || "OPEN") ===
            "OPEN"
        ).length;

        const closed = rows.filter(
          (record) =>
            (record.riskStatus || "OPEN") ===
            "CLOSED"
        ).length;

        return {
          open,
          closed,
          total: rows.length,
        };
      };

      const total = bucket();
      const low = bucket("LOW");
      const medium = bucket("MEDIUM");
      const high = bucket("HIGH");
      const veryHigh =
        bucket("VERY_HIGH");
      const intolerable =
        bucket("INTOLERABLE");

      const openDof =
        filteredRecords.filter(
          (record) => !record.completed
        ).length;

      const closedDof =
        filteredRecords.filter(
          (record) => record.completed
        ).length;

      const overdueAction =
        filteredRecords.filter(
          (record) =>
            !record.completed &&
            typeof record.dueDateMillis ===
              "number" &&
            record.dueDateMillis > 0 &&
            record.dueDateMillis < now
        ).length;

      const criticalIntervention =
        veryHigh.open +
        intolerable.open;

      const closureRate =
        total.total > 0
          ? Math.round(
              (total.closed /
                total.total) *
                100
            )
          : 0;

      const classifiedTotal =
        low.total +
        medium.total +
        high.total +
        veryHigh.total +
        intolerable.total;

      if (
        process.env.NODE_ENV !==
          "production" &&
        classifiedTotal !== total.total
      ) {
        console.warn(
          "[Risk Dashboard] Sınıflandırma toplamı genel toplamla eşleşmiyor.",
          {
            classifiedTotal,
            totalRisk: total.total,
          }
        );
      }

      return {
        totalRisk: total.total,
        total,
        low,
        medium,
        high,
        veryHigh,
        intolerable,
        criticalIntervention,
        overdueAction,
        closureRate,
        openDof,
        closedDof,
      };
    }, [filteredRecords]);

  /* =========================================================
     EMERGENCY TOTALS
  ========================================================= */

  const emergencyTotals =
    useMemo<EmergencyDashboard>(() => {
      const now = Date.now();

      return {
        totalPlans: plans.length,

        expiredPlans:
          plans.filter(
            (plan) =>
              plan.validUntilMillis !==
                null &&
              plan.validUntilMillis < now
          ).length,

        totalMembers: teams.length,

        pendingSignatures:
          teams.filter(
            (member) =>
              member.signatureStatus ===
              "IMZA_BEKLIYOR"
          ).length,

        totalDrills: drills.length,

        upcomingDrills:
          drills.filter(
            (drill) =>
              drill.nextDrillDueMillis !==
                null &&
              drill.nextDrillDueMillis >=
                now
          ).length,
      };
    }, [plans, teams, drills]);

  /* =========================================================
     LOAD COMPANIES
  ========================================================= */

  const loadCompanies =
    useCallback(async () => {
      try {
        setLoadingCompanies(true);

        const response = await fetch(
          "/api/admin/companies",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const json: CompaniesResponse =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            json.error ||
              json.message ||
              "Firmalar alınamadı."
          );
        }

        const rows = (
          Array.isArray(json.data)
            ? json.data
            : []
        )
          .map(
            (row): CompanyItem => ({
              id: String(
                row.id || ""
              ).trim(),

              name: String(
                row.name ||
                  row.title ||
                  row.company_name ||
                  ""
              ).trim(),

              isActive:
                row.is_active !== false,
            })
          )
          .filter(
            (company) =>
              company.id &&
              company.name &&
              company.isActive
          )
          .sort((a, b) =>
            a.name.localeCompare(
              b.name,
              "tr"
            )
          );

        setCompanies(rows);

        setSelectedCompanyId(
          (current) => {
            if (
              (current === "ALL" ||
                !current) &&
              rows.length > 0
            ) {
              return rows[0].id;
            }

            return current;
          }
        );
      } catch (companyError) {
        console.error(
          "Company load error:",
          companyError
        );

        setCompanies([]);

        setError(
          companyError instanceof Error
            ? companyError.message
            : "Firmalar yüklenemedi."
        );
      } finally {
        setLoadingCompanies(false);
      }
    }, []);

  /* =========================================================
     LOAD RISK
  ========================================================= */

  const loadRiskData = async () => {
    try {
      setLoading(true);
      setError("");

      const riskRows =
        await getRisks();

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

  /* =========================================================
     LOAD EMERGENCY
  ========================================================= */

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

  /* =========================================================
     REFRESH
  ========================================================= */

  const loadAll = async () => {
    await Promise.all([
      loadCompanies(),
      loadRiskData(),
    ]);

    if (selectedFirmId) {
      await loadEmergencyData(
        selectedFirmId
      );
    }
  };

  useEffect(() => {
    void Promise.all([
      loadCompanies(),
      loadRiskData(),
    ]);
  }, [loadCompanies]);

  useEffect(() => {
    void loadEmergencyData(
      selectedFirmId
    );
  }, [selectedFirmId]);

  /* =========================================================
     TAB
  ========================================================= */

  const handleTabChange = (
    tab: MainTab
  ) => {
    if (
      tab === "EMERGENCY" &&
      selectedCompanyId === "ALL" &&
      companies.length > 0
    ) {
      setSelectedCompanyId(
        companies[0].id
      );
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
      icon: (
        <LayoutDashboard size={17} />
      ),
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

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="riskPageRoot">
      <div className="riskPageContainer">
        {/* ===================================================
            HERO
        ==================================================== */}

        <section className="riskHero">
          <div className="riskHeroContent">
            <div className="riskHeroText">
              <div className="riskHeroBadge">
                <ShieldAlert size={16} />

                D-SEC Risk Yönetim Merkezi
              </div>

              <h1>
                Kurumsal Risk ve Acil
                Durum Yönetimi
              </h1>

              <p>
                Fine-Kinney, 5x5 matris,
                DÖF, acil durum planları,
                destek ekipleri ve
                tatbikatları tek çalışma
                alanından yönetin.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadAll()
              }
              disabled={loading}
              className="refreshButton"
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

        {/* ===================================================
            ERROR
        ==================================================== */}

        {error ? (
          <section className="errorBox">
            <AlertTriangle size={18} />

            <span>{error}</span>
          </section>
        ) : null}

        {/* ===================================================
            NAVIGATION
        ==================================================== */}

        <section className="riskNavigation">
          <div className="riskTabs">
            {tabs.map((tab) => {
              const active =
                mainTab === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() =>
                    handleTabChange(
                      tab.value
                    )
                  }
                  className={
                    active
                      ? "riskTab riskTabActive"
                      : "riskTab"
                  }
                >
                  {tab.icon}

                  {tab.label}
                </button>
              );
            })}
          </div>

          <label className="companySelector">
            <Building2 size={16} />

            <select
              value={
                selectedCompanyId
              }
              disabled={
                loadingCompanies
              }
              onChange={(event) =>
                setSelectedCompanyId(
                  event.target.value
                )
              }
            >
              <option value="ALL">
                Tüm Firmalar
              </option>

              {companies.map(
                (company) => (
                  <option
                    key={company.id}
                    value={company.id}
                  >
                    {company.name}
                  </option>
                )
              )}
            </select>
          </label>
        </section>

        {/* ===================================================
            DASHBOARD
        ==================================================== */}

        {mainTab === "DASHBOARD" ? (
          <div className="dashboardRoot">
            {/* KPI CARDS */}

            <div className="dashboardBlock">
              <DashboardCards
                risk={riskTotals}
                emergency={
                  selectedCompany
                    ? emergencyTotals
                    : EMPTY_EMERGENCY_TOTALS
                }
                loading={
                  loading ||
                  loadingCompanies
                }
              />
            </div>

            {/* TREND + DISTRIBUTION */}

            <div className="dashboardTwoColumn dashboardTrendGrid">
              <div className="dashboardCell">
                <RiskTrendChart
                  records={
                    filteredRecords
                  }
                  loading={loading}
                />
              </div>

              <div className="dashboardCell">
                <RiskDistributionChart
                  totals={riskTotals}
                  loading={loading}
                />
              </div>
            </div>

            {/* ANALYTICS */}

            <div className="dashboardBlock">
              <RiskAnalyticsSection
                records={
                  filteredRecords
                }
                loading={loading}
                onOpenRisks={() =>
                  setMainTab("RISKS")
                }
              />
            </div>

            {/* HEATMAP + EMERGENCY */}

            <div className="dashboardTwoColumn">
              <div className="dashboardCell">
                <HeatMapCard
                  records={
                    filteredRecords
                  }
                  onCellClick={(
                    probability,
                    severity,
                    selectedRecords
                  ) => {
                    if (
                      selectedRecords.length >
                      0
                    ) {
                      setMainTab(
                        "RISKS"
                      );
                    }
                  }}
                />
              </div>

              <div className="dashboardCell">
                {selectedCompany ? (
                  <EmergencySummary
                    plans={plans}
                    teams={teams}
                    drills={drills}
                    loading={
                      loadingEmergency
                    }
                    onOpenPlans={() =>
                      setMainTab(
                        "EMERGENCY"
                      )
                    }
                    onOpenTeams={() =>
                      setMainTab(
                        "EMERGENCY"
                      )
                    }
                    onOpenDrills={() =>
                      setMainTab(
                        "EMERGENCY"
                      )
                    }
                  />
                ) : (
                  <section className="companyRequiredCard">
                    <div>
                      <Building2
                        size={36}
                        color="#7f1d1d"
                      />

                      <h3>
                        Acil durum özeti
                        için firma seçin
                      </h3>

                      <p>
                        Plan, ekip ve
                        tatbikat verileri
                        firma bazında
                        gösterilir.
                      </p>
                    </div>
                  </section>
                )}
              </div>
            </div>

            {/* RECENT */}

            <div className="dashboardBlock">
              <RecentRisks
                records={
                  filteredRecords
                }
                loading={loading}
                onSelect={() =>
                  setMainTab("RISKS")
                }
              />
            </div>
          </div>
        ) : null}

        {/* ===================================================
            RISK WORKSPACE
        ==================================================== */}

        {mainTab === "RISKS" ? (
          <div className="workspaceWrapper">
            <RiskWorkspace
              records={
                filteredRecords
              }
              loading={loading}
              firmId={selectedFirmId}
              companyName={
                selectedCompanyName
              }
              onReload={
                loadRiskData
              }
            />
          </div>
        ) : null}

        {/* ===================================================
            EMERGENCY
        ==================================================== */}

        {mainTab === "EMERGENCY" ? (
          selectedCompany ? (
            <div className="workspaceWrapper">
              <EmergencyWorkspace
                firmId={
                  selectedFirmId
                }
                companyName={
                  selectedCompanyName
                }
              />
            </div>
          ) : (
            <section className="companyRequiredWarning">
              <div>
                <Building2 size={36} />

                <h3>
                  Firma seçimi gerekli
                </h3>

                <p>
                  Acil durum kayıtları
                  için yukarıdan firma
                  seçin.
                </p>
              </div>
            </section>
          )
        ) : null}
      </div>

      <style jsx>{`
        /* ===================================================
           PAGE WIDTH FIX
        ==================================================== */

        .riskPageRoot {
          min-height: 100vh;

          width: 100%;
          max-width: 100%;

          min-width: 0;

          overflow-x: clip;

          box-sizing: border-box;

          padding: 24px;

          background: linear-gradient(
            180deg,
            #f8fafc 0%,
            #eef2f7 100%
          );
        }

        .riskPageContainer {
          width: 100%;
          max-width: 1540px;
          min-width: 0;

          margin: 0 auto;

          display: grid;
          gap: 18px;

          box-sizing: border-box;
        }

        /*
         * Grid/Flex child bileşenlerinin
         * intrinsic width nedeniyle parent'i
         * genişletmesini engeller.
         */
        .riskPageContainer
          :global(*) {
          box-sizing: border-box;
        }

        .dashboardRoot,
        .dashboardBlock,
        .dashboardCell,
        .workspaceWrapper {
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        .dashboardRoot {
          display: grid;
          gap: 16px;
        }

        .dashboardBlock {
          overflow: hidden;
        }

        /*
         * Child bileşenlerde min-content
         * taşmasını özellikle engeller.
         */
        .dashboardBlock
          :global(> *),
        .dashboardCell
          :global(> *),
        .workspaceWrapper
          :global(> *) {
          min-width: 0;
          max-width: 100%;
        }

        /* ===================================================
           HERO
        ==================================================== */

        .riskHero {
          width: 100%;
          min-width: 0;

          overflow: hidden;

          border-radius: 28px;

          background: linear-gradient(
            135deg,
            #3f0d18 0%,
            #111827 55%,
            #8b1e2d 100%
          );

          padding: 24px;

          color: #ffffff;

          box-shadow: 0 24px 60px
            rgba(63, 13, 24, 0.22);
        }

        .riskHeroContent {
          width: 100%;
          min-width: 0;

          display: flex;
          flex-wrap: wrap;

          gap: 18px;

          justify-content: space-between;
          align-items: flex-start;
        }

        .riskHeroText {
          flex: 1 1 520px;
          min-width: 0;
          max-width: 780px;
        }

        .riskHeroBadge {
          display: inline-flex;
          align-items: center;

          gap: 8px;

          border-radius: 999px;

          padding: 7px 11px;

          background: rgba(
            255,
            255,
            255,
            0.12
          );

          margin-bottom: 14px;

          font-size: 12px;
          font-weight: 800;
        }

        .riskHero h1 {
          margin: 0;

          font-size: clamp(
            26px,
            3vw,
            34px
          );

          line-height: 1.12;

          font-weight: 950;

          letter-spacing: -0.03em;

          overflow-wrap: anywhere;
        }

        .riskHero p {
          margin: 10px 0 0;

          max-width: 740px;

          color: rgba(
            255,
            255,
            255,
            0.84
          );

          line-height: 1.6;

          font-size: 15px;
        }

        .refreshButton {
          min-height: 44px;

          flex: 0 0 auto;

          border-radius: 14px;

          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.24
            );

          background: rgba(
            255,
            255,
            255,
            0.13
          );

          color: #ffffff;

          padding: 0 15px;

          display: inline-flex;

          align-items: center;

          gap: 8px;

          font-weight: 850;

          cursor: pointer;
        }

        .refreshButton:disabled {
          cursor: wait;
          opacity: 0.75;
        }

        /* ===================================================
           ERROR
        ==================================================== */

        .errorBox {
          width: 100%;
          min-width: 0;

          border: 1px solid #fecaca;

          background: #fef2f2;

          color: #b91c1c;

          border-radius: 16px;

          padding: 14px;

          display: flex;

          gap: 10px;

          align-items: center;

          font-weight: 800;

          overflow-wrap: anywhere;
        }

        /* ===================================================
           NAVIGATION
        ==================================================== */

        .riskNavigation {
          width: 100%;
          min-width: 0;

          border-radius: 18px;

          border: 1px solid #e5e7eb;

          background: #ffffff;

          padding: 10px;

          display: flex;

          flex-wrap: wrap;

          align-items: center;

          justify-content: space-between;

          gap: 10px;

          box-shadow: 0 10px 28px
            rgba(15, 23, 42, 0.04);
        }

        .riskTabs {
          min-width: 0;

          display: flex;

          flex: 1 1 520px;

          flex-wrap: wrap;

          gap: 8px;
        }

        .riskTab {
          min-height: 43px;

          border-radius: 12px;

          border: 1px solid
            transparent;

          background: #f8fafc;

          color: #475569;

          padding: 0 15px;

          display: inline-flex;

          align-items: center;

          gap: 8px;

          font-weight: 900;

          cursor: pointer;

          white-space: nowrap;
        }

        .riskTabActive {
          border-color: #6b1020;

          background: #6b1020;

          color: #ffffff;
        }

        .companySelector {
          width: min(100%, 360px);

          min-width: 0;

          height: 43px;

          border-radius: 12px;

          border: 1px solid #dbe3ec;

          padding: 0 11px;

          display: flex;

          align-items: center;

          gap: 8px;

          background: #ffffff;

          color: #64748b;

          flex: 0 1 360px;
        }

        .companySelector select {
          width: 100%;

          min-width: 0;

          border: 0;

          outline: 0;

          background: transparent;

          color: #334155;

          font-weight: 800;

          text-overflow: ellipsis;
        }

        /* ===================================================
           DASHBOARD GRID
        ==================================================== */

        .dashboardTwoColumn {
          width: 100%;
          max-width: 100%;
          min-width: 0;

          display: grid;

          /*
           * ÖNEMLİ:
           * Eski:
           * minmax(0,1.15fr) minmax(360px,.85fr)
           *
           * 360px alt sınırı parent grid'i
           * sağa doğru büyütebiliyordu.
           */
          grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1fr);

          gap: 16px;

          align-items: start;
        }

        .dashboardTrendGrid {
          grid-template-columns:
            minmax(0, 1.15fr)
            minmax(0, 0.85fr);
        }

        .dashboardCell {
          /*
           * CSS Grid'de bu kritik.
           * Child içerik parent kolonu
           * büyütemez.
           */
          min-width: 0;

          width: 100%;

          max-width: 100%;

          overflow: hidden;
        }

        /* ===================================================
           PLACEHOLDER
        ==================================================== */

        .companyRequiredCard {
          min-height: 360px;

          width: 100%;

          border-radius: 22px;

          border: 1px solid #e5e7eb;

          background: #ffffff;

          display: grid;

          place-items: center;

          padding: 24px;

          text-align: center;

          color: #64748b;
        }

        .companyRequiredCard h3 {
          margin: 12px 0 6px;

          color: #0f172a;
        }

        .companyRequiredCard p {
          margin: 0;
        }

        .companyRequiredWarning {
          min-height: 300px;

          width: 100%;
          min-width: 0;

          border-radius: 20px;

          border: 1px solid #fde68a;

          background: #fffbeb;

          color: #92400e;

          display: grid;

          place-items: center;

          padding: 24px;

          text-align: center;
        }

        .companyRequiredWarning h3 {
          margin: 12px 0 6px;
        }

        .companyRequiredWarning p {
          margin: 0;
        }

        /* ===================================================
           ANIMATION
        ==================================================== */

        .riskPageSpin {
          animation: risk-page-spin
            0.9s linear infinite;
        }

        @keyframes risk-page-spin {
          to {
            transform: rotate(
              360deg
            );
          }
        }

        /* ===================================================
           RESPONSIVE
        ==================================================== */

        /*
         * Admin sidebar varken gerçek kullanılabilir
         * alan daha düşük olduğu için breakpoint'i
         * 1000 yerine 1180 yaptım.
         */
        @media (max-width: 1180px) {
          .dashboardTwoColumn,
          .dashboardTrendGrid {
            grid-template-columns:
              minmax(0, 1fr) !important;
          }
        }

        @media (max-width: 900px) {
          .riskPageRoot {
            padding: 18px;
          }

          .riskHero {
            padding: 20px;
          }

          .riskNavigation {
            align-items: stretch;
          }

          .riskTabs {
            flex-basis: 100%;
          }

          .companySelector {
            width: 100%;
            max-width: none;

            flex-basis: 100%;
          }
        }

        @media (max-width: 700px) {
          .riskPageRoot {
            padding: 12px;
          }

          .riskHero {
            border-radius: 20px;
            padding: 18px;
          }

          .riskHeroText {
            flex-basis: 100%;
          }

          .refreshButton {
            width: 100%;

            justify-content: center;
          }

          .riskTab {
            flex: 1 1 auto;

            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .riskPageRoot {
            padding: 8px;
          }

          .riskNavigation {
            padding: 8px;
          }

          .riskTabs {
            display: grid;

            grid-template-columns:
              minmax(0, 1fr);
          }

          .riskTab {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}