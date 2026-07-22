"use client";

import {
  memo,
  useMemo,
  useState,
} from "react";

import {
  RISK_LIBRARY,
  RISK_LIBRARY_SECTORS,
  type RiskLibraryItem,
} from "./riskLibrary";

type Props = {
  company: string;
  department: string;
  process: string;
  activity: string;
  responsible: string;
  selectedTemplateId: string;
  onFieldChange: (
    field:
      | "company"
      | "department"
      | "process"
      | "activity"
      | "responsible",
    value: string
  ) => void;
  onApplyTemplate: (
    item: RiskLibraryItem
  ) => void;
};

function RiskGeneralTab({
  company,
  department,
  process,
  activity,
  responsible,
  selectedTemplateId,
  onFieldChange,
  onApplyTemplate,
}: Props) {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("ALL");

  const filteredTemplates = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("tr-TR");

    return RISK_LIBRARY.filter((item) => {
      const sectorMatch =
        sector === "ALL" ||
        item.sector === sector;

      const text = [
        item.title,
        item.sector,
        item.category,
        item.activity,
        item.hazard,
        ...item.keywords,
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return (
        sectorMatch &&
        (!query || text.includes(query))
      );
    });
  }, [search, sector]);

  const fields = [
    {
      label: "Firma",
      field: "company" as const,
      value: company,
    },
    {
      label: "Departman",
      field: "department" as const,
      value: department,
    },
    {
      label: "Süreç / Lokasyon",
      field: "process" as const,
      value: process,
    },
    {
      label: "Faaliyet",
      field: "activity" as const,
      value: activity,
    },
    {
      label: "Risk Sorumlusu",
      field: "responsible" as const,
      value: responsible,
    },
  ];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section
        style={{
          borderRadius: 17,
          border: "1px solid #dbe3ec",
          background: "#f8fafc",
          padding: 14,
          display: "grid",
          gap: 11,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: 15,
              fontWeight: 950,
            }}
          >
            Hazır Risk Kütüphanesi
          </h3>

          <p
            style={{
              margin: "4px 0 0",
              color: "#64748b",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            Senaryo seçildiğinde risk alanları
            otomatik doldurulur.
          </p>
        </div>

        <div
          className="riskLibraryFilters"
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0,1fr) minmax(190px,.38fr)",
            gap: 9,
          }}
        >
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Forklift, elektrik, kaygan zemin..."
            style={{
              height: 43,
              borderRadius: 11,
              border: "1px solid #dbe3ec",
              padding: "0 11px",
            }}
          />

          <select
            value={sector}
            onChange={(event) =>
              setSector(event.target.value)
            }
            style={{
              height: 43,
              borderRadius: 11,
              border: "1px solid #dbe3ec",
              padding: "0 11px",
            }}
          >
            <option value="ALL">
              Tüm sektörler
            </option>

            {RISK_LIBRARY_SECTORS.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>
        </div>

        <div
          style={{
            maxHeight: 275,
            overflowY: "auto",
            display: "grid",
            gap: 8,
            contentVisibility: "auto",
          }}
        >
          {filteredTemplates.map((item) => {
            const selected =
              selectedTemplateId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  onApplyTemplate(item)
                }
                style={{
                  borderRadius: 13,
                  border: selected
                    ? "2px solid #6b1020"
                    : "1px solid #dbe3ec",
                  background: selected
                    ? "#fff1f2"
                    : "#ffffff",
                  padding: 12,
                  textAlign: "left",
                  cursor: "pointer",
                  display: "grid",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent:
                      "space-between",
                    gap: 8,
                  }}
                >
                  <strong
                    style={{
                      color: "#0f172a",
                      fontSize: 13,
                    }}
                  >
                    {item.title}
                  </strong>

                  <span
                    style={{
                      borderRadius: 999,
                      padding: "4px 8px",
                      background: "#f1f5f9",
                      color: "#475569",
                      fontSize: 10,
                      fontWeight: 850,
                    }}
                  >
                    {item.sector} ·{" "}
                    {item.category}
                  </span>
                </div>

                <span
                  style={{
                    color: "#64748b",
                    fontSize: 11,
                    lineHeight: 1.45,
                  }}
                >
                  {item.hazard}
                </span>
              </button>
            );
          })}

          {filteredTemplates.length === 0 ? (
            <div
              style={{
                borderRadius: 12,
                border:
                  "1px dashed #cbd5e1",
                padding: 18,
                color: "#94a3b8",
                textAlign: "center",
                fontSize: 12,
              }}
            >
              Uygun senaryo bulunamadı.
            </div>
          ) : null}
        </div>
      </section>

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
              onChange={(event) =>
                onFieldChange(
                  item.field,
                  event.target.value
                )
              }
              style={{
                height: 44,
                borderRadius: 11,
                border: "1px solid #dbe3ec",
                padding: "0 11px",
              }}
            />
          </label>
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 700px) {
          .riskLibraryFilters,
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