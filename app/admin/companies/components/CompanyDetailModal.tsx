"use client";

type CompanyRow = {
  id: string;
  name: string;
  created_at?: string | null;
  user_count?: number;
  yetkili?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  is_active?: boolean | null;
  calisan_sayisi?: number | null;
  nace_kodu?: string | null;
  tehlike_sinifi?: string | null;
  sgk_sicil_no?: string | null;
  sektor?: string | null;
  isg_uzmani?: string | null;
  isyeri_hekimi?: string | null;
  dsp?: string | null;
  is_demo?: boolean;
};

type ModulePerformanceItem = {
  key: string;
  title: string;
  score: number;
  status: "GOOD" | "DEVELOP" | "HIGH" | "CRITICAL";
  total: number;
  completed: number;
  missing: number;
  detail: string;
};

type CompanyPerformanceResponse = {
  success?: boolean;
  companyId?: string;
  overallScore?: number;
  modules?: ModulePerformanceItem[];
  warnings?: string[];
  error?: string;
};

type DetailTab = "PROFILE" | "PERFORMANCE";

type Props = {
  open: boolean;
  company: CompanyRow | null;
  isMobile: boolean;
  detailTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  performanceLoading: boolean;
  performanceError: string;
  companyPerformance: CompanyPerformanceResponse | null;
  onClose: () => void;
};

const BRAND = {
  white: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  red: "#c62828",
  redDark: "#5a0f1f",
  shadow: "0 10px 30px rgba(15,23,42,0.06)",
};

function cardStyle(): React.CSSProperties {
  return {
    border: `1px solid ${BRAND.border}`,
    borderRadius: 18,
    background: BRAND.white,
    padding: 18,
    boxShadow: BRAND.shadow,
    minWidth: 0,
  };
}

export default function CompanyDetailModal({
  open,
  company,
  isMobile,
  detailTab,
  onTabChange,
  performanceLoading,
  performanceError,
  companyPerformance,
  onClose,
}: Props) {
  if (!open || !company) {
    return null;
  }

  const isDemo =
    company.is_demo ||
    company.name
      .toLocaleLowerCase("tr-TR")
      .includes("d-sec demo lojistik");

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 9999,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: isMobile ? "100%" : 760,
          maxHeight: isMobile ? "100vh" : "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: isMobile ? 0 : 24,
          boxShadow: "0 24px 60px rgba(15,23,42,0.22)",
          border: `1px solid ${BRAND.border}`,
        }}
      >
        <div
          style={{
            padding: 24,
            background: `linear-gradient(135deg, ${BRAND.redDark} 0%, ${BRAND.red} 100%)`,
            color: "#fff",
            borderTopLeftRadius: isMobile ? 0 : 24,
            borderTopRightRadius: isMobile ? 0 : 24,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.22)",
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            Firma Detay Kartı
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "clamp(24px,4vw,34px)",
              fontWeight: 900,
              lineHeight: 1.15,
              wordBreak: "break-word",
            }}
          >
            {company.name}
          </h2>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                padding: "5px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                background: company.is_active
                  ? "rgba(34,197,94,0.18)"
                  : "rgba(239,68,68,0.18)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.20)",
              }}
            >
              {company.is_active ? "AKTİF" : "PASİF"}
            </span>

            {isDemo ? (
              <span
                style={{
                  display: "inline-flex",
                  padding: "5px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 900,
                  background: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                DEMO FİRMA
              </span>
            ) : null}
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 18,
              padding: 6,
              borderRadius: 14,
              background: "#f3f4f6",
            }}
          >
            <TabButton
              active={detailTab === "PROFILE"}
              label="Firma Profili"
              onClick={() => onTabChange("PROFILE")}
            />

            <TabButton
              active={detailTab === "PERFORMANCE"}
              label="Modül Performansı"
              onClick={() => onTabChange("PERFORMANCE")}
            />
          </div>

          {detailTab === "PROFILE" ? (
            <CompanyProfile company={company} />
          ) : (
            <CompanyPerformance
              loading={performanceLoading}
              error={performanceError}
              data={companyPerformance}
            />
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 20,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                border: "none",
                borderRadius: 12,
                padding: "12px 18px",
                background: "#111827",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: 10,
        padding: "10px 14px",
        fontWeight: 900,
        cursor: "pointer",
        background: active ? BRAND.red : "transparent",
        color: active ? "#fff" : BRAND.text,
      }}
    >
      {label}
    </button>
  );
}

