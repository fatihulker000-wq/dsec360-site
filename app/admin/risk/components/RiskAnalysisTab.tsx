"use client";

import { memo } from "react";

import type {
  RiskMethod,
} from "../types";

type ScoreOption = {
  value: number;
  title: string;
  description: string;
};

const PROBABILITY_OPTIONS: ScoreOption[] = [
  { value: 0.2, title: "Pratikte imkânsız", description: "Normal şartlarda beklenmez." },
  { value: 0.5, title: "Çok düşük", description: "Çok seyrek gerçekleşebilir." },
  { value: 1, title: "Düşük", description: "Nadir gerçekleşebilir." },
  { value: 3, title: "Olası", description: "Zaman zaman gerçekleşebilir." },
  { value: 6, title: "Yüksek", description: "Gerçekleşmesi kuvvetle muhtemeldir." },
  { value: 10, title: "Çok yüksek", description: "Gerçekleşmesi beklenir." },
];

const FREQUENCY_OPTIONS: ScoreOption[] = [
  { value: 0.5, title: "Yılda bir veya seyrek", description: "İstisnai maruziyet." },
  { value: 1, title: "Ayda bir", description: "Aylık maruziyet." },
  { value: 2, title: "Haftada bir", description: "Haftalık maruziyet." },
  { value: 3, title: "Günde bir", description: "Günlük maruziyet." },
  { value: 6, title: "Günde birçok kez", description: "Sık tekrarlanan maruziyet." },
  { value: 10, title: "Sürekli", description: "Kesintisiz maruziyet." },
];

const SEVERITY_OPTIONS: ScoreOption[] = [
  { value: 1, title: "Önemsiz", description: "İş gücü kaybı beklenmez." },
  { value: 3, title: "İlk yardım", description: "Basit tıbbi müdahale." },
  { value: 7, title: "İş günü kaybı", description: "Geçici iş göremezlik." },
  { value: 15, title: "Kalıcı yaralanma", description: "Kalıcı sağlık etkisi." },
  { value: 40, title: "Tek ölüm", description: "Ölümle sonuçlanabilir." },
  { value: 100, title: "Birden fazla ölüm", description: "Afet boyutunda sonuç." },
];

const MATRIX_PROBABILITY: ScoreOption[] = [
  { value: 1, title: "Çok düşük", description: "Beklenmez." },
  { value: 2, title: "Düşük", description: "Nadiren." },
  { value: 3, title: "Orta", description: "Zaman zaman." },
  { value: 4, title: "Yüksek", description: "Sıklıkla." },
  { value: 5, title: "Çok yüksek", description: "Beklenir." },
];

const MATRIX_SEVERITY: ScoreOption[] = [
  { value: 1, title: "Önemsiz", description: "Çok hafif etki." },
  { value: 2, title: "Hafif", description: "İlk yardım." },
  { value: 3, title: "Ciddi", description: "İş günü kaybı." },
  { value: 4, title: "Çok ciddi", description: "Kalıcı yaralanma." },
  { value: 5, title: "Felaket", description: "Birden fazla ölüm." },
];

function OptionGrid({
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
    <section
      style={{
        display: "grid",
        gap: 9,
      }}
    >
      <h4
        style={{
          margin: 0,
          color: "#0f172a",
          fontSize: 14,
          fontWeight: 950,
        }}
      >
        {title}
      </h4>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(185px,1fr))",
          gap: 8,
          contentVisibility: "auto",
        }}
      >
        {options.map((item) => {
          const selected =
            value === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                onSelect(item.value)
              }
              style={{
                minHeight: 75,
                borderRadius: 13,
                border: selected
                  ? "2px solid #6b1020"
                  : "1px solid #dbe3ec",
                background: selected
                  ? "#fff1f2"
                  : "#ffffff",
                padding: 10,
                display: "grid",
                gridTemplateColumns:
                  "35px 1fr",
                gap: 8,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  display: "grid",
                  placeItems: "center",
                  background: selected
                    ? "#6b1020"
                    : "#f1f5f9",
                  color: selected
                    ? "#ffffff"
                    : "#334155",
                  fontWeight: 950,
                }}
              >
                {item.value}
              </span>

              <span>
                <strong
                  style={{
                    display: "block",
                    color: "#0f172a",
                    fontSize: 11,
                  }}
                >
                  {item.title}
                </strong>

                <span
                  style={{
                    display: "block",
                    marginTop: 3,
                    color: "#64748b",
                    fontSize: 10,
                  }}
                >
                  {item.description}
                </span>
              </span>
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
  onMethodChange: (
    value: RiskMethod
  ) => void;
  onTextChange: (
    field: "hazard" | "consequence",
    value: string
  ) => void;
  onScoreChange: (
    field:
      | "probability"
      | "frequency"
      | "severity",
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
  onTextChange,
  onScoreChange,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gap: 14,
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
          Değerlendirme Yöntemi
        </span>

        <select
          value={method}
          onChange={(event) =>
            onMethodChange(
              event.target.value as RiskMethod
            )
          }
          style={{
            height: 44,
            borderRadius: 11,
            border: "1px solid #dbe3ec",
            padding: "0 11px",
          }}
        >
          <option value="FINE_KINNEY">
            Fine-Kinney
          </option>

          <option value="MATRIX_5X5">
            5×5 Risk Matrisi
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
          Tehlikenin Ayrıntılı Açıklaması
        </span>

        <textarea
          value={hazard}
          onChange={(event) =>
            onTextChange(
              "hazard",
              event.target.value
            )
          }
          style={{
            minHeight: 105,
            borderRadius: 11,
            border: "1px solid #dbe3ec",
            padding: 11,
            resize: "vertical",
          }}
        />
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
          Olası Sonuçlar
        </span>

        <textarea
          value={consequence}
          onChange={(event) =>
            onTextChange(
              "consequence",
              event.target.value
            )
          }
          style={{
            minHeight: 105,
            borderRadius: 11,
            border: "1px solid #dbe3ec",
            padding: 11,
            resize: "vertical",
          }}
        />
      </label>

      {method === "FINE_KINNEY" ? (
        <>
          <OptionGrid
            title="Olasılık"
            options={PROBABILITY_OPTIONS}
            value={probability}
            onSelect={(value) =>
              onScoreChange(
                "probability",
                value
              )
            }
          />

          <OptionGrid
            title="Maruziyet Frekansı"
            options={FREQUENCY_OPTIONS}
            value={frequency}
            onSelect={(value) =>
              onScoreChange(
                "frequency",
                value
              )
            }
          />

          <OptionGrid
            title="Şiddet"
            options={SEVERITY_OPTIONS}
            value={severity}
            onSelect={(value) =>
              onScoreChange(
                "severity",
                value
              )
            }
          />
        </>
      ) : (
        <>
          <OptionGrid
            title="Olasılık"
            options={MATRIX_PROBABILITY}
            value={probability}
            onSelect={(value) =>
              onScoreChange(
                "probability",
                value
              )
            }
          />

          <OptionGrid
            title="Şiddet"
            options={MATRIX_SEVERITY}
            value={severity}
            onSelect={(value) =>
              onScoreChange(
                "severity",
                value
              )
            }
          />
        </>
      )}
    </div>
  );
}

export default memo(RiskAnalysisTab);