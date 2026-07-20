"use client";

import type { CompanyItem } from "../types";

type Props = {
  companies: CompanyItem[];
  loading: boolean;
  value: string;
  onChange: (company: CompanyItem | null) => void;
};

export default function CompanySelect({
  companies,
  loading,
  value,
  onChange,
}: Props) {
  return (
    <label style={{ display: "grid", gap: 7 }}>
      <span style={{ fontSize: 13, fontWeight: 850, color: "#334155" }}>
        Firma
      </span>

      <select
        value={value}
        disabled={loading || companies.length === 0}
        onChange={(event) => {
          const selected =
            companies.find(
              (company) => company.id === event.target.value
            ) ?? null;

          onChange(selected);
        }}
        style={inputStyle}
      >
        {loading ? (
          <option value="">Firmalar yükleniyor...</option>
        ) : companies.length === 0 ? (
          <option value="">Aktif firma bulunamadı</option>
        ) : (
          companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
              {company.localId
                ? ` • Mobil ID: ${company.localId}`
                : " • Mobil ID eksik"}
            </option>
          ))
        )}
      </select>
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  boxSizing: "border-box",
  borderRadius: 14,
  border: "1px solid #dbe2ea",
  background: "#ffffff",
  color: "#172033",
  padding: "11px 13px",
  outline: "none",
  fontSize: 14,
};
