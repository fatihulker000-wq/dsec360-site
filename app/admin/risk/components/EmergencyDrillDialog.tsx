"use client";

import { Save, Siren, X } from "lucide-react";
import type { EmergencyDrill } from "../../emergency/types";

type Props = {
  open: boolean;
  drill: Partial<EmergencyDrill>;
  saving: boolean;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  onChange: (field: keyof EmergencyDrill, value: unknown) => void;
};

function millisToDate(value?: number | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function dateToMillis(value: string) {
  if (!value) return null;
  const millis = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(millis) ? null : millis;
}

const inputStyle = {
  width: "100%",
  height: 44,
  borderRadius: 12,
  border: "1px solid #dbe3ec",
  padding: "0 12px",
  boxSizing: "border-box" as const,
};

const textareaStyle = {
  width: "100%",
  minHeight: 100,
  borderRadius: 12,
  border: "1px solid #dbe3ec",
  padding: 12,
  resize: "vertical" as const,
  boxSizing: "border-box" as const,
};

const labelStyle = { display: "grid", gap: 6 };
const labelTextStyle = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 850,
};

export default function EmergencyDrillDialog({
  open,
  drill,
  saving,
  onClose,
  onSave,
  onChange,
}: Props) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 115,
        background: "rgba(15,23,42,0.62)",
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <section
        style={{
          width: "min(900px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: 24,
          background: "#ffffff",
          padding: 22,
          boxShadow: "0 30px 90px rgba(15,23,42,0.34)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 23,
                fontWeight: 950,
                display: "flex",
                alignItems: "center",
                gap: 9,
              }}
            >
              <Siren size={21} />
              Acil Durum Tatbikatı
            </h2>
            <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: 13 }}>
              Android tatbikat kayıt alanlarıyla uyumludur.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: 0,
              background: "#f1f5f9",
              color: "#475569",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="drillGrid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <label style={labelStyle}>
            <span style={labelTextStyle}>Tatbikat Türü</span>
            <select
              value={drill.drillType ?? "YANGIN_TAHLIYE"}
              onChange={(event) => onChange("drillType", event.target.value)}
              style={inputStyle}
            >
              <option value="YANGIN_TAHLIYE">Yangın ve Tahliye</option>
              <option value="DEPREM">Deprem</option>
              <option value="KIMYASAL_SIZINTI">Kimyasal Sızıntı</option>
              <option value="ILK_YARDIM">İlk Yardım</option>
              <option value="GENEL_TAHLIYE">Genel Tahliye</option>
              <option value="DIGER">Diğer</option>
            </select>
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Tatbikat Başlığı</span>
            <input
              value={drill.drillTitle ?? ""}
              onChange={(event) => onChange("drillTitle", event.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Tatbikat Tarihi</span>
            <input
              type="date"
              value={millisToDate(drill.drillDateMillis)}
              onChange={(event) =>
                onChange(
                  "drillDateMillis",
                  dateToMillis(event.target.value) ?? Date.now()
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Sonraki Tatbikat Tarihi</span>
            <input
              type="date"
              value={millisToDate(drill.nextDrillDueMillis)}
              onChange={(event) =>
                onChange("nextDrillDueMillis", dateToMillis(event.target.value))
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Katılımcı Sayısı</span>
            <input
              type="number"
              min={0}
              value={drill.participantCount ?? 0}
              onChange={(event) =>
                onChange("participantCount", Number(event.target.value))
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Süre (Dakika)</span>
            <input
              type="number"
              min={0}
              value={drill.durationMinutes ?? 0}
              onChange={(event) =>
                onChange("durationMinutes", Number(event.target.value))
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Sorumlu</span>
            <input
              value={drill.responsible ?? ""}
              onChange={(event) => onChange("responsible", event.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Durum</span>
            <select
              value={drill.status ?? "GEÇERLİ"}
              onChange={(event) => onChange("status", event.target.value)}
              style={inputStyle}
            >
              <option value="GEÇERLİ">Geçerli</option>
              <option value="PLANLANDI">Planlandı</option>
              <option value="TAMAMLANDI">Tamamlandı</option>
              <option value="İPTAL">İptal</option>
            </select>
          </label>

          {[
            ["result", "Tatbikat Sonucu"],
            ["deficiencies", "Tespit Edilen Eksiklikler"],
            ["correctiveActions", "Düzeltici Faaliyetler"],
          ].map(([field, label]) => (
            <label
              key={field}
              style={{ ...labelStyle, gridColumn: "1 / -1" }}
            >
              <span style={labelTextStyle}>{label}</span>
              <textarea
                value={String(
                  drill[field as keyof EmergencyDrill] ?? ""
                )}
                onChange={(event) =>
                  onChange(field as keyof EmergencyDrill, event.target.value)
                }
                style={textareaStyle}
              />
            </label>
          ))}
        </div>

        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              height: 44,
              borderRadius: 12,
              border: "1px solid #dbe3ec",
              background: "#ffffff",
              color: "#475569",
              fontWeight: 850,
              padding: "0 16px",
              cursor: "pointer",
            }}
          >
            İptal
          </button>

          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving}
            style={{
              height: 44,
              borderRadius: 12,
              border: 0,
              background: "#b91c1c",
              color: "#ffffff",
              fontWeight: 900,
              padding: "0 18px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: saving ? "wait" : "pointer",
            }}
          >
            <Save size={16} />
            {saving ? "Kaydediliyor" : "Tatbikatı Kaydet"}
          </button>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 720px) {
          .drillGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}