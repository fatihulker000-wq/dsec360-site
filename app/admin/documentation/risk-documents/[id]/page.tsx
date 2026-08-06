"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  MapPin,
  Printer,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type RiskItem = {
  id?: string;
  localId?: number;
  activity?: string;
  title?: string;
  hazard?: string;
  consequence?: string;
  existingControl?: string;
  currentControl?: string;
  proposedControl?: string;
  recommendedAction?: string;
  responsible?: string;
  dofResponsible?: string;
  level?: string;
  riskLevel?: string;
  score?: number;
  probability?: number;
  frequency?: number;
  severity?: number;
  completed?: boolean;
  dofStatus?: string;
  dofAction?: string;
};

type RiskArchiveRecord = {
  id: string;
  firm_id: string;
  assessment_remote_id: string;
  document_title: string;
  risk_method: string;
  assessment_date: string | null;
  prepared_by: string | null;
  location: string | null;
  department: string | null;
  revision_no: number;
  total_item_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  open_dof_count: number;
  compliance_rate: number | null;
  result_json: Record<string, unknown> | null;
  items_json: RiskItem[] | null;
  generated_pdf_url: string | null;
  signed_pdf_url: string | null;
  report_status: string | null;
};

type ApiResponse = {
  success?: boolean;
  record?: RiskArchiveRecord | null;
  records?: RiskArchiveRecord[];
  error?: string;
  detail?: string;
};

const clean = (value: unknown) => String(value ?? "").trim();

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function methodLabel(value: string): string {
  return value === "FINE_KINNEY" ? "Fine-Kinney" : "5×5 Matris";
}

function levelLabel(value: unknown): string {
  const key = clean(value).toUpperCase();
  const labels: Record<string, string> = {
    LOW: "Düşük",
    DUSUK: "Düşük",
    MEDIUM: "Orta",
    ORTA: "Orta",
    HIGH: "Yüksek",
    YUKSEK: "Yüksek",
    VERY_HIGH: "Çok Yüksek",
    COK_YUKSEK: "Çok Yüksek",
    INTOLERABLE: "Kabul Edilemez",
    TOLERE_EDILEMEZ: "Kabul Edilemez",
    KABUL_EDILEMEZ: "Kabul Edilemez",
    ONEMLI: "Önemli",
    OLASI: "Olası",
    KABUL_EDILEBILIR: "Kabul Edilebilir",
  };

  return labels[key] || key || "-";
}

