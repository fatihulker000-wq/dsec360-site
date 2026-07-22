"use client";

import {
  CalendarClock,
  Edit3,
  Plus,
  Siren,
  Trash2,
} from "lucide-react";

import type { EmergencyDrill } from "../../emergency/types";

type Props = {
  data: EmergencyDrill[];
  deletingId?: string;
  onAdd: () => void;
  onEdit: (drill: EmergencyDrill) => void;
  onDelete: (drill: EmergencyDrill) => void;
};

function formatDate(value?: number | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function EmergencyDrillTable({
  data,
  deletingId = "",
  onAdd,
  onEdit,
  onDelete,
}: Props) {
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
          <h2
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: 19,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Siren size={20} color="#b91c1c" />
            Acil Durum Tatbikatları
          </h2>

          <p style={{ margin: "5px 0 0", color: "#94a3b8", fontSize: 13 }}>
            {data.length} tatbikat kaydı
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          style={{
            minHeight: 42,
            borderRadius: 12,
            border: 0,
            background: "#b91c1c",
            color: "#ffffff",
            padding: "0 15px",
            fontWeight: 900,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <Plus size={17} />
          Yeni Tatbikat
        </button>
      </div>

      {data.length === 0 ? (
        <div
          style={{
            minHeight: 280,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            color: "#94a3b8",
            padding: 24,
          }}
        >
          <div>
            <CalendarClock size={40} />
            <h3 style={{ color: "#334155", marginBottom: 6 }}>
              Tatbikat kaydı yok
            </h3>
            <p style={{ margin: 0 }}>Yeni tatbikat kaydı oluşturarak başlayın.</p>
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 1120,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {[
                  "Tatbikat",
                  "Tür",
                  "Tarih",
                  "Sonraki Tatbikat",
                  "Katılımcı",
                  "Süre",
                  "Sorumlu",
                  "Durum",
                  "İşlemler",
                ].map((title) => (
                  <th
                    key={title}
                    style={{
                      padding: "12px 14px",
                      textAlign: "left",
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 900,
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.map((drill) => (
                <tr key={drill.id} style={{ borderBottom: "1px solid #eef2f7" }}>
                  <td style={{ padding: 14 }}>
                    <div style={{ color: "#0f172a", fontWeight: 900 }}>
                      {drill.drillTitle || "Acil Durum Tatbikatı"}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        maxWidth: 300,
                        color: "#94a3b8",
                        fontSize: 11,
                      }}
                    >
                      {drill.result || "Sonuç bilgisi girilmemiş"}
                    </div>
                  </td>

                  <td style={{ padding: 14 }}>{drill.drillType}</td>
                  <td style={{ padding: 14 }}>{formatDate(drill.drillDateMillis)}</td>
                  <td style={{ padding: 14 }}>
                    {formatDate(drill.nextDrillDueMillis)}
                  </td>
                  <td style={{ padding: 14 }}>{drill.participantCount}</td>
                  <td style={{ padding: 14 }}>{drill.durationMinutes} dk</td>
                  <td style={{ padding: 14 }}>{drill.responsible || "-"}</td>

                  <td style={{ padding: 14 }}>
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "5px 9px",
                        background:
                          drill.status === "GEÇERLİ" ? "#ecfdf5" : "#f1f5f9",
                        color:
                          drill.status === "GEÇERLİ" ? "#047857" : "#64748b",
                        fontSize: 12,
                        fontWeight: 850,
                      }}
                    >
                      {drill.status}
                    </span>
                  </td>

                  <td style={{ padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => onEdit(drill)}
                        title="Düzenle"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          border: "1px solid #dbe3ec",
                          background: "#ffffff",
                          color: "#475569",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(drill)}
                        disabled={deletingId === drill.id}
                        title="Sil"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          border: "1px solid #fecaca",
                          background: "#fef2f2",
                          color: "#b91c1c",
                          display: "grid",
                          placeItems: "center",
                          cursor:
                            deletingId === drill.id ? "wait" : "pointer",
                          opacity: deletingId === drill.id ? 0.6 : 1,
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}