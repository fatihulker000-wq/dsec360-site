"use client";

import { Company } from "../types";
import { BRAND } from "../constants";
import CompanyActions from "./CompanyActions";

interface Props {
  company: Company;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CompanyCard({
  company,
  onDetail,
  onEdit,
  onDelete,
}: Props) {
  const dangerColor =
    company.tehlike_sinifi === "Çok Tehlikeli"
      ? "#C62828"
      : company.tehlike_sinifi === "Tehlikeli"
      ? "#EF6C00"
      : "#2E7D32";

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${BRAND.border}`,
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        <div>

          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: BRAND.text,
            }}
          >
            {company.name}
          </div>

          <div
            style={{
              marginTop: 8,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <Badge
              color={dangerColor}
              text={company.tehlike_sinifi || "-"}
            />

            <Badge
              color="#1565C0"
              text={company.nace_kodu || "-"}
            />

            {company.is_demo && (
              <Badge
                color="#8E24AA"
                text="DEMO"
              />
            )}
          </div>

        </div>

        <CompanyActions
          onDetail={onDetail}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 12,
        }}
      >
        <Info
          title="Yetkili"
          value={company.yetkili}
        />

        <Info
          title="Telefon"
          value={company.phone}
        />

        <Info
          title="Çalışan"
          value={String(company.user_count || 0)}
        />

        <Info
          title="Sektör"
          value={company.sektor}
        />
      </div>
    </div>
  );
}

function Badge({
  color,
  text,
}: {
  color: string;
  text: string;
}) {
  return (
    <span
      style={{
        background: color,
        color: "#fff",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {text}
    </span>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  return (
    <div>
      <div
        style={{
          color: "#6B7280",
          fontSize: 12,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 4,
          fontWeight: 700,
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}