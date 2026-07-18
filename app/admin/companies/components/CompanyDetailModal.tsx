"use client";

import type {
  Company,
  CompanyModulePerformance,
  CompanyPerformanceAlert,
  CompanyPerformanceResponse,
  CompanyRiskLevel,
} from "../types";

import {
  BRAND,
} from "../constants";

type DetailTab =
  | "PROFILE"
  | "PERFORMANCE";

type Props = {
  open: boolean;
  company: Company | null;
  isMobile: boolean;
  detailTab: DetailTab;
  onTabChange: (
    tab: DetailTab
  ) => void;
  performanceLoading: boolean;
  performanceError: string;
  companyPerformance:
    CompanyPerformanceResponse |
    null;
  onClose: () => void;
};

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
    Boolean(
      company.is_demo
    ) ||
    company.name
      .toLocaleLowerCase(
        "tr-TR"
      )
      .includes(
        "d-sec demo lojistik"
      );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent:
          "center",
        padding: isMobile
          ? 0
          : 20,
        background:
          "rgba(15,23,42,0.58)",
      }}
    >
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        style={{
          width: "100%",
          maxWidth: 980,
          maxHeight: isMobile
            ? "100vh"
            : "92vh",
          overflowY: "auto",
          borderRadius: isMobile
            ? 0
            : 24,
          border:
            `1px solid ${BRAND.border}`,
          background: "#fff",
          boxShadow:
            "0 28px 80px rgba(15,23,42,0.28)",
        }}
      >
        <header
          style={{
            padding: 24,
            color: "#fff",
            background:
              `linear-gradient(135deg,${BRAND.redDark},${BRAND.red})`,
            borderTopLeftRadius:
              isMobile
                ? 0
                : 24,
            borderTopRightRadius:
              isMobile
                ? 0
                : 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-start",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display:
                    "inline-flex",
                  padding:
                    "6px 10px",
                  borderRadius: 999,
                  background:
                    "rgba(255,255,255,0.14)",
                  border:
                    "1px solid rgba(255,255,255,0.22)",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                FİRMA YÖNETİM MERKEZİ
              </div>

              <h2
                style={{
                  margin:
                    "12px 0 0",
                  fontSize:
                    "clamp(25px,4vw,36px)",
                  fontWeight: 950,
                  lineHeight: 1.15,
                }}
              >
                {company.name}
              </h2>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 12,
                }}
              >
                <HeaderBadge
                  label={
                    company.is_active ===
                    false
                      ? "PASİF"
                      : "AKTİF"
                  }
                />

                {isDemo ? (
                  <HeaderBadge
                    label="DEMO FİRMA"
                  />
                ) : null}
              </div>
            </div>

            {companyPerformance ? (
              <div
                style={{
                  minWidth: 180,
                  padding: 16,
                  borderRadius: 18,
                  background:
                    "rgba(255,255,255,0.13)",
                  border:
                    "1px solid rgba(255,255,255,0.22)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    opacity: 0.8,
                  }}
                >
                  GENEL İSG SKORU
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "baseline",
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <strong
                    style={{
                      fontSize: 42,
                      lineHeight: 1,
                    }}
                  >
                    {
                      companyPerformance.overallScore
                    }
                  </strong>

                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                    }}
                  >
                    {
                      companyPerformance.grade
                    }
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <div
          style={{
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              padding: 6,
              marginBottom: 18,
              borderRadius: 14,
              background: "#f3f4f6",
            }}
          >
            <TabButton
              active={
                detailTab ===
                "PROFILE"
              }
              label="Firma Profili"
              onClick={() =>
                onTabChange(
                  "PROFILE"
                )
              }
            />

            <TabButton
              active={
                detailTab ===
                "PERFORMANCE"
              }
              label="Kurumsal Performans"
              onClick={() =>
                onTabChange(
                  "PERFORMANCE"
                )
              }
            />
          </div>

          {detailTab ===
          "PROFILE" ? (
            <CompanyProfile
              company={company}
            />
          ) : (
            <CompanyPerformance
              loading={
                performanceLoading
              }
              error={
                performanceError
              }
              data={
                companyPerformance
              }
            />
          )}

          <div
            style={{
              display: "flex",
              justifyContent:
                "flex-end",
              marginTop: 20,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                border: "none",
                borderRadius: 12,
                padding:
                  "12px 18px",
                background:
                  "#111827",
                color: "#fff",
                fontWeight: 900,
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

function CompanyPerformance({
  loading,
  error,
  data,
}: {
  loading: boolean;
  error: string;
  data:
    CompanyPerformanceResponse |
    null;
}) {
  if (loading) {
    return (
      <div style={cardStyle}>
        Firma performansı hesaplanıyor...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          ...cardStyle,
          color: "#991b1b",
          background:
            "#fff7f7",
          border:
            "1px solid #fecaca",
          fontWeight: 800,
        }}
      >
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={cardStyle}>
        Performans verisi bulunamadı.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 12,
        }}
      >
        <KpiCard
          label="Genel Skor"
          value={`${data.overallScore}/100`}
          accent="#1d4ed8"
        />

        <KpiCard
          label="Kurumsal Seviye"
          value={data.grade}
          accent="#7c3aed"
        />

        <KpiCard
          label="Risk Durumu"
          value={riskLabel(
            data.riskLevel
          )}
          accent={riskColor(
            data.riskLevel
          )}
        />

        <KpiCard
          label="Kritik Modül"
          value={String(
            data.criticalCount
          )}
          accent={
            data.criticalCount > 0
              ? "#c62828"
              : "#166534"
          }
        />
      </div>

      <section style={cardStyle}>
        <div style={eyebrowStyle}>
          DORA AI
        </div>

        <h3 style={headingStyle}>
          Yönetici Özeti
        </h3>

        <div
          style={{
            display: "grid",
            gap: 9,
            marginTop: 14,
          }}
        >
          {data.doraSummary.map(
            (
              item,
              index
            ) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: 10,
                  color:
                    BRAND.text,
                  lineHeight: 1.55,
                }}
              >
                <span
                  style={{
                    color:
                      BRAND.red,
                    fontWeight: 950,
                  }}
                >
                  •
                </span>

                <span>
                  {item}
                </span>
              </div>
            )
          )}
        </div>
      </section>

      {data.alerts.length >
      0 ? (
        <section style={cardStyle}>
          <div style={eyebrowStyle}>
            YÖNETİM UYARILARI
          </div>

          <h3 style={headingStyle}>
            Kritik ve Öncelikli Aksiyonlar
          </h3>

          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 14,
            }}
          >
            {data.alerts.map(
              (
                alert,
                index
              ) => (
                <AlertCard
                  key={index}
                  alert={alert}
                />
              )
            )}
          </div>
        </section>
      ) : null}

      <section style={cardStyle}>
        <div style={eyebrowStyle}>
          MODÜL PERFORMANSLARI
        </div>

        <h3 style={headingStyle}>
          Gerçek Veri Bazlı Firma Karnesi
        </h3>

        <div
          style={{
            display: "grid",
            gap: 12,
            marginTop: 16,
          }}
        >
          {data.modules.map(
            (module) => (
              <PerformanceRow
                key={module.key}
                module={module}
              />
            )
          )}
        </div>
      </section>

      {data.warnings.length >
      0 ? (
        <div
          style={{
            ...cardStyle,
            color: "#92400e",
            background:
              "#fffbeb",
            border:
              "1px solid #fde68a",
            fontSize: 12,
          }}
        >
          {data.warnings.join(
            " • "
          )}
        </div>
      ) : null}
    </div>
  );
}

