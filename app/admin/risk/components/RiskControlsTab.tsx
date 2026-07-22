"use client";

import { memo } from "react";

import type {
  ControlSuggestion,
  RiskControlBundle,
} from "./riskControlLibrary";

function SuggestionCard({
  item,
  onAdd,
}: {
  item: ControlSuggestion;
  onAdd: (
    item: ControlSuggestion
  ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(item)}
      style={{
        borderRadius: 13,
        border: "1px solid #dbe3ec",
        background: "#ffffff",
        padding: 11,
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
        {item.text}
      </span>
    </button>
  );
}

type Props = {
  existingControl: string;
  proposedControl: string;
  bundle: RiskControlBundle;
  onTextChange: (
    field:
      | "existingControl"
      | "proposedControl",
    value: string
  ) => void;
  onAddExisting: (
    item: ControlSuggestion
  ) => void;
  onAddAdditional: (
    item: ControlSuggestion
  ) => void;
};

function RiskControlsTab({
  existingControl,
  proposedControl,
  bundle,
  onTextChange,
  onAddExisting,
  onAddAdditional,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gap: 14,
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
          Hazır Mevcut Kontroller
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 8,
            contentVisibility: "auto",
          }}
        >
          {bundle.existing.map((item) => (
            <SuggestionCard
              key={item.id}
              item={item}
              onAdd={onAddExisting}
            />
          ))}
        </div>
      </section>

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
          Mevcut Kontrol Tedbirleri
        </span>

        <textarea
          value={existingControl}
          onChange={(event) =>
            onTextChange(
              "existingControl",
              event.target.value
            )
          }
          style={{
            minHeight: 180,
            borderRadius: 11,
            border: "1px solid #dbe3ec",
            padding: 11,
            resize: "vertical",
          }}
        />
      </label>

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
          Hazır İlave Kontroller
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 8,
            contentVisibility: "auto",
          }}
        >
          {bundle.additional.map((item) => (
            <SuggestionCard
              key={item.id}
              item={item}
              onAdd={onAddAdditional}
            />
          ))}
        </div>
      </section>

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
          İlave / Önerilen Kontroller
        </span>

        <textarea
          value={proposedControl}
          onChange={(event) =>
            onTextChange(
              "proposedControl",
              event.target.value
            )
          }
          style={{
            minHeight: 210,
            borderRadius: 11,
            border: "1px solid #dbe3ec",
            padding: 11,
            resize: "vertical",
          }}
        />
      </label>
    </div>
  );
}

export default memo(RiskControlsTab);