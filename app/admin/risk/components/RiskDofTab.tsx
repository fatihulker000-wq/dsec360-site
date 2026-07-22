"use client";

import { memo } from "react";
import { Clock3 } from "lucide-react";

function toDateInput(value?: number | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toISOString().slice(0, 10);
}

function toMillis(value: string) {
  if (!value) return null;
  const result = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(result) ? null : result;
}

type Props = {
  completed: boolean;
  dueDateMillis: number | null;
  suggestedDays: number;
  onCompletedChange: (value: boolean) => void;
  onDueDateChange: (value: number | null) => void;
};

function RiskDofTab({
  completed,
  dueDateMillis,
  suggestedDays,
  onCompletedChange,
  onDueDateChange,
}: Props) {
  const applySuggestedDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + suggestedDays);
    onDueDateChange(date.getTime());
  };

  return (
    <div style={{ display: "grid", gap: 13 }}>
      <div
        className="riskDofGrid"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2,minmax(0,1fr))",
          gap: 12,
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
            DÖF Durumu
          </span>

          <select
            value={completed ? "CLOSED" : "OPEN"}
            onChange={(event) =>
              onCompletedChange(event.currentTarget.value === "CLOSED")
            }
            style={{
              height: 44,
              borderRadius: 11,
              border: "1px solid #dbe3ec",
              padding: "0 11px",
            }}
          >
            <option value="OPEN">Açık</option>
            <option value="CLOSED">Kapalı</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
            Termin Tarihi
          </span>

          <input
            type="date"
            value={toDateInput(dueDateMillis)}
            onChange={(event) =>
              onDueDateChange(toMillis(event.currentTarget.value))
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
          {suggestedDays === 0 ? "Bugün" : `${suggestedDays} gün`}
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 700px) {
          .riskDofGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(RiskDofTab);