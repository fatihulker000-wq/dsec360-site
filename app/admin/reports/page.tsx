"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ReportAdvancedAnalyticsCenter,
} from "@/components/reports-v2/advanced-analytics";

import {
  ExecutiveReportsDashboard,
} from "@/components/reports-v2/executive-dashboard";

import {
  ReportAnalyticsCenter,
} from "@/components/reports-v2/analytics";

import {
  ReportPdfPreview,
} from "@/components/reports-v2/pdf";

import {
  ReportPdfCover,
} from "@/components/reports-v2/pdf-pro";

import {
  ReportVerificationCard,
} from "@/components/reports-v2/pdf-engine";

import ReportSectionPdfExportButton from "@/components/reports-v2/pdf-engine/ReportSectionPdfExportButton";

import ExecutiveAiPanel from "@/components/reports-v2/dora-ai/ExecutiveAiPanel";

import type {
  ExecutiveSummary,
} from "@/components/reports-v2/dora-ai/types";

import {
  mapEnterpriseSummaryToDashboard,
  ReportEnterpriseStatus,
  useReportEnterpriseSummary,
} from "@/components/reports-v2/data-integration";

type CompanyRow = {
  id: string;
  name: string;
};

type ScopeResponse = {
  success?: boolean;
  role?: string;
  can_select_company?: boolean;
  allowed_company_id?: string | null;
  allowed_company_name?: string | null;
  error?: string;
};

type MatrixStatus = {
  training_id: string;
  status: string;
  source?: string | null;
  type?: string | null;
  training_date?: string | null;
  duration_minutes?: number | null;
};

type MatrixRow = {
  user_id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  statuses: MatrixStatus[];
};

type TrainingMini = {
  id: string;
  title: string;
};

type ReportResponse = {
  success?: boolean;
  role?: string;
  company?: {
    id: string;
    name: string;
    company_title: string;
    address: string;
    employer_representative: string;
    employee_count: number;
  };
  summary?: {
    total_employees: number;
    total_trainings: number;
    total_assignments: number;
    completed_count: number;
    in_progress_count: number;
    not_started_count: number;
  };
  trainings?: TrainingMini[];
  matrix?: MatrixRow[];
  error?: string;
};

type AuditAnalysisResponse = {
  success?: boolean;
  company?: {
    id: string;
    name: string;
  };
  summary?: {
    total_audits: number;
    completed_audits: number;
    draft_audits: number;
    total_items: number;
    uygun_count: number;
    uygunsuz_count: number;
    kismen_count: number;
    kapsam_disi_count: number;
    other_count: number;
    open_dof_count: number;
    closed_dof_count: number;
    compliance_score: number;
  };
  result_distribution?: Array<{
    label: string;
    value: number;
  }>;
  top_nonconformities?: Array<{
    title: string;
    count: number;
  }>;
  recommended_actions?: Array<{
    title: string;
    count: number;
  }>;
  audits?: Array<{
    id: number | string;
    app_run_id?: number | string | null;
    template_type?: string | null;
    eval_mode?: string | null;
    location?: string | null;
    responsible?: string | null;
    inspector_name?: string | null;
    report_no?: string | null;
    status?: string | null;
    audit_date_millis?: number | null;
  }>;
  error?: string;
};

type DetailModalState =
  | {
      open: false;
    }
  | {
      open: true;
      title: string;
      subtitle?: string;
      rows: Array<{
        employee: string;
        email: string;
        training: string;
        status: string;
      }>;
    };

type ExecutiveAiResponse = {
  success?: boolean;

  dashboard?: {
    company?: string;
    employeeCount?: number;
    trainingCount?: number;
    inspectionCount?: number;
    riskCount?: number;
    accidentCount?: number;
    dofCount?: number;
    ibysCount?: number;
    documentCount?: number;
    emergencyCount?: number;
    generatedAt?: string;
  } | null;

  executiveSummary?: ExecutiveSummary | null;

  pdfSummary?: {
    title?: string;
    company?: string;
    overallScore?: number;
    grade?: string;
    maturity?: number;
    legalCompliance?: number;
    digitalization?: number;
    operationalRisk?: number;
    executiveText?: string;
  } | null;

  error?: string;
};

type ReportTab = "matrix" | "employee" | "training" | "audit";

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
  slate: "#374151",
  slateSoft: "#f3f4f6",
  shadow: "0 10px 30px rgba(15,23,42,0.06)",
};

function cardStyle(): React.CSSProperties {
  return {
    border: `1px solid ${BRAND.border}`,
    borderRadius: 18,
    background: BRAND.white,
    padding: 18,
    boxShadow: BRAND.shadow,
    minWidth: 0,
  };
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    border: "none",
    borderRadius: 999,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    background: active ? BRAND.red : "#f3f4f6",
    color: active ? "#fff" : BRAND.text,
  };
}

function statusStyle(status: string): React.CSSProperties {
  if (status === "App Kaydı") {
  return {
    background: "#ede9fe",
    color: "#6d28d9",
    border: "1px solid #c4b5fd",
  };
}
  if (status === "Tamamlandı") {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
    };
  }

  if (status === "Devam Ediyor") {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
      border: "1px solid #93c5fd",
    };
  }

  if (status === "Başlamadı") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fcd34d",
    };
  }

  return {
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
  };
}

function badge(status: string) {
  return (
    <span
      style={{
        ...statusStyle(status),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function matchesStatusFilter(status: string, filter: string) {
  if (filter === "all") return true;
  if (filter === "completed") return status === "Tamamlandı";
  if (filter === "in_progress") return status === "Devam Ediyor";
  if (filter === "not_started") return status === "Başlamadı";
  if (filter === "unassigned") return status === "Atanmadı";
  if (filter === "app_record") return status === "App Kaydı";
  if (filter === "missing") return status === "Başlamadı" || status === "Atanmadı";
  return true;
}

function MiniBar({
  label,
  value,
  total,
  color,
  soft,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  soft: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div
      style={{
        border: `1px solid ${BRAND.border}`,
        borderRadius: 16,
        padding: 14,
        background: soft,
        minWidth: 0,
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
        <div style={{ fontSize: 13, fontWeight: 800, color: BRAND.text }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 900, color }}>{value}</div>
      </div>

      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.max(4, percent)}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
          }}
        />
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: BRAND.muted }}>%{percent}</div>
    </div>
  );
}

