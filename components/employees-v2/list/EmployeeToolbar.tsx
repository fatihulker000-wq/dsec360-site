"use client";

import type {
  EmployeeListCompany,
  EmployeeListFilters,
} from "./types";

export default function EmployeeToolbar({
  filters,
  companies,
  departments,
  jobTitles,
  readOnly = false,
  onChange,
  onRefresh,
  onAdd,
}: {
  filters: EmployeeListFilters;
  companies: EmployeeListCompany[];
  departments: string[];
  jobTitles: string[];
  readOnly?: boolean;
  onChange(filters: EmployeeListFilters): void;
  onRefresh(): void;
  onAdd(): void;
}) {
  return (
    <section
      style={{
        display: "grid",
        gap: 14,
        padding: 18,
        borderRadius: 20,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      {readOnly ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "11px 14px",
            borderRadius: 14,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            color: "#9a3412",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 850,
              lineHeight: 1.5,
            }}
          >
            Demo görünümü: Çalışan kayıtlarını inceleyebilirsiniz.
            Ekleme, düzenleme ve silme işlemleri kapalıdır.
          </div>

          <div
            style={{
              flexShrink: 0,
              padding: "6px 10px",
              borderRadius: 999,
              background: "#ffedd5",
              border: "1px solid #fdba74",
              fontSize: 11,
              fontWeight: 950,
            }}
          >
            SALT OKUNUR
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: readOnly
            ? "minmax(240px,1.5fr) repeat(4,minmax(150px,1fr)) auto"
            : "minmax(240px,1.5fr) repeat(4,minmax(150px,1fr)) auto auto",
          gap: 10,
          alignItems: "center",
        }}
      >
        <input
          value={filters.search}
          onChange={(event) =>
            onChange({
              ...filters,
              search: event.target.value,
            })
          }
          placeholder="Ad, ünvan, telefon, e-posta, sicil veya T.C. ara"
          style={fieldStyle}
        />

        <select
          value={filters.companyId}
          onChange={(event) =>
            onChange({
              ...filters,
              companyId: event.target.value,
            })
          }
          style={fieldStyle}
        >
          <option value="all">
            {companies.length === 1
              ? companies[0]?.name || "Firma"
              : "Tüm firmalar"}
          </option>

          {companies.length > 1
            ? companies.map((company) => (
                <option
                  key={company.id}
                  value={company.id}
                >
                  {company.name}
                </option>
              ))
            : null}
        </select>

        <select
          value={filters.department}
          onChange={(event) =>
            onChange({
              ...filters,
              department: event.target.value,
            })
          }
          style={fieldStyle}
        >
          <option value="all">Tüm departmanlar</option>

          {departments.map((department) => (
            <option
              key={department}
              value={department}
            >
              {department}
            </option>
          ))}
        </select>

        <select
          value={filters.jobTitle}
          onChange={(event) =>
            onChange({
              ...filters,
              jobTitle: event.target.value,
            })
          }
          style={fieldStyle}
        >
          <option value="all">Tüm ünvanlar</option>

          {jobTitles.map((jobTitle) => (
            <option
              key={jobTitle}
              value={jobTitle}
            >
              {jobTitle}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(event) =>
            onChange({
              ...filters,
              status:
                event.target
                  .value as EmployeeListFilters["status"],
            })
          }
          style={fieldStyle}
        >
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
        </select>

        <button
          type="button"
          onClick={onRefresh}
          style={darkButton}
        >
          Yenile
        </button>

        {!readOnly ? (
          <button
            type="button"
            onClick={onAdd}
            style={primaryButton}
          >
            + Çalışan Ekle
          </button>
        ) : null}
      </div>

      <style jsx>{`
        @media (max-width: 1200px) {
          section > div:last-child {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            ) !important;
          }
        }

        @media (max-width: 680px) {
          section > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: "10px 12px",
  background: "#fff",
  color: "#111827",
  fontSize: 13,
  fontWeight: 750,
  boxSizing: "border-box",
};

const darkButton: React.CSSProperties = {
  minHeight: 44,
  border: "none",
  borderRadius: 12,
  padding: "10px 15px",
  background: "#111827",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const primaryButton: React.CSSProperties = {
  ...darkButton,
  background: "#2563eb",
};