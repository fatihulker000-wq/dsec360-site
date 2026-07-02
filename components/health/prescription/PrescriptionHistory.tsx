"use client";

import { useEffect, useState } from "react";

type PrescriptionRow = {
  id: string;
  diagnosis_code?: string | null;
  diagnosis_name?: string | null;
  status?: string | null;
  created_at?: string | null;
  health_prescription_items?: unknown[];
};

type Props = {
  employeeId: string;
};

export default function PrescriptionHistory({ employeeId }: Props) {
  const [items, setItems] = useState<PrescriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/admin/health-prescriptions?employeeId=${employeeId}&limit=20`,
          { cache: "no-store", credentials: "include" }
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

    if (employeeId) void loadHistory();
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
              <strong>{formatDate(item.created_at)}</strong>

              <div style={diagnosisStyle}>
                {item.diagnosis_code || "-"}{" "}
                {item.diagnosis_name || "Tanı girilmemiş"}
              </div>

              <div style={medicineStyle}>
                💊 {item.health_prescription_items?.length || 0} ilaç
              </div>

              <div style={buttonRowStyle}>
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

const diagnosisStyle: React.CSSProperties = {
  marginTop: 10,
  fontWeight: 900,
  color: "#111827",
};

const medicineStyle: React.CSSProperties = {
  marginTop: 8,
  color: "#64748b",
  fontSize: 13,
  fontWeight: 700,
};

const buttonRowStyle: React.CSSProperties = {
  marginTop: 12,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const pdfButtonStyle: React.CSSProperties = {
  background: "#7f1d1d",
  color: "#fff",
  borderRadius: 10,
  padding: "8px 12px",
  fontWeight: 900,
  textDecoration: "none",
};
