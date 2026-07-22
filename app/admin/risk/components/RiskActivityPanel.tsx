"use client";

import {
  Activity,
  CheckCircle2,
  CircleDot,
  Gauge,
  Target,
} from "lucide-react";

export type ActivityRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ActivityRiskMethod = "MATRIX" | "FINE_KINNEY";
export type ActivityDofStatus = "OPEN" | "CLOSED";

export type ActivityRiskRecord = {
  id: string;
  title: string;
  company: string;
  department?: string | null;
  method: ActivityRiskMethod;
  level: ActivityRiskLevel;
  dofStatus: ActivityDofStatus;
  source?: "APP" | "WEB" | "MERGED";
  updatedAt: string;
};

type Props = {
  records: ActivityRiskRecord[];
  onSelect: (id: string) => void;
};

const LEVEL_META: Record<
  ActivityRiskLevel,
  { label: string; bg: string; text: string; border: string }
> = {
  LOW: { label: "Düşük", bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
  MEDIUM: { label: "Orta", bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
  HIGH: { label: "Yüksek", bg: "#fff7ed", text: "#c2410c", border: "#fdba74" },
  CRITICAL: { label: "Kritik", bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
};

function formatDateTime(value: string) {
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

export default function RiskActivityPanel({
  records,
  onSelect,
}: Props) {
  const activities = [...records]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime()
    )
    .slice(0, 12);

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
            <Activity size={19} color="#2563eb" />
            Son Risk Aktiviteleri
          </div>

          <p
            style={{
              margin: "4px 0 0",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            En son güncellenen risk kayıtları
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
          {activities.length} işlem
        </span>
      </div>

      {activities.length === 0 ? (
        <div
          style={{
            minHeight: 220,
            display: "grid",
            placeItems: "center",
            padding: 24,
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          Henüz aktivite bulunmuyor.
        </div>
      ) : (
        <div>
          {activities.map((record, index) => {
            const level = LEVEL_META[record.level];

            return (
              <button
                key={record.id}
                type="button"
                onClick={() => onSelect(record.id)}
                style={{
                  width: "100%",
                  border: 0,
                  borderBottom:
                    index === activities.length - 1
                      ? "none"
                      : "1px solid #eef2f7",
                  background: "#ffffff",
                  padding: 15,
                  display: "grid",
                  gridTemplateColumns: "44px minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: 12,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    background: level.bg,
                    color: level.text,
                    border: `1px solid ${level.border}`,
                  }}
                >
                  {record.method === "FINE_KINNEY" ? (
                    <Gauge size={18} />
                  ) : (
                    <Target size={18} />
                  )}
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
                    {record.department ? ` · ${record.department}` : ""}
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
                        background: level.bg,
                        color: level.text,
                        border: `1px solid ${level.border}`,
                        fontSize: 11,
                        fontWeight: 850,
                      }}
                    >
                      {level.label}
                    </span>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        borderRadius: 999,
                        padding: "4px 8px",
                        background:
                          record.dofStatus === "CLOSED"
                            ? "#ecfdf5"
                            : "#fffbeb",
                        color:
                          record.dofStatus === "CLOSED"
                            ? "#047857"
                            : "#92400e",
                        fontSize: 11,
                        fontWeight: 850,
                      }}
                    >
                      {record.dofStatus === "CLOSED" ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <CircleDot size={12} />
                      )}

                      {record.dofStatus === "CLOSED"
                        ? "DÖF Kapalı"
                        : "DÖF Açık"}
                    </span>

                    <span
                      style={{
                        borderRadius: 999,
                        padding: "4px 8px",
                        background: "#f1f5f9",
                        color: "#475569",
                        fontSize: 11,
                        fontWeight: 850,
                      }}
                    >
                      {record.source || "WEB"}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    color: "#64748b",
                    fontSize: 11,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDateTime(record.updatedAt)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}