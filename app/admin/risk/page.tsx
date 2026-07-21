"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  FileDown,
  Filter,
  Flame,
  Gauge,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
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

const LEVEL_META: Record<
  RiskLevel,
  { label: string; bg: string; text: string; border: string }
> = {
  LOW: {
    label: "Düşük",
    bg: "#ecfdf5",
    text: "#047857",
    border: "#a7f3d0",
  },
  MEDIUM: {
    label: "Orta",
    bg: "#fffbeb",
    text: "#b45309",
    border: "#fde68a",
  },
  HIGH: {
    label: "Yüksek",
    bg: "#fff7ed",
    text: "#c2410c",
    border: "#fdba74",
  },
  CRITICAL: {
    label: "Kritik",
    bg: "#fef2f2",
    text: "#b91c1c",
    border: "#fecaca",
  },
};

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

function MethodBadge({ method }: { method: RiskMethod }) {
  const isFine = method === "FINE_KINNEY";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        padding: "5px 9px",
        fontSize: 12,
        fontWeight: 800,
        color: isFine ? "#6d28d9" : "#1d4ed8",
        background: isFine ? "#f5f3ff" : "#eff6ff",
        border: `1px solid ${isFine ? "#ddd6fe" : "#bfdbfe"}`,
      }}
    >
      {isFine ? <Gauge size={13} /> : <Target size={13} />}
      {isFine ? "Fine-Kinney" : "5x5 Matris"}
    </span>
  );
}

