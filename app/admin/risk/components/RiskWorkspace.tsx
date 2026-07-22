"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import type { RiskLevel, RiskMethod, RiskRecord } from "../types";
import RiskDialog, { type RiskFormState } from "./RiskDialog";
import RiskDetailDrawer from "./RiskDetailDrawer";
import RiskReportCenter from "./RiskReportCenter";
import {
  createRisk,
  deleteRisk,
  updateRisk,
} from "../services";
import {
  formatDate,
  riskBackground,
  riskColor,
  riskLabel,
} from "../helpers";

type ViewMode = "TABLE" | "CARDS";

type Props = {
  records: RiskRecord[];
  loading?: boolean;
  firmId?: string;
  onReload: () => void | Promise<void>;
};


const EMPTY_FORM: RiskFormState = {
  firmId: "",
  company: "",
  department: "",
  process: "",
  activity: "",
  hazard: "",
  consequence: "",
  existingControl: "",
  proposedControl: "",
  responsible: "",
  dueDateMillis: null,
  completed: false,
  probability: 1,
  frequency: 1,
  severity: 1,
  score: 1,
  method: "FINE_KINNEY",
  level: "LOW",
  photoUrl: null,
  attachmentUrl: null,
};


function calculateLevel(score: number): RiskLevel {
  if (score < 20) return "LOW";
  if (score < 70) return "MEDIUM";
  if (score < 200) return "HIGH";
  if (score < 400) return "VERY_HIGH";
  return "INTOLERABLE";
}

