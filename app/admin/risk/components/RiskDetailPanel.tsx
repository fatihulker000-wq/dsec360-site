"use client";

import {
  Gauge,
  Pencil,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";

export type RiskDetailLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskDetailMethod = "MATRIX" | "FINE_KINNEY";
export type RiskDetailDofStatus = "OPEN" | "CLOSED";

export type RiskDetailRecord = {
  id: string;
  firmId: string;
  webFirmId?: string | null;
  company: string;
  title: string;
  hazard: string;
  consequence?: string | null;
  control?: string | null;
  method: RiskDetailMethod;
  score: number;
  level: RiskDetailLevel;
  department?: string | null;
  responsible?: string | null;
  dofStatus: RiskDetailDofStatus;
  dofDueDate?: string | null;
  source?: "APP" | "WEB" | "MERGED";
  updatedAt: string;
};

type Props = {
  risk: RiskDetailRecord | null;
  deleting?: boolean;
  onEdit: (risk: RiskDetailRecord) => void;
  onDelete: (risk: RiskDetailRecord) => void | Promise<void>;
};

const LEVEL_META: Record<
  RiskDetailLevel,
  { label: string; bg: string; text: string; border: string }
> = {
  LOW: {
    label: "Düşük",
    bg: "#ecfdf5",
    text: "#047857",
    border: "#a7f3d0",
  },
  MEDIUM: {
    label: "Orta",
    bg: "#fffbeb",
    text: "#b45309",
    border: "#fde68a",
  },
  HIGH: {
    label: "Yüksek",
    bg: "#fff7ed",
    text: "#c2410c",
    border: "#fdba74",
  },
  CRITICAL: {
    label: "Kritik",
    bg: "#fef2f2",
    text: "#b91c1c",
    border: "#fecaca",
  },
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function RiskLevelBadge({ level }: { level: RiskDetailLevel }) {
  const meta = LEVEL_META[level];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "5px 9px",
        fontSize: 12,
        fontWeight: 800,
        color: meta.text,
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}

export default function RiskDetailPanel({
  risk,
  deleting = false,
  onEdit,
  onDelete,
}: Props) {
  return (
    <aside
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 22,
        padding: 18,
        boxShadow: "0 14px 35px rgba(15,23,42,0.05)",
        position: "sticky",
        top: 18,
      }}
    >
      {risk ? (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: 850,
                  marginBottom: 5,
                }}
              >
                SEÇİLEN RİSK
              </div>

              <h2
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: 20,
                  lineHeight: 1.25,
                }}
              >
                {risk.title}
              </h2>
            </div>

            <RiskLevelBadge level={risk.level} />
          </div>

          <div
            style={{
              borderRadius: 18,
              padding: 16,
              background:
                "linear-gradient(135deg, #4b0f1d 0%, #111827 100%)",
              color: "#ffffff",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.66)",
                    fontWeight: 800,
                  }}
                >
                  RİSK PUANI
                </div>

                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 950,
                    marginTop: 3,
                  }}
                >
                  {risk.score}
                </div>
              </div>

              <Gauge size={34} />
            </div>
          </div>

          {[
            ["Firma", risk.company],
            ["Bölüm", risk.department || "-"],
            ["Sorumlu", risk.responsible || "-"],
            ["Termin", formatDate(risk.dofDueDate)],
            ["Kaynak", risk.source || "-"],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr",
                gap: 10,
                padding: "10px 0",
                borderBottom: "1px solid #eef2f7",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {label}
              </div>

              <div
                style={{
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 750,
                }}
              >
                {value}
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: 16,
              borderRadius: 16,
              padding: 14,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#6d28d9",
                fontWeight: 900,
                marginBottom: 8,
              }}
            >
              <Sparkles size={17} />
              DORA Risk Yorumu
            </div>

            <p
              style={{
                margin: 0,
                color: "#475569",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {risk.level === "CRITICAL"
                ? "Bu kayıt kritik seviyededir. Faaliyet durdurma, geçici güvenlik önlemi ve yönetim onayı gerektiren aksiyonlar değerlendirilmelidir."
                : risk.level === "HIGH"
                ? "Risk için kısa vadeli termin belirlenmeli, sorumlu atanmalı ve kontrol tedbirlerinin etkinliği yeniden değerlendirilmelidir."
                : "Mevcut kontroller sürdürülmeli ve risk periyodik olarak izlenmelidir."}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginTop: 14,
            }}
          >
            <button
              type="button"
              onClick={() => onEdit(risk)}
              style={{
                minHeight: 44,
                borderRadius: 13,
                border: "1px solid #dbe3ec",
                background: "#ffffff",
                color: "#334155",
                fontWeight: 900,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Pencil size={16} />
              Düzenle
            </button>

            <button
              type="button"
              onClick={() => void onDelete(risk)}
              disabled={deleting}
              style={{
                minHeight: 44,
                borderRadius: 13,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
                fontWeight: 900,
                cursor: deleting ? "wait" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Trash2 size={16} />
              {deleting ? "Siliniyor" : "Sil"}
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            minHeight: 330,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            color: "#94a3b8",
          }}
        >
          <div>
            <ShieldAlert size={42} />

            <h3 style={{ color: "#334155", marginBottom: 5 }}>
              Risk seçilmedi
            </h3>

            <p style={{ margin: 0, fontSize: 13 }}>
              Detaylarını görüntülemek için listeden bir kayıt seçin.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}