"use client";

import { IncidentAnalyticsFilters } from "./types";

interface Props {
  value: IncidentAnalyticsFilters;
  departments: string[];
  locations: string[];
  incidentTypes: string[];
  onChange(
    value: IncidentAnalyticsFilters
  ): void;
  onReset(): void;
}

export default function ExecutiveFilters({
  value,
  departments,
  locations,
  incidentTypes,
  onChange,
  onReset,
}: Props) {
  function update(
    field: keyof IncidentAnalyticsFilters,
    fieldValue: string
  ) {
    onChange({
      ...value,
      [field]: fieldValue || undefined,
    });
  }

  return (
    <section style={cardStyle}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(170px,1fr))",
          gap: 14,
          alignItems: "end",
        }}
      >
        <Field label="Departman">
          <select
            value={value.department || ""}
            onChange={(event) =>
              update(
                "department",
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              Tüm Departmanlar
            </option>

            {departments.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Lokasyon">
          <select
            value={value.location || ""}
            onChange={(event) =>
              update(
                "location",
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              Tüm Lokasyonlar
            </option>

            {locations.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Olay Türü">
          <select
            value={value.incidentType || ""}
            onChange={(event) =>
              update(
                "incidentType",
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              Tüm Olay Türleri
            </option>

            {incidentTypes.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Başlangıç">
          <input
            type="date"
            value={value.startDate || ""}
            onChange={(event) =>
              update(
                "startDate",
                event.target.value
              )
            }
            style={inputStyle}
          />
        </Field>

        <Field label="Bitiş">
          <input
            type="date"
            value={value.endDate || ""}
            onChange={(event) =>
              update(
                "endDate",
                event.target.value
              )
            }
            style={inputStyle}
          />
        </Field>

        <button
          type="button"
          onClick={onReset}
          style={{
            minHeight: 44,
            border: "none",
            borderRadius: 12,
            padding: "11px 16px",
            background: "#111827",
            color: "#fff",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Filtreleri Temizle
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: 7,
      }}
    >
      <span
        style={{
          color: "#64748b",
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        {label}
      </span>

      {children}
    </label>
  );
}

const cardStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e5e7eb",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  borderRadius: 12,
  border: "1px solid #d1d5db",
  background: "#fff",
  padding: "10px 12px",
  fontFamily: "inherit",
};