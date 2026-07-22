"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  Building2,
  Eye,
  Flame,
  Trophy,
} from "lucide-react";

import type { RiskRecord } from "../types";
import {
  riskBackground,
  riskColor,
  riskLabel,
} from "../helpers";

type Props = {
  records: RiskRecord[];
  loading?: boolean;
  limit?: number;
  onSelect?: (record: RiskRecord) => void;
};

export default function CriticalRisksCard({
  records,
  loading = false,
  limit = 10,
  onSelect,
}: Props) {
  const criticalRecords = useMemo(
    () =>
      [...records]
        .filter(
          (record) =>
            record.level === "HIGH" ||
            record.level === "VERY_HIGH" ||
            record.level === "INTOLERABLE"
        )
        .sort(
          (a, b) =>
            Number(b.score || 0) -
            Number(a.score || 0)
        )
        .slice(0, limit),
    [records, limit]
  );

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
      <header
        style={{
          padding: 18,
          borderBottom: "1px solid #eef2f7",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
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
            <Trophy size={19} color="#b91c1c" />
            En Kritik 10 Risk
          </div>

          <p
            style={{
              margin: "5px 0 0",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            En yüksek puanlı risklerin öncelik sırası
          </p>
        </div>

        <span
          style={{
            borderRadius: 999,
            padding: "6px 10px",
            background: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecaca",
            fontSize: 12,
            fontWeight: 850,
          }}
        >
          {criticalRecords.length} kritik
        </span>
      </header>

      {loading ? (
        <div
          style={{
            minHeight: 360,
            display: "grid",
            placeItems: "center",
            color: "#94a3b8",
          }}
        >
          Kritik riskler yükleniyor...
        </div>
      ) : criticalRecords.length === 0 ? (
        <div
          style={{
            minHeight: 360,
            display: "grid",
            placeItems: "center",
            color: "#94a3b8",
            textAlign: "center",
            padding: 24,
          }}
        >
          <div>
            <AlertTriangle size={36} />
            <p style={{ margin: "10px 0 0" }}>
              Yüksek veya kritik risk kaydı bulunmuyor.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {criticalRecords.map((record, index) => (
            <article
              key={record.id}
              style={{
                padding: 13,
                display: "grid",
                gridTemplateColumns:
                  "34px 40px minmax(0, 1fr) auto",
                gap: 9,
                alignItems: "center",
                borderBottom:
                  index === criticalRecords.length - 1
                    ? "none"
                    : "1px solid #eef2f7",
              }}
            >
              <div
                style={{
                  color:
                    index < 3 ? "#b91c1c" : "#64748b",
                  fontSize: 15,
                  fontWeight: 950,
                  textAlign: "center",
                }}
              >
                {index + 1}
              </div>

              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 13,
                  display: "grid",
                  placeItems: "center",
                  background: riskBackground(
                    record.level
                  ),
                  color: riskColor(record.level),
                }}
              >
                <Flame size={17} />
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: "#0f172a",
                    fontSize: 13,
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {record.activity || record.hazard}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    color: "#64748b",
                    fontSize: 10,
                    fontWeight: 750,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Building2 size={11} />
                    {record.company || "-"}
                  </span>

                  <span>{record.department || "-"}</span>

                  <span>
                    {record.completed
                      ? "DÖF Kapalı"
                      : "DÖF Açık"}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <span
                  style={{
                    borderRadius: 999,
                    padding: "5px 8px",
                    background: riskBackground(
                      record.level
                    ),
                    color: riskColor(record.level),
                    fontSize: 10,
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  {record.score} ·{" "}
                  {riskLabel(record.level)}
                </span>

                <button
                  type="button"
                  onClick={() => onSelect?.(record)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: "1px solid #dbe3ec",
                    background: "#ffffff",
                    color: "#475569",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <Eye size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}