function PerformanceRow({
  module,
}: {
  module:
    CompanyModulePerformance;
}) {
  const score =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          module.score
        )
      )
    );

  const visual =
    performanceVisual(
      module.status
    );

  return (
    <article
      style={{
        padding: 15,
        borderRadius: 15,
        border:
          `1px solid ${visual.border}`,
        background:
          visual.soft,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(180px,260px) minmax(180px,1fr) 78px",
          gap: 14,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              color:
                BRAND.text,
              fontWeight: 950,
            }}
          >
            {module.title}
          </div>

          <div
            style={{
              marginTop: 4,
              color:
                BRAND.muted,
              fontSize: 11,
              lineHeight: 1.45,
            }}
          >
            {module.detail}
          </div>
        </div>

        <div>
          <div
            style={{
              height: 11,
              overflow: "hidden",
              borderRadius: 999,
              background:
                "#e5e7eb",
            }}
          >
            <div
              style={{
                width:
                  `${score}%`,
                height:
                  "100%",
                borderRadius: 999,
                background:
                  visual.color,
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 7,
              color:
                BRAND.muted,
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            <span>
              Toplam:{" "}
              {module.total}
            </span>

            <span>
              Tamamlanan:{" "}
              {module.completed}
            </span>

            <span>
              Eksik/Açık:{" "}
              {module.missing}
            </span>
          </div>
        </div>

        <div
          style={{
            textAlign: "right",
          }}
        >
          <strong
            style={{
              color:
                visual.color,
              fontSize: 23,
            }}
          >
            %{score}
          </strong>

          <div
            style={{
              marginTop: 5,
              color:
                visual.color,
              fontSize: 9,
              fontWeight: 950,
            }}
          >
            {visual.label}
          </div>
        </div>
      </div>
    </article>
  );
}

function AlertCard({
  alert,
}: {
  alert:
    CompanyPerformanceAlert;
}) {
  const visual =
    alert.level ===
    "CRITICAL"
      ? {
          color:
            "#991b1b",
          background:
            "#fff7f7",
          border:
            "#fecaca",
        }
      : alert.level ===
        "WARNING"
      ? {
          color:
            "#92400e",
          background:
            "#fffbeb",
          border:
            "#fde68a",
        }
      : {
          color:
            "#166534",
          background:
            "#f0fdf4",
          border:
            "#bbf7d0",
        };

  return (
    <button
      type="button"
      onClick={() => {
        if (
          alert.route &&
          typeof window !==
            "undefined"
        ) {
          window.location.href =
            alert.route;
        }
      }}
      style={{
        width: "100%",
        padding:
          "12px 14px",
        borderRadius: 14,
        border:
          `1px solid ${visual.border}`,
        background:
          visual.background,
        textAlign: "left",
        cursor:
          alert.route
            ? "pointer"
            : "default",
      }}
    >
      <div
        style={{
          color:
            visual.color,
          fontWeight: 950,
        }}
      >
        {alert.title}
      </div>

      <div
        style={{
          marginTop: 4,
          color:
            visual.color,
          fontSize: 11,
          lineHeight: 1.45,
        }}
      >
        {alert.description}
      </div>
    </button>
  );
}

function CompanyProfile({
  company,
}: {
  company: Company;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(230px,1fr))",
        gap: 14,
      }}
    >
      <InfoCard
        label="Yetkili"
        value={
          company.yetkili
        }
      />

      <InfoCard
        label="Telefon"
        value={
          company.phone
        }
      />

      <InfoCard
        label="E-posta"
        value={
          company.email
        }
      />

      <InfoCard
        label="Çalışan"
        value={String(
          company.calisan_sayisi ??
            company.user_count ??
            0
        )}
      />

      <InfoCard
        label="SGK Sicil No"
        value={
          company.sgk_sicil_no
        }
      />

      <InfoCard
        label="NACE Kodu"
        value={
          company.nace_kodu
        }
      />

      <InfoCard
        label="Tehlike Sınıfı"
        value={
          company.tehlike_sinifi
        }
      />

      <InfoCard
        label="Sektör"
        value={
          company.sektor
        }
      />

      <InfoCard
        label="İSG Uzmanı"
        value={
          company.isg_uzmani
        }
      />

      <InfoCard
        label="İşyeri Hekimi"
        value={
          company.isyeri_hekimi
        }
      />

      <InfoCard
        label="DSP"
        value={
          company.dsp
        }
      />

      <InfoCard
        label="Adres"
        value={
          company.address
        }
      />
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value?:
    string |
    null;
}) {
  return (
    <div style={cardStyle}>
      <div
        style={{
          color:
            BRAND.muted,
          fontSize: 11,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 7,
          color:
            BRAND.text,
          fontWeight: 900,
          wordBreak:
            "break-word",
          lineHeight: 1.4,
        }}
      >
        {value || "-"}
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
        padding:
          "10px 14px",
        fontWeight: 900,
        cursor: "pointer",
        background: active
          ? BRAND.red
          : "transparent",
        color: active
          ? "#fff"
          : BRAND.text,
      }}
    >
      {label}
    </button>
  );
}

