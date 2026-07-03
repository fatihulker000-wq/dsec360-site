"use client";

import { useEffect, useState, type CSSProperties } from "react";

type Props = {
  employee: any;
};

type AccidentRow = {
  id: string;
  title?: string;
  employeeName?: string;
  eventType?: string;
  location?: string;
  severity?: number;
  lostWorkDays?: number;
  eventDate?: string | null;
  description?: string;
  department?: string;
  shift?: string;
  injuryBodyPart?: string;
  injuryType?: string;
  rootCauseCategory?: string;
  eventHour?: string | number | null;
  eventWeekDay?: string;
  source?: string;
};

export default function AccidentTab({ employee }: Props) {
  const [items, setItems] = useState<AccidentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccidents() {
      try {
        setLoading(true);

       const res = await fetch(`/api/admin/accidents`, {
  cache: "no-store",
  credentials: "include",
});

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json.success) {
          setItems([]);
          return;
        }

        const employeeName = normalizeText(employee.full_name || "");

const filteredRows = (json.rows || []).filter((row: AccidentRow) => {
  const rowName = normalizeText(row.employeeName || "");
  return rowName === employeeName || rowName.includes(employeeName);
});

setItems(filteredRows);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    if (employee?.id) void loadAccidents();
  }, [employee?.id]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>İş Kazaları</h2>
        <p style={{ color: "#64748b", marginBottom: 0 }}>
          Çalışanın geçirdiği iş kazaları, olay detayları, yaralanma bilgileri ve kök neden kayıtları bu alanda listelenir.
        </p>
      </section>

      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Kaza Kayıtları</h3>

        {loading ? (
          <Empty text="İş kazası kayıtları yükleniyor..." />
        ) : items.length === 0 ? (
          <Empty text="Bu çalışan için iş kazası kaydı bulunamadı." />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((item) => (
              <div key={item.id} style={accidentCardStyle}>
                <div>
                  <div style={{ fontWeight: 950, fontSize: 17 }}>
                    {item.title || "İş Kazası Kaydı"}
                  </div>

                  <div style={{ color: "#64748b", marginTop: 6, fontWeight: 700 }}>
                    {formatDate(item.eventDate)} • {item.eventType || "-"} • {item.location || "-"}
                  </div>

                  <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                    <Info label="Bölüm" value={item.department || "-"} />
                    <Info label="Vardiya" value={item.shift || "-"} />
                    <Info label="Yaralanan Bölge" value={item.injuryBodyPart || "-"} />
                    <Info label="Yaralanma Türü" value={item.injuryType || "-"} />
                    <Info label="Kök Neden" value={item.rootCauseCategory || "-"} />
                    <Info label="Kayıp Gün" value={String(item.lostWorkDays ?? 0)} />
                    <Info label="Açıklama" value={item.description || "-"} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={severityBadgeStyle}>
                    Şiddet: {item.severity ?? 0}
                  </span>

                  <span style={sourceBadgeStyle}>
                    {item.source || "APP"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: "#64748b", fontWeight: 800 }}>{label}: </span>
      <span style={{ fontWeight: 800 }}>{value}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={emptyStyle}>
      {text}
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR");
}

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 22,
};

const emptyStyle: CSSProperties = {
  padding: 28,
  borderRadius: 14,
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center",
  fontWeight: 800,
};

const accidentCardStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 18,
  background: "#f8fafc",
};

const severityBadgeStyle: CSSProperties = {
  display: "inline-flex",
  borderRadius: 999,
  padding: "7px 10px",
  background: "#fef2f2",
  color: "#b91c1c",
  fontWeight: 900,
  fontSize: 12,
};

const sourceBadgeStyle: CSSProperties = {
  display: "inline-flex",
  borderRadius: 999,
  padding: "7px 10px",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontWeight: 900,
  fontSize: 12,
};
function normalizeText(value: string) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}