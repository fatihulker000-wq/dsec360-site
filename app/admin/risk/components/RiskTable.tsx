"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  FileDown,
  Gauge,
  Loader2,
  Pencil,
  ShieldAlert,
  Target,
  Trash2,
} from "lucide-react";

export type RiskTableLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskTableMethod = "MATRIX" | "FINE_KINNEY";
export type RiskTableDofStatus = "OPEN" | "CLOSED";

export type RiskTableRecord = {
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
  method: RiskTableMethod;
  score: number;
  level: RiskTableLevel;
  department?: string | null;
  responsible?: string | null;
  dofStatus: RiskTableDofStatus;
  dofDueDate?: string | null;
  source?: "APP" | "WEB" | "MERGED";
  updatedAt: string;
};

type Props = {
  records: RiskTableRecord[];
  selectedRiskId: string;
  loading: boolean;
  deletingRisk?: boolean;
  onSelect: (id: string) => void;
  onEdit: (record: RiskTableRecord) => void;
  onDelete: (record: RiskTableRecord) => void | Promise<void>;
  onExportCsv?: () => void;
  onExportXlsx?: () => void | Promise<void>;
  exportingXlsx?: boolean;
};

const LEVEL_META: Record<
  RiskTableLevel,
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

function isOverdue(record: RiskTableRecord) {
  if (record.dofStatus === "CLOSED" || !record.dofDueDate) {
    return false;
  }

  const due = new Date(record.dofDueDate);
  if (Number.isNaN(due.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return due.getTime() < today.getTime();
}

function MethodBadge({ method }: { method: RiskTableMethod }) {
  const fineKinney = method === "FINE_KINNEY";

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
        color: fineKinney ? "#6d28d9" : "#1d4ed8",
        background: fineKinney ? "#f5f3ff" : "#eff6ff",
        border: `1px solid ${fineKinney ? "#ddd6fe" : "#bfdbfe"}`,
        whiteSpace: "nowrap",
      }}
    >
      {fineKinney ? <Gauge size={13} /> : <Target size={13} />}
      {fineKinney ? "Fine-Kinney" : "5x5 Matris"}
    </span>
  );
}

function LevelBadge({ level }: { level: RiskTableLevel }) {
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
        whiteSpace: "nowrap",
      }}
    >
      <CircleDot size={12} />
      {meta.label}
    </span>
  );
}

export default function RiskTable({
  records,
  selectedRiskId,
  loading,
  deletingRisk = false,
  onSelect,
  onEdit,
  onDelete,
  onExportCsv,
  onExportXlsx,
  exportingXlsx = false,
}: Props) {
  return (
    <section
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
            {records.length} kayıt görüntüleniyor
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onExportCsv}
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
            CSV
          </button>

          <button
            type="button"
            onClick={() => void onExportXlsx?.()}
            disabled={exportingXlsx}
            style={{
              height: 40,
              borderRadius: 12,
              border: "1px solid #bbf7d0",
              padding: "0 12px",
              background: "#ecfdf5",
              color: "#047857",
              fontWeight: 850,
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              cursor: exportingXlsx ? "wait" : "pointer",
              opacity: exportingXlsx ? 0.7 : 1,
            }}
          >
            {exportingXlsx ? (
              <Loader2 size={16} className="riskTableSpin" />
            ) : (
              <FileDown size={16} />
            )}
            {exportingXlsx ? "Hazırlanıyor" : "Excel"}
          </button>
        </div>
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
            <Loader2 size={28} className="riskTableSpin" />
            <div style={{ marginTop: 10, fontWeight: 800 }}>
              Risk verileri yükleniyor...
            </div>
          </div>
        </div>
      ) : records.length === 0 ? (
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
              minWidth: 1040,
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
                  "İşlemler",
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
              {records.map((record) => {
                const active = selectedRiskId === record.id;
                const overdue = isOverdue(record);

                return (
                  <tr
                    key={record.id}
                    onClick={() => onSelect(record.id)}
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
                      <LevelBadge level={record.level} />
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
                          whiteSpace: "nowrap",
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <button
                          type="button"
                          title="Düzenle"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit(record);
                          }}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 11,
                            border: "1px solid #dbe3ec",
                            background: "#ffffff",
                            color: "#475569",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          title="Sil"
                          disabled={deletingRisk}
                          onClick={(event) => {
                            event.stopPropagation();
                            void onDelete(record);
                          }}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 11,
                            border: "1px solid #fecaca",
                            background: "#fef2f2",
                            color: "#b91c1c",
                            display: "grid",
                            placeItems: "center",
                            cursor: deletingRisk ? "wait" : "pointer",
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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

      <style jsx>{`
        .riskTableSpin {
          animation: risk-table-spin 0.9s linear infinite;
        }

        @keyframes risk-table-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </section>
  );
}