function AuditScoreCard({
  title,
  value,
  subtitle,
  color,
  soft,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
  soft: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${BRAND.border}`,
        borderRadius: 18,
        padding: 18,
        background: soft,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 13, color: BRAND.muted, fontWeight: 800 }}>
        {title}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 30,
          fontWeight: 900,
          color,
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: BRAND.muted }}>
        {subtitle}
      </div>
    </div>
  );
}

function CircleGauge({ score }: { score: number }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, score || 0));
  const offset = circumference - (circumference * safeScore) / 100;

  // 🎯 RENK LOGİĞİ
  let color = "#22c55e"; // yeşil
  if (safeScore < 60) color = "#f59e0b"; // turuncu
  if (safeScore < 40) color = "#dc2626"; // kırmızı

  return (
    <div style={{ position: "relative", width: 120, height: 120 }}>
      <svg width="120" height="120">
        {/* Arka halka */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="10"
          fill="none"
        />

        {/* Animasyonlu ön halka */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{
            transition: "stroke-dashoffset 1s ease, stroke 0.5s ease",
          }}
        />
      </svg>

      {/* Ortadaki yüzde */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 900,
          color: "#fff",
        }}
      >
        %{safeScore}
      </div>
    </div>
  );
}

function DonutChart({
  total,
  uygun,
  uygunsuz,
  kismen,
  kapsamDisi,
}: {
  total: number;
  uygun: number;
  uygunsuz: number;
  kismen: number;
  kapsamDisi: number;
}) {
  const safeTotal = total || 1;

  const uygunDeg = (uygun / safeTotal) * 360;
  const uygunsuzDeg = (uygunsuz / safeTotal) * 360;
  const kismenDeg = (kismen / safeTotal) * 360;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: 18,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: `conic-gradient(
            ${BRAND.green} 0deg ${uygunDeg}deg,
            ${BRAND.red} ${uygunDeg}deg ${uygunDeg + uygunsuzDeg}deg,
            #f59e0b ${uygunDeg + uygunsuzDeg}deg ${uygunDeg + uygunsuzDeg + kismenDeg}deg,
            #64748b ${uygunDeg + uygunsuzDeg + kismenDeg}deg 360deg
          )`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 34,
            borderRadius: "50%",
            background: "#fff",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: BRAND.muted, fontWeight: 800 }}>
              Toplam
            </div>
            <div style={{ fontSize: 26, fontWeight: 950, color: BRAND.text }}>
              {total}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {[
          ["Uygun", uygun, BRAND.green],
          ["Uygunsuz", uygunsuz, BRAND.red],
          ["Kısmen Uygun", kismen, BRAND.amber],
          ["Kapsam Dışı", kapsamDisi, BRAND.slate],
        ].map(([label, value, color]) => (
          <div
            key={String(label)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            <span style={{ color: String(color) }}>● {label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");
  const [auditReport, setAuditReport] = useState<AuditAnalysisResponse | null>(null);
  const [loadingAuditReport, setLoadingAuditReport] = useState(false);
  const [
  executiveAiSummary,
  setExecutiveAiSummary,
] = useState<ExecutiveSummary | null>(
  null
);

const [
  loadingExecutiveAi,
  setLoadingExecutiveAi,
] = useState(false);

const [
  executiveAiError,
  setExecutiveAiError,
] = useState("");

const {
  data: enterpriseSummary,
  loading: loadingEnterpriseSummary,
  error: enterpriseSummaryError,
} = useReportEnterpriseSummary(
  selectedCompanyId
);

  const [scope, setScope] = useState<ScopeResponse | null>(null);
  const [loadingScope, setLoadingScope] = useState(true);

  const [activeTab, setActiveTab] = useState<ReportTab>("matrix");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [trainingSearch, setTrainingSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  const [showOnlyActiveEmployees, setShowOnlyActiveEmployees] = useState(false);

  const [detailModal, setDetailModal] = useState<DetailModalState>({
    open: false,
  });

  const loadScope = async () => {
    try {
      setLoadingScope(true);

      const res = await fetch("/api/admin/reports/scope", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json: ScopeResponse = await res.json();

      if (!res.ok) {
        setError(json?.error || "Rapor yetki bilgisi alınamadı.");
        setScope(null);
        return;
      }

      setScope(json);

      if (!json.can_select_company && json.allowed_company_id) {
        setSelectedCompanyId(String(json.allowed_company_id));
      }
    } catch (err) {
      console.error(err);
      setError("Rapor yetki bilgisi alınamadı.");
      setScope(null);
    } finally {
      setLoadingScope(false);
    }
  };

  const loadCompanies = async () => {
  try {
    setLoadingCompanies(true);

    const res = await fetch("/api/admin/companies", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    const json = await res.json();

    if (!res.ok) {
      setError(json?.error || "Firmalar alınamadı.");
      setCompanies([]);
      return;
    }

    const list: CompanyRow[] = Array.isArray(json?.data)
      ? json.data.map((item: { id: string; name: string }) => ({
          id: String(item.id),
          name: String(item.name || "").trim(),
        }))
      : [];

  
setCompanies([
  { id: "ALL", name: "Tüm Firmalar" },
  ...list,
]);

  } catch (err) {
    console.error(err);
    setError("Firmalar alınamadı.");
    setCompanies([]);
  } finally {
    setLoadingCompanies(false);
  }
};



  const loadReport = async (companyId: string) => {
  if (!companyId) {
    setReport(null);
    return;
  }
 
    try {
      setLoadingReport(true);
      setError("");

      const res = await fetch(
        `/api/admin/reports/company-training-matrix?companyId=${encodeURIComponent(companyId)}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json: ReportResponse = await res.json();

      if (!res.ok) {
  console.warn("Eğitim raporu alınamadı:", json?.error);

  setReport({
    success: true,
    company: {
      id: companyId,
      name: companies.find((c) => c.id === companyId)?.name || "Seçili Firma",
      company_title: "-",
      address: "-",
      employer_representative: "-",
      employee_count: 0,
    },
    summary: {
      total_employees: 0,
      total_trainings: 0,
      total_assignments: 0,
      completed_count: 0,
      in_progress_count: 0,
      not_started_count: 0,
    },
    trainings: [],
    matrix: [],
  });

  return;
}

      setReport(json);
    } catch (err) {
      console.error(err);
      setError("Rapor alınamadı.");
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  };
  
  const loadAuditReport = async (companyId: string) => {
  if (!companyId) {
    setAuditReport(null);
    return;
  }

  try {
    setLoadingAuditReport(true);

const companyName =
  companyId === "ALL"
    ? "Tüm Firmalar"
    : companies.find((c) => c.id === companyId)?.name || "";

const res = await fetch(
  `/api/admin/reports/audit-analysis?companyId=${encodeURIComponent(
    companyId
  )}&companyName=${encodeURIComponent(companyName)}`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      }
    );

    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    const json: AuditAnalysisResponse = await res.json();

    if (!res.ok) {
      setAuditReport(null);
      return;
    }

    setAuditReport(json);
  } catch (err) {
    console.error("audit report load error:", err);
    setAuditReport(null);
  } finally {
    setLoadingAuditReport(false);
  }
};


