"use client";

import { useEffect, useState } from "react";

type ExaminationRow = {
  id: string;
  exam_type?: string | null;
  exam_date?: string | null;
  next_exam_date?: string | null;
  decision?: string | null;
  bmi?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
};

type Props = {
  employeeId: string;
  reloadKey?: number;
  onSelect?: (id: string) => void;
  onDeleted?: () => void;
};

export default function ExaminationHistory({
  employeeId,
  reloadKey = 0,
  onSelect,
  onDeleted,
}: Props) {
  const [items, setItems] = useState<ExaminationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function deleteExamination(id: string) {
    const ok = window.confirm("Bu muayene kaydı silinsin mi?");
    if (!ok) return;

    try {
      setDeletingId(id);

      const res = await fetch(`/api/admin/health-examinations/${id}`, {
        method: "DELETE",
        cache: "no-store",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json.error || "Muayene silinemedi.");
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      onDeleted?.();
    } catch {
      alert("Sunucu bağlantı hatası.");
    } finally {
      setDeletingId(null);
    }
  }

  function printExamination(id: string) {
    window.open(`/api/admin/health-examinations/${id}/pdf`, "_blank");
  }

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
            <div
              key={item.id}
              style={{
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                borderRadius: 16,
                padding: 16,
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
                {item.systolic || "-"}/{item.diastolic || "-"}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 14,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelect?.(item.id)}
                  style={actionButton}
                >
                  Düzenle
                </button>

                <button
                  type="button"
                  onClick={() => printExamination(item.id)}
                  style={secondaryButton}
                >
                  PDF
                </button>

                <button
                  type="button"
                  onClick={() => deleteExamination(item.id)}
                  disabled={deletingId === item.id}
                  style={{
                    ...deleteButton,
                    opacity: deletingId === item.id ? 0.7 : 1,
                    cursor: deletingId === item.id ? "wait" : "pointer",
                  }}
                >
                  {deletingId === item.id ? "Siliniyor..." : "Sil"}
                </button>
              </div>
            </div>
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

const actionButton: React.CSSProperties = {
  border: "none",
  background: "#7f1d1d",
  color: "#fff",
  borderRadius: 10,
  padding: "8px 14px",
  cursor: "pointer",
  fontWeight: 800,
};

const secondaryButton: React.CSSProperties = {
  border: "1px solid #d1d5db",
  background: "#fff",
  borderRadius: 10,
  padding: "8px 14px",
  cursor: "pointer",
  fontWeight: 800,
};

const deleteButton: React.CSSProperties = {
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  borderRadius: 10,
  padding: "8px 14px",
  cursor: "pointer",
  fontWeight: 800,
};