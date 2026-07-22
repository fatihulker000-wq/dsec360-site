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
  onFieldChange: (
    field: FieldName,
    value: string
  ) => void;
};

function RiskGeneralTab({
  department,
  process,
  activity,
  responsible,
  onFieldChange,
}: Props) {
  const fields: Array<{
    label: string;
    field: FieldName;
    value: string;
    placeholder: string;
  }> = [
    {
      label: "Departman",
      field: "department",
      value: department,
      placeholder: "Örn. Depo, Üretim, Mağaza",
    },
    {
      label: "Süreç / Lokasyon",
      field: "process",
      value: process,
      placeholder: "Örn. Sevkiyat alanı",
    },
    {
      label: "Faaliyet",
      field: "activity",
      value: activity,
      placeholder: "Yapılan faaliyeti yazın",
    },
    {
      label: "Risk Sorumlusu",
      field: "responsible",
      value: responsible,
      placeholder: "Sorumlu kişi veya görev",
    },
  ];

  return (
    <div
      className="riskGeneralGrid"
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(2,minmax(0,1fr))",
        gap: 12,
      }}
    >
      {fields.map((item) => (
        <label
          key={item.field}
          style={{
            display: "grid",
            gap: 6,
            minWidth: 0,
          }}
        >
          <span
            style={{
              color: "#64748b",
              fontSize: 12,
              fontWeight: 850,
            }}
          >
            {item.label}
          </span>

          <input
            value={item.value}
            autoComplete="off"
            placeholder={item.placeholder}
            onChange={(event) =>
              onFieldChange(
                item.field,
                event.currentTarget.value
              )
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
            grid-template-columns:
              1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(RiskGeneralTab);