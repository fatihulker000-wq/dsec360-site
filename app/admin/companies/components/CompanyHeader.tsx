"use client";

import { BRAND } from "../constants";
import { Company } from "../types";

interface Props {
  companies: Company[];
  onAddCompany: () => void;
}

export default function CompanyHeader({
  companies,
  onAddCompany,
}: Props) {
  const total = companies.length;

  const active = companies.filter(
    (c) => c.is_active !== false
  ).length;

  const passive = companies.filter(
    (c) => c.is_active === false
  ).length;

  const demo = companies.filter(
    (c) =>
      c.is_demo ||
      c.name
        .toLocaleLowerCase("tr-TR")
        .includes("d-sec demo")
  ).length;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        border: `1px solid ${BRAND.border}`,
        padding: 24,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: BRAND.red,
              fontSize: 30,
              fontWeight: 900,
            }}
          >
            Firma Yönetimi
          </h1>

          <div
            style={{
              marginTop: 6,
              color: BRAND.muted,
              fontSize: 15,
            }}
          >
            Firmalarınızı yönetin, çalışan sayılarını,
            modül durumlarını ve genel bilgileri tek
            ekrandan takip edin.
          </div>
        </div>

        <button
          onClick={onAddCompany}
          style={{
            border: "none",
            borderRadius: 12,
            padding: "14px 24px",
            background: BRAND.red,
            color: "#fff",
            cursor: "pointer",
            fontWeight: 900,
            fontSize: 15,
          }}
        >
          + Yeni Firma
        </button>
      </div>

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 14,
        }}
      >
        <StatCard
          title="Toplam Firma"
          value={total}
          color="#1565C0"
        />

        <StatCard
          title="Aktif Firma"
          value={active}
          color="#2E7D32"
        />

        <StatCard
          title="Pasif Firma"
          value={passive}
          color="#EF6C00"
        />

        <StatCard
          title="Demo Firma"
          value={demo}
          color={BRAND.red}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${color}22`,
        borderLeft: `5px solid ${color}`,
        borderRadius: 14,
        padding: 18,
        background: "#fff",
      }}
    >
      <div
        style={{
          color: "#6B7280",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 34,
          fontWeight: 900,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}