function HeaderBadge({
  label,
}: {
  label: string;
}) {
  return (
    <span
      style={{
        display:
          "inline-flex",
        padding:
          "5px 10px",
        borderRadius: 999,
        background:
          "rgba(255,255,255,0.16)",
        border:
          "1px solid rgba(255,255,255,0.24)",
        color: "#fff",
        fontSize: 10,
        fontWeight: 950,
      }}
    >
      {label}
    </span>
  );
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <article
      style={{
        ...cardStyle,
        borderTop:
          `4px solid ${accent}`,
      }}
    >
      <div
        style={{
          color:
            BRAND.muted,
          fontSize: 10,
          fontWeight: 900,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 8,
          color: accent,
          fontSize: 29,
          fontWeight: 950,
        }}
      >
        {value}
      </div>
    </article>
  );
}

function performanceVisual(
  status:
    CompanyModulePerformance["status"]
) {
  if (
    status === "GOOD"
  ) {
    return {
      label: "İYİ",
      color: "#166534",
      soft: "#f0fdf4",
      border: "#bbf7d0",
    };
  }

  if (
    status === "DEVELOP"
  ) {
    return {
      label:
        "GELİŞTİRİLMELİ",
      color: "#92400e",
      soft: "#fffbeb",
      border: "#fde68a",
    };
  }

  if (
    status === "HIGH"
  ) {
    return {
      label:
        "YÜKSEK RİSK",
      color: "#c2410c",
      soft: "#fff7ed",
      border: "#fed7aa",
    };
  }

  return {
    label: "KRİTİK",
    color: "#b91c1c",
    soft: "#fff7f7",
    border: "#fecaca",
  };
}

function riskLabel(
  level:
    CompanyRiskLevel
) {
  return level === "LOW"
    ? "Düşük"
    : level === "MEDIUM"
    ? "Orta"
    : level === "HIGH"
    ? "Yüksek"
    : "Kritik";
}

function riskColor(
  level:
    CompanyRiskLevel
) {
  return level === "LOW"
    ? "#166534"
    : level === "MEDIUM"
    ? "#92400e"
    : level === "HIGH"
    ? "#c2410c"
    : "#b91c1c";
}

const cardStyle:
  React.CSSProperties = {
    padding: 17,
    borderRadius: 17,
    border:
      `1px solid ${BRAND.border}`,
    background: "#fff",
    boxShadow:
      "0 10px 30px rgba(15,23,42,0.05)",
    minWidth: 0,
  };

const eyebrowStyle:
  React.CSSProperties = {
    color: BRAND.red,
    fontSize: 10,
    fontWeight: 950,
    letterSpacing: 0.9,
  };

const headingStyle:
  React.CSSProperties = {
    margin: "6px 0 0",
    color: BRAND.text,
    fontSize: 20,
    fontWeight: 950,
  };