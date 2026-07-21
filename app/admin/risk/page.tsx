"use client";

import { useEffect, useMemo, useState } from "react";
import RiskKpiCards from "./components/RiskKpiCards";
import RiskTable from "./components/RiskTable";
import RiskDetailPanel from "./components/RiskDetailPanel";
import RiskDialog from "./components/RiskDialog";
import RiskHeatMap from "./components/RiskHeatMap";
import RiskCharts from "./components/RiskCharts";
import {
  AlertTriangle,
  Building2,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type RiskMethod = "MATRIX" | "FINE_KINNEY";
type DofStatus = "OPEN" | "CLOSED";

type RiskRecord = {
  id: string;
  remoteId?: string | null;
  syncKey?: string | null;
  firmId: string;
  webFirmId?: string | null;
  company: string;
  title: string;
  hazard: string;
  consequence?: string | null;
  control?: string | null;
  method: RiskMethod;
  probability?: number | null;
  severity?: number | null;
  probabilityValue?: number | null;
  frequencyValue?: number | null;
  severityValue?: number | null;
  score: number;
  level: RiskLevel;
  department?: string | null;
  responsible?: string | null;
  dofStatus: DofStatus;
  dofDueDate?: string | null;
  source?: "APP" | "WEB" | "MERGED";
  updatedAt: string;
};

type RiskDashboardResponse = {
  success?: boolean;
  records?: RiskRecord[];
  companies?: string[];
  message?: string;
};


type RiskFormState = {
  id?: string;
  method: RiskMethod;
  companyId: string;
  title: string;
  hazard: string;
  consequence: string;
  control: string;
  probability: number;
  severity: number;
  probabilityValue: number;
  frequencyValue: number;
  severityValue: number;
  department: string;
  location: string;
  machine: string;
  responsible: string;
  dofStatus: DofStatus;
  dofAction: string;
  dofResponsible: string;
  dofDueDate: string;
  dofNote: string;
};

const EMPTY_FORM: RiskFormState = {
  method: "MATRIX",
  companyId: "",
  title: "",
  hazard: "",
  consequence: "",
  control: "",
  probability: 1,
  severity: 1,
  probabilityValue: 1,
  frequencyValue: 1,
  severityValue: 1,
  department: "",
  location: "",
  machine: "",
  responsible: "",
  dofStatus: "OPEN",
  dofAction: "",
  dofResponsible: "",
  dofDueDate: "",
  dofNote: "",
};

const DEMO_RISKS: RiskRecord[] = [
  {
    id: "demo-1",
    firmId: "1",
    company: "D-SEC Demo İşletmesi",
    title: "Forklift ve yaya yolunun kesişmesi",
    hazard: "Forklift-yaya çarpışması",
    consequence: "Ezilme, ağır yaralanma veya ölüm",
    control: "Yaya yolu ayrılmalı, bariyer ve ikaz sistemi kurulmalı.",
    method: "FINE_KINNEY",
    score: 420,
    level: "CRITICAL",
    department: "Lojistik",
    responsible: "Depo Müdürü",
    dofStatus: "OPEN",
    dofDueDate: "2026-07-30",
    source: "APP",
    updatedAt: "2026-07-21T10:30:00.000Z",
  },
  {
    id: "demo-2",
    firmId: "1",
    company: "D-SEC Demo İşletmesi",
    title: "Elektrik panosu önünde malzeme istifi",
    hazard: "Elektrik panosuna erişimin engellenmesi",
    consequence: "Yangın ve acil müdahale gecikmesi",
    control: "Pano önü en az 1 metre boş bırakılmalı.",
    method: "MATRIX",
    score: 20,
    level: "CRITICAL",
    department: "Üretim",
    responsible: "Bakım Şefi",
    dofStatus: "OPEN",
    dofDueDate: "2026-07-24",
    source: "WEB",
    updatedAt: "2026-07-21T09:10:00.000Z",
  },
  {
    id: "demo-3",
    firmId: "1",
    company: "D-SEC Demo İşletmesi",
    title: "Islak zeminde kayma riski",
    hazard: "Kaygan zemin",
    consequence: "Burkulma, kırık ve iş göremezlik",
    control: "Zemin kurutulmalı ve uyarı levhası kullanılmalı.",
    method: "MATRIX",
    score: 12,
    level: "MEDIUM",
    department: "Market",
    responsible: "Şube Müdürü",
    dofStatus: "CLOSED",
    dofDueDate: null,
    source: "APP",
    updatedAt: "2026-07-20T13:00:00.000Z",
  },
  {
    id: "demo-4",
    firmId: "1",
    company: "D-SEC Demo İşletmesi",
    title: "Raf üstü uygunsuz yükleme",
    hazard: "Yük düşmesi",
    consequence: "Baş ve vücut yaralanmaları",
    control: "Raf yük limitleri işaretlenmeli ve ağır yükler alt raflara alınmalı.",
    method: "FINE_KINNEY",
    score: 168,
    level: "HIGH",
    department: "Depo",
    responsible: "Depo Sorumlusu",
    dofStatus: "OPEN",
    dofDueDate: "2026-08-02",
    source: "WEB",
    updatedAt: "2026-07-19T16:25:00.000Z",
  },
];

function normalizeCompany(value?: string | null) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function isOverdue(record: RiskRecord) {
  if (record.dofStatus === "CLOSED" || !record.dofDueDate) {
    return false;
  }

  const due = new Date(record.dofDueDate);
  if (Number.isNaN(due.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return due.getTime() < today.getTime();
}

export default function RiskManagementPage() {
  const [records, setRecords] = useState<RiskRecord[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [selectedDof, setSelectedDof] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRiskId, setSelectedRiskId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [showRiskDialog, setShowRiskDialog] = useState(false);
  const [savingRisk, setSavingRisk] = useState(false);
  const [deletingRisk, setDeletingRisk] = useState(false);
  const [riskForm, setRiskForm] = useState<RiskFormState>(EMPTY_FORM);
  const [selectedHeatCell, setSelectedHeatCell] = useState<{
    probability: number;
    severity: number;
  } | null>(null);

  const loadRisks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/risk-management", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json: RiskDashboardResponse = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(json?.message || "Risk verileri alınamadı.");
      }

      const nextRecords = Array.isArray(json.records) ? json.records : [];

      setRecords(nextRecords);
      setCompanies(
        Array.isArray(json.companies)
          ? json.companies
          : Array.from(
              new Set(
                nextRecords
                  .map((item) => item.company?.trim())
                  .filter(Boolean)
              )
            )
      );
      setUsingDemoData(false);

      if (!selectedRiskId && nextRecords.length > 0) {
        setSelectedRiskId(nextRecords[0].id);
      }
    } catch (loadError) {
      console.error("risk management load error:", loadError);

      setRecords(DEMO_RISKS);
      setCompanies(
        Array.from(new Set(DEMO_RISKS.map((item) => item.company)))
      );
      setSelectedRiskId((current) => current || DEMO_RISKS[0]?.id || "");
      setUsingDemoData(true);
      setError(
        "Risk API henüz bağlı değil. Ekran geçici olarak demo verileriyle açıldı."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRisks();
  }, []);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("tr-TR");

    return records.filter((record) => {
      const companyMatch =
        selectedCompany === "all" ||
        normalizeCompany(record.company) === normalizeCompany(selectedCompany);

      const levelMatch =
        selectedLevel === "all" || record.level === selectedLevel;

      const methodMatch =
        selectedMethod === "all" || record.method === selectedMethod;

      const dofMatch =
        selectedDof === "all" || record.dofStatus === selectedDof;

      const searchable = [
        record.title,
        record.hazard,
        record.consequence,
        record.control,
        record.company,
        record.department,
        record.responsible,
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      const searchMatch =
        !normalizedSearch || searchable.includes(normalizedSearch);

      return (
        companyMatch &&
        levelMatch &&
        methodMatch &&
        dofMatch &&
        searchMatch
      );
    });
  }, [
    records,
    selectedCompany,
    selectedLevel,
    selectedMethod,
    selectedDof,
    search,
  ]);

  const selectedRisk =
    filteredRecords.find((item) => item.id === selectedRiskId) ||
    filteredRecords[0] ||
    null;

  const totals = useMemo(() => {
    const total = records.length;
    const critical = records.filter(
      (item) => item.level === "CRITICAL"
    ).length;
    const high = records.filter((item) => item.level === "HIGH").length;
    const medium = records.filter((item) => item.level === "MEDIUM").length;
    const low = records.filter((item) => item.level === "LOW").length;
    const openDof = records.filter(
      (item) => item.dofStatus === "OPEN"
    ).length;
    const closedDof = records.filter(
      (item) => item.dofStatus === "CLOSED"
    ).length;
    const overdue = records.filter(isOverdue).length;

    return {
      total,
      critical,
      high,
      medium,
      low,
      openDof,
      closedDof,
      overdue,
    };
  }, [records]);

  const riskScore = useMemo(() => {
    if (records.length === 0) return 100;

    const penalty =
      totals.critical * 18 +
      totals.high * 9 +
      totals.medium * 4 +
      totals.overdue * 6;

    return Math.max(0, Math.min(100, 100 - penalty));
  }, [records.length, totals]);

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      setError("");

      const response = await fetch("/api/admin/risk-management/sync", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.message || "Risk senkronizasyonu başlatılamadı."
        );
      }

      await loadRisks();
    } catch (syncError) {
      console.error("risk sync error:", syncError);
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Risk senkronizasyonu başarısız."
      );
    } finally {
      setSyncing(false);
    }
  };

  const clearFilters = () => {
    setSelectedCompany("all");
    setSelectedLevel("all");
    setSelectedMethod("all");
    setSelectedDof("all");
    setSearch("");
  };

  const openNewRisk = () => {
    setRiskForm({
      ...EMPTY_FORM,
      companyId:
        selectedCompany !== "all"
          ? selectedCompany
          : "",
    });
    setShowRiskDialog(true);
  };

  const openEditRisk = (record: RiskRecord) => {
    setRiskForm({
      id: record.id,
      method: record.method,
      companyId: record.webFirmId || record.firmId || "",
      title: record.title,
      hazard: record.hazard,
      consequence: record.consequence || "",
      control: record.control || "",
      probability: Number((record as any).probability || 1),
      severity: Number((record as any).severity || 1),
      probabilityValue: Number((record as any).probabilityValue || 1),
      frequencyValue: Number((record as any).frequencyValue || 1),
      severityValue: Number((record as any).severityValue || 1),
      department: record.department || "",
      location: (record as any).location || "",
      machine: (record as any).machine || "",
      responsible: record.responsible || "",
      dofStatus: record.dofStatus,
      dofAction: (record as any).dofAction || "",
      dofResponsible: (record as any).dofResponsible || "",
      dofDueDate: record.dofDueDate
        ? record.dofDueDate.slice(0, 10)
        : "",
      dofNote: (record as any).dofNote || "",
    });
    setShowRiskDialog(true);
  };

  const saveRisk = async () => {
    if (!riskForm.title.trim() || !riskForm.hazard.trim()) {
      setError("Risk başlığı ve tehlike alanı zorunludur.");
      return;
    }

    try {
      setSavingRisk(true);
      setError("");

      const response = await fetch("/api/admin/risk-management", {
        method: riskForm.id ? "PATCH" : "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(riskForm),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json?.message || "Risk kaydı kaydedilemedi.");
      }

      setShowRiskDialog(false);
      setRiskForm(EMPTY_FORM);
      await loadRisks();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Risk kaydı kaydedilemedi."
      );
    } finally {
      setSavingRisk(false);
    }
  };

  const deleteRisk = async (record: RiskRecord) => {
    const accepted = window.confirm(
      `"${record.title}" kaydı silinecek. Emin misiniz?`
    );

    if (!accepted) return;

    try {
      setDeletingRisk(true);
      setError("");

      const response = await fetch(
        `/api/admin/risk-management?id=${encodeURIComponent(
          record.id
        )}&method=${encodeURIComponent(record.method)}`,
        {
          method: "DELETE",
          credentials: "include",
          cache: "no-store",
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json?.message || "Risk kaydı silinemedi.");
      }

      setSelectedRiskId("");
      await loadRisks();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Risk kaydı silinemedi."
      );
    } finally {
      setDeletingRisk(false);
    }
  };


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
            boxShadow: "0 24px 60px rgba(63,13,24,0.22)",
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
            <div style={{ maxWidth: 760 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 999,
                  padding: "7px 11px",
                  background: "rgba(255,255,255,0.12)",
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
                Kurumsal Risk Yönetimi
              </h1>

              <p
                style={{
                  margin: "10px 0 0",
                  maxWidth: 720,
                  color: "rgba(255,255,255,0.84)",
                  lineHeight: 1.6,
                  fontSize: 15,
                }}
              >
                5x5 Matris, Fine-Kinney, DÖF ve kritik risk analizlerini
                mobil uygulama ile aynı veri modeli üzerinden yönetin.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                alignItems: "center",
              }}
            >
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncing}
                style={{
                  border: "1px solid rgba(255,255,255,0.24)",
                  borderRadius: 14,
                  padding: "11px 14px",
                  background: "rgba(255,255,255,0.13)",
                  color: "#ffffff",
                  fontWeight: 850,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: syncing ? "wait" : "pointer",
                }}
              >
                {syncing ? (
                  <Loader2 size={17} className="riskSpin" />
                ) : (
                  <RefreshCw size={17} />
                )}
                {syncing ? "Senkronize ediliyor" : "Senkronize Et"}
              </button>

              <button
                type="button"
                onClick={openNewRisk}
                style={{
                  border: "1px solid rgba(255,255,255,0.24)",
                  borderRadius: 14,
                  padding: "11px 14px",
                  background: "#ffffff",
                  color: "#6b1020",
                  fontWeight: 900,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <Plus size={17} />
                Yeni Risk
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 10,
            }}
          >
            {[
              ["Risk Skoru", `${riskScore}/100`],
              ["Toplam Risk", totals.total],
              ["Kritik", totals.critical],
              ["Açık DÖF", totals.openDof],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  borderRadius: 18,
                  padding: 14,
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.68)",
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
              border: "1px solid #fde68a",
              background: "#fffbeb",
              color: "#92400e",
              borderRadius: 16,
              padding: 14,
              display: "flex",
              gap: 10,
              alignItems: "center",
              fontWeight: 750,
            }}
          >
            <AlertTriangle size={18} />
            <span>{error}</span>
            {usingDemoData ? (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  borderRadius: 999,
                  padding: "4px 8px",
                  background: "#fef3c7",
                }}
              >
                Demo görünüm
              </span>
            ) : null}
          </section>
        ) : null}

        <RiskKpiCards totals={totals} />

        <RiskHeatMap
          risks={records}
          selectedCell={selectedHeatCell}
          onCellClick={(probability, severity, riskIds) => {
            setSelectedHeatCell({ probability, severity });
            setSelectedMethod("MATRIX");

            if (riskIds.length > 0) {
              setSelectedRiskId(riskIds[0]);
            }
          }}
        />

        <RiskCharts records={records} />

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 22,
            padding: 16,
            boxShadow: "0 14px 35px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div
              style={{
                flex: "1 1 280px",
                position: "relative",
              }}
            >
              <Search
                size={17}
                style={{
                  position: "absolute",
                  left: 13,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Risk, tehlike, bölüm veya sorumlu ara..."
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 13,
                  border: "1px solid #dbe3ec",
                  padding: "0 14px 0 40px",
                  outline: "none",
                  fontSize: 14,
                  color: "#0f172a",
                  background: "#f8fafc",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {[
              {
                value: selectedCompany,
                setValue: setSelectedCompany,
                icon: <Building2 size={15} />,
                options: [
                  ["all", "Tüm Firmalar"],
                  ...companies.map((company) => [company, company]),
                ],
              },
              {
                value: selectedLevel,
                setValue: setSelectedLevel,
                icon: <ShieldAlert size={15} />,
                options: [
                  ["all", "Tüm Seviyeler"],
                  ["CRITICAL", "Kritik"],
                  ["HIGH", "Yüksek"],
                  ["MEDIUM", "Orta"],
                  ["LOW", "Düşük"],
                ],
              },
              {
                value: selectedMethod,
                setValue: setSelectedMethod,
                icon: <SlidersHorizontal size={15} />,
                options: [
                  ["all", "Tüm Yöntemler"],
                  ["MATRIX", "5x5 Matris"],
                  ["FINE_KINNEY", "Fine-Kinney"],
                ],
              },
              {
                value: selectedDof,
                setValue: setSelectedDof,
                icon: <Filter size={15} />,
                options: [
                  ["all", "Tüm DÖF Durumları"],
                  ["OPEN", "Açık"],
                  ["CLOSED", "Kapalı"],
                ],
              },
            ].map((filter, index) => (
              <label
                key={index}
                style={{
                  minWidth: 170,
                  height: 44,
                  borderRadius: 13,
                  border: "1px solid #dbe3ec",
                  padding: "0 11px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#ffffff",
                  color: "#64748b",
                }}
              >
                {filter.icon}
                <select
                  value={filter.value}
                  onChange={(event) => filter.setValue(event.target.value)}
                  style={{
                    border: 0,
                    outline: 0,
                    width: "100%",
                    background: "transparent",
                    color: "#334155",
                    fontSize: 13,
                    fontWeight: 750,
                  }}
                >
                  {filter.options.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            <button
              type="button"
              onClick={clearFilters}
              style={{
                height: 44,
                borderRadius: 13,
                border: "1px solid #dbe3ec",
                padding: "0 14px",
                background: "#ffffff",
                color: "#475569",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Filtreleri Temizle
            </button>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.65fr) minmax(320px, 0.75fr)",
            gap: 16,
            alignItems: "start",
          }}
          className="riskMainGrid"
        >
          <RiskTable
            records={filteredRecords}
            selectedRiskId={selectedRiskId}
            loading={loading}
            deletingRisk={deletingRisk}
            onSelect={setSelectedRiskId}
            onEdit={openEditRisk}
            onDelete={deleteRisk}
          />

          <RiskDetailPanel
            risk={selectedRisk}
            deleting={deletingRisk}
            onEdit={openEditRisk}
            onDelete={deleteRisk}
          />
        </section>
      </div>


      <RiskDialog
        open={showRiskDialog}
        saving={savingRisk}
        form={riskForm}
        companies={companies}
        onChange={setRiskForm}
        onClose={() => setShowRiskDialog(false)}
        onSave={saveRisk}
      />

      <style jsx>{`
        .riskSpin {
          animation: risk-spin 0.9s linear infinite;
        }

        @keyframes risk-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1050px) {
          .riskMainGrid {
            grid-template-columns: 1fr !important;
          }

          .riskMainGrid aside {
            position: static !important;
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