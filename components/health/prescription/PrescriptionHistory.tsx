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

export default function PrescriptionHistory({ employeeId, onSelect }: Props) {
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
    <section style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 16 }}>Reçete Geçmişi</h3>

      {loading ? (
        <div style={{ color: "#64748b", fontWeight: 700 }}>
          Reçeteler yükleniyor...
        </div>
      ) : items.length === 0 ? (
        <div style={emptyStyle}>Reçete geçmişi bulunamadı.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} style={historyItemStyle}>
              <div style={topRowStyle}>
                <strong>{formatDate(item.created_at)}</strong>

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

              <div style={buttonRowStyle}>
                <button
                  type="button"
                  onClick={() => onSelect?.(item.id)}
                  style={openButtonStyle}
                >
                  Reçeteyi Aç
                </button>

                <a
                  href={`/api/admin/health-prescriptions/${item.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={pdfButtonStyle}
                >
                  PDF Aç / İndir
                </a>
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

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 22,
};

const emptyStyle: React.CSSProperties = {
  padding: 24,
  borderRadius: 14,
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center",
  fontWeight: 700,
};

const historyItemStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  borderRadius: 16,
  padding: 16,
};

const topRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
};

const buttonRowStyle: React.CSSProperties = {
  marginTop: 12,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const openButtonStyle: React.CSSProperties = {
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#991b1b",
  borderRadius: 10,
  padding: "8px 12px",
  fontWeight: 900,
  cursor: "pointer",
};

const pdfButtonStyle: React.CSSProperties = {
  background: "#7f1d1d",
  color: "#fff",
  borderRadius: 10,
  padding: "8px 12px",
  fontWeight: 900,
  textDecoration: "none",
};
