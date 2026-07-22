"use client";

import { memo } from "react";

type Props = {
  existingControl: string;
  proposedControl: string;
  onTextCommit: (
    field: "existingControl" | "proposedControl",
    value: string
  ) => void;
};

function RiskControlsTab({
  existingControl,
  proposedControl,
  onTextCommit,
}: Props) {
  const textAreaProps = {
    spellCheck: false,
    autoCorrect: "off",
    autoCapitalize: "off",
    translate: "no" as const,
    "data-gramm": "false",
    "data-gramm_editor": "false",
    "data-enable-grammarly": "false",
    "data-lt-active": "false",
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
          Mevcut Kontrol Tedbirleri
        </span>

        <textarea
          {...textAreaProps}
          defaultValue={existingControl}
          onBlur={(event) =>
            onTextCommit(
              "existingControl",
              event.currentTarget.value
            )
          }
          style={{
            minHeight: 220,
            borderRadius: 11,
            border: "1px solid #dbe3ec",
            padding: 11,
            resize: "vertical",
            contain: "content",
          }}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
          İlave / Önerilen Kontroller
        </span>

        <textarea
          {...textAreaProps}
          defaultValue={proposedControl}
          onBlur={(event) =>
            onTextCommit(
              "proposedControl",
              event.currentTarget.value
            )
          }
          style={{
            minHeight: 240,
            borderRadius: 11,
            border: "1px solid #dbe3ec",
            padding: 11,
            resize: "vertical",
            contain: "content",
          }}
        />
      </label>
    </div>
  );
}

export default memo(RiskControlsTab);