const loadExecutiveAi = async (
  companyId: string
) => {
  if (!companyId) {
    setExecutiveAiSummary(null);
    setExecutiveAiError("");
    return;
  }

  try {
    setLoadingExecutiveAi(true);
    setExecutiveAiError("");

    const response = await fetch(
      `/api/admin/reports/executive-ai?companyId=${encodeURIComponent(
        companyId
      )}`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      }
    );

    if (response.status === 401) {
      window.location.href =
        "/admin/login";
      return;
    }

    const json: ExecutiveAiResponse =
      await response
        .json()
        .catch(() => ({}));

    if (
      !response.ok ||
      !json.success ||
      !json.executiveSummary
    ) {
      setExecutiveAiSummary(null);
      setExecutiveAiError(
        json.error ||
          "DORA yönetici analizi oluşturulamadı."
      );
      return;
    }

    setExecutiveAiSummary(
      json.executiveSummary
    );
  } catch (errorValue: unknown) {
    console.error(
      "DORA executive AI load error:",
      errorValue
    );

    setExecutiveAiSummary(null);
    setExecutiveAiError(
      errorValue instanceof Error
        ? errorValue.message
        : "DORA yönetici analizi alınamadı."
    );
  } finally {
    setLoadingExecutiveAi(false);
  }
};

  useEffect(() => {
    void loadScope();
  }, []);

  useEffect(() => {
    if (!scope) return;

    if (scope.can_select_company) {
      void loadCompanies();
    } else {
      setLoadingCompanies(false);
    }
  }, [scope]);

 useEffect(() => {
  if (selectedCompanyId) {
    void loadReport(selectedCompanyId);
    void loadAuditReport(selectedCompanyId);
    void loadExecutiveAi(selectedCompanyId);
  } else {
    setExecutiveAiSummary(null);
    setExecutiveAiError("");
  }
}, [selectedCompanyId, companies]); 

  const completionRate = useMemo(() => {
    const total = report?.summary?.total_assignments || 0;
    const completed = report?.summary?.completed_count || 0;
    return total ? Math.round((completed / total) * 100) : 0;
  }, [report]);

  const trainings = report?.trainings || [];
  const matrix = report?.matrix || [];

  const filteredTrainings = useMemo(() => {
    const q = trainingSearch.trim().toLowerCase();
    return trainings.filter((t) => !q || t.title.toLowerCase().includes(q));
  }, [trainings, trainingSearch]);

  const visibleTrainingIds = useMemo(
    () => new Set(filteredTrainings.map((t) => t.id)),
    [filteredTrainings]
  );

  const filteredMatrix = useMemo(() => {
    const rows = matrix;
    const q = employeeSearch.trim().toLowerCase();

    return rows
      .filter((row) => {
        const matchesSearch =
          !q ||
          row.full_name.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q);

        const matchesActive = showOnlyActiveEmployees ? row.is_active : true;

        const statusesInVisibleTrainings = row.statuses.filter((s) =>
          visibleTrainingIds.has(s.training_id)
        );

        const hasFilteredStatus =
          statusFilter === "all"
            ? true
            : statusesInVisibleTrainings.some((s) =>
                matchesStatusFilter(s.status, statusFilter)
              );

        const hasMissing = statusesInVisibleTrainings.some(
          (s) => s.status === "Başlamadı" || s.status === "Atanmadı"
        );

        const matchesMissing = showOnlyMissing ? hasMissing : true;

        return matchesSearch && matchesActive && hasFilteredStatus && matchesMissing;
      })
      .map((row) => ({
        ...row,
        statuses: row.statuses.filter((s) => visibleTrainingIds.has(s.training_id)),
      }));
  }, [
    matrix,
    employeeSearch,
    showOnlyMissing,
    showOnlyActiveEmployees,
    statusFilter,
    visibleTrainingIds,
  ]);

  const employeeBasedRows = useMemo(() => {
    return filteredMatrix.map((row) => {
      const completed = row.statuses.filter((s) => s.status === "Tamamlandı").length;
      const appRecord = row.statuses.filter((s) => s.status === "App Kaydı").length;
      const inProgress = row.statuses.filter((s) => s.status === "Devam Ediyor").length;
      const notStarted = row.statuses.filter((s) => s.status === "Başlamadı").length;
      const unassigned = row.statuses.filter((s) => s.status === "Atanmadı").length;

      return {
  ...row,
  completed,
  appRecord,
  inProgress,
  notStarted,
  unassigned,
};
    });
  }, [filteredMatrix]);

  const trainingBasedRows = useMemo(() => {
    return filteredTrainings
      .map((training) => {
        let completed = 0;
        let inProgress = 0;
        let notStarted = 0;
        let unassigned = 0;

        const participants: Array<{
          employee: string;
          email: string;
          training: string;
          status: string;
        }> = [];

        matrix.forEach((row) => {
          if (showOnlyActiveEmployees && !row.is_active) return;

          if (
            employeeSearch.trim() &&
            !row.full_name.toLowerCase().includes(employeeSearch.trim().toLowerCase()) &&
            !row.email.toLowerCase().includes(employeeSearch.trim().toLowerCase())
          ) {
            return;
          }

          const status =
            row.statuses.find((s) => s.training_id === training.id)?.status || "Atanmadı";

          if (status === "Tamamlandı") completed += 1;
          else if (status === "Devam Ediyor") inProgress += 1;
          else if (status === "Başlamadı") notStarted += 1;
          else unassigned += 1;

          participants.push({
            employee: row.full_name,
            email: row.email,
            training: training.title,
            status,
          });
        });

        return {
          training_id: training.id,
          title: training.title,
          completed,
          inProgress,
          notStarted,
          unassigned,
          participants,
        };
      })
      .filter((item) => {
        const matchesFilter =
          statusFilter === "all"
            ? true
            : statusFilter === "completed"
            ? item.completed > 0
            : statusFilter === "in_progress"
            ? item.inProgress > 0
            : statusFilter === "not_started"
            ? item.notStarted > 0
            : statusFilter === "unassigned"
            ? item.unassigned > 0
            : item.notStarted > 0 || item.unassigned > 0;

        const matchesMissing = showOnlyMissing
          ? item.notStarted > 0 || item.unassigned > 0
          : true;

        return matchesFilter && matchesMissing;
      });
  }, [
    filteredTrainings,
    matrix,
    employeeSearch,
    showOnlyActiveEmployees,
    statusFilter,
    showOnlyMissing,
  ]);

  const dynamicStats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let unassigned = 0;

    filteredMatrix.forEach((row) => {
      row.statuses.forEach((s) => {
        if (s.status === "Tamamlandı") completed += 1;
        else if (s.status === "Devam Ediyor") inProgress += 1;
        else if (s.status === "Başlamadı") notStarted += 1;
        else unassigned += 1;
      });
    });

    return {
      employees: filteredMatrix.length,
      trainings: filteredTrainings.length,
      completed,
      inProgress,
      notStarted,
      unassigned,
    };
  }, [filteredMatrix, filteredTrainings]);

  const executiveTone = useMemo(() => {
    const total = dynamicStats.completed + dynamicStats.inProgress + dynamicStats.notStarted;
    const missing = dynamicStats.notStarted + dynamicStats.unassigned;
    const missingRate = total > 0 ? Math.round((missing / total) * 100) : 0;

    if (missingRate >= 45) {
      return {
        label: "Kritik İzleme",
        bg: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)",
        text: "Eksik ve atanmamış eğitim oranı yüksek. Acil aksiyon ve firma bazlı takip önerilir.",
      };
    }

    if (missingRate >= 20) {
      return {
        label: "Yakın Takip",
        bg: "linear-gradient(135deg, #92400e 0%, #f59e0b 100%)",
        text: "Genel durum orta seviyede. Eksik eğitimlerin kapatılması için yakın takip gerekli.",
      };
    }

    return {
      label: "Kontrollü Düzey",
      bg: "linear-gradient(135deg, #166534 0%, #22c55e 100%)",
      text: "Eğitim durumu kontrollü görünüyor. Tamamlanma performansı güçlü şekilde ilerliyor.",
    };
  }, [dynamicStats]);

  const chartTrainingTop = useMemo(() => {
    return trainingBasedRows
      .slice()
      .sort((a, b) => b.notStarted + b.unassigned - (a.notStarted + a.unassigned))
      .slice(0, 6);
  }, [trainingBasedRows]);

  const auditSummary = auditReport?.summary;

  const auditTone = useMemo(() => {
  const score = auditSummary?.compliance_score || 0;

  if (score >= 85) {
    return {
      label: "Güçlü Uyum",
      bg: "linear-gradient(135deg, #166534 0%, #22c55e 100%)",
      text: "Denetim uyum skoru güçlü görünüyor. Mevcut kontrol seviyesi korunmalı.",
    };
  }

  if (score >= 60) {
    return {
      label: "Kontrollü Risk",
      bg: "linear-gradient(135deg, #92400e 0%, #f59e0b 100%)",
      text: "Denetim bulguları orta seviyede risk içeriyor. Açık uygunsuzluklar takip edilmeli.",
    };
  }

  return {
    label: "Kritik İzleme",
    bg: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)",
    text: "Denetim uyum skoru düşük. Uygunsuzluklar için hızlı aksiyon planı önerilir.",
  };
}, [auditSummary]);

const enterpriseDashboardPatch =
  useMemo(
    () =>
      mapEnterpriseSummaryToDashboard(
        enterpriseSummary
      ),
    [enterpriseSummary]
  );

