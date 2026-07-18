"use client";

import {
  useMemo,
} from "react";

import type {
  Company,
} from "../types";

interface Props {
  companies: Company[];
  loading: boolean;
  onCreateOrRefresh:
    () => void;
  onOpenDemo:
    (company: Company) => void;
}

export default function CompanyDemoCenter({
  companies,
  loading,
  onCreateOrRefresh,
  onOpenDemo,
}: Props) {
  const demoCompany =
    useMemo(
      () =>
        companies.find(
          (company) =>
            company.name
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                "d-sec demo lojistik"
              )
        ) || null,
      [companies]
    );

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(0,1fr) auto",
        gap: 18,
        alignItems: "center",
        marginBottom: 18,
        padding:
          "18px 20px",
        borderRadius: 18,
        color: "#fff",
        background:
          "linear-gradient(135deg,#111827 0%,#5b1620 58%,#c62828 100%)",
        boxShadow:
          "0 18px 48px rgba(15,23,42,0.18)",
      }}
    >
      <div>
        <div
          style={{
            display:
              "inline-flex",
            padding: "5px 9px",
            borderRadius: 999,
            background:
              "rgba(255,255,255,0.14)",
            border:
              "1px solid rgba(255,255,255,0.18)",
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          DEMO FİRMA
        </div>

        <h2
          style={{
            margin:
              "8px 0 4px",
            fontSize:
              "clamp(20px,2.3vw,27px)",
            lineHeight: 1.15,
          }}
        >
          D-SEC Demo Lojistik ve Depolama A.Ş.
        </h2>

        <div
          style={{
            color:
              "rgba(255,255,255,0.78)",
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          10 çalışan • 30 eğitim ataması • 12 denetim • 3 açık DÖF • 2 kaza/ramak kala
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent:
            "flex-end",
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
            borderRadius: 12,
            padding:
              "11px 16px",
            background: "#fff",
            color: "#991b1b",
            fontWeight: 900,
            cursor: loading
              ? "not-allowed"
              : "pointer",
            opacity: loading
              ? 0.65
              : 1,
          }}
        >
          {loading
            ? "Hazırlanıyor..."
            : demoCompany
            ? "Demo Verisini Yenile"
            : "Demo Verisini Oluştur"}
        </button>

        {demoCompany ? (
          <button
            type="button"
            onClick={() =>
              onOpenDemo(
                demoCompany
              )
            }
            style={{
              border:
                "1px solid rgba(255,255,255,0.5)",
              borderRadius: 12,
              padding:
                "11px 16px",
              background:
                "rgba(255,255,255,0.08)",
              color: "#fff",
              fontWeight: 900,
              cursor:
                "pointer",
            }}
          >
            Firma Detayı
          </button>
        ) : null}
      </div>
    </section>
  );
}
