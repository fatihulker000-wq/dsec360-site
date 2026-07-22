"use client";

import { memo } from "react";

type FieldName =
  | "department"
  | "process"
  | "activity"
  | "responsible";

type Props = {
  department: string;
  process: string;
  activity: string;
  responsible: string;
  onFieldInput: (
    field: FieldName,
    value: string
  ) => void;
};

function RiskGeneralTab({
  department,
  process,
  activity,
  responsible,
  onFieldInput,
}: Props) {
  const fields = [
    ["Departman", "department", department, "Örn. Depo, Üretim, Mağaza"],
    ["Süreç / Lokasyon", "process", process, "Örn. Sevkiyat alanı"],
    ["Faaliyet", "activity", activity, "Yapılan faaliyeti yazın"],
    ["Risk Sorumlusu", "responsible", responsible, "Sorumlu kişi veya görev"],
  ] as const;

  return (
    <div
      className="riskGeneralGrid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2,minmax(0,1fr))",
        gap: 12,
      }}
    >
      {fields.map(([label, field, value, placeholder]) => (
        <label key={field} style={{ display: "grid", gap: 6, minWidth: 0 }}>
          <span style={{ color: "#64748b", fontSize: 12, fontWeight: 850 }}>
            {label}
          </span>

          <input
            defaultValue={value}
            autoComplete="off"
            spellCheck={false}
            placeholder={placeholder}
            onInput={(event) =>
              onFieldInput(field, event.currentTarget.value)
            }
            style={{
              width: "100%",
              height: 44,
              borderRadius: 11,
              border: "1px solid #dbe3ec",
              padding: "0 11px",
              boxSizing: "border-box",
            }}
          />
        </label>
      ))}

      <style jsx>{`
        @media (max-width: 700px) {
          .riskGeneralGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(RiskGeneralTab);