function CompanyProfile({
  company,
}: {
  company: CompanyRow;
}) {
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <InfoCard label="Yetkili" value={company.yetkili} />
        <InfoCard label="Telefon" value={company.phone} />
        <InfoCard label="E-Posta" value={company.email} />
        <InfoCard
          label="Çalışan"
          value={String(
            company.calisan_sayisi ??
              company.user_count ??
              0
          )}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 14,
        }}
      >
        <InfoCard label="SGK Sicil No" value={company.sgk_sicil_no} />
        <InfoCard label="NACE Kodu" value={company.nace_kodu} />
        <InfoCard label="Tehlike Sınıfı" value={company.tehlike_sinifi} />
        <InfoCard label="Sektör" value={company.sektor} />
        <InfoCard label="İSG Uzmanı" value={company.isg_uzmani} />
        <InfoCard label="İşyeri Hekimi" value={company.isyeri_hekimi} />
        <InfoCard label="DSP" value={company.dsp} />
        <InfoCard label="Adres" value={company.address} multiline />
      </div>
    </>
  );
}

function InfoCard({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value?: string | null;
  multiline?: boolean;
}) {
  return (
    <div style={cardStyle()}>
      <div style={{ fontSize: 12, color: BRAND.muted }}>
        {label}
      </div>

      <div
        style={{
          marginTop: 8,
          fontWeight: 900,
          wordBreak: "break-word",
          lineHeight: multiline ? 1.6 : 1.35,
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function CompanyPerformance({
  loading,
  error,
  data,
}: {
  loading: boolean;
  error: string;
  data: CompanyPerformanceResponse | null;
}) {
  if (loading) {
    return (
      <div style={cardStyle()}>
        Firma performansı hesaplanıyor...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          ...cardStyle(),
          color: "#991b1b",
          background: "#fff7f7",
          border: "1px solid #fecaca",
          fontWeight: 800,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div
        style={{
          ...cardStyle(),
          background:
            "linear-gradient(135deg,#111827,#5a0f1f,#c62828)",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            opacity: 0.8,
          }}
        >
          GENEL MODÜL PERFORMANSI
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 48,
            fontWeight: 950,
          }}
        >
          %{data?.overallScore ?? 0}
        </div>
      </div>

      {(data?.modules || []).map((module) => (
        <CompanyPerformanceRow
          key={module.key}
          module={module}
        />
      ))}

      {data?.warnings?.length ? (
        <div
          style={{
            ...cardStyle(),
            color: "#92400e",
            background: "#fffbeb",
            border: "1px solid #fde68a",
          }}
        >
          {data.warnings.join(" • ")}
        </div>
      ) : null}
    </div>
  );
}

function CompanyPerformanceRow({
  module,
}: {
  module: ModulePerformanceItem;
}) {
  const score = Math.max(
    0,
    Math.min(100, Math.round(module.score))
  );

  const visual =
    module.status === "GOOD"
      ? {
          label: "İYİ",
          color: "#166534",
          soft: "#f0fdf4",
          border: "#bbf7d0",
        }
      : module.status === "DEVELOP"
      ? {
          label: "GELİŞTİRİLMELİ",
          color: "#92400e",
          soft: "#fffbeb",
          border: "#fde68a",
        }
      : module.status === "HIGH"
      ? {
          label: "YÜKSEK RİSK",
          color: "#c2410c",
          soft: "#fff7ed",
          border: "#fed7aa",
        }
      : {
          label: "KRİTİK",
          color: "#b91c1c",
          soft: "#fff7f7",
          border: "#fecaca",
        };

  return (
    <article
      style={{
        padding: 16,
        borderRadius: 16,
        background: visual.soft,
        border: `1px solid ${visual.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 950,
              color: BRAND.text,
            }}
          >
            {module.title}
          </div>

          <div
            style={{
              marginTop: 5,
              color: BRAND.muted,
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {module.detail}
          </div>
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 950,
            color: visual.color,
          }}
        >
          %{score}
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          height: 10,
          borderRadius: 999,
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            background: visual.color,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 8,
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
          fontSize: 11,
          color: BRAND.muted,
          fontWeight: 800,
        }}
      >
        <span>Toplam: {module.total}</span>
        <span>Tamamlanan: {module.completed}</span>
        <span>Eksik/Açık: {module.missing}</span>
        <span style={{ color: visual.color }}>
          {visual.label}
        </span>
      </div>
    </article>
  );
}