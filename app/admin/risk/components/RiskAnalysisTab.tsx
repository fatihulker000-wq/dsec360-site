"use client";

import { memo } from "react";
import type { RiskMethod } from "../types";

type ScoreOption = {
  value: number;
  title: string;
};

const PROBABILITY_OPTIONS: ScoreOption[] = [
  { value: 0.2, title: "Pratikte imkânsız" },
  { value: 0.5, title: "Çok düşük" },
  { value: 1, title: "Düşük" },
  { value: 3, title: "Olası" },
  { value: 6, title: "Yüksek" },
  { value: 10, title: "Çok yüksek" },
];

const FREQUENCY_OPTIONS: ScoreOption[] = [
  { value: 0.5, title: "Yılda bir veya seyrek" },
  { value: 1, title: "Ayda bir" },
  { value: 2, title: "Haftada bir" },
  { value: 3, title: "Günde bir" },
  { value: 6, title: "Günde birçok kez" },
  { value: 10, title: "Sürekli" },
];

const SEVERITY_OPTIONS: ScoreOption[] = [
  { value: 1, title: "Önemsiz" },
  { value: 3, title: "İlk yardım" },
  { value: 7, title: "İş günü kaybı" },
  { value: 15, title: "Kalıcı yaralanma" },
  { value: 40, title: "Tek ölüm" },
  { value: 100, title: "Birden fazla ölüm" },
];

const MATRIX_PROBABILITY: ScoreOption[] = [
  { value: 1, title: "Çok düşük" },
  { value: 2, title: "Düşük" },
  { value: 3, title: "Orta" },
  { value: 4, title: "Yüksek" },
  { value: 5, title: "Çok yüksek" },
];

const MATRIX_SEVERITY: ScoreOption[] = [
  { value: 1, title: "Önemsiz" },
  { value: 2, title: "Hafif" },
  { value: 3, title: "Ciddi" },
  { value: 4, title: "Çok ciddi" },
  { value: 5, title: "Felaket" },
];

function CompactOptions({
  title,
  options,
  value,
  onSelect,
}: {
  title: string;
  options: ScoreOption[];
  value: number;
  onSelect: (value: number) => void;
}) {
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <h4 style={{ margin: 0, fontSize: 13, fontWeight: 900 }}>{title}</h4>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {options.map((item) => {
          const selected = value === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onSelect(item.value)}
              style={{
                minHeight: 38,
                borderRadius: 10,
                border: selected
                  ? "2px solid #6b1020"
                  : "1px solid #dbe3ec",
                background: selected ? "#fff1f2" : "#ffffff",
                padding: "0 11px",
                cursor: "pointer",
                fontWeight: selected ? 900 : 700,
              }}
            >
              {item.value} · {item.title}
            </button>
          );
        })}
      </div>
    </section>
  );
}

type Props = {
  method: RiskMethod;
  hazard: string;
  consequence: string;
  probability: number;
  frequency: number;
  severity: number;
  onMethodChange: (value: RiskMethod) => void;
  onTextInput: (
    field: "hazard" | "consequence",
    value: string
  ) => void;
  onScoreChange: (
    field: "probability" | "frequency" | "severity",
    value: number
  ) => void;
};

function RiskAnalysisTab({
  method,
  hazard,
  consequence,
  probability,
  frequency,
  severity,
  onMethodChange,
  onTextInput,
  onScoreChange,
}: Props) {
  const noTextAssist = {
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
          Değerlendirme Yöntemi
        </span>

        <select
          value={method}
          onChange={(event) =>
            onMethodChange(event.currentTarget.value as RiskMethod)
          }
          style={{
            height: 44,
            borderRadius: 11,
            border: "1px solid #dbe3ec",
            padding: "0 11px",
          }}
        >
          <option value="FINE_KINNEY">Fine-Kinney</option>
          <option value="MATRIX_5X5">5×5 Risk Matrisi</option>
        </select>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
          Tehlikenin Ayrıntılı Açıklaması
        </span>

        <textarea
          {...noTextAssist}
          defaultValue={hazard}
          onInput={(event) =>
            onTextInput("hazard", event.currentTarget.value)
          }
          style={{
            minHeight: 120,
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
          Olası Sonuçlar
        </span>

        <textarea
          {...noTextAssist}
          defaultValue={consequence}
          onInput={(event) =>
            onTextInput("consequence", event.currentTarget.value)
          }
          style={{
            minHeight: 120,
            borderRadius: 11,
            border: "1px solid #dbe3ec",
            padding: 11,
            resize: "vertical",
            contain: "content",
          }}
        />
      </label>

      {method === "FINE_KINNEY" ? (
        <>
          <CompactOptions
            title="Olasılık"
            options={PROBABILITY_OPTIONS}
            value={probability}
            onSelect={(value) => onScoreChange("probability", value)}
          />
          <CompactOptions
            title="Maruziyet Frekansı"
            options={FREQUENCY_OPTIONS}
            value={frequency}
            onSelect={(value) => onScoreChange("frequency", value)}
          />
          <CompactOptions
            title="Şiddet"
            options={SEVERITY_OPTIONS}
            value={severity}
            onSelect={(value) => onScoreChange("severity", value)}
          />
        </>
      ) : (
        <>
          <CompactOptions
            title="Olasılık"
            options={MATRIX_PROBABILITY}
            value={probability}
            onSelect={(value) => onScoreChange("probability", value)}
          />
          <CompactOptions
            title="Şiddet"
            options={MATRIX_SEVERITY}
            value={severity}
            onSelect={(value) => onScoreChange("severity", value)}
          />
        </>
      )}
    </div>
  );
}

export default memo(RiskAnalysisTab);