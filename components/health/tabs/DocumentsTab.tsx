"use client";

import { useEffect, useState, type CSSProperties } from "react";

type Props = {
  employee: any;
};

type Ek2Record = {
  id: string;
  form_type?: string | null;
  status?: string | null;
  exam_date?: string | null;
  next_exam_date?: string | null;
  decision?: string | null;
  doctor_name?: string | null;
  file_no?: string | null;
};

export default function DocumentsTab({ employee }: Props) {
  const [items, setItems] = useState<Ek2Record[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEk2Files() {
      try {
        const res = await fetch(`/api/admin/ek2?employeeId=${employee.id}`, {
          cache: "no-store",
          credentials: "include",
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          setItems([]);
          return;
        }

        setItems(json.forms || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    if (employee?.id) void loadEk2Files();
  }, [employee?.id]);

 function viewEk2(id: string) {
  window.open(`/api/admin/ek2/${id}/download`, "_blank");
}

function openPdf(id: string) {
  window.open(`/api/admin/ek2/${id}/download`, "_blank");
}

function printEk2(id: string) {
  const win = window.open(`/api/admin/ek2/${id}/download`, "_blank");
  if (win) {
    setTimeout(() => {
      win.print();
    }, 1000);
  }
}

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Sağlık Dosyaları</h2>
        <p style={{ color: "#64748b", marginBottom: 0 }}>
          Çalışana ait EK-2, muayene, reçete ve sağlık evrakları bu alanda listelenir.
        </p>
      </section>

      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>EK-2 Formları</h3>

        {loading ? (
          <Empty text="EK-2 kayıtları yükleniyor..." />
        ) : items.length === 0 ? (
          <Empty text="Bu çalışan için EK-2 kaydı bulunamadı." />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((item) => (
              <div key={item.id} style={fileCardStyle}>
                <div>
                  <div style={{ fontWeight: 950, fontSize: 16 }}>
                    {item.file_no || `EK-2 ${item.form_type || ""}`}
                  </div>

                  <div style={{ color: "#64748b", marginTop: 6, fontWeight: 700 }}>
                    {item.form_type || "-"} • {item.exam_date || "-"} •{" "}
                    {item.status || "-"}
                  </div>

                  <div style={{ marginTop: 8, fontWeight: 800 }}>
                    Karar: {item.decision || "-"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                 <button
  type="button"
  onClick={() => viewEk2(item.id)}
  style={primaryButtonStyle}
>
  Görüntüle
</button>

<button
  type="button"
  onClick={() => openPdf(item.id)}
  style={secondaryButtonStyle}
>
  PDF
</button>

<button
  type="button"
  onClick={() => printEk2(item.id)}
  style={secondaryButtonStyle}
>
  Yazdır
</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: 28,
        borderRadius: 14,
        background: "#f8fafc",
        color: "#64748b",
        textAlign: "center",
        fontWeight: 800,
      }}
    >
      {text}
    </div>
  );
}

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 22,
};

const fileCardStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 18,
  background: "#f8fafc",
};

const primaryButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "9px 13px",
  background: "#7f1d1d",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: "9px 13px",
  background: "#fff",
  color: "#334155",
  fontWeight: 900,
  cursor: "pointer",
};