const executiveDashboardInput = useMemo(() => {
  const activeEmployeeCount = matrix.filter(
    (employee) => employee.is_active
  ).length;

  const passiveEmployeeCount = matrix.filter(
    (employee) => !employee.is_active
  ).length;

  return {
    companyId:
      report?.company?.id ||
      selectedCompanyId ||
      "ALL",

    companyName:
      report?.company?.name ||
      "Tüm Firmalar",

    companyTitle:
      report?.company?.company_title ||
      undefined,

    employeeCount:
      report?.company?.employee_count ||
      report?.summary?.total_employees ||
      0,

    activeEmployeeCount,
    passiveEmployeeCount,

    totalTrainings:
      report?.summary?.total_trainings ||
      0,

    completedTrainings:
      report?.summary?.completed_count ||
      0,

    missingTrainings:
      report?.summary?.not_started_count ||
      0,

    inProgressTrainings:
      report?.summary?.in_progress_count ||
      0,

    totalAudits:
      auditSummary?.total_audits ||
      0,

    completedAudits:
      auditSummary?.completed_audits ||
      0,

    draftAudits:
      auditSummary?.draft_audits ||
      0,

    complianceScore:
      auditSummary?.compliance_score ||
      0,

    nonconformityCount:
      auditSummary?.uygunsuz_count ||
      0,

    openDofCount:
      auditSummary?.open_dof_count ||
      0,

    closedDofCount:
      auditSummary?.closed_dof_count ||
      0,

    ...enterpriseDashboardPatch,
  };
}, [
  report,
  auditSummary,
  matrix,
  selectedCompanyId,
  enterpriseDashboardPatch,
]);

const analyticsInput = useMemo(() => {
  return {
    trainingTrend: [
      {
        label: "Mevcut",
        value:
          report?.summary?.completed_count ||
          0,
        secondaryValue:
          report?.summary?.not_started_count ||
          0,
      },
    ],

    auditTrend: [
      {
        label: "Mevcut",
        value:
          auditSummary?.completed_audits ||
          0,
        secondaryValue:
          auditSummary?.open_dof_count ||
          0,
      },
    ],

    dofTrend: [
      {
        label: "Mevcut",
        value:
          auditSummary?.open_dof_count ||
          0,
        secondaryValue:
          auditSummary?.closed_dof_count ||
          0,
      },
    ],

    accidentTrend: [],
    riskTrend: [],
    healthTrend: [],
    ppeTrend: [],

    companyComparison: [],

    monthlyChanges: [
      {
        key: "TRAINING" as const,
        title: "Tamamlanan Eğitim",
        current:
          report?.summary?.completed_count ||
          0,
        previous: 0,
      },
      {
        key: "AUDIT" as const,
        title: "Tamamlanan Denetim",
        current:
          auditSummary?.completed_audits ||
          0,
        previous: 0,
      },
      {
        key: "DOF" as const,
        title: "Açık DÖF",
        current:
          auditSummary?.open_dof_count ||
          0,
        previous: 0,
        inversePositive: true,
      },
    ],

    heatmap:
      auditReport?.top_nonconformities?.map(
        (item, index) => ({
          rowLabel: "Uygunsuzluk",
          columnLabel: `Alan ${index + 1}`,
          value: item.count,
        })
      ) || [],
  };
}, [
  report,
  auditSummary,
  auditReport,
]);

const reportNo = useMemo(
  () =>
    `DSEC-${new Date().getFullYear()}-${
      selectedCompanyId || "ALL"
    }`,
  [selectedCompanyId]
);

const verificationCode = useMemo(
  () =>
    `VRF-${selectedCompanyId || "ALL"}-${new Date()
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "")}`,
  [selectedCompanyId]
);

const pdfCover = useMemo(
  () => ({
    reportNo,
    revisionNo: "00",
    companyName:
      report?.company?.name ||
      "Tüm Firmalar",
    reportTitle:
      "D-SEC Kurumsal İSG Yönetim Raporu",
    generatedAt:
      new Date().toLocaleDateString(
        "tr-TR"
      ),
    preparedBy:
      "İş Güvenliği Uzmanı",
    approvedBy:
      report?.company
        ?.employer_representative ||
      "",
    score:
      Math.round(
        (
          completionRate +
          (auditSummary?.compliance_score ||
            0)
        ) / 2
      ),
  }),
  [
    report,
    reportNo,
    completionRate,
    auditSummary,
  ]
);

const pdfPreviewDocument = useMemo(
  () => ({
    companyName:
      report?.company?.name ||
      "Tüm Firmalar",
    reportTitle:
      "D-SEC Kurumsal İSG Yönetim Raporu",
    generatedAt:
      new Date().toISOString(),
    score: pdfCover.score,
    executiveSummary:
      executiveTone.text,
    doraSummary:
      auditTone.text,
    sections: [
      {
        title: "Eğitim Performansı",
        content:
          `Tamamlanan: ${
            report?.summary
              ?.completed_count || 0
          }, devam eden: ${
            report?.summary
              ?.in_progress_count || 0
          }, başlamayan: ${
            report?.summary
              ?.not_started_count || 0
          }.`,
      },
      {
        title: "Denetim Performansı",
        content:
          `Toplam denetim: ${
            auditSummary?.total_audits ||
            0
          }, uygunsuzluk: ${
            auditSummary?.uygunsuz_count ||
            0
          }, açık DÖF: ${
            auditSummary?.open_dof_count ||
            0
          }.`,
      },
    ],
  }),
  [
    report,
    pdfCover.score,
    executiveTone,
    auditTone,
    auditSummary,
  ]
);

