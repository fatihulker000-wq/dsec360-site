"use client";

import {
  AlertTriangle,
  ChevronRight,
  Flame,
  Gauge,
  Target,
} from "lucide-react";

export type CriticalRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type CriticalRiskMethod =
  | "MATRIX"
  | "FINE_KINNEY";

export type CriticalRiskRecord = {
  id: string;
  title: string;
  hazard: string;
  company: string;
  department?: string | null;
  method: CriticalRiskMethod;
  score: number;
  level: CriticalRiskLevel;
};

type Props = {
  records: CriticalRiskRecord[];
  onSelect: (id: string) => void;
};

const LEVEL_LABELS: Record<
  CriticalRiskLevel,
  string
> = {
  LOW: "Düşük",
  MEDIUM: "Orta",
  HIGH: "Yüksek",
  CRITICAL: "Kritik",
};

const LEVEL_COLORS: Record<
  CriticalRiskLevel,
  { bg: string; text: string; border: string }
> = {
  LOW: {
    bg: "#ecfdf5",
    text: "#047857",
    border: "#a7f3d0",
  },
  MEDIUM: {
    bg: "#fffbeb",
    text: "#b45309",
    border: "#fde68a",
  },
  HIGH: {
    bg: "#fff7ed",
    text: "#c2410c",
    border: "#fdba74",
  },
  CRITICAL: {
    bg: "#fef2f2",
    text: "#b91c1c",
    border: "#fecaca",
  },
};

export default function CriticalRisksPanel({
  records,
  onSelect,
}: Props) {
  const criticalRecords = [...records]
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.title.localeCompare(b.title, "tr");
    })
    .slice(0, 10);

  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 22,
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
          alignItems: "center",
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
            <Flame size={19} color="#dc2626" />
            En Kritik 10 Risk
          </div>

          <p
            style={{
              margin: "4px 0 0",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            Risk puanına göre en yüksek öncelikli
            kayıtlar
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
          {criticalRecords.length} kayıt
        </span>
      </div>

      {criticalRecords.length === 0 ? (
        <div
          style={{
            minHeight: 220,
            display: "grid",
            placeItems: "center",
            padding: 24,
            textAlign: "center",
            color: "#94a3b8",
          }}
        >
          <div>
            <AlertTriangle size={36} />

            <p
              style={{
                margin: "10px 0 0",
                fontWeight: 800,
              }}
            >
              Kritik risk kaydı bulunamadı.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {criticalRecords.map((record, index) => {
            const levelMeta =
              LEVEL_COLORS[record.level];

            return (
              <button
                key={record.id}
                type="button"
                onClick={() => onSelect(record.id)}
                style={{
                  width: "100%",
                  border: 0,
                  borderBottom:
                    index ===
                    criticalRecords.length - 1
                      ? "none"
                      : "1px solid #eef2f7",
                  background: "#ffffff",
                  padding: 15,
                  display: "grid",
                  gridTemplateColumns:
                    "42px minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: 12,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 13,
                    display: "grid",
                    placeItems: "center",
                    background: levelMeta.bg,
                    color: levelMeta.text,
                    border:
                      `1px solid ${levelMeta.border}`,
                    fontWeight: 950,
                  }}
                >
                  {index + 1}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: "#0f172a",
                      fontSize: 14,
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {record.title}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: "#64748b",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {record.company}
                    {record.department
                      ? ` · ${record.department}`
                      : ""}
                  </div>

                  <div
                    style={{
                      marginTop: 7,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 7,
                    }}
                  >
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "4px 8px",
                        background: levelMeta.bg,
                        color: levelMeta.text,
                        border:
                          `1px solid ${levelMeta.border}`,
                        fontSize: 11,
                        fontWeight: 850,
                      }}
                    >
                      {LEVEL_LABELS[record.level]}
                    </span>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        borderRadius: 999,
                        padding: "4px 8px",
                        background:
                          record.method ===
                          "FINE_KINNEY"
                            ? "#f5f3ff"
                            : "#eff6ff",
                        color:
                          record.method ===
                          "FINE_KINNEY"
                            ? "#6d28d9"
                            : "#1d4ed8",
                        fontSize: 11,
                        fontWeight: 850,
                      }}
                    >
                      {record.method ===
                      "FINE_KINNEY" ? (
                        <Gauge size={12} />
                      ) : (
                        <Target size={12} />
                      )}

                      {record.method ===
                      "FINE_KINNEY"
                        ? "Fine-Kinney"
                        : "5×5 Matris"}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: 10,
                        fontWeight: 850,
                      }}
                    >
                      SKOR
                    </div>

                    <div
                      style={{
                        marginTop: 3,
                        color: "#0f172a",
                        fontSize: 20,
                        fontWeight: 950,
                      }}
                    >
                      {record.score}
                    </div>
                  </div>

                  <ChevronRight
                    size={18}
                    color="#94a3b8"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}