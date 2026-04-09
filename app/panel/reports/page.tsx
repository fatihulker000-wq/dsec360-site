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

type ChartItem = {
  label: string;
  value: number;
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

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function MiniBarChart({
  title,
  items,
  color,
  emptyText,
}: {
  title: string;
  items: ChartItem[];
  color: string;
  emptyText?: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  return (
    <div style={cardStyle()}>
      <h3
        style={{
          marginTop: 0,
          marginBottom: 16,
          fontSize: 20,
          fontWeight: 900,
          color: BRAND.text,
        }}
      >
        {title}
      </h3>

      {items.length === 0 ? (
        <div style={{ color: BRAND.muted }}>
          {emptyText || "Veri bulunamadı."}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {items.map((item) => {
            const width = maxValue > 0 ? Math.max((item.value / maxValue) * 100, 6) : 6;

            return (
              <div key={item.label}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 6,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      color: BRAND.text,
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {item.label}
                  </div>

                  <div
                    style={{
                      minWidth: 36,
                      textAlign: "right",
                      color: color,
                      fontWeight: 900,
                      fontSize: 13,
                    }}
                  >
                    {item.value}
                  </div>
                </div>

                <div
                  style={{
                    height: 12,
                    width: "100%",
                    borderRadius: 999,
                    background: "#eef2f7",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${width}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
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
    return total ? (completed / total) * 100 : 0;
  }, [report]);

  const inProgressRate = useMemo(() => {
    const total = report?.summary?.total_assignments || 0;
    const value = report?.summary?.in_progress_count || 0;
    return total ? (value / total) * 100 : 0;
  }, [report]);

  const missingRate = useMemo(() => {
    const total = report?.summary?.total_assignments || 0;
    const value = report?.summary?.not_started_count || 0;
    return total ? (value / total) * 100 : 0;
  }, [report]);

  const executiveTone = useMemo(() => {
    const total = report?.summary?.total_assignments || 0;
    const missing =
      (report?.summary?.not_started_count || 0) +
      ((report?.summary?.total_employees || 0) *
        (report?.summary?.total_trainings || 0) -
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

  const employeeStatusSummary = useMemo(() => {
    const rows = report?.matrix || [];
    const totals = {
      completed: 0,
      inProgress: 0,
      missing: 0,
    };

    rows.forEach((row) => {
      let hasMissing = false;
      let hasProgress = false;
      let allCompleted = row.statuses.length > 0;

      row.statuses.forEach((status) => {
        if (status.status === "Başlamadı" || status.status === "Atanmadı") {
          hasMissing = true;
          allCompleted = false;
        } else if (status.status === "Devam Ediyor") {
          hasProgress = true;
          allCompleted = false;
        } else if (status.status !== "Tamamlandı") {
          allCompleted = false;
        }
      });

      if (allCompleted) {
        totals.completed += 1;
      } else if (hasProgress) {
        totals.inProgress += 1;
      } else if (hasMissing) {
        totals.missing += 1;
      }
    });

    return totals;
  }, [report]);

  const trainingStatusDistribution = useMemo<ChartItem[]>(() => {
    return [
      {
        label: "Tamamlandı",
        value: report?.summary?.completed_count || 0,
      },
      {
        label: "Devam Ediyor",
        value: report?.summary?.in_progress_count || 0,
      },
      {
        label: "Başlamadı",
        value: report?.summary?.not_started_count || 0,
      },
    ];
  }, [report]);

  const missingByTraining = useMemo<ChartItem[]>(() => {
    if (!report?.trainings || !report?.matrix) return [];

    return report.trainings
      .map((training) => {
        let missingCount = 0;

        report.matrix?.forEach((row) => {
          const found = row.statuses.find((s) => s.training_id === training.id);
          if (!found || found.status === "Başlamadı" || found.status === "Atanmadı") {
            missingCount += 1;
          }
        });

        return {
          label: training.title,
          value: missingCount,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [report]);

  const progressByTraining = useMemo<ChartItem[]>(() => {
    if (!report?.trainings || !report?.matrix) return [];

    return report.trainings
      .map((training) => {
        let completedCount = 0;

        report.matrix?.forEach((row) => {
          const found = row.statuses.find((s) => s.training_id === training.id);
          if (found?.status === "Tamamlandı") {
            completedCount += 1;
          }
        });

        return {
          label: training.title,
          value: completedCount,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [report]);

  const missingEmployeesForPdf = useMemo(() => {
    return filteredMatrix
      .map((row) => {
        const missingItems = row.statuses.filter(
          (s) => s.status === "Başlamadı" || s.status === "Atanmadı"
        );

        return {
          full_name: row.full_name,
          email: row.email,
          missing_count: missingItems.length,
        };
      })
      .filter((item) => item.missing_count > 0)
      .sort((a, b) => b.missing_count - a.missing_count)
      .slice(0, 12);
  }, [filteredMatrix]);

  const pdfMatrixRows = useMemo(() => {
    return filteredMatrix.slice(0, 20);
  }, [filteredMatrix]);

  const pdfTrainings = useMemo(() => {
    return (report?.trainings || []).slice(0, 8);
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
    link.download = "firma-egitim-raporu.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const element = document.getElementById("panel-report-pdf");
    if (!element) return;

    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      windowWidth: 1240,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;
    const imgHeight = (canvas.height * usableWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
    heightLeft -= usableHeight;

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
      heightLeft -= usableHeight;
    }

    pdf.save("firma-egitim-sorumlusu-raporu.pdf");
  };

  if (loadingScope) {
    return (
      <main style={{ padding: 24 }}>
        <div style={cardStyle()}>Yetki bilgisi yükleniyor...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <div style={{ ...cardStyle(), color: BRAND.red, fontWeight: 700 }}>
          {error}
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100%", background: BRAND.bg, padding: 24 }}>
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <button
            type="button"
            onClick={() => window.history.back()}
            style={{
              border: `1px solid ${BRAND.border}`,
              background: BRAND.white,
              color: BRAND.text,
              borderRadius: 12,
              padding: "12px 16px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: BRAND.shadow,
            }}
          >
            ← Geri
          </button>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
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
                boxShadow: BRAND.shadow,
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
                boxShadow: BRAND.shadow,
              }}
            >
              PDF İndir
            </button>
          </div>
        </div>

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

          <h1
            style={{
              marginTop: 0,
              marginBottom: 8,
              fontSize: 36,
              fontWeight: 900,
            }}
          >
            Firma Eğitim Raporu
          </h1>

          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.7,
              maxWidth: 850,
            }}
          >
            Kendi firmanızın eğitim durumunu daha görünür, daha yönetilebilir ve
            daha hızlı aksiyon alınabilir yapıda izleyin.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: 20,
            marginBottom: 20,
          }}
        >
          <div style={cardStyle()}>
            <h2
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              Firma Künyesi
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: BRAND.muted }}>Firma</div>
                <div style={{ marginTop: 4, fontWeight: 800 }}>
                  {report?.company?.name || "-"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: BRAND.muted }}>
                  Şirket Ünvanı
                </div>
                <div style={{ marginTop: 4, fontWeight: 700 }}>
                  {report?.company?.company_title || "-"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: BRAND.muted }}>Adres</div>
                <div style={{ marginTop: 4, fontWeight: 700 }}>
                  {report?.company?.address || "-"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: BRAND.muted }}>
                  İşveren Vekili
                </div>
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

            <div style={{ fontSize: 30, fontWeight: 900 }}>Yönetici Özeti</div>
            <div style={{ marginTop: 10, lineHeight: 1.8 }}>
              {executiveTone.text}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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
                  %{formatPercent(completionRate)}
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
                <div style={{ fontSize: 12, opacity: 0.9 }}>Eksik Oran</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 900 }}>
                  %{formatPercent(missingRate)}
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
            <div
              style={{
                marginTop: 8,
                fontSize: 28,
                fontWeight: 900,
                color: BRAND.green,
              }}
            >
              {report?.summary?.completed_count || 0}
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 12, color: BRAND.muted }}>Devam Ediyor</div>
            <div
              style={{
                marginTop: 8,
                fontSize: 28,
                fontWeight: 900,
                color: BRAND.blue,
              }}
            >
              {report?.summary?.in_progress_count || 0}
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 12, color: BRAND.muted }}>Başlamadı</div>
            <div
              style={{
                marginTop: 8,
                fontSize: 28,
                fontWeight: 900,
                color: BRAND.amber,
              }}
            >
              {report?.summary?.not_started_count || 0}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 20,
            marginBottom: 20,
          }}
        >
          <MiniBarChart
            title="Atama Durum Dağılımı"
            items={trainingStatusDistribution}
            color={BRAND.red}
            emptyText="Durum verisi bulunamadı."
          />

          <MiniBarChart
            title="Eksik Eğitim Yoğunluğu"
            items={missingByTraining}
            color={BRAND.amber}
            emptyText="Eksik eğitim verisi bulunamadı."
          />

          <MiniBarChart
            title="Tamamlama Gücü"
            items={progressByTraining}
            color={BRAND.green}
            emptyText="Tamamlama verisi bulunamadı."
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 20,
            marginBottom: 20,
          }}
        >
          <div style={cardStyle()}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: 14,
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              Çalışan Bazlı Görünüm
            </h3>

            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span style={{ color: BRAND.muted }}>Tüm eğitimleri tamamlayan</span>
                <strong style={{ color: BRAND.green }}>
                  {employeeStatusSummary.completed}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span style={{ color: BRAND.muted }}>En az bir eğitimde devam eden</span>
                <strong style={{ color: BRAND.blue }}>
                  {employeeStatusSummary.inProgress}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span style={{ color: BRAND.muted }}>Eksik eğitimi olan</span>
                <strong style={{ color: BRAND.amber }}>
                  {employeeStatusSummary.missing}
                </strong>
              </div>
            </div>
          </div>

          <div style={cardStyle()}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: 14,
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              Hızlı Oranlar
            </h3>

            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontWeight: 700, color: BRAND.text }}>
                    Tamamlama
                  </span>
                  <span style={{ fontWeight: 900, color: BRAND.green }}>
                    %{formatPercent(completionRate)}
                  </span>
                </div>
                <div
                  style={{
                    height: 12,
                    borderRadius: 999,
                    background: "#ecfdf5",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(completionRate, 4)}%`,
                      height: "100%",
                      background: BRAND.green,
                    }}
                  />
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontWeight: 700, color: BRAND.text }}>
                    Devam Eden
                  </span>
                  <span style={{ fontWeight: 900, color: BRAND.blue }}>
                    %{formatPercent(inProgressRate)}
                  </span>
                </div>
                <div
                  style={{
                    height: 12,
                    borderRadius: 999,
                    background: "#eff6ff",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(inProgressRate, 4)}%`,
                      height: "100%",
                      background: BRAND.blue,
                    }}
                  />
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontWeight: 700, color: BRAND.text }}>
                    Başlamadı
                  </span>
                  <span style={{ fontWeight: 900, color: BRAND.amber }}>
                    %{formatPercent(missingRate)}
                  </span>
                </div>
                <div
                  style={{
                    height: 12,
                    borderRadius: 999,
                    background: "#fff7ed",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(missingRate, 4)}%`,
                      height: "100%",
                      background: BRAND.amber,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={cardStyle()}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: 14,
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              Rapor Notu
            </h3>

            <div
              style={{
                color: BRAND.muted,
                lineHeight: 1.8,
                fontSize: 14,
              }}
            >
              Bu ekran; firma eğitim sorumlusunun hızlı aksiyon alabilmesi için
              eksik eğitim yoğunluğu, çalışan bazlı durum ve eğitim tamamlama
              seviyesini tek alanda birleştirir. PDF çıktısında artık matris
              bölümü de ayrıca rapora eklenir.
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
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 8,
                }}
              >
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
          <h2
            style={{
              marginTop: 0,
              marginBottom: 16,
              fontSize: 24,
              fontWeight: 900,
            }}
          >
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
                      <div
                        style={{
                          fontWeight: 800,
                          color: BRAND.text,
                        }}
                      >
                        {row.full_name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: BRAND.muted,
                          marginTop: 4,
                        }}
                      >
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

        <div
          id="panel-report-pdf"
          style={{
            position: "fixed",
            left: "-10000px",
            top: 0,
            width: "1120px",
            background: "#ffffff",
            padding: "28px",
            color: "#111827",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #5a0f1f 0%, #c62828 100%)",
                color: "#fff",
                padding: "24px 28px",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  opacity: 0.92,
                  marginBottom: 8,
                }}
              >
                D-SEC • Firma Eğitim Raporu
              </div>
              <div style={{ fontSize: 28, fontWeight: 900 }}>
                Kurumsal Eğitim Durum Özeti
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  lineHeight: 1.6,
                  opacity: 0.95,
                }}
              >
                Firma bazlı eğitim tamamlama, eksik eğitim yoğunluğu ve aksiyon
                özeti
              </div>
            </div>

            <div style={{ padding: "24px 28px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 18,
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Firma</div>
                  <div style={{ fontSize: 20, fontWeight: 900, marginTop: 4 }}>
                    {report?.company?.name || "-"}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 13, color: "#6b7280" }}>
                    Şirket Ünvanı: {report?.company?.company_title || "-"}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: "#6b7280" }}>
                    İşveren Vekili: {report?.company?.employer_representative || "-"}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 16,
                    background:
                      executiveTone.label === "Kırmızı Alan"
                        ? "#fef2f2"
                        : executiveTone.label === "Sarı Alan"
                        ? "#fff7ed"
                        : "#f0fdf4",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Yönetici Değerlendirmesi
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 20,
                      fontWeight: 900,
                    }}
                  >
                    {executiveTone.label}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      lineHeight: 1.7,
                      color: "#374151",
                    }}
                  >
                    {executiveTone.text}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 14,
                  marginBottom: 22,
                }}
              >
                {[
                  {
                    title: "Toplam Atama",
                    value: report?.summary?.total_assignments || 0,
                    color: "#111827",
                  },
                  {
                    title: "Tamamlandı",
                    value: report?.summary?.completed_count || 0,
                    color: "#166534",
                  },
                  {
                    title: "Devam Ediyor",
                    value: report?.summary?.in_progress_count || 0,
                    color: "#1d4ed8",
                  },
                  {
                    title: "Başlamadı",
                    value: report?.summary?.not_started_count || 0,
                    color: "#92400e",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {item.title}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 24,
                        fontWeight: 900,
                        color: item.color,
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 18,
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      marginBottom: 12,
                    }}
                  >
                    Oran Özeti
                  </div>

                  {[
                    { label: "Tamamlama", value: completionRate, color: "#166534" },
                    { label: "Devam Eden", value: inProgressRate, color: "#1d4ed8" },
                    { label: "Başlamadı", value: missingRate, color: "#92400e" },
                  ].map((item) => (
                    <div key={item.label} style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                          fontSize: 13,
                        }}
                      >
                        <span>{item.label}</span>
                        <strong>%{formatPercent(item.value)}</strong>
                      </div>

                      <div
                        style={{
                          height: 10,
                          borderRadius: 999,
                          background: "#eef2f7",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(item.value, 4)}%`,
                            height: "100%",
                            background: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      marginBottom: 12,
                    }}
                  >
                    En Fazla Eksik Eğitim Olan Başlıklar
                  </div>

                  {missingByTraining.slice(0, 5).map((item) => (
                    <div
                      key={item.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "8px 0",
                        borderBottom: "1px solid #f1f5f9",
                        fontSize: 13,
                      }}
                    >
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}

                  {missingByTraining.length === 0 ? (
                    <div style={{ color: "#6b7280", fontSize: 13 }}>
                      Veri bulunamadı.
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    marginBottom: 12,
                  }}
                >
                  Eksik Eğitim Yoğunluğu Olan Çalışanlar
                </div>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "8px 6px",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        Çalışan
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "8px 6px",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        E-Posta
                      </th>
                      <th
                        style={{
                          textAlign: "right",
                          padding: "8px 6px",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        Eksik Eğitim
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {missingEmployeesForPdf.map((item) => (
                      <tr key={`${item.email}-${item.full_name}`}>
                        <td
                          style={{
                            padding: "8px 6px",
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          {item.full_name}
                        </td>
                        <td
                          style={{
                            padding: "8px 6px",
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          {item.email}
                        </td>
                        <td
                          style={{
                            padding: "8px 6px",
                            borderBottom: "1px solid #f1f5f9",
                            textAlign: "right",
                            fontWeight: 800,
                          }}
                        >
                          {item.missing_count}
                        </td>
                      </tr>
                    ))}

                    {missingEmployeesForPdf.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          style={{
                            padding: "10px 6px",
                            color: "#6b7280",
                          }}
                        >
                          Eksik eğitim verisi bulunamadı.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    marginBottom: 12,
                  }}
                >
                  Eğitim Durum Matrisi
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 10,
                    lineHeight: 1.6,
                  }}
                >
                  PDF görünümünde okunabilirlik için ilk 20 çalışan ve ilk 8 eğitim
                  başlığı gösterilir.
                </div>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 11,
                    tableLayout: "fixed",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "8px 6px",
                          borderBottom: "1px solid #e5e7eb",
                          width: 170,
                        }}
                      >
                        Çalışan
                      </th>

                      {pdfTrainings.map((training) => (
                        <th
                          key={training.id}
                          style={{
                            textAlign: "center",
                            padding: "8px 4px",
                            borderBottom: "1px solid #e5e7eb",
                            fontWeight: 800,
                          }}
                        >
                          {training.title}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {pdfMatrixRows.map((row) => (
                      <tr key={row.user_id}>
                        <td
                          style={{
                            padding: "8px 6px",
                            borderBottom: "1px solid #f1f5f9",
                            verticalAlign: "top",
                          }}
                        >
                          <div style={{ fontWeight: 800 }}>{row.full_name}</div>
                          <div style={{ color: "#6b7280", marginTop: 2 }}>
                            {row.email}
                          </div>
                        </td>

                        {pdfTrainings.map((training) => {
                          const found = row.statuses.find(
                            (s) => s.training_id === training.id
                          );

                          const value = found?.status || "Atanmadı";

                          return (
                            <td
                              key={`${row.user_id}-${training.id}`}
                              style={{
                                padding: "8px 4px",
                                borderBottom: "1px solid #f1f5f9",
                                textAlign: "center",
                                verticalAlign: "middle",
                              }}
                            >
                              <span
                                style={{
                                  ...statusStyle(value),
                                  display: "inline-block",
                                  borderRadius: 999,
                                  padding: "4px 6px",
                                  fontSize: 10,
                                  fontWeight: 800,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {value}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {pdfMatrixRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={pdfTrainings.length + 1}
                          style={{
                            padding: "10px 6px",
                            color: "#6b7280",
                          }}
                        >
                          Matris verisi bulunamadı.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}