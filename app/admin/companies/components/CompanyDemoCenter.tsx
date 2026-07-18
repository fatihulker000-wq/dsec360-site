"use client";

import type {
  Company,
} from "../types";

import {
  BRAND,
  DEMO_COMPANY_NAME,
} from "../constants";

interface Props {
  companies: Company[];
  loading: boolean;
  onCreateOrRefresh: () => void;
  onOpenDemo: (
    company: Company
  ) => void;
}

export default function CompanyDemoCenter({
  companies,
  loading,
  onCreateOrRefresh,
  onOpenDemo,
}: Props) {
  const demoCompany =
    companies.find(
      (company) =>
        company.is_demo ||
        company.name
          .toLocaleLowerCase(
            "tr-TR"
          )
          .includes(
            "d-sec demo lojistik"
          )
    ) || null;

  const employeeCount =
    Number(
      demoCompany?.user_count ??
        demoCompany?.calisan_sayisi ??
        0
    );

  return (
    <section
      style={{
        marginBottom: 20,
        padding:
          "clamp(18px,2.4vw,26px)",
        borderRadius: 22,
        color: "#fff",
        background:
          "linear-gradient(135deg,#111827 0%,#4c0519 50%,#c62828 100%)",
        boxShadow:
          "0 20px 50px rgba(76,5,25,0.20)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 220,
          height: 220,
          right: -70,
          top: -70,
          borderRadius: "50%",
          background:
            "rgba(255,255,255,0.08)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(280px,1fr))",
          gap: 20,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              padding: "6px 10px",
              borderRadius: 999,
              background:
                "rgba(255,255,255,0.13)",
              border:
                "1px solid rgba(255,255,255,0.18)",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 0.7,
            }}
          >
            D-SEC DEMO DENEYİMİ
          </div>

          <h2
            style={{
              margin:
                "12px 0 8px",
              fontSize:
                "clamp(24px,3vw,36px)",
              lineHeight: 1.1,
            }}
          >
            {demoCompany?.name ||
              DEMO_COMPANY_NAME}
          </h2>

          <p
            style={{
              margin: 0,
              maxWidth: 760,
              color:
                "rgba(255,255,255,0.84)",
              lineHeight: 1.7,
            }}
          >
            Potansiyel müşterilerin
            firma, çalışan, eğitim,
            denetim, DÖF, sağlık ve
            raporlama akışlarını örnek
            veriler üzerinden
            inceleyebilmesi için
            hazırlanmış demo merkezidir.
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 18,
            }}
          >
            <DemoBadge
              label={
                demoCompany
                  ? "Demo Firma Hazır"
                  : "Demo Firma Bekleniyor"
              }
              positive={Boolean(
                demoCompany
              )}
            />

            <DemoBadge
              label={`${employeeCount} çalışan`}
              positive={
                employeeCount > 0
              }
            />

            <DemoBadge
              label={
                demoCompany?.is_active ===
                false
                  ? "Pasif"
                  : "Aktif"
              }
              positive={
                demoCompany?.is_active !==
                false
              }
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={
              onCreateOrRefresh
            }
            disabled={loading}
            style={{
              border: "none",
              borderRadius: 14,
              padding:
                "14px 18px",
              background: "#fff",
              color:
                BRAND.redDark,
              fontWeight: 950,
              cursor: loading
                ? "not-allowed"
                : "pointer",
              opacity: loading
                ? 0.65
                : 1,
            }}
          >
            {loading
              ? "Demo Verileri Hazırlanıyor..."
              : demoCompany
              ? "Demo Verilerini Yenile"
              : "Demo Verilerini Oluştur"}
          </button>

          <button
            type="button"
            onClick={() => {
              if (demoCompany) {
                onOpenDemo(
                  demoCompany
                );
              }
            }}
            disabled={!demoCompany}
            style={{
              border:
                "1px solid rgba(255,255,255,0.32)",
              borderRadius: 14,
              padding:
                "14px 18px",
              background:
                "rgba(255,255,255,0.10)",
              color: "#fff",
              fontWeight: 900,
              cursor: demoCompany
                ? "pointer"
                : "not-allowed",
              opacity: demoCompany
                ? 1
                : 0.55,
            }}
          >
            Demo Firma Detayını Aç
          </button>
        </div>
      </div>
    </section>
  );
}

function DemoBadge({
  label,
  positive,
}: {
  label: string;
  positive: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        padding: "6px 10px",
        borderRadius: 999,
        background: positive
          ? "rgba(34,197,94,0.18)"
          : "rgba(251,191,36,0.18)",
        border: positive
          ? "1px solid rgba(134,239,172,0.32)"
          : "1px solid rgba(253,224,71,0.28)",
        color: "#fff",
        fontSize: 11,
        fontWeight: 900,
      }}
    >
      {label}
    </span>
  );
}
