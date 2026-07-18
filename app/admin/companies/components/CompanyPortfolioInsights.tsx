"use client";

import type {
  Company,
} from "../types";

import {
  BRAND,
} from "../constants";

interface Props {
  companies: Company[];
  onOpenCompany: (
    company: Company
  ) => void;
}

type CompanyInsight = {
  company: Company;
  employeeCount: number;
  profileScore: number;
  missingFields: number;
};

const PROFILE_FIELDS: Array<
  keyof Company
> = [
  "yetkili",
  "phone",
  "email",
  "address",
  "nace_kodu",
  "tehlike_sinifi",
  "sgk_sicil_no",
  "sektor",
  "isg_uzmani",
  "isyeri_hekimi",
  "dsp",
];

export default function CompanyPortfolioInsights({
  companies,
  onOpenCompany,
}: Props) {
  const insights:
    CompanyInsight[] =
    companies.map((company) => {
      const completedFields =
        PROFILE_FIELDS.filter(
          (field) =>
            String(
              company[field] ?? ""
            ).trim().length > 0
        ).length;

      const profileScore =
        Math.round(
          (
            completedFields /
            PROFILE_FIELDS.length
          ) * 100
        );

      return {
        company,
        employeeCount:
          Number(
            company.user_count ??
              company.calisan_sayisi ??
              0
          ),
        profileScore,
        missingFields:
          PROFILE_FIELDS.length -
          completedFields,
      };
    });

  const activeCount =
    companies.filter(
      (company) =>
        company.is_active !== false
    ).length;

  const passiveCount =
    companies.length -
    activeCount;

  const totalEmployees =
    insights.reduce(
      (total, item) =>
        total +
        item.employeeCount,
      0
    );

  const averageProfileScore =
    insights.length === 0
      ? 0
      : Math.round(
          insights.reduce(
            (total, item) =>
              total +
              item.profileScore,
            0
          ) /
            insights.length
        );

  const incompleteCompanies =
    insights.filter(
      (item) =>
        item.profileScore < 75
    );

  const sortedCompanies =
    [...insights]
      .sort(
        (first, second) =>
          second.employeeCount -
          first.employeeCount
      )
      .slice(0, 6);

  const largestEmployeeCount =
    Math.max(
      ...sortedCompanies.map(
        (item) =>
          item.employeeCount
      ),
      1
    );

  return (
    <section
      style={{
        display: "grid",
        gap: 18,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(210px,1fr))",
          gap: 14,
        }}
      >
        <InsightCard
          eyebrow="PORTFÖY"
          title="Toplam Çalışan"
          value={totalEmployees}
          description={`${companies.length} firma genelinde aktif çalışan`}
          accent="#1d4ed8"
        />

        <InsightCard
          eyebrow="FİRMA DURUMU"
          title="Aktif / Pasif"
          value={`${activeCount} / ${passiveCount}`}
          description="Aktif ve pasif firma dağılımı"
          accent="#166534"
        />

        <InsightCard
          eyebrow="DORA ÖN SKOR"
          title="Profil Hazırlığı"
          value={`%${averageProfileScore}`}
          description="Firma ana bilgilerinin tamamlanma oranı"
          accent="#7c3aed"
        />

        <InsightCard
          eyebrow="DİKKAT"
          title="Eksik Profilli Firma"
          value={incompleteCompanies.length}
          description="Profil hazırlığı %75 altında olan firmalar"
          accent={
            incompleteCompanies.length > 0
              ? "#c62828"
              : "#166534"
          }
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0,1.35fr) minmax(300px,0.65fr)",
          gap: 18,
        }}
      >
        <div style={panelStyle}>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-start",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={eyebrowStyle}>
                FİRMA PORTFÖYÜ
              </div>

              <h3 style={headingStyle}>
                Çalışan Dağılımı
              </h3>

              <p style={descriptionStyle}>
                En yüksek çalışan
                sayısına sahip firmaların
                karşılaştırmalı görünümü.
              </p>
            </div>

            <span
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                background:
                  "#eff6ff",
                color: "#1d4ed8",
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              İlk 6 Firma
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gap: 14,
              marginTop: 22,
            }}
          >
            {sortedCompanies.length ===
            0 ? (
              <div
                style={{
                  padding: 20,
                  borderRadius: 14,
                  background:
                    "#f8fafc",
                  color:
                    BRAND.muted,
                }}
              >
                Firma verisi bulunmuyor.
              </div>
            ) : (
              sortedCompanies.map(
                (item) => {
                  const width =
                    Math.max(
                      4,
                      Math.round(
                        (
                          item.employeeCount /
                          largestEmployeeCount
                        ) * 100
                      )
                    );

                  return (
                    <button
                      key={
                        item.company.id
                      }
                      type="button"
                      onClick={() =>
                        onOpenCompany(
                          item.company
                        )
                      }
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(170px,240px) minmax(180px,1fr) 72px",
                        gap: 14,
                        alignItems:
                          "center",
                        width: "100%",
                        padding: 0,
                        border: "none",
                        background:
                          "transparent",
                        textAlign:
                          "left",
                        cursor:
                          "pointer",
                      }}
                    >
                      <div
                        style={{
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace:
                              "nowrap",
                            color:
                              BRAND.text,
                            fontWeight: 900,
                          }}
                        >
                          {
                            item.company
                              .name
                          }
                        </div>

                        <div
                          style={{
                            marginTop: 4,
                            color:
                              BRAND.muted,
                            fontSize: 11,
                          }}
                        >
                          Profil %
                          {
                            item.profileScore
                          }
                        </div>
                      </div>

                      <div
                        style={{
                          height: 12,
                          borderRadius: 999,
                          overflow:
                            "hidden",
                          background:
                            "#e5e7eb",
                        }}
                      >
                        <div
                          style={{
                            width: `${width}%`,
                            height:
                              "100%",
                            borderRadius: 999,
                            background:
                              "linear-gradient(90deg,#5a0f1f,#c62828)",
                          }}
                        />
                      </div>

                      <strong
                        style={{
                          textAlign:
                            "right",
                          color:
                            BRAND.text,
                          fontSize: 16,
                        }}
                      >
                        {
                          item.employeeCount
                        }
                      </strong>
                    </button>
                  );
                }
              )
            )}
          </div>
        </div>

        <div style={panelStyle}>
          <div style={eyebrowStyle}>
            YÖNETİM UYARILARI
          </div>

          <h3 style={headingStyle}>
            Firma Sağlık Göstergesi
          </h3>

          <p style={descriptionStyle}>
            Firma profillerindeki eksik
            alanlar satış demosu ve
            raporlama kalitesini etkiler.
          </p>

          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 18,
            }}
          >
            {incompleteCompanies
              .slice(0, 5)
              .map((item) => (
                <button
                  key={
                    item.company.id
                  }
                  type="button"
                  onClick={() =>
                    onOpenCompany(
                      item.company
                    )
                  }
                  style={{
                    width: "100%",
                    padding:
                      "12px 14px",
                    borderRadius: 14,
                    border:
                      "1px solid #fecaca",
                    background:
                      "#fff7f7",
                    textAlign:
                      "left",
                    cursor:
                      "pointer",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#991b1b",
                      fontWeight: 900,
                    }}
                  >
                    {
                      item.company
                        .name
                    }
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      color:
                        "#7f1d1d",
                      fontSize: 11,
                    }}
                  >
                    {
                      item.missingFields
                    } eksik profil alanı
                    · Hazırlık %
                    {
                      item.profileScore
                    }
                  </div>
                </button>
              ))}

            {incompleteCompanies.length ===
            0 ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  border:
                    "1px solid #bbf7d0",
                  background:
                    "#f0fdf4",
                  color:
                    "#166534",
                  fontWeight: 800,
                }}
              >
                Tüm firma profilleri
                yeterli seviyede.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function InsightCard({
  eyebrow,
  title,
  value,
  description,
  accent,
}: {
  eyebrow: string;
  title: string;
  value: number | string;
  description: string;
  accent: string;
}) {
  return (
    <article
      style={{
        ...panelStyle,
        borderTop:
          `4px solid ${accent}`,
      }}
    >
      <div
        style={{
          color: accent,
          fontSize: 10,
          fontWeight: 950,
          letterSpacing: 0.8,
        }}
      >
        {eyebrow}
      </div>

      <div
        style={{
          marginTop: 8,
          color: BRAND.text,
          fontSize: 14,
          fontWeight: 850,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          color: accent,
          fontSize: 32,
          fontWeight: 950,
          lineHeight: 1,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 8,
          color: BRAND.muted,
          fontSize: 11,
          lineHeight: 1.5,
        }}
      >
        {description}
      </div>
    </article>
  );
}

const panelStyle:
  React.CSSProperties = {
    padding: 18,
    borderRadius: 18,
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
    fontSize: 21,
    fontWeight: 950,
  };

const descriptionStyle:
  React.CSSProperties = {
    margin: "6px 0 0",
    color: BRAND.muted,
    fontSize: 12,
    lineHeight: 1.6,
  };