const auditTotalDistribution =
  (auditSummary?.uygun_count || 0) +
  (auditSummary?.uygunsuz_count || 0) +
  (auditSummary?.kismen_count || 0) +
  (auditSummary?.kapsam_disi_count || 0);

  const openEmployeeDetail = (row: MatrixRow) => {
    const rows = row.statuses
      .map((s) => ({
        employee: row.full_name,
        email: row.email,
        training: trainings.find((t) => t.id === s.training_id)?.title || "Eğitim",
        status: s.status,
      }))
      .filter((item) => matchesStatusFilter(item.status, statusFilter))
      .filter((item) =>
        showOnlyMissing ? item.status === "Başlamadı" || item.status === "Atanmadı" : true
      );

    setDetailModal({
      open: true,
      title: row.full_name,
      subtitle: "Çalışan eğitim detayları",
      rows,
    });
  };

  const openTrainingDetail = (trainingId: string, title: string) => {
    const rows = matrix
      .filter((row) => (showOnlyActiveEmployees ? row.is_active : true))
      .filter((row) => {
        const q = employeeSearch.trim().toLowerCase();
        return (
          !q ||
          row.full_name.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q)
        );
      })
      .map((row) => ({
        employee: row.full_name,
        email: row.email,
        training: title,
        status: row.statuses.find((s) => s.training_id === trainingId)?.status || "Atanmadı",
      }))
      .filter((item) => matchesStatusFilter(item.status, statusFilter))
      .filter((item) =>
        showOnlyMissing ? item.status === "Başlamadı" || item.status === "Atanmadı" : true
      );

    setDetailModal({
      open: true,
      title,
      subtitle: "Eğitim katılımcı detayları",
      rows,
    });
  };

  const openCellDetail = (row: MatrixRow, trainingId: string) => {
    const trainingTitle = trainings.find((t) => t.id === trainingId)?.title || "Eğitim";
    const status = row.statuses.find((s) => s.training_id === trainingId)?.status || "Atanmadı";

    setDetailModal({
      open: true,
      title: `${row.full_name} • ${trainingTitle}`,
      subtitle: "Tekil eğitim durumu",
      rows: [
        {
          employee: row.full_name,
          email: row.email,
          training: trainingTitle,
          status,
        },
      ],
    });
  };

  const exportExcel = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (activeTab === "matrix") {
      headers = ["Çalışan", "E-Posta", ...filteredTrainings.map((t) => t.title)];

      rows = filteredMatrix.map((row) => {
        const statusMap = new Map(row.statuses.map((s) => [s.training_id, s.status]));
        return [
          row.full_name,
          row.email,
          ...filteredTrainings.map((t) => statusMap.get(t.id) || "Atanmadı"),
        ];
      });
    } else if (activeTab === "employee") {
      headers = [
        "Çalışan",
        "E-Posta",
        "Tamamlandı",
        "Devam Ediyor",
        "Başlamadı",
        "Atanmadı",
      ];

      rows = employeeBasedRows.map((row) => [
        row.full_name,
        row.email,
        String(row.completed),
        String(row.inProgress),
        String(row.notStarted),
        String(row.unassigned),
      ]);
    } else if (activeTab === "training") {
  headers = [
    "Eğitim",
    "Tamamlandı",
    "Devam Ediyor",
    "Başlamadı",
    "Atanmadı",
  ];

  rows = trainingBasedRows.map((row) => [
    row.title,
    String(row.completed),
    String(row.inProgress),
    String(row.notStarted),
    String(row.unassigned),
  ]);
} else if (activeTab === "audit") {
  headers = ["Başlık", "Değer", "Açıklama"];

  rows = [
    ["Toplam Denetim", String(auditSummary?.total_audits || 0), "Seçili firma denetim sayısı"],
    ["Tamamlanan Denetim", String(auditSummary?.completed_audits || 0), "Kapanan denetimler"],
    ["Taslak Denetim", String(auditSummary?.draft_audits || 0), "Taslak / açık denetimler"],
    ["Toplam Madde", String(auditSummary?.total_items || 0), "Analize dahil madde sayısı"],
    ["Uygun", String(auditSummary?.uygun_count || 0), "Uygun cevap sayısı"],
    ["Uygunsuz", String(auditSummary?.uygunsuz_count || 0), "Uygunsuz cevap sayısı"],
    ["Kısmen Uygun", String(auditSummary?.kismen_count || 0), "Kısmi uygunluk sayısı"],
    ["Kapsam Dışı", String(auditSummary?.kapsam_disi_count || 0), "Kapsam dışı madde sayısı"],
    ["DÖF Açık", String(auditSummary?.open_dof_count || 0), "Açık aksiyon sayısı"],
    ["DÖF Kapalı", String(auditSummary?.closed_dof_count || 0), "Kapanan aksiyon sayısı"],
    ["Uyum Skoru", `%${auditSummary?.compliance_score || 0}`, "Genel denetim uyum oranı"],
  ];
}

    if (!rows.length) return;

    const csvContent = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `firma-egitim-raporu-${activeTab}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const element = document.getElementById("report-export-area");
    if (!element) return;

    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    const canvas = await html2canvas(element, {
      scale: 1.2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");

    const pageWidth = 297;
    const pageHeight = 210;
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

    pdf.save(
      `${(report?.company?.name || "firma").replace(/\s+/g, "-").toLowerCase()}-${activeTab}-raporu.pdf`
    );
  };

 return (
  <main
    style={{
      minHeight: "100%",
      background: BRAND.bg,
      padding: "16px",
    }}
  >
    <div style={{ maxWidth: 1600, margin: "0 auto", width: "100%" }}>
        <div
          style={{
            ...cardStyle(),
            background: `linear-gradient(135deg, ${BRAND.redDark} 0%, ${BRAND.red} 100%)`,
            color: "#fff",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  fontSize: 12,
                  fontWeight: 900,
                  marginBottom: 12,
                }}
              >
                {scope?.role === "company_admin"
                  ? "Firma Eğitim Sorumlusu Görünümü"
                  : "Admin Raporlama Merkezi"}
              </div>

             <h1
  style={{
    marginTop: 0,
    marginBottom: 8,
    fontSize: "clamp(24px, 4vw, 36px)",
    fontWeight: 900,
    lineHeight: 1.2,
  }}
>
                Raporlama Merkezi
              </h1>
              <p
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.92)",
                  lineHeight: 1.7,
                }}
              >
               Firma bazlı eğitim, denetim, çalışan ve yönetim raporlarını tek merkezden analiz et.
              </p>
            </div>

            {report?.company ? (
             <div
  style={{
    display: "grid",
    gap: 8,
    minWidth: 0,
    width: "100%",
    maxWidth: 260,
  }}
>
                <button
                  onClick={exportExcel}
                  style={{
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 16px",
                    background: "#ffffff",
                    color: BRAND.blue,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Excel / CSV
                </button>

                <ReportSectionPdfExportButton
                  elementId="report-export-area"
                  filename={`${
                    report?.company?.name ||
                    "firma"
                  }-${activeTab}-raporu`}
                  label="Kurumsal PDF"
                  reportTitle="D-SEC Kurumsal İSG Yönetim Raporu"
                  reportNo={reportNo}
                  verificationCode={verificationCode}
                />
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div style={{ ...cardStyle(), marginBottom: 20, color: BRAND.red, fontWeight: 700 }}>
            {error}
          </div>
        ) : null}

        {loadingScope ? <div style={cardStyle()}>Yetki bilgisi yükleniyor...</div> : null}

        {!loadingScope && scope ? (
          <div style={{ ...cardStyle(), marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Firma Seç</div>

            {scope.can_select_company ? (
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                disabled={loadingCompanies}
                style={{
                  width: "100%",
                  maxWidth: 420,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${BRAND.border}`,
                  background: "#fff",
                  fontSize: 14,
                }}
              >
                
                <option value="ALL">Tüm Firmalar</option>
                {companies
  .filter((c) => c.id !== "ALL")
  .map((company) => (
    <option key={company.id} value={company.id}>
      {company.name}
    </option>
))}
              </select>
            ) : (
              <div
                style={{
                  maxWidth: 420,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${BRAND.border}`,
                  background: "#f9fafb",
                  fontSize: 14,
                  fontWeight: 800,
                  color: BRAND.text,
                }}
              >
                {scope.allowed_company_name || "Bağlı Firma"}
              </div>
            )}
          </div>
        ) : null}

        {loadingReport ? <div style={cardStyle()}>Rapor yükleniyor...</div> : null}

        {!loadingReport && report?.company ? (
          
<div id="report-export-area">
            <div
              data-pdf-split-children="true"
              style={{
                display: "grid",
                gap: 20,
                marginBottom: 20,
              }}
            >
              {loadingExecutiveAi ? (
                <div
                  style={{
                    ...cardStyle(),
                    color: BRAND.blue,
                    fontWeight: 800,
                  }}
                >
                  DORA yönetici analizi hazırlanıyor...
                </div>
              ) : null}

              {!loadingExecutiveAi &&
              executiveAiError ? (
                <div
                  style={{
                    ...cardStyle(),
                    color: BRAND.red,
                    background: BRAND.redSoft,
                    fontWeight: 800,
                  }}
                >
                  {executiveAiError}
                </div>
              ) : null}

              {!loadingExecutiveAi &&
              executiveAiSummary ? (
                <ExecutiveAiPanel
                  summary={executiveAiSummary}
                />
              ) : null}

              <ExecutiveReportsDashboard
                input={
                  executiveDashboardInput
                }
              />

              <ReportEnterpriseStatus
                data={enterpriseSummary}
                loading={loadingEnterpriseSummary}
                error={enterpriseSummaryError}
              />

              <ReportAnalyticsCenter
                input={analyticsInput}
              />

<ReportAdvancedAnalyticsCenter
                companyId={selectedCompanyId}
                months={12}
              />

              <section
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(340px,1fr))",
                  gap: 18,
                }}
              >
                <ReportPdfCover
                  cover={pdfCover}
                />

                <ReportPdfPreview
                  document={
                    pdfPreviewDocument
                  }
                />
              </section>

              <ReportVerificationCard
                verification={{
                  reportNo,
                  revisionNo: "00",
                  verificationCode,
                  verificationUrl:
                    "https://dsec360.com/report-verify",
                }}
              />
            </div>
           <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
    marginBottom: 20,
  }}
>
              <div style={cardStyle()}>
                <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24, fontWeight: 900 }}>
                  Firma Künyesi
                </h2>

                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: BRAND.muted }}>Firma Adı</div>
                    <div style={{ marginTop: 4, fontWeight: 800, color: BRAND.text }}>
                      {report.company.name}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: BRAND.muted }}>Şirket Ünvanı</div>
                    <div style={{ marginTop: 4, fontWeight: 700, color: BRAND.text }}>
                      {report.company.company_title}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: BRAND.muted }}>Adres</div>
                    <div style={{ marginTop: 4, fontWeight: 700, color: BRAND.text }}>
                      {report.company.address}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: BRAND.muted }}>İşveren Vekili</div>
                    <div style={{ marginTop: 4, fontWeight: 700, color: BRAND.text }}>
                      {report.company.employer_representative}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  ...cardStyle(),
                  background: executiveTone.bg,
                  color: "#fff",
                  border: "none",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    padding: "7px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    fontSize: 12,
                    fontWeight: 900,
                    marginBottom: 14,
                  }}
                >
                  {executiveTone.label}
                </div>

               <div
  style={{
    fontSize: "clamp(20px, 3.5vw, 28px)",
    fontWeight: 900,
    lineHeight: 1.2,
  }}
>
                  Yönetici Dashboard
                </div>

                <div
                  style={{
                    marginTop: 12,
                    lineHeight: 1.8,
                    color: "rgba(255,255,255,0.95)",
                    fontSize: 14,
                  }}
                >
                  {executiveTone.text}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginTop: 18,
                  }}
                >
                  <div
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.16)",
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.9 }}>Çalışan Sayısı</div>
                    <div style={{ marginTop: 6, fontSize: 24, fontWeight: 900 }}>
                      {report.company.employee_count}
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.16)",
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.9 }}>Tamamlama</div>
                    <div style={{ marginTop: 6, fontSize: 24, fontWeight: 900 }}>
                      %{completionRate}
                    </div>
                  </div>
                </div>
              </div>
            </div>

           <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    marginBottom: 20,
  }}
>
              <div style={cardStyle()}>
                <div style={{ fontSize: 12, color: BRAND.muted }}>Filtrelenen Çalışan</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>
                  {dynamicStats.employees}
                </div>
              </div>

              <div style={cardStyle()}>
                <div style={{ fontSize: 12, color: BRAND.muted }}>Eğitim</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>
                  {dynamicStats.trainings}
                </div>
              </div>

              <div style={cardStyle()}>
                <div style={{ fontSize: 12, color: BRAND.muted }}>Tamamlandı</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900, color: BRAND.green }}>
                  {dynamicStats.completed}
                </div>
              </div>

              <div style={cardStyle()}>
                <div style={{ fontSize: 12, color: BRAND.muted }}>Devam Ediyor</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900, color: BRAND.blue }}>
                  {dynamicStats.inProgress}
                </div>
              </div>

              <div style={cardStyle()}>
                <div style={{ fontSize: 12, color: BRAND.muted }}>Başlamadı</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900, color: BRAND.amber }}>
                  {dynamicStats.notStarted}
                </div>
              </div>

              <div style={cardStyle()}>
                <div style={{ fontSize: 12, color: BRAND.muted }}>Atanmadı</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900, color: BRAND.slate }}>
                  {dynamicStats.unassigned}
                </div>
              </div>
            </div>

           <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
    marginBottom: 20,
  }}
>
              <div style={cardStyle()}>
                <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 20, fontWeight: 900 }}>
                  Durum Dağılımı
                </h3>

                <div style={{ display: "grid", gap: 12 }}>
                  <MiniBar
                    label="Tamamlandı"
                    value={dynamicStats.completed}
                    total={
                      dynamicStats.completed +
                      dynamicStats.inProgress +
                      dynamicStats.notStarted +
                      dynamicStats.unassigned
                    }
                    color={BRAND.green}
                    soft={BRAND.greenSoft}
                  />
                  <MiniBar
                    label="Devam Ediyor"
                    value={dynamicStats.inProgress}
                    total={
                      dynamicStats.completed +
                      dynamicStats.inProgress +
                      dynamicStats.notStarted +
                      dynamicStats.unassigned
                    }
                    color={BRAND.blue}
                    soft={BRAND.blueSoft}
                  />
                  <MiniBar
                    label="Başlamadı"
                    value={dynamicStats.notStarted}
                    total={
                      dynamicStats.completed +
                      dynamicStats.inProgress +
                      dynamicStats.notStarted +
                      dynamicStats.unassigned
                    }
                    color={BRAND.amber}
                    soft={BRAND.amberSoft}
                  />
                  <MiniBar
                    label="Atanmadı"
                    value={dynamicStats.unassigned}
                    total={
                      dynamicStats.completed +
                      dynamicStats.inProgress +
                      dynamicStats.notStarted +
                      dynamicStats.unassigned
                    }
                    color={BRAND.slate}
                    soft={BRAND.slateSoft}
                  />
                </div>
              </div>

              <div style={cardStyle()}>
                <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 20, fontWeight: 900 }}>
                  En Kritik Eğitimler
                </h3>

                {chartTrainingTop.length === 0 ? (
                  <div style={{ color: BRAND.muted }}>Veri bulunamadı.</div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {chartTrainingTop.map((item) => {
                      const critical = item.notStarted + item.unassigned;
                      const total =
                        item.completed + item.inProgress + item.notStarted + item.unassigned;
                      const percent = total > 0 ? Math.round((critical / total) * 100) : 0;

                      return (
                        <div
                          key={item.training_id}
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
                            <button
                              onClick={() => openTrainingDetail(item.training_id, item.title)}
                              style={{
                                border: "none",
                                background: "transparent",
                                padding: 0,
                                fontWeight: 800,
                                cursor: "pointer",
                                color: BRAND.text,
                                textAlign: "left",
                              }}
                            >
                              {item.title}
                            </button>

                            <div style={{ fontSize: 13, fontWeight: 900, color: BRAND.red }}>
                              {critical}
                            </div>
                          </div>

                          <div
                            style={{
                              height: 10,
                              borderRadius: 999,
                              background: "#e5e7eb",
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

                          <div style={{ marginTop: 8, fontSize: 12, color: BRAND.muted }}>
                            Kritik oran %{percent}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ ...cardStyle(), marginBottom: 20 }}>
             <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    alignItems: "end",
  }}
>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
                    Çalışan Ara
                  </div>
                  <input
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    placeholder="Ad soyad veya e-posta ara..."
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1px solid ${BRAND.border}`,
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
                    Eğitim Ara
                  </div>
                  <input
                    value={trainingSearch}
                    onChange={(e) => setTrainingSearch(e.target.value)}
                    placeholder="Eğitim adı ara..."
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1px solid ${BRAND.border}`,
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Durum</div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1px solid ${BRAND.border}`,
                      background: "#fff",
                      fontSize: 14,
                    }}
                  >
                    <option value="all">Tümü</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="app_record">App Kaydı</option>
                    <option value="in_progress">Devam Ediyor</option>
                    <option value="not_started">Başlamadı</option>
                    <option value="unassigned">Atanmadı</option>
                    <option value="missing">Eksikler</option>
                  </select>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <label
                    style={{
                      display: "inline-flex",
                      gap: 8,
                      alignItems: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color: BRAND.text,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={showOnlyMissing}
                      onChange={(e) => setShowOnlyMissing(e.target.checked)}
                    />
                    Sadece eksik eğitimler
                  </label>

                  <label
                    style={{
                      display: "inline-flex",
                      gap: 8,
                      alignItems: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color: BRAND.text,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={showOnlyActiveEmployees}
                      onChange={(e) => setShowOnlyActiveEmployees(e.target.checked)}
                    />
                    Sadece aktif çalışanlar
                  </label>
                </div>

                <button
                  onClick={exportExcel}
                  style={{
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 16px",
                    background: BRAND.blue,
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Excel / CSV
                </button>

                <button
                  onClick={exportPDF}
                  style={{
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 16px",
                    background: BRAND.red,
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  PDF İndir
                </button>
              </div>

              <div
  style={{
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 16,
  }}
>
  <button
    style={pillStyle(activeTab === "matrix")}
    onClick={() => setActiveTab("matrix")}
  >
    Eğitim Matrisi
  </button>

  <button
    style={pillStyle(activeTab === "employee")}
    onClick={() => setActiveTab("employee")}
  >
    Çalışan Bazlı
  </button>

  <button
    style={pillStyle(activeTab === "training")}
    onClick={() => setActiveTab("training")}
  >
    Eğitim Bazlı
  </button>

  <button
    style={pillStyle(activeTab === "audit")}
    onClick={() => setActiveTab("audit")}
  >
    Denetim Analizleri
  </button>
</div>

            </div>

            {activeTab === "matrix" ? (
              <div style={cardStyle()}>
                <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24, fontWeight: 900 }}>
                  Eğitim Durum Matrisi
                </h2>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: 620,
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            textAlign: "left",
                            padding: 12,
                            borderBottom: `1px solid ${BRAND.border}`,
                            background: "#f9fafb",
                            position: "sticky",
                            left: 0,
                            zIndex: 1,
                          }}
                        >
                          Çalışan
                        </th>

                        {filteredTrainings.map((training) => (
                          <th
                            key={training.id}
                            style={{
                              textAlign: "center",
                              padding: 12,
                              borderBottom: `1px solid ${BRAND.border}`,
                              background: "#f9fafb",
                              minWidth: 160,
                            }}
                          >
                            <button
                              onClick={() => openTrainingDetail(training.id, training.title)}
                              style={{
                                border: "none",
                                background: "transparent",
                                fontWeight: 800,
                                cursor: "pointer",
                                color: BRAND.text,
                              }}
                            >
                              {training.title}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredMatrix.map((row) => (
                        <tr key={row.user_id}>
                          <td
                            style={{
                              padding: 12,
                              borderBottom: `1px solid ${BRAND.border}`,
                              background: "#fff",
                              position: "sticky",
                              left: 0,
                              zIndex: 1,
                              minWidth: 180,
                            }}
                          >
                            <div style={{ fontWeight: 800, color: BRAND.text }}>
                              {row.full_name}
                            </div>
                            <div style={{ fontSize: 12, color: BRAND.muted, marginTop: 4 }}>
                              {row.email || "-"}
                            </div>
                            <button
                              onClick={() => openEmployeeDetail(row)}
                              style={{
                                marginTop: 8,
                                border: "none",
                                borderRadius: 10,
                                padding: "8px 10px",
                                background: "#f3f4f6",
                                color: BRAND.text,
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                              Detay
                            </button>
                          </td>

                          {row.statuses.map((cell) => (
                            <td
                              key={`${row.user_id}-${cell.training_id}`}
                              style={{
                                padding: 12,
                                borderBottom: `1px solid ${BRAND.border}`,
                                textAlign: "center",
                              }}
                            >
                              <button
                                onClick={() => openCellDetail(row, cell.training_id)}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  cursor: "pointer",
                                }}
                              >
                                {badge(cell.status)}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredMatrix.length === 0 ? (
                  <div style={{ marginTop: 16, color: BRAND.muted }}>
                    Filtreye uygun çalışan bulunamadı.
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === "employee" ? (
              <div style={cardStyle()}>
                <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24, fontWeight: 900 }}>
                  Çalışan Bazlı Rapor
                </h2>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: 620,
                    }}
                  >
                    <thead>
                      <tr>
                        {["Çalışan", "E-Posta", "Tamamlandı", "App Kaydı", "Devam Ediyor", "Başlamadı", "Atanmadı", "İşlem"].map(
                          (head) => (
                            <th
                              key={head}
                              style={{
                                textAlign: head === "İşlem" ? "center" : "left",
                                padding: 12,
                                borderBottom: `1px solid ${BRAND.border}`,
                                background: "#f9fafb",
                              }}
                            >
                              {head}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {employeeBasedRows.map((row) => (
                        <tr key={row.user_id}>
                          <td
  style={{
    padding: 12,
    borderBottom: `1px solid ${BRAND.border}`,
  }}
>
  <div style={{ fontWeight: 800 }}>
    {row.full_name}
  </div>
</td>

<td
  style={{
    padding: 12,
    borderBottom: `1px solid ${BRAND.border}`,
    color: BRAND.muted,
  }}
>
  {row.email || "-"}
</td>

<td
  style={{
    padding: 12,
    borderBottom: `1px solid ${BRAND.border}`,
  }}
>
  {row.completed}
</td>

<td
  style={{
    padding: 12,
    borderBottom: `1px solid ${BRAND.border}`,
  }}
>
  {row.appRecord}
</td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>
                            {row.inProgress}
                          </td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>
                            {row.notStarted}
                          </td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>
                            {row.unassigned}
                          </td>
                          <td
                            style={{
                              padding: 12,
                              borderBottom: `1px solid ${BRAND.border}`,
                              textAlign: "center",
                            }}
                          >
                            <button
                              onClick={() => openEmployeeDetail(row)}
                              style={{
                                border: "none",
                                borderRadius: 10,
                                padding: "8px 12px",
                                background: BRAND.red,
                                color: "#fff",
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                              Aç
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {employeeBasedRows.length === 0 ? (
                  <div style={{ marginTop: 16, color: BRAND.muted }}>
                    Filtreye uygun çalışan bulunamadı.
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === "training" ? (
              <div style={cardStyle()}>
                <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24, fontWeight: 900 }}>
                  Eğitim Bazlı Rapor
                </h2>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: 620,
                    }}
                  >
                    <thead>
                      <tr>
                        {["Eğitim", "Tamamlandı", "Devam Ediyor", "Başlamadı", "Atanmadı", "İşlem"].map(
                          (head) => (
                            <th
                              key={head}
                              style={{
                                textAlign: head === "İşlem" ? "center" : "left",
                                padding: 12,
                                borderBottom: `1px solid ${BRAND.border}`,
                                background: "#f9fafb",
                              }}
                            >
                              {head}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {trainingBasedRows.map((row) => (
                        <tr key={row.training_id}>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>
                            <div style={{ fontWeight: 800 }}>{row.title}</div>
                          </td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>
                            {row.completed}
                          </td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>
                            {row.inProgress}
                          </td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>
                            {row.notStarted}
                          </td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>
                            {row.unassigned}
                          </td>
                          <td
                            style={{
                              padding: 12,
                              borderBottom: `1px solid ${BRAND.border}`,
                              textAlign: "center",
                            }}
                          >
                            <button
                              onClick={() => openTrainingDetail(row.training_id, row.title)}
                              style={{
                                border: "none",
                                borderRadius: 10,
                                padding: "8px 12px",
                                background: BRAND.red,
                                color: "#fff",
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                              Aç
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {trainingBasedRows.length === 0 ? (
                  <div style={{ marginTop: 16, color: BRAND.muted }}>
                    Filtreye uygun eğitim bulunamadı.
                  </div>
                ) : null}
              </div>
            ) : null}

          {activeTab === "audit" ? (
  <div style={{ display: "grid", gap: 22 }}>
    <div
      style={{
        ...cardStyle(),
        background: auditTone.bg,
        boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
        color: "#fff",
        overflow: "hidden",
        position: "relative",
        padding: 28,
      }}
    >
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "inline-flex",
            padding: "7px 12px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.16)",
            border: "1px solid rgba(255,255,255,0.22)",
            fontSize: 12,
            fontWeight: 900,
            marginBottom: 12,
          }}
        >
          D-SEC360 Denetim Karar Destek
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: "clamp(30px, 4vw, 46px)",
            fontWeight: 950,
            letterSpacing: -1,
          }}
        >
          Denetim Analizleri
        </h2>

        <p
          style={{
            marginTop: 10,
            marginBottom: 0,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.7,
            maxWidth: 850,
            fontSize: 15,
          }}
        >
          {loadingAuditReport ? "Denetim verileri yükleniyor..." : auditTone.text}
        </p>
      </div>

      <div
        style={{
          position: "absolute",
          right: 26,
          top: 24,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.14)",
          border: "1px solid rgba(255,255,255,0.22)",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>Uyum Skoru</div>
          <div style={{ fontSize: 38, fontWeight: 950 }}>
            <CircleGauge score={auditSummary?.compliance_score || 0} />
          </div>
        </div>
      </div>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        gap: 16,
      }}
    >
      <AuditScoreCard title="Toplam Denetim" value={auditSummary?.total_audits || 0} subtitle="Seçili firma kayıtları" color={BRAND.slate} soft={BRAND.slateSoft} />
      <AuditScoreCard title="Tamamlanan" value={auditSummary?.completed_audits || 0} subtitle="Raporu kapanan denetim" color={BRAND.green} soft={BRAND.greenSoft} />
      <AuditScoreCard title="Taslak" value={auditSummary?.draft_audits || 0} subtitle="Açık / devam eden denetim" color={BRAND.amber} soft={BRAND.amberSoft} />
      <AuditScoreCard title="Toplam Madde" value={auditSummary?.total_items || 0} subtitle="Analize dahil edilen cevap" color={BRAND.blue} soft={BRAND.blueSoft} />
      <AuditScoreCard title="Uygunsuz" value={auditSummary?.uygunsuz_count || 0} subtitle="Aksiyon gerektiren bulgu" color={BRAND.red} soft={BRAND.redSoft} />
      <AuditScoreCard title="DÖF Açık" value={auditSummary?.open_dof_count || 0} subtitle="Kapanmamış aksiyon" color={BRAND.slate} soft={BRAND.slateSoft} />
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        gap: 20,
      }}
    >
      <div style={cardStyle()}>
        <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 21, fontWeight: 950 }}>
          Uyum Skoru
        </h3>

        <CircleGauge score={auditSummary?.compliance_score || 0} />

        <div style={{ marginTop: 8, color: BRAND.muted, fontSize: 13, lineHeight: 1.7 }}>
          Uyum skoru; uygun cevaplar ve kısmen uygun cevapların ağırlıklı etkisiyle hesaplanır.
        </div>
      </div>

      <div style={cardStyle()}>
        <h3 style={{ marginTop: 0, marginBottom: 18, fontSize: 21, fontWeight: 950 }}>
          Sonuç Dağılımı
        </h3>

        <DonutChart
          total={auditTotalDistribution}
          uygun={auditSummary?.uygun_count || 0}
          uygunsuz={auditSummary?.uygunsuz_count || 0}
          kismen={auditSummary?.kismen_count || 0}
          kapsamDisi={auditSummary?.kapsam_disi_count || 0}
        />
      </div>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        gap: 20,
      }}
    >
      <div style={cardStyle()}>
        <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 21, fontWeight: 950 }}>
          En Çok Uygunsuzluk
        </h3>

        {!auditReport?.top_nonconformities?.length ? (
          <div style={{ color: BRAND.muted }}>Uygunsuzluk verisi bulunamadı.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {auditReport.top_nonconformities.slice(0, 5).map((item) => (
              <MiniBar
                key={item.title}
                label={item.title}
                value={item.count}
                total={auditReport.top_nonconformities?.[0]?.count || 1}
                color={BRAND.red}
                soft={BRAND.redSoft}
              />
            ))}
          </div>
        )}
      </div>

      <div style={cardStyle()}>
        <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 21, fontWeight: 950 }}>
          Önerilen Aksiyon Yoğunluğu
        </h3>

        {!auditReport?.recommended_actions?.length ? (
          <div style={{ color: BRAND.muted }}>Aksiyon verisi bulunamadı.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {auditReport.recommended_actions.slice(0, 5).map((item) => (
              <MiniBar
                key={item.title}
                label={item.title}
                value={item.count}
                total={auditReport.recommended_actions?.[0]?.count || 1}
                color={BRAND.blue}
                soft={BRAND.blueSoft}
              />
            ))}
          </div>
        )}
      </div>
    </div>

    <div style={cardStyle()}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 21, fontWeight: 950 }}>
          Denetim Kayıtları
        </h3>

        <div style={{ color: BRAND.muted, fontSize: 13, fontWeight: 800 }}>
          Toplam {auditReport?.audits?.length || 0} kayıt
        </div>
      </div>

      {!auditReport?.audits?.length ? (
        <div style={{ color: BRAND.muted }}>Denetim kaydı bulunamadı.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr>
                {["Rapor No", "Tür", "Mod", "Lokasyon", "Sorumlu", "Denetçi", "Durum"].map((head) => (
                  <th
                    key={head}
                    style={{
                      textAlign: "left",
                      padding: 13,
                      borderBottom: `1px solid ${BRAND.border}`,
                      background: "#f9fafb",
                      fontSize: 13,
                      color: BRAND.muted,
                    }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {auditReport.audits.map((a) => (
                <tr key={String(a.id)}>
                  <td style={{ padding: 13, borderBottom: `1px solid ${BRAND.border}`, fontWeight: 900 }}>
                    {a.report_no || "-"}
                  </td>
                  <td style={{ padding: 13, borderBottom: `1px solid ${BRAND.border}` }}>
                    {a.template_type || "-"}
                  </td>
                  <td style={{ padding: 13, borderBottom: `1px solid ${BRAND.border}` }}>
                    {a.eval_mode || "-"}
                  </td>
                  <td style={{ padding: 13, borderBottom: `1px solid ${BRAND.border}` }}>
                    {a.location || "-"}
                  </td>
                  <td style={{ padding: 13, borderBottom: `1px solid ${BRAND.border}` }}>
                    {a.responsible || "-"}
                  </td>
                  <td style={{ padding: 13, borderBottom: `1px solid ${BRAND.border}` }}>
                    {a.inspector_name || "-"}
                  </td>
                  <td style={{ padding: 13, borderBottom: `1px solid ${BRAND.border}` }}>
                    <span
  style={{
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    background:
      a.status === "TAMAMLANDI"
        ? "#dcfce7"
        : a.status === "TASLAK"
        ? "#fef3c7"
        : "#f3f4f6",
    color:
      a.status === "TAMAMLANDI"
        ? "#166534"
        : a.status === "TASLAK"
        ? "#92400e"
        : "#374151",
  }}
>
  {a.status}
</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
) : null}

          </div>
        ) : null}
      </div>

      {detailModal.open ? (
        <div
          onClick={() => setDetailModal({ open: false })}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
         <div
  onClick={(e) => e.stopPropagation()}
  style={{
    width: "100%",
    maxWidth: 980,
    maxHeight: "90vh",
    overflow: "auto",
    background: "#fff",
    borderRadius: 20,
    boxShadow: "0 24px 64px rgba(15,23,42,0.20)",
    border: `1px solid ${BRAND.border}`,
  }}
>
           <div
  style={{
    padding: 20,
    borderBottom: `1px solid ${BRAND.border}`,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    flexWrap: "wrap",
  }}
>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: BRAND.text }}>
                  {detailModal.title}
                </div>
                {detailModal.subtitle ? (
                  <div style={{ marginTop: 6, color: BRAND.muted }}>{detailModal.subtitle}</div>
                ) : null}
              </div>

              <button
                onClick={() => setDetailModal({ open: false })}
                style={{
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 14px",
                  background: BRAND.red,
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Kapat
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 620,
                  }}
                >
                  <thead>
                    <tr>
                      {["Çalışan", "E-Posta", "Eğitim", "Durum"].map((head) => (
                        <th
                          key={head}
                          style={{
                            textAlign: "left",
                            padding: 12,
                            borderBottom: `1px solid ${BRAND.border}`,
                            background: "#f9fafb",
                          }}
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {detailModal.rows.map((row, index) => (
                      <tr key={`${row.employee}-${row.training}-${index}`}>
                        <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>
                          {row.employee}
                        </td>
                        <td
                          style={{
                            padding: 12,
                            borderBottom: `1px solid ${BRAND.border}`,
                            color: BRAND.muted,
                          }}
                        >
                          {row.email || "-"}
                        </td>
                        <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>
                          {row.training}
                        </td>

                       

                        <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>
                          {badge(row.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {detailModal.rows.length === 0 ? (
                <div style={{ marginTop: 16, color: BRAND.muted }}>Detay bulunamadı.</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}