function RiskLevelBadge({ level }: { level: RiskLevel }) {
  const meta = LEVEL_META[level];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        padding: "5px 9px",
        fontSize: 12,
        fontWeight: 800,
        color: meta.text,
        background: meta.bg,
        border: `1px solid ${meta.border}`,
      }}
    >
      <CircleDot size={12} />
      {meta.label}
    </span>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  tone,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  tone: "blue" | "red" | "orange" | "green" | "purple";
}) {
  const tones = {
    blue: {
      bg: "#eff6ff",
      text: "#1d4ed8",
      border: "#bfdbfe",
    },
    red: {
      bg: "#fef2f2",
      text: "#b91c1c",
      border: "#fecaca",
    },
    orange: {
      bg: "#fff7ed",
      text: "#c2410c",
      border: "#fed7aa",
    },
    green: {
      bg: "#ecfdf5",
      text: "#047857",
      border: "#a7f3d0",
    },
    purple: {
      bg: "#f5f3ff",
      text: "#6d28d9",
      border: "#ddd6fe",
    },
  } as const;

  const selected = tones[tone];

  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 22,
        padding: 18,
        boxShadow: "0 14px 35px rgba(15,23,42,0.06)",
        minHeight: 142,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          display: "grid",
          placeItems: "center",
          borderRadius: 14,
          color: selected.text,
          background: selected.bg,
          border: `1px solid ${selected.border}`,
          marginBottom: 14,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color: "#64748b",
          fontSize: 13,
          fontWeight: 800,
          marginBottom: 5,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "#0f172a",
          fontSize: 30,
          fontWeight: 900,
          lineHeight: 1,
          marginBottom: 9,
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#94a3b8",
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        {subtitle}
      </div>
    </section>
  );
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

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 14,
          }}
        >
          <KpiCard
            title="Toplam Risk"
            value={totals.total}
            subtitle="Tüm aktif 5x5 ve Fine-Kinney kayıtları"
            icon={<BarChart3 size={20} />}
            tone="blue"
          />
          <KpiCard
            title="Kritik Risk"
            value={totals.critical}
            subtitle="Derhal aksiyon gerektiren kayıtlar"
            icon={<Flame size={20} />}
            tone="red"
          />
          <KpiCard
            title="Yüksek Risk"
            value={totals.high}
            subtitle="Öncelikli iyileştirme gerektiren riskler"
            icon={<TrendingUp size={20} />}
            tone="orange"
          />
          <KpiCard
            title="Açık DÖF"
            value={totals.openDof}
            subtitle={`${totals.overdue} geciken aksiyon bulunuyor`}
            icon={<ShieldAlert size={20} />}
            tone="purple"
          />
          <KpiCard
            title="Kapalı DÖF"
            value={totals.closedDof}
            subtitle="Tamamlanmış düzeltici faaliyetler"
            icon={<CheckCircle2 size={20} />}
            tone="green"
          />
        </section>

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
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 22,
              overflow: "hidden",
              boxShadow: "0 14px 35px rgba(15,23,42,0.05)",
            }}
          >
            <div
              style={{
                padding: 18,
                borderBottom: "1px solid #eef2f7",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    fontSize: 18,
                    fontWeight: 900,
                  }}
                >
                  Risk Kayıtları
                </h2>
                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  {filteredRecords.length} kayıt görüntüleniyor
                </p>
              </div>

              <button
                type="button"
                style={{
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid #dbe3ec",
                  padding: "0 12px",
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  cursor: "pointer",
                }}
              >
                <FileDown size={16} />
                Dışa Aktar
              </button>
            </div>

            {loading ? (
              <div
                style={{
                  minHeight: 360,
                  display: "grid",
                  placeItems: "center",
                  color: "#64748b",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <Loader2 size={28} className="riskSpin" />
                  <div style={{ marginTop: 10, fontWeight: 800 }}>
                    Risk verileri yükleniyor...
                  </div>
                </div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div
                style={{
                  minHeight: 360,
                  display: "grid",
                  placeItems: "center",
                  padding: 24,
                  textAlign: "center",
                }}
              >
                <div>
                  <ShieldAlert size={40} color="#94a3b8" />
                  <h3 style={{ color: "#0f172a", marginBottom: 6 }}>
                    Kayıt bulunamadı
                  </h3>
                  <p style={{ color: "#94a3b8", margin: 0 }}>
                    Filtreleri değiştirin veya yeni bir risk kaydı oluşturun.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 880,
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {[
                        "Risk",
                        "Yöntem",
                        "Seviye",
                        "Bölüm",
                        "DÖF",
                        "Güncelleme",
                        "",
                      ].map((title) => (
                        <th
                          key={title}
                          style={{
                            textAlign: "left",
                            padding: "12px 14px",
                            color: "#64748b",
                            fontSize: 12,
                            fontWeight: 900,
                            borderBottom: "1px solid #e5e7eb",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => {
                      const active = selectedRisk?.id === record.id;
                      const overdue = isOverdue(record);

                      return (
                        <tr
                          key={record.id}
                          onClick={() => setSelectedRiskId(record.id)}
                          style={{
                            background: active ? "#fff7f8" : "#ffffff",
                            cursor: "pointer",
                            borderBottom: "1px solid #eef2f7",
                          }}
                        >
                          <td style={{ padding: 14 }}>
                            <div
                              style={{
                                color: "#0f172a",
                                fontWeight: 900,
                                marginBottom: 5,
                              }}
                            >
                              {record.title}
                            </div>
                            <div
                              style={{
                                color: "#94a3b8",
                                fontSize: 12,
                                maxWidth: 360,
                              }}
                            >
                              {record.hazard}
                            </div>
                          </td>
                          <td style={{ padding: 14 }}>
                            <MethodBadge method={record.method} />
                          </td>
                          <td style={{ padding: 14 }}>
                            <RiskLevelBadge level={record.level} />
                          </td>
                          <td
                            style={{
                              padding: 14,
                              color: "#475569",
                              fontWeight: 750,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {record.department || "-"}
                          </td>
                          <td style={{ padding: 14 }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                borderRadius: 999,
                                padding: "5px 9px",
                                fontSize: 12,
                                fontWeight: 850,
                                color:
                                  record.dofStatus === "CLOSED"
                                    ? "#047857"
                                    : overdue
                                    ? "#b91c1c"
                                    : "#92400e",
                                background:
                                  record.dofStatus === "CLOSED"
                                    ? "#ecfdf5"
                                    : overdue
                                    ? "#fef2f2"
                                    : "#fffbeb",
                              }}
                            >
                              {record.dofStatus === "CLOSED" ? (
                                <CheckCircle2 size={13} />
                              ) : (
                                <AlertTriangle size={13} />
                              )}
                              {record.dofStatus === "CLOSED"
                                ? "Kapalı"
                                : overdue
                                ? "Gecikmiş"
                                : "Açık"}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: 14,
                              color: "#64748b",
                              fontSize: 12,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatDate(record.updatedAt)}
                          </td>
                          <td style={{ padding: 14 }}>
                            <ChevronRight size={17} color="#94a3b8" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <aside
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 22,
              padding: 18,
              boxShadow: "0 14px 35px rgba(15,23,42,0.05)",
              position: "sticky",
              top: 18,
            }}
          >
            {selectedRisk ? (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: 12,
                        fontWeight: 850,
                        marginBottom: 5,
                      }}
                    >
                      SEÇİLEN RİSK
                    </div>
                    <h2
                      style={{
                        margin: 0,
                        color: "#0f172a",
                        fontSize: 20,
                        lineHeight: 1.25,
                      }}
                    >
                      {selectedRisk.title}
                    </h2>
                  </div>
                  <RiskLevelBadge level={selectedRisk.level} />
                </div>

                <div
                  style={{
                    borderRadius: 18,
                    padding: 16,
                    background:
                      "linear-gradient(135deg, #4b0f1d 0%, #111827 100%)",
                    color: "#ffffff",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.66)",
                          fontWeight: 800,
                        }}
                      >
                        RİSK PUANI
                      </div>
                      <div
                        style={{
                          fontSize: 32,
                          fontWeight: 950,
                          marginTop: 3,
                        }}
                      >
                        {selectedRisk.score}
                      </div>
                    </div>
                    <Gauge size={34} />
                  </div>
                </div>

                {[
                  ["Firma", selectedRisk.company],
                  ["Bölüm", selectedRisk.department || "-"],
                  ["Sorumlu", selectedRisk.responsible || "-"],
                  ["Termin", formatDate(selectedRisk.dofDueDate)],
                  ["Kaynak", selectedRisk.source || "-"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "90px 1fr",
                      gap: 10,
                      padding: "10px 0",
                      borderBottom: "1px solid #eef2f7",
                    }}
                  >
                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        color: "#334155",
                        fontSize: 13,
                        fontWeight: 750,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    marginTop: 16,
                    borderRadius: 16,
                    padding: 14,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#6d28d9",
                      fontWeight: 900,
                      marginBottom: 8,
                    }}
                  >
                    <Sparkles size={17} />
                    DORA Risk Yorumu
                  </div>
                  <p
                    style={{
                      margin: 0,
                      color: "#475569",
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {selectedRisk.level === "CRITICAL"
                      ? "Bu kayıt kritik seviyededir. Faaliyet durdurma, geçici güvenlik önlemi ve yönetim onayı gerektiren aksiyonlar değerlendirilmelidir."
                      : selectedRisk.level === "HIGH"
                      ? "Risk için kısa vadeli termin belirlenmeli, sorumlu atanmalı ve kontrol tedbirlerinin etkinliği yeniden değerlendirilmelidir."
                      : "Mevcut kontroller sürdürülmeli ve risk periyodik olarak izlenmelidir."}
                  </p>
                </div>

                <button
                  type="button"
                  style={{
                    width: "100%",
                    marginTop: 14,
                    minHeight: 44,
                    borderRadius: 13,
                    border: 0,
                    background: "#6b1020",
                    color: "#ffffff",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Risk Detayını Aç
                </button>
              </div>
            ) : (
              <div
                style={{
                  minHeight: 330,
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                  color: "#94a3b8",
                }}
              >
                <div>
                  <ShieldAlert size={42} />
                  <h3 style={{ color: "#334155", marginBottom: 5 }}>
                    Risk seçilmedi
                  </h3>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    Detaylarını görüntülemek için listeden bir kayıt seçin.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>

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