function exportCsv(records: RiskRecord[]) {
  const header = [
    "Firma",
    "Departman",
    "Süreç",
    "Faaliyet",
    "Tehlike",
    "Sonuç",
    "Mevcut Kontrol",
    "Önerilen Kontrol",
    "Sorumlu",
    "Yöntem",
    "Olasılık",
    "Frekans",
    "Şiddet",
    "Skor",
    "Seviye",
    "DÖF",
    "Termin",
  ];

  const escapeValue = (value: unknown) => {
    const text = String(value ?? "");

    return `"${text.replace(/"/g, '""')}"`;
  };

  const rows = records.map((record) => [
    record.company,
    record.department,
    record.process,
    record.activity,
    record.hazard,
    record.consequence,
    record.existingControl,
    record.proposedControl,
    record.responsible,
    record.method,
    record.probability,
    record.frequency,
    record.severity,
    record.score,
    riskLabel(record.level),
    record.completed ? "Kapalı" : "Açık",
    formatDate(record.dueDateMillis),
  ]);

  const csv = [
    header.map(escapeValue).join(";"),
    ...rows.map((row) =>
      row.map(escapeValue).join(";")
    ),
  ].join("\n");

  const blob = new Blob(["\ufeff", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `DSEC_Risk_Listesi_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function RiskWorkspace({
  records,
  loading = false,
  firmId = "",
  onReload,
}: Props) {
  const [viewMode, setViewMode] =
    useState<ViewMode>("TABLE");

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] =
    useState<"ALL" | RiskLevel>("ALL");

  const [methodFilter, setMethodFilter] =
    useState<"ALL" | RiskMethod>("ALL");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "OPEN" | "CLOSED">("ALL");

  const [selectedRisk, setSelectedRisk] =
    useState<RiskRecord | null>(null);

  const [form, setForm] =
    useState<RiskFormState>(EMPTY_FORM);

  const [showDialog, setShowDialog] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState("");

  const [error, setError] = useState("");
  const [showReports, setShowReports] =
    useState(false);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("tr-TR");

    return records.filter((record) => {
      const searchable = [
        record.company,
        record.department,
        record.process,
        record.activity,
        record.hazard,
        record.consequence,
        record.responsible,
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      const searchMatch =
        !normalizedSearch ||
        searchable.includes(normalizedSearch);

      const levelMatch =
        levelFilter === "ALL" ||
        record.level === levelFilter;

      const methodMatch =
        methodFilter === "ALL" ||
        record.method === methodFilter;

      const statusMatch =
        statusFilter === "ALL" ||
        (statusFilter === "OPEN"
          ? !record.completed
          : record.completed);

      return (
        searchMatch &&
        levelMatch &&
        methodMatch &&
        statusMatch
      );
    });
  }, [
    records,
    search,
    levelFilter,
    methodFilter,
    statusFilter,
  ]);

  const totals = useMemo(() => {
    return {
      total: filteredRecords.length,
      critical: filteredRecords.filter(
        (record) =>
          record.level === "VERY_HIGH" ||
          record.level === "INTOLERABLE"
      ).length,
      open: filteredRecords.filter(
        (record) => !record.completed
      ).length,
      closed: filteredRecords.filter(
        (record) => record.completed
      ).length,
    };
  }, [filteredRecords]);

  const openNewRisk = () => {
    setForm({
      ...EMPTY_FORM,
      firmId,
      createdAtMillis: undefined as never,
    } as RiskFormState);

    setError("");
    setShowDialog(true);
  };

  const openEditRisk = (record: RiskRecord) => {
    setForm({
      id: record.id,
      firmId: record.firmId,
      company: record.company,
      department: record.department,
      process: record.process,
      activity: record.activity,
      hazard: record.hazard,
      consequence: record.consequence,
      existingControl: record.existingControl,
      proposedControl: record.proposedControl,
      responsible: record.responsible,
      dueDateMillis: record.dueDateMillis,
      completed: record.completed,
      probability: record.probability,
      frequency: record.frequency,
      severity: record.severity,
      score: record.score,
      method: record.method,
      level: record.level,
      photoUrl: record.photoUrl,
      attachmentUrl: record.attachmentUrl,
    });

    setError("");
    setShowDialog(true);
  };


  const handleSave = async (
    submittedForm: RiskFormState
  ) => {
    if (!submittedForm.hazard.trim()) {
      setError("Tehlike alanı zorunludur.");
      return;
    }

    if (!submittedForm.activity.trim()) {
      setError("Faaliyet alanı zorunludur.");
      return;
    }

    if (!submittedForm.firmId) {
      setError("Firma bilgisi bulunamadı.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: Partial<RiskRecord> = {
        ...submittedForm,
        createdAtMillis: Date.now(),
        updatedAtMillis: Date.now(),
      };

      if (submittedForm.id) {
        await updateRisk(payload);
      } else {
        await createRisk(payload);
      }

      setShowDialog(false);
      setForm(EMPTY_FORM);

      await onReload();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Risk kaydı kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    record: RiskRecord
  ) => {
    const accepted = window.confirm(
      `"${record.activity || record.hazard}" kaydı silinsin mi?`
    );

    if (!accepted) return;

    try {
      setDeletingId(record.id);
      setError("");

      await deleteRisk(
        record.id,
        record.method
      );

      if (selectedRisk?.id === record.id) {
        setSelectedRisk(null);
      }

      await onReload();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Risk kaydı silinemedi."
      );
    } finally {
      setDeletingId("");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setLevelFilter("ALL");
    setMethodFilter("ALL");
    setStatusFilter("ALL");
  };

  return (
    <section
      style={{
        display: "grid",
        gap: 16,
      }}
    >
      <div
        style={{
          borderRadius: 22,
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          padding: 16,
          boxShadow:
            "0 14px 35px rgba(15,23,42,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 22,
                fontWeight: 950,
              }}
            >
              Risk Çalışma Alanı
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Risk kayıtlarını görüntüleyin,
              filtreleyin ve yönetin.
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
              onClick={() => void onReload()}
              disabled={loading}
              style={{
                minHeight: 42,
                borderRadius: 12,
                border: "1px solid #dbe3ec",
                background: "#ffffff",
                color: "#475569",
                padding: "0 13px",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontWeight: 850,
                cursor: loading
                  ? "wait"
                  : "pointer",
              }}
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="riskWorkspaceSpin"
                />
              ) : (
                <RefreshCw size={16} />
              )}
              Yenile
            </button>

            <button
              type="button"
              onClick={() =>
                setShowReports(true)
              }
              style={{
                minHeight: 42,
                borderRadius: 12,
                border: "1px solid #bbf7d0",
                background: "#ecfdf5",
                color: "#047857",
                padding: "0 13px",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              <Download size={16} />
              Raporlar
            </button>

            <button
              type="button"
              onClick={openNewRisk}
              style={{
                minHeight: 42,
                borderRadius: 12,
                border: 0,
                background: "#6b1020",
                color: "#ffffff",
                padding: "0 15px",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              <Plus size={16} />
              Yeni Risk
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 10,
          }}
        >
          {[
            [
              "Toplam",
              totals.total,
              <BarChart3 size={17} />,
              "#eff6ff",
              "#1d4ed8",
            ],
            [
              "Kritik",
              totals.critical,
              <ShieldAlert size={17} />,
              "#fef2f2",
              "#b91c1c",
            ],
            [
              "Açık DÖF",
              totals.open,
              <AlertTriangle size={17} />,
              "#fffbeb",
              "#92400e",
            ],
            [
              "Kapalı DÖF",
              totals.closed,
              <CheckCircle2 size={17} />,
              "#ecfdf5",
              "#047857",
            ],
          ].map(
            ([
              label,
              value,
              icon,
              background,
              color,
            ]) => (
              <div
                key={String(label)}
                style={{
                  borderRadius: 15,
                  padding: 13,
                  background:
                    String(background),
                  color: String(color),
                  border: `1px solid ${String(
                    color
                  )}22`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 11,
                    fontWeight: 850,
                  }}
                >
                  {icon}
                  {label}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 23,
                    fontWeight: 950,
                  }}
                >
                  {value}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {error ? (
        <div
          style={{
            borderRadius: 14,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
            padding: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 800,
          }}
        >
          <AlertTriangle size={17} />
          {error}
        </div>
      ) : null}

      <div
        style={{
          borderRadius: 18,
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          padding: 14,
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 9,
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1 1 280px",
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Firma, faaliyet, tehlike veya sorumlu ara..."
              style={{
                width: "100%",
                height: 42,
                borderRadius: 12,
                border: "1px solid #dbe3ec",
                padding: "0 12px 0 38px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <select
            value={levelFilter}
            onChange={(event) =>
              setLevelFilter(
                event.target.value as
                  | "ALL"
                  | RiskLevel
              )
            }
            style={{
              minWidth: 165,
              height: 42,
              borderRadius: 12,
              border: "1px solid #dbe3ec",
              padding: "0 10px",
            }}
          >
            <option value="ALL">
              Tüm Seviyeler
            </option>
            <option value="LOW">Düşük</option>
            <option value="MEDIUM">Orta</option>
            <option value="HIGH">Yüksek</option>
            <option value="VERY_HIGH">
              Çok Yüksek
            </option>
            <option value="INTOLERABLE">
              Kabul Edilemez
            </option>
          </select>

          <select
            value={methodFilter}
            onChange={(event) =>
              setMethodFilter(
                event.target.value as
                  | "ALL"
                  | RiskMethod
              )
            }
            style={{
              minWidth: 165,
              height: 42,
              borderRadius: 12,
              border: "1px solid #dbe3ec",
              padding: "0 10px",
            }}
          >
            <option value="ALL">
              Tüm Yöntemler
            </option>
            <option value="FINE_KINNEY">
              Fine-Kinney
            </option>
            <option value="MATRIX_5X5">
              5x5 Matris
            </option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "ALL"
                  | "OPEN"
                  | "CLOSED"
              )
            }
            style={{
              minWidth: 150,
              height: 42,
              borderRadius: 12,
              border: "1px solid #dbe3ec",
              padding: "0 10px",
            }}
          >
            <option value="ALL">
              Tüm DÖF Durumları
            </option>
            <option value="OPEN">Açık</option>
            <option value="CLOSED">
              Kapalı
            </option>
          </select>

          <button
            type="button"
            onClick={clearFilters}
            style={{
              minHeight: 42,
              borderRadius: 12,
              border: "1px solid #dbe3ec",
              background: "#ffffff",
              color: "#475569",
              padding: "0 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontWeight: 850,
              cursor: "pointer",
            }}
          >
            <Filter size={15} />
            Temizle
          </button>

          <div
            style={{
              display: "inline-flex",
              borderRadius: 12,
              border: "1px solid #dbe3ec",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setViewMode("TABLE")
              }
              style={{
                width: 42,
                height: 40,
                border: 0,
                background:
                  viewMode === "TABLE"
                    ? "#6b1020"
                    : "#ffffff",
                color:
                  viewMode === "TABLE"
                    ? "#ffffff"
                    : "#64748b",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <List size={16} />
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode("CARDS")
              }
              style={{
                width: 42,
                height: 40,
                border: 0,
                borderLeft:
                  "1px solid #dbe3ec",
                background:
                  viewMode === "CARDS"
                    ? "#6b1020"
                    : "#ffffff",
                color:
                  viewMode === "CARDS"
                    ? "#ffffff"
                    : "#64748b",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            minHeight: 300,
            borderRadius: 20,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            display: "grid",
            placeItems: "center",
            color: "#64748b",
          }}
        >
          <Loader2
            size={28}
            className="riskWorkspaceSpin"
          />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div
          style={{
            minHeight: 300,
            borderRadius: 20,
            border: "1px dashed #cbd5e1",
            background: "#ffffff",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            color: "#94a3b8",
            padding: 24,
          }}
        >
          Risk kaydı bulunamadı.
        </div>
      ) : viewMode === "TABLE" ? (
        <div
          style={{
            borderRadius: 20,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 1200,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {[
                  "Faaliyet",
                  "Tehlike",
                  "Firma",
                  "Departman",
                  "Yöntem",
                  "Skor",
                  "Seviye",
                  "DÖF",
                  "Sorumlu",
                  "İşlemler",
                ].map((title) => (
                  <th
                    key={title}
                    style={{
                      padding: "12px 14px",
                      textAlign: "left",
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 900,
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map(
                (record) => (
                  <tr
                    key={record.id}
                    style={{
                      borderBottom:
                        "1px solid #eef2f7",
                    }}
                  >
                    <td
                      style={{
                        padding: 14,
                        fontWeight: 900,
                        color: "#0f172a",
                      }}
                    >
                      {record.activity || "-"}
                    </td>

                    <td style={{ padding: 14 }}>
                      {record.hazard || "-"}
                    </td>

                    <td style={{ padding: 14 }}>
                      {record.company || "-"}
                    </td>

                    <td style={{ padding: 14 }}>
                      {record.department || "-"}
                    </td>

                    <td style={{ padding: 14 }}>
                      {record.method}
                    </td>

                    <td
                      style={{
                        padding: 14,
                        fontWeight: 950,
                      }}
                    >
                      {record.score}
                    </td>

                    <td style={{ padding: 14 }}>
                      <span
                        style={{
                          borderRadius: 999,
                          padding: "5px 9px",
                          background:
                            riskBackground(
                              record.level
                            ),
                          color: riskColor(
                            record.level
                          ),
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        {riskLabel(
                          record.level
                        )}
                      </span>
                    </td>

                    <td style={{ padding: 14 }}>
                      {record.completed
                        ? "Kapalı"
                        : "Açık"}
                    </td>

                    <td style={{ padding: 14 }}>
                      {record.responsible ||
                        "-"}
                    </td>

                    <td style={{ padding: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 7,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRisk(
                              record
                            )
                          }
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            border:
                              "1px solid #dbe3ec",
                            background:
                              "#ffffff",
                            display: "grid",
                            placeItems:
                              "center",
                            cursor: "pointer",
                          }}
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEditRisk(
                              record
                            )
                          }
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            border:
                              "1px solid #bfdbfe",
                            background:
                              "#eff6ff",
                            color: "#1d4ed8",
                            display: "grid",
                            placeItems:
                              "center",
                            cursor: "pointer",
                          }}
                        >
                          <FileSpreadsheet
                            size={15}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(
                              record
                            )
                          }
                          disabled={
                            deletingId ===
                            record.id
                          }
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            border:
                              "1px solid #fecaca",
                            background:
                              "#fef2f2",
                            color: "#b91c1c",
                            display: "grid",
                            placeItems:
                              "center",
                            cursor:
                              deletingId ===
                              record.id
                                ? "wait"
                                : "pointer",
                            opacity:
                              deletingId ===
                              record.id
                                ? 0.6
                                : 1,
                          }}
                        >
                          <Trash2
                            size={15}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {filteredRecords.map((record) => (
            <article
              key={record.id}
              style={{
                borderRadius: 18,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                padding: 16,
                boxShadow:
                  "0 10px 26px rgba(15,23,42,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-start",
                  gap: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#0f172a",
                      fontSize: 15,
                      fontWeight: 900,
                    }}
                  >
                    {record.activity ||
                      "Risk kaydı"}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: "#64748b",
                      fontSize: 12,
                    }}
                  >
                    {record.company} ·{" "}
                    {record.department}
                  </div>
                </div>

                <span
                  style={{
                    borderRadius: 999,
                    padding: "5px 9px",
                    background:
                      riskBackground(
                        record.level
                      ),
                    color: riskColor(
                      record.level
                    ),
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                >
                  {riskLabel(record.level)}
                </span>
              </div>

              <div
                style={{
                  marginTop: 13,
                  color: "#334155",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {record.hazard}
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {[
                  ["Skor", record.score],
                  [
                    "Yöntem",
                    record.method,
                  ],
                  [
                    "DÖF",
                    record.completed
                      ? "Kapalı"
                      : "Açık",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    style={{
                      borderRadius: 12,
                      background: "#f8fafc",
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: 10,
                        fontWeight: 850,
                      }}
                    >
                      {label}
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        color: "#0f172a",
                        fontSize: 13,
                        fontWeight: 900,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedRisk(record)
                  }
                  style={{
                    minHeight: 38,
                    borderRadius: 10,
                    border:
                      "1px solid #dbe3ec",
                    background: "#ffffff",
                    padding: "0 11px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 850,
                    cursor: "pointer",
                  }}
                >
                  <Eye size={14} />
                  Detay
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openEditRisk(record)
                  }
                  style={{
                    minHeight: 38,
                    borderRadius: 10,
                    border:
                      "1px solid #bfdbfe",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    padding: "0 11px",
                    fontWeight: 850,
                    cursor: "pointer",
                  }}
                >
                  Düzenle
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <RiskDetailDrawer
        open={Boolean(selectedRisk)}
        record={selectedRisk}
        onClose={() => setSelectedRisk(null)}
        onEdit={openEditRisk}
      />

      <RiskDialog
        open={showDialog}
        form={form}
        saving={saving}
        error={error}
        onClose={() => {
          if (!saving) {
            setShowDialog(false);
          }
        }}
        onSave={handleSave}
      />

      <RiskReportCenter
        open={showReports}
        records={filteredRecords}
        companyName={
          filteredRecords[0]?.company || ""
        }
        onClose={() =>
          setShowReports(false)
        }
      />

      <style jsx>{`
        .riskWorkspaceSpin {
          animation: risk-workspace-spin
            0.9s linear infinite;
        }

        @keyframes risk-workspace-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 760px) {
          .riskFormGrid {
            grid-template-columns:
              1fr !important;
          }
        }
      `}</style>
    </section>
  );
}