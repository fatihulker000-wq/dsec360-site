"use client";

import {
  BRAND,
  COMPANY_SORT,
  COMPANY_STATUS,
} from "../constants";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;

  status: string;
  onStatusChange: (value: string) => void;

  sort: string;
  onSortChange: (value: string) => void;
}

export default function CompanyToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
}: Props) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${BRAND.border}`,
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "2fr 1fr 1fr",
          gap: 14,
        }}
      >
        <input
          value={search}
          onChange={(e) =>
            onSearchChange(e.target.value)
          }
          placeholder="Firma ara..."
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: `1px solid ${BRAND.border}`,
            fontSize: 14,
          }}
        />

        <select
          value={status}
          onChange={(e) =>
            onStatusChange(e.target.value)
          }
          style={{
            padding: "12px",
            borderRadius: 12,
            border: `1px solid ${BRAND.border}`,
          }}
        >
          {COMPANY_STATUS.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) =>
            onSortChange(e.target.value)
          }
          style={{
            padding: "12px",
            borderRadius: 12,
            border: `1px solid ${BRAND.border}`,
          }}
        >
          {COMPANY_SORT.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}