"use client";

import { useEffect, useState } from "react";

type PrescriptionRow = {
  id: string;
  diagnosis_code?: string | null;
  diagnosis_name?: string | null;
  status?: string | null;
  notes?: string | null;
  created_at?: string | null;
  health_prescription_items?: unknown[];
};

type Props = {
  employeeId: string;
  onSelect?: (prescriptionId: string) => void;
};

export default function PrescriptionHistory({
  employeeId,
  onSelect,
}: Props) {
  const [items, setItems] = useState<PrescriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/admin/health-prescriptions?employeeId=${employeeId}&limit=20`,
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

        setItems(json.prescriptions || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    if (employeeId) {
      void loadHistory();
    }
  }, [employeeId]);

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 22,
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 16 }}>
        Reçete Geçmişi
      </h3>

      {loading ? (
        <div style={{ color: "#64748b", fontWeight: 700 }}>
          Reçeteler yükleniyor...
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
          Reçete geçmişi bulunamadı.
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
                <strong>
                  {formatDate(item.created_at)}
                </strong>

                <span
                  style={{
                    padding: "5px 9px",
                    borderRadius: 999,
                    background:
                      item.status === "approved" ? "#f0fdf4" : "#fff7ed",
                    color:
                      item.status === "approved" ? "#15803d" : "#c2410c",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {item.status === "approved" ? "Onaylandı" : "Taslak"}
                </span>
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontWeight: 900,
                  color: "#111827",
                }}
              >
                {item.diagnosis_code || "-"}{" "}
                {item.diagnosis_name || "Tanı girilmemiş"}
              </div>

              <div
                style={{
                  marginTop: 8,
                  color: "#64748b",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                💊 {item.health_prescription_items?.length || 0} ilaç
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