export default function RiskDocumentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = clean(params?.id);

  const [record, setRecord] = useState<RiskArchiveRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Risk dokümanı kimliği bulunamadı.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/mobile/risk-documents/sync?id=${encodeURIComponent(id)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "x-api-key": "dsec_mobile_123",
            },
            cache: "no-store",
          }
        );

        const json = (await response
          .json()
          .catch(() => ({}))) as ApiResponse;

        if (!response.ok || !json.success) {
          throw new Error(
            json.detail || json.error || "Risk dokümanı alınamadı."
          );
        }

        const found = json.record || json.records?.[0] || null;

        if (!found) {
          throw new Error("Risk dokümanı bulunamadı.");
        }

        setRecord(found);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Risk dokümanı alınamadı."
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const items = useMemo(
    () => (Array.isArray(record?.items_json) ? record.items_json : []),
    [record]
  );

  const companyName = useMemo(() => {
    const fromResult =
      clean(record?.result_json?.companyName) ||
      clean(record?.result_json?.firmName);

    if (fromResult) return fromResult;

    const title = clean(record?.document_title);
    return title.includes(" • ") ? title.split(" • ")[0] : "Firma";
  }, [record]);

  const handlePrint = () => {
    window.setTimeout(() => {
      window.print();
    }, 200);
  };

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <Loader2 size={34} className="spin" />
        <strong>Risk dokümanı hazırlanıyor...</strong>
        <style jsx>{`
          .spin {
            animation: spin 0.9s linear infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  if (error || !record) {
    return (
      <main style={styles.page}>
        <section style={styles.errorCard}>
          <AlertTriangle size={42} color="#b91c1c" />
          <h1>Risk dokümanı açılamadı</h1>
          <p>{error}</p>
          <button
            type="button"
            onClick={() =>
              router.push("/admin/documentation/risk-documents")
            }
            style={styles.primaryButton}
          >
            Risk Dokümanlarına Dön
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div className="noPrint" style={styles.toolbar}>
          <button
            type="button"
            onClick={() =>
              router.push("/admin/documentation/risk-documents")
            }
            style={styles.secondaryButton}
          >
            <ArrowLeft size={17} />
            Risk Dokümanları
          </button>

          <div style={styles.buttonRow}>
            {record.generated_pdf_url ? (
              <a
                href={record.generated_pdf_url}
                target="_blank"
                rel="noreferrer"
                style={styles.downloadLink}
              >
                <Download size={17} />
                PDF İndir
              </a>
            ) : null}

            <button
              type="button"
              onClick={handlePrint}
              style={styles.primaryButton}
            >
              <Printer size={17} />
              PDF Raporu Oluştur
            </button>
          </div>
        </div>

        <div id="risk-print-root">
          <section style={styles.hero}>
          <div>
            <div style={styles.heroBadge}>
              <ShieldAlert size={16} />
              D-SEC Risk Dokümanı
            </div>

            <h1 style={styles.heroTitle}>{record.document_title}</h1>
            <p style={styles.heroSubtitle}>{companyName}</p>
          </div>

          <div style={styles.chips}>
            <span style={styles.chip}>{methodLabel(record.risk_method)}</span>
            <span style={styles.chip}>Rev. {record.revision_no}</span>
            <span style={styles.chip}>
              {record.report_status || "COMPLETED"}
            </span>
          </div>
        </section>

        <section className="kpiGrid" style={styles.kpiGrid}>
          {[
            ["Toplam Madde", record.total_item_count, "#eff6ff", "#1d4ed8"],
            ["Kritik", record.critical_count, "#fef2f2", "#b91c1c"],
            ["Yüksek Risk", record.high_count, "#fff7ed", "#c2410c"],
            ["Açık DÖF", record.open_dof_count, "#fffbeb", "#92400e"],
            [
              "PDF Durumu",
              record.generated_pdf_url
                ? "PDF Hazır"
                : "PDF Oluşturulmadı",
              "#f8fafc",
              "#475569",
            ],
          ].map(([label, value, background, color]) => (
            <div
              key={String(label)}
              style={{
                ...styles.kpiCard,
                background: String(background),
                color: String(color),
              }}
            >
              <div style={styles.kpiLabel}>{label}</div>
              <div style={styles.kpiValue}>{value}</div>
            </div>
          ))}
        </section>

        <section className="infoGrid" style={styles.infoGrid}>
          {[
            [
              "Değerlendirme Tarihi",
              formatDate(record.assessment_date),
              <CalendarDays size={18} />,
            ],
            ["Hazırlayan", clean(record.prepared_by) || "-", <UserRound size={18} />],
            ["Lokasyon", clean(record.location) || "-", <MapPin size={18} />],
            [
              "Departman",
              clean(record.department) || "-",
              <ClipboardList size={18} />,
            ],
          ].map(([label, value, icon]) => (
            <div key={String(label)} style={styles.infoCard}>
              <div style={styles.infoLabel}>
                {icon}
                {label}
              </div>
              <div style={styles.infoValue}>{value}</div>
            </div>
          ))}
        </section>

        <section style={styles.tableCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Risk Maddeleri</h2>
              <p style={styles.sectionText}>
                Arşivlenen risk değerlendirmesinin madde bazlı tam dökümü.
              </p>
            </div>

            <span style={styles.countBadge}>{items.length} kayıt</span>
          </div>

          {items.length === 0 ? (
            <div style={styles.emptyState}>Risk maddesi bulunamadı.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {[
                      "No",
                      "Faaliyet / Başlık",
                      "Tehlike",
                      "Sonuç",
                      "Mevcut Kontrol",
                      "Önerilen Önlem",
                      "O",
                      "F",
                      "Ş",
                      "Skor",
                      "Seviye",
                      "DÖF",
                      "Sorumlu",
                    ].map((title) => (
                      <th key={title} style={styles.th}>
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => {
                    const dofStatus =
                      clean(item.dofStatus) ||
                      (item.completed ? "CLOSED" : "OPEN");

                    return (
                      <tr
                        key={item.id || item.localId || index}
                        style={styles.tr}
                      >
                        <td style={styles.td}>{index + 1}</td>
                        <td style={styles.tdStrong}>
                          {clean(item.activity || item.title) || "-"}
                        </td>
                        <td style={styles.td}>{clean(item.hazard) || "-"}</td>
                        <td style={styles.td}>
                          {clean(item.consequence) || "-"}
                        </td>
                        <td style={styles.td}>
                          {clean(
                            item.existingControl || item.currentControl
                          ) || "-"}
                        </td>
                        <td style={styles.td}>
                          {clean(
                            item.proposedControl ||
                              item.recommendedAction ||
                              item.dofAction
                          ) || "-"}
                        </td>
                        <td style={styles.td}>{item.probability ?? "-"}</td>
                        <td style={styles.td}>{item.frequency ?? "-"}</td>
                        <td style={styles.td}>{item.severity ?? "-"}</td>
                        <td style={styles.tdStrong}>{item.score ?? "-"}</td>
                        <td style={styles.td}>
                          {levelLabel(item.level || item.riskLevel)}
                        </td>
                        <td
                          style={{
                            ...styles.tdStrong,
                            color:
                              dofStatus === "CLOSED" ? "#047857" : "#b45309",
                          }}
                        >
                          {dofStatus === "CLOSED" ? "Kapalı" : "Açık"}
                        </td>
                        <td style={styles.td}>
                          {clean(item.dofResponsible || item.responsible) ||
                            "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={styles.statusCard}>
          <h2 style={styles.sectionTitle}>Belge ve Revizyon Durumu</h2>

          <div className="statusGrid" style={styles.statusGrid}>
            {[
              [
                "PDF Dokümanı",
                record.generated_pdf_url
                  ? "PDF Hazır"
                  : "PDF Henüz Oluşturulmadı",
              ],
              [
                "İmzalı Doküman",
                record.signed_pdf_url ? "Hazır" : "İmza bekliyor",
              ],
              ["Revizyon", `Rev. ${record.revision_no}`],
            ].map(([label, value]) => (
              <div key={label} style={styles.statusItem}>
                <div style={styles.statusLabel}>{label}</div>
                <div style={styles.statusValue}>{value}</div>
              </div>
            ))}
          </div>
        </section>
        </div>
      </div>

      <style jsx global>{`
        #risk-print-root {
          width: 100%;
          min-width: 0;
          display: grid;
          gap: 14px;
          box-sizing: border-box;
        }

        #risk-print-root > * {
          min-width: 0;
          max-width: 100%;
        }

        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }

          html,
          body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
          }

          body * {
            visibility: hidden !important;
          }

          #risk-print-root,
          #risk-print-root * {
            visibility: visible !important;
          }

          #risk-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
          }

          .noPrint,
          aside,
          nav,
          header {
            display: none !important;
          }

          #risk-print-root section {
            display: block !important;
            position: static !important;
            overflow: visible !important;
            box-shadow: none !important;
          }

          #risk-print-root table {
            display: table !important;
            width: 100% !important;
            min-width: 0 !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            font-size: 8px !important;
          }

          #risk-print-root thead {
            display: table-header-group !important;
          }

          #risk-print-root tbody {
            display: table-row-group !important;
          }

          #risk-print-root tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          #risk-print-root th,
          #risk-print-root td {
            padding: 4px !important;
            white-space: normal !important;
            overflow-wrap: anywhere !important;
            border: 1px solid #d1d5db !important;
          }

          #risk-print-root h1 {
            font-size: 24px !important;
          }

          #risk-print-root h2 {
            font-size: 17px !important;
          }
        }

        @media (max-width: 1100px) {
          .kpiGrid,
          .infoGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 700px) {
          main {
            padding: 12px !important;
          }

          .kpiGrid,
          .infoGrid,
          .statusGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
 page: {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%)",
  padding: 18,
  boxSizing: "border-box",
},
  loadingPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f8fafc",
    color: "#64748b",
    gap: 12,
  },
 container: {
  width: "100%",
  maxWidth: 1280,
  margin: "0 auto",
  display: "grid",
  gap: 18,
  boxSizing: "border-box",
},
  toolbar: {
    width: "100%",
    minWidth: 0,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    boxSizing: "border-box",
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  primaryButton: {
    minHeight: 42,
    borderRadius: 12,
    border: 0,
    background: "#6b1020",
    color: "#fff",
    padding: "0 15px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 12,
    border: "1px solid #dbe3ec",
    background: "#fff",
    color: "#475569",
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 850,
    cursor: "pointer",
  },
  downloadLink: {
    minHeight: 42,
    borderRadius: 12,
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
    color: "#047857",
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 900,
    textDecoration: "none",
  },
  hero: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "hidden",
    borderRadius: 20,
    background:
      "linear-gradient(135deg,#4c0d1a 0%,#9f1239 52%,#ea580c 100%)",
    color: "#fff",
    padding: 18,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 18,
    boxShadow: "0 24px 60px rgba(76,13,26,.22)",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,.14)",
    padding: "7px 11px",
    fontSize: 12,
    fontWeight: 900,
  },
  heroTitle: {
    margin: "12px 0 8px",
    maxWidth: "100%",
    fontSize: "clamp(21px, 2.4vw, 30px)",
    lineHeight: 1.12,
    fontWeight: 950,
    overflowWrap: "anywhere",
  },
  heroSubtitle: {
    margin: 0,
    color: "rgba(255,255,255,.82)",
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    background: "rgba(255,255,255,.14)",
    padding: "8px 12px",
    fontWeight: 900,
    fontSize: 12,
  },
  kpiGrid: {
    width: "100%",
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))",
    gap: 8,
  },
  kpiCard: {
    minWidth: 0,
    borderRadius: 14,
    padding: 12,
    overflow: "hidden",
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: 900,
  },
  kpiValue: {
    marginTop: 7,
    fontSize: 22,
    lineHeight: 1.15,
    overflowWrap: "anywhere",
    fontWeight: 950,
    color: "#0f172a",
  },
  infoGrid: {
    width: "100%",
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: 8,
  },
  infoCard: {
    minWidth: 0,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
    padding: 16,
  },
  infoLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#64748b",
    fontSize: 11,
    fontWeight: 900,
  },
  infoValue: {
    marginTop: 9,
    color: "#0f172a",
    fontSize: 15,
    fontWeight: 900,
  },
  tableCard: {
    width: "100%",
    minWidth: 0,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#fff",
    overflow: "hidden",
  },
  sectionHeader: {
    padding: 18,
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: 22,
    fontWeight: 950,
  },
  sectionText: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: 13,
  },
  countBadge: {
    borderRadius: 999,
    background: "#f1f5f9",
    color: "#475569",
    padding: "7px 11px",
    fontSize: 12,
    fontWeight: 900,
  },
  emptyState: {
    minHeight: 240,
    display: "grid",
    placeItems: "center",
    color: "#94a3b8",
  },
  table: {
    width: "100%",
    minWidth: 1280,
    borderCollapse: "collapse",
  },
  th: {
    padding: "12px 13px",
    textAlign: "left",
    color: "#64748b",
    fontSize: 11,
    fontWeight: 900,
    borderBottom: "1px solid #e5e7eb",
  },
  tr: {
    borderBottom: "1px solid #eef2f7",
  },
  td: {
    padding: 13,
  },
  tdStrong: {
    padding: 13,
    fontWeight: 900,
  },
  statusCard: {
    width: "100%",
    minWidth: 0,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#fff",
    padding: 18,
  },
  statusGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(3,minmax(0,1fr))",
    gap: 12,
  },
  statusItem: {
    borderRadius: 15,
    background: "#f8fafc",
    padding: 14,
  },
  statusLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: 900,
  },
  statusValue: {
    marginTop: 5,
    color: "#0f172a",
    fontSize: 14,
    fontWeight: 900,
  },
  errorCard: {
    maxWidth: 900,
    margin: "80px auto",
    borderRadius: 22,
    border: "1px solid #fecaca",
    background: "#fff",
    padding: 28,
    textAlign: "center",
  },
};