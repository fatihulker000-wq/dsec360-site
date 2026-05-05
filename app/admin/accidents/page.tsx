"use client";

import { useEffect, useMemo, useState } from "react";

type AccidentRow = {
  id: number;
  title?: string | null;
  employeeName?: string | null;
  eventType?: string | null;
  location?: string | null;
  severity?: number | null;
  eventDate?: number | null;
  createdAt?: number | null;
  syncStatus?: string | null;
};

export default function AdminAccidentsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AccidentRow[]>([]);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/accidents", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Veriler alınamadı");
      }

      setRows(Array.isArray(json.rows) ? json.rows : []);
    } catch (err: any) {
      setError(err?.message || "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      accident: rows.filter((x) => x.eventType === "KAZA").length,
      nearMiss: rows.filter((x) => x.eventType === "RAMAK_KALA").length,
      danger: rows.filter((x) => x.eventType === "TEHLIKELI_DURUM").length,
    };
  }, [rows]);

  return (
    <div
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div
        style={{
          borderRadius: 24,
          padding: 24,
          background:
            "linear-gradient(135deg, #4a0d1a 0%, #7a0017 60%, #b91c1c 100%)",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            opacity: 0.85,
            marginBottom: 8,
          }}
        >
          D-SEC Kaza Merkezi
        </div>

        <div
          style={{
            fontSize: 34,
            fontWeight: 900,
            lineHeight: 1.1,
          }}
        >
          Kaza ve Olay Yönetimi
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 15,
            opacity: 0.9,
            maxWidth: 900,
          }}
        >
          İş kazaları, ramak kala kayıtları, olay bildirimleri ve
          tehlikeli durum kayıtlarını merkezi olarak yönetin.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
        }}
      >
        <StatCard title="Toplam Kayıt" value={stats.total} />
        <StatCard title="İş Kazası" value={stats.accident} />
        <StatCard title="Ramak Kala" value={stats.nearMiss} />
        <StatCard title="Tehlikeli Durum" value={stats.danger} />
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: 18,
          border: "1px solid #ececec",
          overflowX: "auto",
        }}
      >
        {loading ? (
          <div style={{ padding: 20, fontWeight: 700 }}>
            Veriler yükleniyor...
          </div>
        ) : error ? (
          <div
            style={{
              padding: 20,
              color: "#b91c1c",
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "#6b7280",
              fontWeight: 600,
            }}
          >
            Henüz kayıt bulunmuyor.
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#faf5f5",
                }}
              >
                <Th>Kayıt</Th>
                <Th>Çalışan</Th>
                <Th>Tür</Th>
                <Th>Lokasyon</Th>
                <Th>Şiddet</Th>
                <Th>Tarih</Th>
                <Th>Senkron</Th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: "1px solid #f1f1f1",
                  }}
                >
                  <Td>{row.title || "-"}</Td>
                  <Td>{row.employeeName || "-"}</Td>
                  <Td>{row.eventType || "-"}</Td>
                  <Td>{row.location || "-"}</Td>
                  <Td>{String(row.severity ?? "-")}</Td>
                  <Td>
                    {row.eventDate
                      ? new Date(row.eventDate).toLocaleDateString("tr-TR")
                      : "-"}
                  </Td>
                  <Td>{row.syncStatus || "-"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: 18,
        border: "1px solid #ececec",
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#6b7280",
          fontWeight: 700,
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 30,
          fontWeight: 900,
          color: "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: 14,
        fontSize: 13,
        color: "#374151",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        padding: 14,
        fontSize: 14,
        color: "#111827",
      }}
    >
      {children}
    </td>
  );
}