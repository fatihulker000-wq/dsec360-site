"use client";

import { memo } from "react";

import {
  Clock3,
} from "lucide-react";

import type {
  DofSuggestion,
  RiskControlBundle,
} from "./riskControlLibrary";

function toDateInput(
  value?: number | null
) {
  if (!value) return "";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toISOString().slice(0, 10);
}

function toMillis(value: string) {
  if (!value) return null;

  const result = new Date(
    `${value}T00:00:00`
  ).getTime();

  return Number.isNaN(result)
    ? null
    : result;
}

type Props = {
  completed: boolean;
  dueDateMillis: number | null;
  suggestedDays: number;
  bundle: RiskControlBundle;
  onCompletedChange: (
    value: boolean
  ) => void;
  onDueDateChange: (
    value: number | null
  ) => void;
  onApplySuggestion: (
    item: DofSuggestion
  ) => void;
};

function RiskDofTab({
  completed,
  dueDateMillis,
  suggestedDays,
  bundle,
  onCompletedChange,
  onDueDateChange,
  onApplySuggestion,
}: Props) {
  const applySuggestedDate = () => {
    const date = new Date();

    date.setDate(
      date.getDate() + suggestedDays
    );

    onDueDateChange(date.getTime());
  };

  return (
    <div
      style={{
        display: "grid",
        gap: 13,
      }}
    >
      <section
        style={{
          borderRadius: 16,
          border: "1px solid #dbe3ec",
          background: "#f8fafc",
          padding: 13,
          display: "grid",
          gap: 9,
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: 14,
            fontWeight: 950,
          }}
        >
          Hazır DÖF Önerileri
        </h3>

        <div
          style={{
            display: "grid",
            gap: 8,
            contentVisibility: "auto",
          }}
        >
          {bundle.dof.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                onApplySuggestion(item)
              }
              style={{
                borderRadius: 13,
                border: "1px solid #dbe3ec",
                background: "#ffffff",
                padding: 12,
                textAlign: "left",
                cursor: "pointer",
                display: "grid",
                gap: 5,
              }}
            >
              <strong
                style={{
                  color: "#0f172a",
                  fontSize: 12,
                }}
              >
                + {item.title}
              </strong>

              <span
                style={{
                  color: "#64748b",
                  fontSize: 10,
                  lineHeight: 1.45,
                }}
              >
                {item.action}
              </span>

              <span
                style={{
                  color: "#6b1020",
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                {item.responsibleRole} ·{" "}
                {item.suggestedDays === 0
                  ? "Bugün"
                  : `${item.suggestedDays} gün`}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div
        className="riskDofGrid"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2,minmax(0,1fr))",
          gap: 12,
        }}
      >
        <label
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
            DÖF Durumu
          </span>

          <select
            value={
              completed
                ? "CLOSED"
                : "OPEN"
            }
            onChange={(event) =>
              onCompletedChange(
                event.target.value ===
                  "CLOSED"
              )
            }
            style={{
              height: 44,
              borderRadius: 11,
              border: "1px solid #dbe3ec",
              padding: "0 11px",
            }}
          >
            <option value="OPEN">
              Açık
            </option>

            <option value="CLOSED">
              Kapalı
            </option>
          </select>
        </label>

        <label
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
            Termin Tarihi
          </span>

          <input
            type="date"
            value={toDateInput(
              dueDateMillis
            )}
            onChange={(event) =>
              onDueDateChange(
                toMillis(
                  event.target.value
                )
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

        <button
          type="button"
          onClick={applySuggestedDate}
          style={{
            gridColumn: "1 / -1",
            minHeight: 43,
            borderRadius: 11,
            border: "1px solid #fde68a",
            background: "#fffbeb",
            color: "#92400e",
            padding: "0 13px",
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            fontWeight: 850,
            cursor: "pointer",
          }}
        >
          <Clock3 size={16} />
          Önerilen termini uygula:{" "}
          {suggestedDays === 0
            ? "Bugün"
            : `${suggestedDays} gün`}
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 700px) {
          .riskDofGrid {
            grid-template-columns:
              1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(RiskDofTab);