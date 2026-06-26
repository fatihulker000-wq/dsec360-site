"use client";

import { useEffect, useState } from "react";

type ExaminationRow = {
  id: string;
  exam_type?: string | null;
  exam_date?: string | null;
  next_exam_date?: string | null;
  decision?: string | null;
  bmi?: number | null;
  blood_pressure_sys?: number | null;
  blood_pressure_dia?: number | null;
};

type Props = {
  employeeId: string;
  reloadKey?: number;
  onSelect?: (id: string) => void;
};

export default function ExaminationHistory({
  employeeId,
  reloadKey = 0,
  onSelect,
}: Props) {
  const [items, setItems] = useState<ExaminationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/admin/health-examinations?employeeId=${employeeId}&limit=20`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setItems([]);
          return;
        }

        setItems(json.examinations || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    if (employeeId) void loadHistory();
  }, [employeeId, reloadKey]);

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 22,
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 16 }}>Muayene Geçmişi</h3>

      {loading ? (
        <div style={{ color: "#64748b", fontWeight: 700 }}>
          Muayeneler yükleniyor...
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            padding: 24,
            borderRadius: 14,
            background: "#f8fafc",
            color: "#64748b",
            textAlign: "center",
            fontWeight: 700,
          }}
        >
          Muayene geçmişi bulunamadı.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item.id)}
              style={{
                width: "100%",
                textAlign: "left",
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                borderRadius: 16,
                padding: 16,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <strong>{item.exam_type || "Muayene"}</strong>

                <span
                  style={{
                    padding: "5px 9px",
                    borderRadius: 999,
                    background:
                      item.decision === "Uygun Değil"
                        ? "#fef2f2"
                        : item.decision === "Kısıtlı Uygun"
                        ? "#fff7ed"
                        : "#f0fdf4",
                    color:
                      item.decision === "Uygun Değil"
                        ? "#b91c1c"
                        : item.decision === "Kısıtlı Uygun"
                        ? "#c2410c"
                        : "#15803d",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {item.decision || "Uygun"}
                </span>
              </div>

              <div
                style={{
                  marginTop: 10,
                  color: "#334155",
                  fontWeight: 800,
                }}
              >
                Tarih: {formatDate(item.exam_date)}
              </div>

              <div
                style={{
                  marginTop: 6,
                  color: "#64748b",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                BMI: {item.bmi || "-"} • Tansiyon:{" "}
                {item.blood_pressure_sys || "-"}/{item.blood_pressure_dia || "-"}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("tr-TR");
}