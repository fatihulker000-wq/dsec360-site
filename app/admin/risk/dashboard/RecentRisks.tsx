"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Camera,
  CheckCircle2,
  Eye,
  Paperclip,
  Filter,
  Flame,
  History,
  UserRound,
} from "lucide-react";

import type { RiskRecord } from "../types";
import {
  formatDate,
  riskBackground,
  riskColor,
  riskLabel,
} from "../helpers";

type ViewMode =
  | "RECENT"
  | "UPDATED"
  | "CRITICAL"
  | "OPEN_DOF";

type Props = {
  records: RiskRecord[];
  loading?: boolean;
  limit?: number;
  onSelect?: (record: RiskRecord) => void;
};

function getRecordTime(record: RiskRecord) {
  return (
    Number(record.updatedAtMillis || 0) ||
    Number(record.createdAtMillis || 0)
  );
}

export default function RecentRisks({
  records,
  loading = false,
  limit = 8,
  onSelect,
}: Props) {
  const [mode, setMode] =
    useState<ViewMode>("RECENT");

  const filteredRecords = useMemo(() => {
    const sorted = [...records];

    if (mode === "RECENT") {
      return sorted
        .sort(
          (a, b) =>
            Number(b.createdAtMillis || 0) -
            Number(a.createdAtMillis || 0)
        )
        .slice(0, limit);
    }

    if (mode === "UPDATED") {
      return sorted
        .sort(
          (a, b) =>
            Number(b.updatedAtMillis || 0) -
            Number(a.updatedAtMillis || 0)
        )
        .slice(0, limit);
    }

    if (mode === "CRITICAL") {
      return sorted
        .filter(
          (record) =>
            record.level === "VERY_HIGH" ||
            record.level === "INTOLERABLE"
        )
        .sort(
          (a, b) =>
            Number(b.score || 0) -
            Number(a.score || 0)
        )
        .slice(0, limit);
    }

    return sorted
      .filter((record) => !record.completed)
      .sort(
        (a, b) =>
          getRecordTime(b) -
          getRecordTime(a)
      )
      .slice(0, limit);
  }, [records, mode, limit]);

  const buttons: Array<{
    value: ViewMode;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      value: "RECENT",
      label: "Son Eklenen",
      icon: <History size={15} />,
    },
    {
      value: "UPDATED",
      label: "Güncellenen",
      icon: <Filter size={15} />,
    },
    {
      value: "CRITICAL",
      label: "Kritik Riskler",
      icon: <Flame size={15} />,
    },
    {
      value: "OPEN_DOF",
      label: "DÖF Bekleyen",
      icon: <AlertTriangle size={15} />,
    },
  ];

  return (
    <section
      style={{
        borderRadius: 22,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        overflow: "hidden",
        boxShadow:
          "0 14px 35px rgba(15,23,42,0.05)",
      }}
    >
      <div
        style={{
          padding: 18,
          borderBottom: "1px solid #eef2f7",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#0f172a",
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            <History size={19} color="#2563eb" />
            Son Risk Kayıtları
          </div>

          <p
            style={{
              margin: "5px 0 0",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            Son eklenen, güncellenen ve öncelikli
            risklerin hızlı görünümü
          </p>
        </div>

        <span
          style={{
            borderRadius: 999,
            padding: "6px 10px",
            background: "#eff6ff",
            color: "#1d4ed8",
            border: "1px solid #bfdbfe",
            fontSize: 12,
            fontWeight: 850,
          }}
        >
          {loading
            ? "Yükleniyor"
            : `${filteredRecords.length} kayıt`}
        </span>
      </div>

      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid #eef2f7",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {buttons.map((button) => {
          const active = mode === button.value;

          return (
            <button
              key={button.value}
              type="button"
              onClick={() =>
                setMode(button.value)
              }
              style={{
                minHeight: 38,
                borderRadius: 11,
                border: active
                  ? "1px solid #6b1020"
                  : "1px solid #dbe3ec",
                background: active
                  ? "#6b1020"
                  : "#ffffff",
                color: active
                  ? "#ffffff"
                  : "#475569",
                padding: "0 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontSize: 12,
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              {button.icon}
              {button.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div
          style={{
            padding: 18,
            display: "grid",
            gap: 10,
          }}
        >
          {Array.from({ length: 5 }).map(
            (_, index) => (
              <div
                key={index}
                className="recentRiskSkeleton"
                style={{
                  height: 76,
                  borderRadius: 14,
                  background:
                    "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
                  backgroundSize: "200% 100%",
                }}
              />
            )
          )}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div
          style={{
            minHeight: 260,
            display: "grid",
            placeItems: "center",
            padding: 24,
            textAlign: "center",
            color: "#94a3b8",
          }}
        >
          <div>
            <CheckCircle2 size={40} />

            <h3
              style={{
                margin: "12px 0 5px",
                color: "#334155",
                fontSize: 17,
              }}
            >
              Kayıt bulunamadı
            </h3>

            <p style={{ margin: 0 }}>
              Seçilen kategoriye ait risk kaydı yok.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {filteredRecords.map(
            (record, index) => (
              <article
                key={record.id}
                style={{
                  padding: 15,
                  display: "grid",
                  gridTemplateColumns:
                    "48px minmax(0, 1fr) auto",
                  gap: 13,
                  alignItems: "center",
                  borderBottom:
                    index ===
                    filteredRecords.length - 1
                      ? "none"
                      : "1px solid #eef2f7",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 15,
                    display: "grid",
                    placeItems: "center",
                    background: riskBackground(
                      record.level
                    ),
                    color: riskColor(record.level),
                    border: `1px solid ${riskColor(
                      record.level
                    )}33`,
                  }}
                >
                  <Flame size={19} />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <div
                      style={{
                        minWidth: 0,
                        color: "#0f172a",
                        fontSize: 14,
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {record.activity ||
                        record.hazard ||
                        "Risk kaydı"}
                    </div>

                    <span
                      style={{
                        borderRadius: 999,
                        padding: "4px 8px",
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
                      marginTop: 6,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                      color: "#64748b",
                      fontSize: 11,
                      fontWeight: 750,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Building2 size={12} />
                      {record.company || "-"}
                    </span>

                    <span>
                      {record.department || "-"}
                    </span>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <UserRound size={12} />
                      {record.responsible || "-"}
                    </span>

                    <span>
                      {formatDate(
                        getRecordTime(record)
                      )}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 7,
                    }}
                  >
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "4px 8px",
                        background: "#f8fafc",
                        color: "#475569",
                        border:
                          "1px solid #e2e8f0",
                        fontSize: 10,
                        fontWeight: 850,
                      }}
                    >
                      Skor: {record.score}
                    </span>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        borderRadius: 999,
                        padding: "4px 8px",
                        background:
                          record.photoUrl
                            ? "#eff6ff"
                            : "#f8fafc",
                        color:
                          record.photoUrl
                            ? "#1d4ed8"
                            : "#94a3b8",
                        fontSize: 10,
                        fontWeight: 850,
                      }}
                    >
                      <Camera size={11} />
                      {record.photoUrl
                        ? "Fotoğraf"
                        : "Fotoğraf yok"}
                    </span>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        borderRadius: 999,
                        padding: "4px 8px",
                        background:
                          record.attachmentUrl
                            ? "#f5f3ff"
                            : "#f8fafc",
                        color:
                          record.attachmentUrl
                            ? "#6d28d9"
                            : "#94a3b8",
                        fontSize: 10,
                        fontWeight: 850,
                      }}
                    >
                      <Paperclip size={11} />
                      {record.attachmentUrl
                        ? "Ek mevcut"
                        : "Ek yok"}
                    </span>

                    <span
                      style={{
                        borderRadius: 999,
                        padding: "4px 8px",
                        background: record.completed
                          ? "#ecfdf5"
                          : "#fffbeb",
                        color: record.completed
                          ? "#047857"
                          : "#92400e",
                        fontSize: 10,
                        fontWeight: 850,
                      }}
                    >
                      {record.completed
                        ? "DÖF Kapalı"
                        : "DÖF Açık"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelect?.(record)}
                  title="Detayı aç"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    border: "1px solid #dbe3ec",
                    background: "#ffffff",
                    color: "#475569",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <Eye size={17} />
                </button>
              </article>
            )
          )}
        </div>
      )}

      <style jsx>{`
        .recentRiskSkeleton {
          animation: recent-risk-loading 1.2s
            linear infinite;
        }

        @keyframes recent-risk-loading {
          from {
            background-position: 200% 0;
          }

          to {
            background-position: -200% 0;
          }
        }

        @media (max-width: 720px) {
          article {
            grid-template-columns:
              42px minmax(0, 1fr) !important;
          }

          article > button {
            grid-column: 1 / -1;
            width: 100% !important;
          }
        }
      `}</style>
    </section>
  );
}