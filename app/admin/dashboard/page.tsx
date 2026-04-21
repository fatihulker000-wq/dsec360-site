"use client";

import { useEffect, useMemo, useState } from "react";

type Training = {
  id: string;
  title: string;
  assigned_count: number;
  not_started_count: number;
  in_progress_count: number;
  completed_count: number;
};

type RiskUser = {
  assignment_id: string;
  user_id: string;
  training_id: string;
  full_name: string;
  email: string;
  company_id: string;
  training_title: string;
  status: "not_started" | "in_progress" | "completed";
};

type DashboardSummary = {
  total_assignments: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
  completion_rate: number;
  in_progress_rate: number;
  risk_rate: number;
  risk_status: "KRITIK" | "ORTA" | "IYI";
};

type CompanyDistributionItem = {
  name: string;
  count: number;
};

type TrendItem = {
  label: string;
  value: number;
};

type DashboardResponse = {
  success?: boolean;
  trainings?: Training[];
  risky_users?: RiskUser[];
  in_progress_users?: RiskUser[];
  completed_users?: RiskUser[];
  company_distribution?: CompanyDistributionItem[];
  company_list?: string[];
  trend?: TrendItem[];
  summary?: DashboardSummary;
  error?: string;
  detail?: string;
};

type MeResponse = {
  success?: boolean;
  user?: {
    id?: string;
    full_name?: string;
    email?: string;
    role?: string;
    company_id?: string;
  };
  error?: string;
};

const BRAND = {
  bg: "#f7f8fb",
  white: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",

  red: "#c62828",
  redDark: "#5a0f1f",
  redSoft: "#fff1f1",

  green: "#166534",
  greenSoft: "#f0fdf4",

  blue: "#1d4ed8",
  blueSoft: "#eff6ff",

  amber: "#92400e",
  amberSoft: "#fff7ed",

  slate: "#334155",
  purple: "#6d28d9",
  purpleSoft: "#f5f3ff",

  shadow: "0 10px 30px rgba(15,23,42,0.06)",
};

function cardStyle(isMobile = false): React.CSSProperties {
  return {
    background: BRAND.white,
    border: `1px solid ${BRAND.border}`,
    borderRadius: isMobile ? 16 : 20,
    padding: isMobile ? 14 : 20,
    boxShadow: BRAND.shadow,
    minWidth: 0,
  };
}

function badgeStyle(
  bg: string,
  color: string,
  border?: string
): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    background: bg,
    color,
    border: `1px solid ${border || bg}`,
    whiteSpace: "nowrap",
  };
}

function metricCardStyle(
  _accent: string,
  isMobile = false
): React.CSSProperties {
  return {
    ...cardStyle(isMobile),
    position: "relative",
    overflow: "hidden",
    minHeight: isMobile ? 110 : 132,
    border: `1px solid ${BRAND.border}`,
    background: BRAND.white,
    boxShadow: BRAND.shadow,
  };
}

