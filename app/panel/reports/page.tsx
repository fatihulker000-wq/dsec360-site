"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function PanelReportsPage() {
  const [scope, setScope] = useState<ScopeResponse | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loadingScope, setLoadingScope] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);

  const loadScope = async () => {
    try {
      setLoadingScope(true);
      setError("");

      const res = await fetch("/api/admin/reports/scope", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const json: ScopeResponse = await res.json();

      if (!res.ok) {
        setError(json?.error || "Yetki bilgisi alınamadı.");
        setScope(null);
        return;
      }

      setScope(json);
    } catch (err) {
      console.error(err);
      setError("Yetki bilgisi alınamadı.");
      setScope(null);
    } finally {
      setLoadingScope(false);
    }
  };

  const loadReport = async (companyId: string) => {
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
        window.location.href = "/login";
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
    if (scope?.allowed_company_id) {
      void loadReport(String(scope.allowed_company_id));
    }
  }, [scope]);

  const filteredMatrix = useMemo(() => {
    const rows = report?.matrix || [];
    const q = employeeSearch.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        row.full_name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q);

      const hasMissing = row.statuses.some(
        (s) => s.status === "Başlamadı" || s.status === "Atanmadı"
      );

      return matchesSearch && (showOnlyMissing ? hasMissing : true);
    });
  }, [report, employeeSearch, showOnlyMissing]);

  const completionRate = useMemo(() => {
    const total = report?.summary?.total_assignments || 0;
    const completed = report?.summary?.completed_count || 0;
    return total ? Math.round((completed / total) * 100) : 0;
  }, [report]);

  const executiveTone = useMemo(() => {
    const total = report?.summary?.total_assignments || 0;
    const missing =
      (report?.summary?.not_started_count || 0) +
      ((report?.summary?.total_employees || 0) * (report?.summary?.total_trainings || 0) -
        (report?.summary?.total_assignments || 0));

    const rate = total > 0 ? Math.round((missing / total) * 100) : 0;

    if (rate >= 45) {
      return {
        label: "Kırmızı Alan",
        bg: "linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%)",
        text: "Eksik eğitim yoğunluğu yüksek. Hızlı aksiyon önerilir.",
      };
    }

    if (rate >= 20) {
      return {
        label: "Sarı Alan",
        bg: "linear-gradient(135deg,#92400e 0%,#f59e0b 100%)",
        text: "Orta düzey eksik eğitim var. Takip sıklaştırılmalı.",
      };
    }

    return {
      label: "Yeşil Alan",
      bg: "linear-gradient(135deg,#166534 0%,#22c55e 100%)",
      text: "Eğitim görünümü kontrollü seviyede ilerliyor.",
    };
  }, [report]);

  const exportExcel = () => {
    if (!report?.trainings || !filteredMatrix.length) return;

    const headers = ["Çalışan", "E-Posta", ...report.trainings.map((t) => t.title)];

    const rows = filteredMatrix.map((row) => {
      const statusMap = new Map(row.statuses.map((s) => [s.training_id, s.status]));
      return [
        row.full_name,
        row.email,
        ...report.trainings!.map((t) => statusMap.get(t.id) || "Atanmadı"),
      ];
    });

    const csvContent = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "firma-egitim-raporu.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const element = document.getElementById("panel-report-export");
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

    pdf.save("firma-egitim-sorumlusu-raporu.pdf");
  };

  if (loadingScope) {
    return <main style={{ padding: 24 }}><div style={cardStyle()}>Yetki bilgisi yükleniyor...</div></main>;
  }

  if (error) {
    return <main style={{ padding: 24 }}><div style={{ ...cardStyle(), color: BRAND.red, fontWeight: 700 }}>{error}</div></main>;
  }

  return (
    <main style={{ minHeight: "100%", background: BRAND.bg, padding: 24 }}>
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
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
            Firma Eğitim Sorumlusu Görünümü
          </div>

          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 36, fontWeight: 900 }}>
            Firma Eğitim Raporu
          </h1>

          <p style={{ margin: 0, color: "rgba(255,255,255,0.92)", lineHeight: 1.7 }}>
            Kendi firmanızın eğitim durumunu sade ve yönetilebilir görünümde izleyin.
          </p>
        </div>

        <div id="panel-report-export">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
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
                  <div style={{ fontSize: 12, color: BRAND.muted }}>Firma</div>
                  <div style={{ marginTop: 4, fontWeight: 800 }}>{report?.company?.name || "-"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: BRAND.muted }}>Şirket Ünvanı</div>
                  <div style={{ marginTop: 4, fontWeight: 700 }}>
                    {report?.company?.company_title || "-"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: BRAND.muted }}>Adres</div>
                  <div style={{ marginTop: 4, fontWeight: 700 }}>{report?.company?.address || "-"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: BRAND.muted }}>İşveren Vekili</div>
                  <div style={{ marginTop: 4, fontWeight: 700 }}>
                    {report?.company?.employer_representative || "-"}
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
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  fontSize: 12,
                  fontWeight: 900,
                  marginBottom: 12,
                }}
              >
                {executiveTone.label}
              </div>

              <div style={{ fontSize: 28, fontWeight: 900 }}>Yönetici Özeti</div>
              <div style={{ marginTop: 10, lineHeight: 1.8 }}>{executiveTone.text}</div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginTop: 16,
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
                  <div style={{ fontSize: 12, opacity: 0.9 }}>Çalışan</div>
                  <div style={{ marginTop: 6, fontSize: 24, fontWeight: 900 }}>
                    {report?.company?.employee_count || 0}
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
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div style={cardStyle()}>
              <div style={{ fontSize: 12, color: BRAND.muted }}>Toplam Atama</div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>
                {report?.summary?.total_assignments || 0}
              </div>
            </div>

            <div style={cardStyle()}>
              <div style={{ fontSize: 12, color: BRAND.muted }}>Tamamlandı</div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900, color: BRAND.green }}>
                {report?.summary?.completed_count || 0}
              </div>
            </div>

            <div style={cardStyle()}>
              <div style={{ fontSize: 12, color: BRAND.muted }}>Devam Ediyor</div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900, color: BRAND.blue }}>
                {report?.summary?.in_progress_count || 0}
              </div>
            </div>

            <div style={cardStyle()}>
              <div style={{ fontSize: 12, color: BRAND.muted }}>Başlamadı</div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900, color: BRAND.amber }}>
                {report?.summary?.not_started_count || 0}
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle(), marginBottom: 20 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr auto auto auto",
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

              <label
                style={{
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: BRAND.text,
                  paddingBottom: 12,
                }}
              >
                <input
                  type="checkbox"
                  checked={showOnlyMissing}
                  onChange={(e) => setShowOnlyMissing(e.target.checked)}
                />
                Sadece eksik eğitimler
              </label>

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
          </div>

          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24, fontWeight: 900 }}>
              Eğitim Durum Matrisi
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

                    {(report?.trainings || []).map((training) => (
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
                        {training.title}
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
                          minWidth: 220,
                        }}
                      >
                        <div style={{ fontWeight: 800, color: BRAND.text }}>{row.full_name}</div>
                        <div style={{ fontSize: 12, color: BRAND.muted, marginTop: 4 }}>
                          {row.email || "-"}
                        </div>
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
                          {badge(cell.status)}
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
        </div>
      </div>
    </main>
  );
}