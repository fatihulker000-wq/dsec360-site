"use client";

import { Company } from "../types";
import { BRAND } from "../constants";

interface Props {
  companies: Company[];
}

export default function CompanyStats({
  companies,
}: Props) {
  const total = companies.length;

  const active = companies.filter(
    (c) => c.is_active !== false
  ).length;

  const passive = total - active;

  const employeeCount = companies.reduce(
    (total, company) =>
      total + Number(company.user_count || 0),
    0
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(180px,1fr))",
        gap: 16,
        marginBottom: 24,
      }}
    >
      <Card
        title="Toplam Firma"
        value={total}
        color="#1565C0"
      />

      <Card
        title="Aktif Firma"
        value={active}
        color="#2E7D32"
      />

      <Card
        title="Pasif Firma"
        value={passive}
        color="#EF6C00"
      />

      <Card
        title="Toplam Çalışan"
        value={employeeCount}
        color={BRAND.red}
      />
    </div>
  );
}

function Card({
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
        background: "#fff",
        borderRadius: 16,
        border: `1px solid ${BRAND.border}`,
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: BRAND.muted,
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 10,
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