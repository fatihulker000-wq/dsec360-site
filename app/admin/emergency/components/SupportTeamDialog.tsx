"use client";

import {
  Save,
  UserPlus,
  X,
} from "lucide-react";

import type { EmergencySupportMember } from "../types";

type Props = {
  open: boolean;
  member: Partial<EmergencySupportMember>;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  onChange: (
    field: keyof EmergencySupportMember,
    value: unknown
  ) => void;
};

const inputStyle = {
  width: "100%",
  height: 44,
  borderRadius: 12,
  border: "1px solid #dbe3ec",
  padding: "0 12px",
  boxSizing: "border-box" as const,
};

const labelStyle = {
  display: "grid",
  gap: 6,
};

const labelTextStyle = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 850,
};

export default function SupportTeamDialog({
  open,
  member,
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
        zIndex: 110,
        background: "rgba(15,23,42,0.62)",
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
      onClick={onClose}
    >
      <section
        style={{
          width: "min(860px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: 24,
          background: "#ffffff",
          padding: 22,
          boxShadow:
            "0 30px 90px rgba(15,23,42,0.34)",
        }}
        onClick={(event) =>
          event.stopPropagation()
        }
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
              <UserPlus size={21} />
              Destek Ekibi Üyesi
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Android uygulamasındaki ekip üyesi alanlarıyla uyumludur.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
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
          className="supportTeamGrid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Çalışan ID
            </span>

            <input
              value={member.employeeId ?? ""}
              onChange={(event) =>
                onChange(
                  "employeeId",
                  event.target.value || null
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Ad Soyad
            </span>

            <input
              value={member.fullName ?? ""}
              onChange={(event) =>
                onChange(
                  "fullName",
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Ekip Türü
            </span>

            <select
              value={member.teamType ?? "YANGIN"}
              onChange={(event) =>
                onChange(
                  "teamType",
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="YANGIN">
                Yangınla Mücadele
              </option>
              <option value="ARAMA_KURTARMA">
                Arama ve Kurtarma
              </option>
              <option value="TAHLİYE">
                Tahliye
              </option>
              <option value="ILK_YARDIM">
                İlk Yardım
              </option>
              <option value="KORUMA">
                Koruma
              </option>
              <option value="HABERLESME">
                Haberleşme
              </option>
            </select>
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Ekip Rolü
            </span>

            <select
              value={
                member.teamRole ??
                "EKIP_UYESI"
              }
              onChange={(event) =>
                onChange(
                  "teamRole",
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="EKIP_LIDERI">
                Ekip Lideri
              </option>
              <option value="EKIP_UYESI">
                Ekip Üyesi
              </option>
              <option value="YEDEK_UYE">
                Yedek Üye
              </option>
            </select>
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Görev
            </span>

            <input
              value={member.duty ?? ""}
              onChange={(event) =>
                onChange(
                  "duty",
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Departman
            </span>

            <input
              value={member.department ?? ""}
              onChange={(event) =>
                onChange(
                  "department",
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Telefon
            </span>

            <input
              value={member.phone ?? ""}
              onChange={(event) =>
                onChange(
                  "phone",
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Sertifika Bilgisi
            </span>

            <input
              value={
                member.certificateInfo ?? ""
              }
              onChange={(event) =>
                onChange(
                  "certificateInfo",
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Atanma Tarihi
            </span>

            <input
              type="date"
              value={
                member.assignedDateMillis
                  ? new Date(
                      member.assignedDateMillis
                    )
                      .toISOString()
                      .slice(0, 10)
                  : ""
              }
              onChange={(event) =>
                onChange(
                  "assignedDateMillis",
                  event.target.value
                    ? new Date(
                        `${event.target.value}T00:00:00`
                      ).getTime()
                    : Date.now()
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              İmza Durumu
            </span>

            <select
              value={
                member.signatureStatus ??
                "IMZA_BEKLIYOR"
              }
              onChange={(event) =>
                onChange(
                  "signatureStatus",
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="IMZA_BEKLIYOR">
                İmza Bekliyor
              </option>
              <option value="IMZALANDI">
                İmzalandı
              </option>
            </select>
          </label>

          <label
            style={{
              ...labelStyle,
              gridColumn: "1 / -1",
            }}
          >
            <span style={labelTextStyle}>
              Kayıt Durumu
            </span>

            <select
              value={
                member.isActive === false
                  ? "false"
                  : "true"
              }
              onChange={(event) =>
                onChange(
                  "isActive",
                  event.target.value === "true"
                )
              }
              style={inputStyle}
            >
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </label>
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
            style={{
              height: 44,
              borderRadius: 12,
              border: 0,
              background: "#047857",
              color: "#ffffff",
              fontWeight: 900,
              padding: "0 18px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <Save size={16} />
            Üyeyi Kaydet
          </button>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 720px) {
          .supportTeamGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}