function softPanelStyle(bg: string, isMobile = false): React.CSSProperties {
  return {
    borderRadius: isMobile ? 14 : 18,
    padding: isMobile ? 12 : 16,
    background: bg,
    border: `1px solid ${BRAND.border}`,
  };
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function MiniBarChart({
  items,
  color,
  emptyText = "Veri bulunamadı.",
}: {
  items: { label: string; value: number }[];
  color: string;
  emptyText?: string;
}) {
  if (!items.length) {
    return <div style={{ color: BRAND.muted }}>{emptyText}</div>;
  }

  const max = Math.max(...items.map((x) => x.value), 1);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((item) => {
        const width = Math.max(6, Math.round((item.value / max) * 100));

        return (
          <div key={item.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: BRAND.text,
                  lineHeight: 1.4,
                }}
              >
                {item.label}
              </div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color,
                  whiteSpace: "nowrap",
                }}
              >
                {item.value}
              </div>
            </div>

            <div
              style={{
                height: 10,
                borderRadius: 999,
                background: "#f3f4f6",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${width}%`,
                  height: "100%",
                  background: color,
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusDonut({
  label,
  value,
  total,
  color,
  softBg,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  softBg: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div
      style={{
        ...softPanelStyle(softBg),
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: BRAND.text }}>
        {label}
      </div>

      <div
        style={{
          width: 70,
          height: 70,
          borderRadius: "50%",
          background: `conic-gradient(${color} ${percent}%, #e5e7eb ${percent}% 100%)`,
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: "#fff",
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            fontWeight: 900,
            color: BRAND.text,
          }}
        >
          %{percent}
        </div>
      </div>

      <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 16,
        border: `1px dashed ${BRAND.border}`,
        color: BRAND.muted,
        background: "#fafafa",
      }}
    >
      {text}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [adminRole, setAdminRole] = useState<string>("");
  const [adminCompanyId, setAdminCompanyId] = useState<string>("");

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [riskyUsers, setRiskyUsers] = useState<RiskUser[]>([]);
  const [inProgressUsers, setInProgressUsers] = useState<RiskUser[]>([]);
  const [completedUsers, setCompletedUsers] = useState<RiskUser[]>([]);
  const [companyDistribution, setCompanyDistribution] = useState<
  CompanyDistributionItem[]
>([]);
const [companyList, setCompanyList] = useState<string[]>([]);
const [trend, setTrend] = useState<TrendItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [isMobile, setIsMobile] = useState(false);
  const [cbsSummary, setCbsSummary] = useState<{
    total: number;
    new: number;
    processing: number;
    read: number;
    closed: number;
    slaExceeded: number;
  } | null>(null);

  useEffect(() => {
    const loadAdminContext = async () => {
      try {
        const res = await fetch("/api/admin/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setAdminRole("");
          setAdminCompanyId("");
          return;
        }

        const json: MeResponse = await res.json().catch(() => ({}));

        setAdminRole(String(json?.user?.role || "").trim());
        setAdminCompanyId(String(json?.user?.company_id || "").trim());
      } catch (loadError) {
        console.error("admin me load error:", loadError);
        setAdminRole("");
        setAdminCompanyId("");
      }
    };

    void loadAdminContext();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/training-dashboard", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json: DashboardResponse = await res.json();

      if (!res.ok) {
        setError(json?.error || "Veri alınamadı.");
       setTrainings([]);
setRiskyUsers([]);
setInProgressUsers([]);
setCompletedUsers([]);
setCompanyDistribution([]);
setCompanyList([]);
setTrend([]);
setSummary(null);
        return;
      }

     setTrainings(json.trainings || []);
setRiskyUsers(json.risky_users || []);
setInProgressUsers(json.in_progress_users || []);
setCompletedUsers(json.completed_users || []);
setCompanyDistribution(json.company_distribution || []);
setCompanyList(json.company_list || []);
setTrend(json.trend || []);
setSummary(json.summary || null);
    } catch (loadError) {
      console.error(loadError);
      setError("Veri alınamadı.");
setTrainings([]);
setRiskyUsers([]);
setInProgressUsers([]);
setCompletedUsers([]);
setCompanyDistribution([]);
setCompanyList([]);
setTrend([]);
setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCbs = async () => {
    try {
      const res = await fetch("/api/admin/cbs-dashboard", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCbsSummary(null);
        return;
      }

      setCbsSummary(json.summary || null);
    } catch (loadError) {
      console.error("CBS load error:", loadError);
      setCbsSummary(null);
    }
  };

  useEffect(() => {
    void loadDashboard();
    void loadCbs();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    if (adminRole === "company_admin" && adminCompanyId) {
      const matched =
        riskyUsers
          .map((u) => (u.company_id || "").trim())
          .find((x) => x && x === adminCompanyId) || adminCompanyId;

      setSelectedCompany(matched);
    }
  }, [adminRole, adminCompanyId, riskyUsers]);

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    const element = document.getElementById("admin-dashboard-pdf");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 1.2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("dsec-dashboard.pdf");
  };

  const totals = useMemo(() => {
    let assigned = 0;
    let completed = 0;
    let notStarted = 0;
    let inProgress = 0;

    trainings.forEach((t) => {
      assigned += Number(t.assigned_count || 0);
      completed += Number(t.completed_count || 0);
      notStarted += Number(t.not_started_count || 0);
      inProgress += Number(t.in_progress_count || 0);
    });

    return { assigned, completed, notStarted, inProgress };
  }, [trainings]);

  const completionRate =
    summary?.completion_rate ??
    (totals.assigned
      ? Number(((totals.completed / totals.assigned) * 100).toFixed(2))
      : 0);

  const inProgressRate =
    summary?.in_progress_rate ??
    (totals.assigned
      ? Number(((totals.inProgress / totals.assigned) * 100).toFixed(2))
      : 0);

  const riskRate =
    summary?.risk_rate ??
    (totals.assigned
      ? Number(((totals.notStarted / totals.assigned) * 100).toFixed(2))
      : 0);

  const riskStatus =
    summary?.risk_status ??
    (totals.notStarted > 20 ? "KRITIK" : totals.notStarted > 10 ? "ORTA" : "IYI");

 const companies = useMemo(() => {
  return [...companyList].sort((a, b) => a.localeCompare(b, "tr"));
}, [companyList]);

  const effectiveSelectedCompany =
    adminRole === "company_admin" && adminCompanyId
      ? adminCompanyId
      : selectedCompany;

  const filteredRiskUsers = useMemo(() => {
    if (effectiveSelectedCompany === "all") return riskyUsers;

    return riskyUsers.filter(
      (u) =>
        ((u.company_id || "Firma Yok").trim() || "Firma Yok") ===
        effectiveSelectedCompany
    );
  }, [effectiveSelectedCompany, riskyUsers]);

  const filteredInProgressUsers = useMemo(() => {
    if (effectiveSelectedCompany === "all") return inProgressUsers;

    return inProgressUsers.filter(
      (u) =>
        ((u.company_id || "Firma Yok").trim() || "Firma Yok") ===
        effectiveSelectedCompany
    );
  }, [effectiveSelectedCompany, inProgressUsers]);

  const filteredCompletedUsers = useMemo(() => {
    if (effectiveSelectedCompany === "all") return completedUsers;

    return completedUsers.filter(
      (u) =>
        ((u.company_id || "Firma Yok").trim() || "Firma Yok") ===
        effectiveSelectedCompany
    );
  }, [effectiveSelectedCompany, completedUsers]);

  const topRiskTrainings = useMemo(() => {
    return [...trainings]
      .sort((a, b) => b.not_started_count - a.not_started_count)
      .slice(0, 6);
  }, [trainings]);

  const bestTrainings = useMemo(() => {
    return [...trainings]
      .sort((a, b) => b.completed_count - a.completed_count)
      .slice(0, 6);
  }, [trainings]);

  const groupedRiskCompanies = useMemo(() => {
    const map = new Map<string, number>();

    filteredRiskUsers.forEach((u) => {
      const key = (u.company_id || "Firma Yok").trim() || "Firma Yok";
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredRiskUsers]);

  const groupedRiskTrainings = useMemo(() => {
    const map = new Map<string, number>();

    filteredRiskUsers.forEach((u) => {
      const key = u.training_title || "Eğitim";
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredRiskUsers]);

  const aiComment =
    riskRate >= 60
      ? "Risk yüksek. Başlamayan eğitimler için hızlı aksiyon, otomatik hatırlatma ve firma bazlı takip önerilir."
      : riskRate >= 30
      ? "Risk orta seviyede. Devam eden ve başlamayan kullanıcı kümeleri yakından izlenmeli."
      : "Genel görünüm kontrollü. Tamamlanma oranı korunarak sürdürülebilir bir eğitim performansı sağlanıyor.";

  const topEmployees = useMemo(() => {
    const map = new Map<
      string,
      { full_name: string; email: string; count: number }
    >();

    riskyUsers.forEach((u) => {
      const key = u.user_id;
      const current = map.get(key) || {
        full_name: u.full_name,
        email: u.email,
        count: 0,
      };
      current.count += 1;
      map.set(key, current);
    });

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [riskyUsers]);

  const completionHeadline =
    completionRate >= 80
      ? "Güçlü Tamamlama"
      : completionRate >= 50
      ? "Orta Performans"
      : "İyileştirme Gerekli";

  const riskHeadline =
    riskStatus === "KRITIK"
      ? "Kritik Müdahale Alanı"
      : riskStatus === "ORTA"
      ? "Kontrollü Risk Alanı"
      : "Sağlıklı Görünüm";

const heroTotalTrainings = trainings.length;
const heroRiskStatus = riskStatus || "IYI";
const heroCompletionHeadline =
  completionHeadline || "Operasyon Yükleniyor";
const heroRiskHeadline =
  riskHeadline || "Durum Hesaplanıyor";

  const ceoSummary = useMemo(() => {
    const totalTrainings = trainings.length;
    const totalAssignments = summary?.total_assignments ?? totals.assigned;
    const totalCompleted = summary?.completed_count ?? totals.completed;
    const totalInProgress = summary?.in_progress_count ?? totals.inProgress;
    const totalNotStarted = summary?.not_started_count ?? totals.notStarted;

    const cbsTotal = cbsSummary?.total || 0;
    const cbsOpen =
      (cbsSummary?.new || 0) +
      (cbsSummary?.processing || 0) +
      (cbsSummary?.read || 0);

    const cbsClosed = cbsSummary?.closed || 0;
    const cbsSla = cbsSummary?.slaExceeded || 0;

    const executiveRiskScore = Math.min(
      100,
      Math.round(
        riskRate * 0.45 +
          (cbsSla > 0 ? 25 : 0) +
          (cbsOpen > cbsClosed ? 15 : 0) +
          (totalNotStarted > totalCompleted ? 15 : 0)
      )
    );

    const healthLabel =
      executiveRiskScore >= 70
        ? "Kritik"
        : executiveRiskScore >= 40
        ? "Dikkat"
        : "Sağlıklı";

    return {
      totalTrainings,
      totalAssignments,
      totalCompleted,
      totalInProgress,
      totalNotStarted,
      cbsTotal,
      cbsOpen,
      cbsClosed,
      cbsSla,
      executiveRiskScore,
      healthLabel,
    };
  }, [trainings, summary, totals, cbsSummary, riskRate]);


  if (error) {
    return (
      <div style={{ padding: 24, color: BRAND.red, fontWeight: 700 }}>
        {error}
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100%",
        background: BRAND.bg,
        padding: isMobile ? 12 : 24,
      }}
    >
    <div
  id="admin-dashboard-pdf"
  style={{
    maxWidth: 1440,
    margin: "0 auto",
    width: "100%",
    opacity: loading ? 0.96 : 1,
    transition: "opacity 0.2s ease",
  }}
>
        <div
          style={{
            ...cardStyle(),
            background: `linear-gradient(135deg, ${BRAND.redDark} 0%, ${BRAND.red} 100%)`,
            color: "#fff",
            marginBottom: 20,
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              gap: 16,
              alignItems: isMobile ? "stretch" : "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div style={{ maxWidth: isMobile ? "100%" : 860 }}>
              <div
                style={{
                  ...badgeStyle(
                    "rgba(255,255,255,0.16)",
                    "#fff",
                    "rgba(255,255,255,0.22)"
                  ),
                  marginBottom: 12,
                }}
              >
               {adminRole === "company_admin"
  ? "D-SEC • Firma Admin Dashboard"
  : "D-SEC • Admin Dashboard"}
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: isMobile ? 28 : 38,
                  fontWeight: 900,
                  lineHeight: 1.15,
                }}
              >
                Yönetici & CEO Dashboard
              </h1>

              <p
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "rgba(255,255,255,0.92)",
                  maxWidth: 820,
                  lineHeight: 1.7,
                  fontSize: isMobile ? 14 : 16,
                }}
              >
                Eğitim operasyonu, ÇBS yoğunluğu, firma bazlı risk, açık kayıtlar,
                SLA alarmı ve üst yönetim karar desteği tek ekranda izlenir.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 16,
                  alignItems: "center",
                }}
              >
                <span
                  style={badgeStyle(
                    "rgba(255,255,255,0.14)",
                    "#fff",
                    "rgba(255,255,255,0.20)"
                  )}
                >
                  {loading ? "Veriler Hazırlanıyor" : heroCompletionHeadline}
                </span>

                <span
                  style={badgeStyle(
                    "rgba(255,255,255,0.14)",
                    "#fff",
                    "rgba(255,255,255,0.20)"
                  )}
                >
                  {loading ? "Risk Analizi Yükleniyor" : heroRiskHeadline}
                </span>

                <span
                  style={badgeStyle(
                    "rgba(255,255,255,0.14)",
                    "#fff",
                    "rgba(255,255,255,0.20)"
                  )}
                >
                  Toplam Eğitim: {loading ? "..." : heroTotalTrainings}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
                minWidth: isMobile ? "100%" : 240,
                width: isMobile ? "100%" : "auto",
              }}
            >
              <div
                style={{
                  ...badgeStyle(
                    riskStatus === "KRITIK"
                      ? "#7f1d1d"
                      : riskStatus === "ORTA"
                      ? "#92400e"
                      : "#166534",
                    "#ffffff"
                  ),
                  fontSize: 13,
                  padding: "8px 12px",
                  justifyContent: "center",
                }}
              >
                Risk Durumu: {loading ? "Hesaplanıyor" : heroRiskStatus}
              </div>

              <button
                onClick={exportPDF}
                style={{
                  border: "none",
                  borderRadius: 14,
                  padding: "12px 18px",
                  background: "#fff",
                  color: BRAND.red,
                  fontWeight: 900,
                  cursor: "pointer",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                PDF İndir
              </button>

              <button
                onClick={() => {
                  void loadDashboard();
                  void loadCbs();
                }}
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 14,
                  padding: "12px 18px",
                  background: "rgba(255,255,255,0.10)",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Veriyi Yenile
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={cardStyle(isMobile)}>
            <div style={{ fontSize: 12, color: BRAND.muted }}>Genel Sağlık</div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color:
                  ceoSummary.healthLabel === "Kritik"
                    ? BRAND.red
                    : ceoSummary.healthLabel === "Dikkat"
                    ? BRAND.amber
                    : BRAND.green,
              }}
            >
              {ceoSummary.healthLabel}
            </div>
          </div>

          <div style={cardStyle(isMobile)}>
            <div style={{ fontSize: 12, color: BRAND.muted }}>
              Executive Risk Score
            </div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>
              {ceoSummary.executiveRiskScore}
            </div>
          </div>

          <div style={cardStyle(isMobile)}>
            <div style={{ fontSize: 12, color: BRAND.muted }}>
              Açık Şikayet (ÇBS)
            </div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>
              {ceoSummary.cbsOpen}
            </div>
          </div>

          <div style={cardStyle(isMobile)}>
            <div style={{ fontSize: 12, color: BRAND.muted }}>
              Tamamlanan Eğitim
            </div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>
              {ceoSummary.totalCompleted}
            </div>
          </div>
        </div>

        {adminRole === "super_admin" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div style={cardStyle(isMobile)}>
              <div style={{ fontSize: 12, color: BRAND.muted }}>Yönetim</div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 24,
                  fontWeight: 900,
                  color: BRAND.text,
                }}
              >
                Firma Yönetimi
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: BRAND.muted,
                  lineHeight: 1.7,
                }}
              >
                Firma ekleme, düzenleme ve firma atama işlemleri sadece süper admin
                tarafından yönetilir.
              </div>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/admin/companies";
                }}
                style={{
                  marginTop: 16,
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 16px",
                  background: BRAND.red,
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Firma Yönetimine Git
              </button>
            </div>
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              ...cardStyle(isMobile),
              border: `1px solid ${BRAND.border}`,
              background: BRAND.white,
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: 999,
                background: "#eef2ff",
                color: "#3730a3",
                fontSize: 12,
                fontWeight: 800,
                marginBottom: 12,
              }}
            >
              ÇBS MODÜLÜ
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
              Şikayet / Öneri Yönetimi
            </h3>

            <p style={{ marginTop: 10, color: BRAND.muted, lineHeight: 1.7 }}>
              Dış kullanıcılar tarafından gönderilen talepleri görüntüleyin,
              yönlendirin ve sonuçlandırın.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                gap: 10,
                marginTop: 14,
              }}
            >
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 10,
                }}
              >
                <div style={{ fontSize: 12, color: BRAND.muted }}>Toplam</div>
                <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>
                  {cbsSummary?.total || 0}
                </div>
              </div>

              <div
                style={{
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  borderRadius: 12,
                  padding: 10,
                }}
              >
                <div style={{ fontSize: 12, color: "#9f1239" }}>Yeni</div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    marginTop: 4,
                    color: "#be123c",
                  }}
                >
                  {cbsSummary?.new || 0}
                </div>
              </div>

              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 12,
                  padding: 10,
                }}
              >
                <div style={{ fontSize: 12, color: "#92400e" }}>İşlemde</div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    marginTop: 4,
                    color: "#a16207",
                  }}
                >
                  {cbsSummary?.processing || 0}
                </div>
              </div>

              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fca5a5",
                  borderRadius: 12,
                  padding: 10,
                }}
              >
                <div style={{ fontSize: 12, color: "#b91c1c" }}>SLA</div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    marginTop: 4,
                    color: "#b91c1c",
                  }}
                >
                  {cbsSummary?.slaExceeded || 0}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                window.location.href = "/admin/cbs";
              }}
              style={{
                marginTop: 18,
                border: "none",
                borderRadius: 12,
                padding: "12px 16px",
                background: "#1e3a8a",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              ÇBS Paneline Git
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: isMobile ? 12 : 16,
            marginBottom: 20,
          }}
        >
          <div style={metricCardStyle(BRAND.slate, isMobile)}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 5,
                height: "100%",
                background: BRAND.slate,
              }}
            />
            <div style={{ fontSize: 13, color: BRAND.muted }}>Toplam Atama</div>
            <div
              style={{
                fontSize: isMobile ? 28 : 34,
                fontWeight: 900,
                marginTop: 8,
              }}
            >
              {summary?.total_assignments ?? totals.assigned}
            </div>
            <div style={{ marginTop: 8, color: BRAND.muted, fontSize: 13 }}>
              Toplam eğitim atama yükü
            </div>
          </div>

          <div style={metricCardStyle(BRAND.green, isMobile)}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 5,
                height: "100%",
                background: BRAND.green,
              }}
            />
            <div style={{ fontSize: 13, color: BRAND.green }}>Tamamlanma</div>
            <div
              style={{
                fontSize: isMobile ? 28 : 34,
                fontWeight: 900,
                marginTop: 8,
              }}
            >
              %{formatPercent(completionRate)}
            </div>
            <div style={{ marginTop: 8, color: BRAND.muted, fontSize: 13 }}>
              Tamamlanan eğitim oranı
            </div>
          </div>

          <div style={metricCardStyle(BRAND.blue, isMobile)}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 5,
                height: "100%",
                background: BRAND.blue,
              }}
            />
            <div style={{ fontSize: 13, color: BRAND.blue }}>Devam Eden</div>
            <div
              style={{
                fontSize: isMobile ? 28 : 34,
                fontWeight: 900,
                marginTop: 8,
              }}
            >
              %{formatPercent(inProgressRate)}
            </div>
            <div style={{ marginTop: 8, color: BRAND.muted, fontSize: 13 }}>
              Açık süreçte kalan eğitimler
            </div>
          </div>

          <div style={metricCardStyle(BRAND.amber, isMobile)}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 5,
                height: "100%",
                background: BRAND.amber,
              }}
            />
            <div style={{ fontSize: 13, color: BRAND.amber }}>Riskli Oran</div>
            <div
              style={{
                fontSize: isMobile ? 28 : 34,
                fontWeight: 900,
                marginTop: 8,
              }}
            >
              %{formatPercent(riskRate)}
            </div>
            <div style={{ marginTop: 8, color: BRAND.muted, fontSize: 13 }}>
              Başlamamış eğitim yoğunluğu
            </div>
          </div>
        </div>

        <div
          style={{
            ...cardStyle(),
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "minmax(0, 1.3fr) minmax(280px, 0.7fr)",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: BRAND.text }}>
              CEO Executive Özeti
            </div>

            <div style={{ marginTop: 8, color: BRAND.muted, lineHeight: 1.8 }}>
              {ceoSummary.executiveRiskScore >= 70
                ? "Operasyonel risk yükselmiş görünüyor. Başlamayan eğitimler, açık ÇBS kayıtları ve SLA gecikmeleri üst yönetim takibine alınmalıdır."
                : ceoSummary.executiveRiskScore >= 40
                ? "Sistem kontrol altında ancak dikkat gerektiren alanlar var. Eğitim tamamlama performansı ile ÇBS kapanış hızının birlikte izlenmesi önerilir."
                : "Kurumsal görünüm sağlıklı. Eğitim kapanış oranı ve ÇBS akışı dengeli ilerliyor. Yönetim seviyesinde sürdürülebilir operasyon görünümü mevcut."}
            </div>

            <div
              style={{
                marginTop: 16,
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              <StatusDonut
                label="Tamamlanan"
                value={summary?.completed_count ?? totals.completed}
                total={summary?.total_assignments ?? totals.assigned}
                color={BRAND.green}
                softBg={BRAND.greenSoft}
              />

              <StatusDonut
                label="Devam Eden"
                value={summary?.in_progress_count ?? totals.inProgress}
                total={summary?.total_assignments ?? totals.assigned}
                color={BRAND.blue}
                softBg={BRAND.blueSoft}
              />

              <StatusDonut
                label="Başlamayan"
                value={summary?.not_started_count ?? totals.notStarted}
                total={summary?.total_assignments ?? totals.assigned}
                color={BRAND.amber}
                softBg={BRAND.amberSoft}
              />
            </div>
          </div>

          <div
            style={{
              ...softPanelStyle("#fafafa"),
              display: "grid",
              gap: 12,
              alignContent: "start",
              minWidth: 0,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 900, color: BRAND.text }}>
              Firma Filtresi
            </div>

            {adminRole === "company_admin" ? (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${BRAND.border}`,
                  background: "#fff",
                  fontWeight: 700,
                }}
              >
                {adminCompanyId || "Bağlı firma"}
              </div>
            ) : (
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${BRAND.border}`,
                  background: "#fff",
                  fontWeight: 700,
                  minWidth: isMobile ? "100%" : 220,
                  width: isMobile ? "100%" : "auto",
                }}
              >
                <option value="all">Tüm Firmalar</option>
                {companies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            )}

            <div
              style={{
                display: "grid",
                gap: 10,
                marginTop: 4,
              }}
            >
              <div style={softPanelStyle(BRAND.redSoft, isMobile)}>
                <div style={{ fontSize: 12, color: BRAND.muted }}>
                  Seçili Firmada Riskli
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 24,
                    fontWeight: 900,
                    color: BRAND.red,
                  }}
                >
                  {filteredRiskUsers.length}
                </div>
              </div>

              <div style={softPanelStyle(BRAND.blueSoft, isMobile)}>
                <div style={{ fontSize: 12, color: BRAND.muted }}>
                  Seçili Firmada Devam Eden
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 24,
                    fontWeight: 900,
                    color: BRAND.blue,
                  }}
                >
                  {filteredInProgressUsers.length}
                </div>
              </div>

              <div style={softPanelStyle(BRAND.greenSoft, isMobile)}>
                <div style={{ fontSize: 12, color: BRAND.muted }}>
                  Seçili Firmada Tamamlayan
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 24,
                    fontWeight: 900,
                    color: BRAND.green,
                  }}
                >
                  {filteredCompletedUsers.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "minmax(0, 1.1fr) minmax(0, 0.9fr)",
            gap: isMobile ? 14 : 20,
            marginBottom: 20,
          }}
        >
          <section style={cardStyle(isMobile)}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
                Eğitim Durum Özeti
              </h2>

              <span
                style={badgeStyle(BRAND.purpleSoft, BRAND.purple, "#ddd6fe")}
              >
                Trend
              </span>
            </div>

            <MiniBarChart
              items={trend}
              color={BRAND.red}
              emptyText="Trend verisi bulunamadı."
            />
          </section>

          <section style={cardStyle(isMobile)}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
                Firma Risk Yoğunluğu
              </h2>

              <span
                style={badgeStyle(BRAND.amberSoft, BRAND.amber, "#fed7aa")}
              >
                Firma Analizi
              </span>
            </div>

            <MiniBarChart
              items={companyDistribution.map((item) => ({
                label: item.name,
                value: item.count,
              }))}
              color={BRAND.amber}
              emptyText="Firma dağılım verisi bulunamadı."
            />
          </section>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "minmax(0, 1.1fr) minmax(0, 0.9fr)",
            gap: isMobile ? 14 : 20,
            marginBottom: 20,
          }}
        >
          <section style={cardStyle(isMobile)}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
                En Riskli Eğitimler
              </h2>

              <span style={badgeStyle(BRAND.redSoft, BRAND.red, "#f3c8c8")}>
                Öncelikli Alan
              </span>
            </div>

            {topRiskTrainings.length === 0 ? (
              <EmptyState text="Veri bulunamadı." />
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {topRiskTrainings.map((item) => {
                  const percent =
                    (summary?.not_started_count ?? totals.notStarted) > 0
                      ? Math.round(
                          (item.not_started_count /
                            (summary?.not_started_count ?? totals.notStarted)) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      key={item.id}
                      style={{
                        border: `1px solid ${BRAND.border}`,
                        borderRadius: 16,
                        padding: 14,
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontWeight: 800, color: BRAND.text }}>
                          {item.title}
                        </div>

                        <div
                          style={badgeStyle(BRAND.redSoft, BRAND.red, "#f3c8c8")}
                        >
                          {item.not_started_count}
                        </div>
                      </div>

                      <div
                        style={{
                          height: 10,
                          borderRadius: 999,
                          background: "#f3f4f6",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(4, percent)}%`,
                            height: "100%",
                            background: BRAND.red,
                            borderRadius: 999,
                          }}
                        />
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          color: BRAND.muted,
                        }}
                      >
                        Risk payı: %{percent}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section style={cardStyle(isMobile)}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
                En Güçlü Eğitimler
              </h2>

              <span
                style={badgeStyle(BRAND.greenSoft, BRAND.green, "#bbf7d0")}
              >
                Pozitif Görünüm
              </span>
            </div>

            {bestTrainings.length === 0 ? (
              <EmptyState text="Veri bulunamadı." />
            ) : (
              <MiniBarChart
                items={bestTrainings.map((item) => ({
                  label: item.title,
                  value: item.completed_count,
                }))}
                color={BRAND.green}
                emptyText="Veri bulunamadı."
              />
            )}
          </section>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: isMobile ? 14 : 20,
            marginBottom: 20,
          }}
        >
          <section style={cardStyle(isMobile)}>
            <h2
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              Riskli Kullanıcılar
            </h2>

            <div
              style={{
                fontSize: isMobile ? 26 : 32,
                fontWeight: 900,
                color: BRAND.red,
              }}
            >
              {filteredRiskUsers.length}
            </div>

            <div style={{ marginTop: 8, color: BRAND.muted }}>
              Seçili firma filtresine göre toplam riskli kullanıcı
            </div>
          </section>

          <section style={cardStyle(isMobile)}>
            <h2
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              Devam Eden
            </h2>

            <div
              style={{
                fontSize: isMobile ? 26 : 32,
                fontWeight: 900,
                color: BRAND.blue,
              }}
            >
              {summary?.in_progress_count ?? inProgressUsers.length}
            </div>

            <div style={{ marginTop: 8, color: BRAND.muted }}>
              Süreci devam eden kullanıcı sayısı
            </div>
          </section>

          <section style={cardStyle(isMobile)}>
            <h2
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              Tamamlayanlar
            </h2>

            <div
              style={{
                fontSize: isMobile ? 26 : 32,
                fontWeight: 900,
                color: BRAND.green,
              }}
            >
              {summary?.completed_count ?? completedUsers.length}
            </div>

            <div style={{ marginTop: 8, color: BRAND.muted }}>
              Final başarıyla kapanan kullanıcı sayısı
            </div>
          </section>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)",
            gap: isMobile ? 14 : 20,
            marginBottom: 20,
          }}
        >
          <section style={cardStyle(isMobile)}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
                En Riskli Çalışanlar
              </h2>

              <span style={badgeStyle(BRAND.redSoft, BRAND.red, "#f3c8c8")}>
                Çalışan Analizi
              </span>
            </div>

            {topEmployees.length === 0 ? (
              <EmptyState text="Veri bulunamadı." />
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {topEmployees.map((item, index) => (
                  <div
                    key={`${item.email}-${index}`}
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      justifyContent: "space-between",
                      alignItems: isMobile ? "flex-start" : "center",
                      gap: 14,
                      borderBottom: `1px solid ${BRAND.border}`,
                      paddingBottom: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: BRAND.text }}>
                        {item.full_name}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          color: BRAND.muted,
                          fontSize: 13,
                          wordBreak: "break-word",
                        }}
                      >
                        {item.email || "-"}
                      </div>
                    </div>

                    <div style={badgeStyle(BRAND.redSoft, BRAND.red, "#f3c8c8")}>
                      {item.count} eksik
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={cardStyle(isMobile)}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
                Riskli Eğitim Dağılımı
              </h2>

              <span
                style={badgeStyle(BRAND.amberSoft, BRAND.amber, "#fed7aa")}
              >
                Dağılım
              </span>
            </div>

            {groupedRiskTrainings.length === 0 ? (
              <EmptyState text="Veri bulunamadı." />
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {groupedRiskTrainings.map((item) => (
                  <div
                    key={item.name}
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      justifyContent: "space-between",
                      alignItems: isMobile ? "flex-start" : "center",
                      gap: 14,
                      borderBottom: `1px solid ${BRAND.border}`,
                      paddingBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: BRAND.text,
                        wordBreak: "break-word",
                      }}
                    >
                      {item.name}
                    </div>

                    <div style={badgeStyle(BRAND.redSoft, BRAND.red, "#f3c8c8")}>
                      {item.count} kişi
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "minmax(0, 1.05fr) minmax(0, 0.95fr)",
            gap: isMobile ? 14 : 20,
            marginBottom: 20,
          }}
        >
          <section style={cardStyle(isMobile)}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
                Firma Bazlı Risk
              </h2>

              <span style={badgeStyle(BRAND.blueSoft, BRAND.blue, "#bfdbfe")}>
                Firma Takibi
              </span>
            </div>

            {groupedRiskCompanies.length === 0 ? (
              <EmptyState text="Veri bulunamadı." />
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {groupedRiskCompanies.map((item) => {
                  const percent = filteredRiskUsers.length
                    ? Math.round((item.count / filteredRiskUsers.length) * 100)
                    : 0;

                  return (
                    <div key={item.name}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: isMobile ? "column" : "row",
                          justifyContent: "space-between",
                          alignItems: isMobile ? "flex-start" : "center",
                          marginBottom: 6,
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: BRAND.text,
                            wordBreak: "break-word",
                          }}
                        >
                          {item.name}
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: BRAND.red,
                          }}
                        >
                          {item.count}
                        </div>
                      </div>

                      <div
                        style={{
                          height: 12,
                          borderRadius: 999,
                          background: "#f3f4f6",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(4, percent)}%`,
                            height: "100%",
                            background: BRAND.red,
                            borderRadius: 999,
                          }}
                        />
                      </div>

                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: BRAND.muted,
                        }}
                      >
                        Risk payı: %{percent}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section style={cardStyle(isMobile)}>
            <h2
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              Dashboard Notu
            </h2>

            <div style={{ display: "grid", gap: 12 }}>
              <div style={softPanelStyle(BRAND.redSoft, isMobile)}>
                <div style={{ fontWeight: 800, color: BRAND.red }}>
                  Risk Seviyesi
                </div>
                <div
                  style={{
                    marginTop: 6,
                    color: BRAND.muted,
                    lineHeight: 1.7,
                    fontSize: 14,
                  }}
                >
                  Başlamayan eğitim oranı yükseldiğinde firma ve eğitim bazlı
                  aksiyonlar önceliklendirilmelidir.
                </div>
              </div>

              <div style={softPanelStyle(BRAND.blueSoft, isMobile)}>
                <div style={{ fontWeight: 800, color: BRAND.blue }}>
                  Operasyonel Takip
                </div>
                <div
                  style={{
                    marginTop: 6,
                    color: BRAND.muted,
                    lineHeight: 1.7,
                    fontSize: 14,
                  }}
                >
                  Devam eden kullanıcı havuzu düzenli izlenirse riskli kullanıcı
                  sayısı kısa sürede düşürülebilir.
                </div>
              </div>

              <div style={softPanelStyle(BRAND.greenSoft, isMobile)}>
                <div style={{ fontWeight: 800, color: BRAND.green }}>
                  Performans Yorumu
                </div>
                <div
                  style={{
                    marginTop: 6,
                    color: BRAND.muted,
                    lineHeight: 1.7,
                    fontSize: 14,
                  }}
                >
                  Tamamlanma oranı yüksek olan eğitim başlıkları örnek akış olarak
                  alınabilir ve diğer başlıklara uyarlanabilir.
                </div>
              </div>
            </div>
          </section>
        </div>

        <div
          style={{
            ...cardStyle(isMobile),
            marginTop: 20,
            background:
              ceoSummary.executiveRiskScore >= 70
                ? "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)"
                : ceoSummary.executiveRiskScore >= 40
                ? "linear-gradient(135deg, #92400e 0%, #d97706 100%)"
                : "linear-gradient(135deg, #166534 0%, #16a34a 100%)",
            color: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  opacity: 0.9,
                  marginBottom: 8,
                }}
              >
                CEO ALARM PANELİ
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.2 }}>
                {ceoSummary.healthLabel === "Kritik"
                  ? "Üst yönetim müdahalesi önerilir"
                  : ceoSummary.healthLabel === "Dikkat"
                  ? "Yakın takip önerilir"
                  : "Operasyon dengeli görünüyor"}
              </div>
              <div
                style={{
                  marginTop: 10,
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                Açık ÇBS kayıtları: {ceoSummary.cbsOpen} • SLA alarmı:{" "}
                {ceoSummary.cbsSla} • Başlamayan eğitim:{" "}
                {ceoSummary.totalNotStarted} • Tamamlanan eğitim:{" "}
                {ceoSummary.totalCompleted}
              </div>
            </div>

            <div
              style={{
                padding: "12px 16px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.18)",
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              Skor: {ceoSummary.executiveRiskScore}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}