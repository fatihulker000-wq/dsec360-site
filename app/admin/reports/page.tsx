"use client";

import { useEffect, useMemo, useState } from "react";

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

type ReportTab = "matrix" | "employee" | "training";

const BRAND = {
  bg: "#f7f8fb",
  white: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  red: "#c62828",
  redDark: "#5a0f1f",
  green: "#166534",
  blue: "#1d4ed8",
  amber: "#92400e",
  slate: "#374151",
  shadow: "0 10px 30px rgba(15,23,42,0.06)",
};

function cardStyle(): React.CSSProperties {
  return {
    border: `1px solid ${BRAND.border}`,
    borderRadius: 18,
    background: BRAND.white,
    padding: 18,
    boxShadow: BRAND.shadow,
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
  if (filter === "missing") return status === "Başlamadı" || status === "Atanmadı";
  return true;
}

export default function AdminReportsPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");

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

      const list = Array.isArray(json?.data)
        ? json.data.map((item: { id: string; name: string }) => ({
            id: String(item.id),
            name: String(item.name || "").trim(),
          }))
        : [];

      setCompanies(list);
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
        setError(json?.error || "Rapor alınamadı.");
        setReport(null);
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
    }
  }, [selectedCompanyId]);

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
      const inProgress = row.statuses.filter((s) => s.status === "Devam Ediyor").length;
      const notStarted = row.statuses.filter((s) => s.status === "Başlamadı").length;
      const unassigned = row.statuses.filter((s) => s.status === "Atanmadı").length;

      return {
        ...row,
        completed,
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

          const status = row.statuses.find((s) => s.training_id === training.id)?.status || "Atanmadı";

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
    } else {
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
    }

    if (!rows.length) return;

    const csvContent = [headers, ...rows]
      .map((r) =>
        r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      )
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

    pdf.save(`firma-egitim-raporu-${activeTab}.pdf`);
  };

  return (
    <main style={{ minHeight: "100%", background: BRAND.bg, padding: 24 }}>
      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        <div
          style={{
            ...cardStyle(),
            background: `linear-gradient(135deg, ${BRAND.redDark} 0%, ${BRAND.red} 100%)`,
            color: "#fff",
            marginBottom: 20,
          }}
        >
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 36, fontWeight: 900 }}>
            Firma Eğitim Raporları
          </h1>
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.7,
            }}
          >
            Firma seç, filtrele, detay aç ve çalışan / eğitim bazlı interaktif rapor üret.
          </p>
        </div>

        {error ? (
          <div style={{ ...cardStyle(), marginBottom: 20, color: BRAND.red, fontWeight: 700 }}>
            {error}
          </div>
        ) : null}

        {loadingScope ? (
          <div style={cardStyle()}>Yetki bilgisi yükleniyor...</div>
        ) : null}

        {!loadingScope && scope ? (
          <div style={{ ...cardStyle(), marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              Firma Seç
            </div>

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
                <option value="">Firma seç</option>
                {companies.map((company) => (
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
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 0.7fr",
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

              <div style={cardStyle()}>
                <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24, fontWeight: 900 }}>
                  Eğitim Özeti
                </h2>

                <div style={{ display: "grid", gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, color: BRAND.muted }}>Çalışan Sayısı</div>
                    <div style={{ marginTop: 4, fontSize: 28, fontWeight: 900 }}>
                      {report.company.employee_count}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: BRAND.muted }}>Tamamlama Oranı</div>
                    <div style={{ marginTop: 4, fontSize: 28, fontWeight: 900, color: BRAND.green }}>
                      %{completionRate}
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: BRAND.muted, lineHeight: 1.7 }}>
                    Toplam Atama: {report.summary?.total_assignments || 0}
                    <br />
                    Tamamlandı: {report.summary?.completed_count || 0}
                    <br />
                    Devam Ediyor: {report.summary?.in_progress_count || 0}
                    <br />
                    Başlamadı: {report.summary?.not_started_count || 0}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
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

            <div style={{ ...cardStyle(), marginBottom: 20 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1.2fr 1fr 1fr auto auto",
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
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
                    Durum
                  </div>
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
                <button style={pillStyle(activeTab === "matrix")} onClick={() => setActiveTab("matrix")}>
                  Eğitim Matrisi
                </button>
                <button style={pillStyle(activeTab === "employee")} onClick={() => setActiveTab("employee")}>
                  Çalışan Bazlı
                </button>
                <button style={pillStyle(activeTab === "training")} onClick={() => setActiveTab("training")}>
                  Eğitim Bazlı
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
                      minWidth: 1000,
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
                              minWidth: 240,
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
                      minWidth: 900,
                    }}
                  >
                    <thead>
                      <tr>
                        {["Çalışan", "E-Posta", "Tamamlandı", "Devam Ediyor", "Başlamadı", "Atanmadı", "İşlem"].map(
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
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>
                            <div style={{ fontWeight: 800 }}>{row.full_name}</div>
                          </td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                            {row.email || "-"}
                          </td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>{row.completed}</td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>{row.inProgress}</td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>{row.notStarted}</td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>{row.unassigned}</td>
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
                      minWidth: 900,
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
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>{row.completed}</td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>{row.inProgress}</td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>{row.notStarted}</td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${BRAND.border}` }}>{row.unassigned}</td>
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
              maxHeight: "86vh",
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
                    minWidth: 700,
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
                <div style={{ marginTop: 16, color: BRAND.muted }}>
                  Detay bulunamadı.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}