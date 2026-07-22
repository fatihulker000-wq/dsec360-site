"use client";

import {
  memo,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {
  RISK_LIBRARY,
  RISK_LIBRARY_SECTORS,
  type RiskLibraryItem,
} from "./riskLibrary";

type FieldName =
  | "company"
  | "department"
  | "process"
  | "activity"
  | "responsible";

type Props = {
  company: string;
  department: string;
  process: string;
  activity: string;
  responsible: string;
  selectedTemplateId: string;
  onFieldChange: (
    field: FieldName,
    value: string
  ) => void;
  onApplyTemplate: (
    item: RiskLibraryItem
  ) => void;
};

type FieldsProps = {
  company: string;
  department: string;
  process: string;
  activity: string;
  responsible: string;
  onFieldChange: (
    field: FieldName,
    value: string
  ) => void;
};

/**
 * Yalnızca form kutularını render eder.
 * Kütüphane listesi bu bileşenin içinde değildir.
 */
const GeneralFields = memo(
  function GeneralFields({
    company,
    department,
    process,
    activity,
    responsible,
    onFieldChange,
  }: FieldsProps) {
    const fields: Array<{
      label: string;
      field: FieldName;
      value: string;
    }> = [
      {
        label: "Firma",
        field: "company",
        value: company,
      },
      {
        label: "Departman",
        field: "department",
        value: department,
      },
      {
        label: "Süreç / Lokasyon",
        field: "process",
        value: process,
      },
      {
        label: "Faaliyet",
        field: "activity",
        value: activity,
      },
      {
        label: "Risk Sorumlusu",
        field: "responsible",
        value: responsible,
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
                border:
                  "1px solid #dbe3ec",
                padding: "0 11px",
                boxSizing: "border-box",
              }}
            />
          </label>
        ))}
      </div>
    );
  }
);

type LibraryProps = {
  selectedTemplateId: string;
  onApplyTemplate: (
    item: RiskLibraryItem
  ) => void;
};

/**
 * Büyük risk kütüphanesi ayrı ve memoize bileşendir.
 * Form alanına yazılırken yeniden render edilmez.
 */
const RiskLibraryPicker = memo(
  function RiskLibraryPicker({
    selectedTemplateId,
    onApplyTemplate,
  }: LibraryProps) {
    const [expanded, setExpanded] =
      useState(false);

    const [search, setSearch] =
      useState("");

    const [sector, setSector] =
      useState("ALL");

    const filteredTemplates =
      useMemo(() => {
        if (!expanded) {
          return [];
        }

        const query = search
          .trim()
          .toLocaleLowerCase("tr-TR");

        const matches =
          RISK_LIBRARY.filter((item) => {
            const sectorMatch =
              sector === "ALL" ||
              item.sector === sector;

            if (!sectorMatch) {
              return false;
            }

            if (!query) {
              return true;
            }

            const text = [
              item.title,
              item.sector,
              item.category,
              item.activity,
              item.process,
              item.hazard,
              ...item.keywords,
            ]
              .join(" ")
              .toLocaleLowerCase(
                "tr-TR"
              );

            return text.includes(query);
          });

        // Binlerce kartın aynı anda DOM'a
        // basılmasını kesin olarak engeller.
        return matches.slice(0, 30);
      }, [expanded, search, sector]);

    const totalMatchCount =
      useMemo(() => {
        if (!expanded) return 0;

        const query = search
          .trim()
          .toLocaleLowerCase("tr-TR");

        return RISK_LIBRARY.filter(
          (item) => {
            const sectorMatch =
              sector === "ALL" ||
              item.sector === sector;

            if (!sectorMatch) {
              return false;
            }

            if (!query) {
              return true;
            }

            const text = [
              item.title,
              item.sector,
              item.category,
              item.activity,
              item.process,
              item.hazard,
              ...item.keywords,
            ]
              .join(" ")
              .toLocaleLowerCase(
                "tr-TR"
              );

            return text.includes(query);
          }
        ).length;
      }, [expanded, search, sector]);

    return (
      <section
        style={{
          borderRadius: 17,
          border:
            "1px solid #dbe3ec",
          background: "#f8fafc",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() =>
            setExpanded(
              (current) => !current
            )
          }
          style={{
            width: "100%",
            minHeight: 62,
            border: 0,
            background: "transparent",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 12,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                background: "#fff1f2",
                color: "#6b1020",
              }}
            >
              <BookOpen size={18} />
            </span>

            <span>
              <strong
                style={{
                  display: "block",
                  color: "#0f172a",
                  fontSize: 14,
                }}
              >
                Hazır Risk Kütüphanesi
              </strong>

              <span
                style={{
                  display: "block",
                  marginTop: 3,
                  color: "#64748b",
                  fontSize: 11,
                }}
              >
                Yalnızca gerektiğinde
                açın ve senaryo seçin.
              </span>
            </span>
          </span>

          {expanded ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </button>

        {expanded ? (
          <div
            style={{
              borderTop:
                "1px solid #dbe3ec",
              padding: 14,
              display: "grid",
              gap: 11,
            }}
          >
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
                autoComplete="off"
                onChange={(event) =>
                  setSearch(
                    event.currentTarget
                      .value
                  )
                }
                placeholder="Forklift, elektrik, kaygan zemin..."
                style={{
                  height: 43,
                  borderRadius: 11,
                  border:
                    "1px solid #dbe3ec",
                  padding: "0 11px",
                }}
              />

              <select
                value={sector}
                onChange={(event) =>
                  setSector(
                    event.currentTarget
                      .value
                  )
                }
                style={{
                  height: 43,
                  borderRadius: 11,
                  border:
                    "1px solid #dbe3ec",
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
                color: "#64748b",
                fontSize: 11,
                fontWeight: 750,
              }}
            >
              {totalMatchCount} sonuç
              bulundu. Performans için ilk
              30 sonuç gösteriliyor.
            </div>

            <div
              style={{
                maxHeight: 290,
                overflowY: "auto",
                display: "grid",
                gap: 8,
              }}
            >
              {filteredTemplates.map(
                (item) => {
                  const selected =
                    selectedTemplateId ===
                    item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        onApplyTemplate(
                          item
                        )
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
                            color:
                              "#0f172a",
                            fontSize: 13,
                          }}
                        >
                          {item.title}
                        </strong>

                        <span
                          style={{
                            borderRadius:
                              999,
                            padding:
                              "4px 8px",
                            background:
                              "#f1f5f9",
                            color:
                              "#475569",
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
                }
              )}

              {filteredTemplates.length ===
              0 ? (
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
                  Uygun senaryo
                  bulunamadı.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    );
  }
);

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
  return (
    <div
      style={{
        display: "grid",
        gap: 14,
      }}
    >
      <RiskLibraryPicker
        selectedTemplateId={
          selectedTemplateId
        }
        onApplyTemplate={
          onApplyTemplate
        }
      />

      <GeneralFields
        company={company}
        department={department}
        process={process}
        activity={activity}
        responsible={responsible}
        onFieldChange={onFieldChange}
      />

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