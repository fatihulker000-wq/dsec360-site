"use client";

import {
  AlertOctagon,
  ArrowRight,
} from "lucide-react";

import type { RiskRecord } from "../types";

type Props = {
  record: RiskRecord;
  scenario?: string[];
};

function inferScenario(record: RiskRecord) {
  const hazard =
    record.hazard?.trim() ||
    "Tehlikeli durum";

  const consequence =
    record.consequence?.trim() ||
    "Çalışanın yaralanması veya operasyonel kayıp";

  return [
    `${hazard} çalışma sırasında ortaya çıkar veya kontrol dışına çıkar.`,
    "Çalışan tehlike bölgesinde bulunur ve mevcut kontroller olayı tamamen engelleyemez.",
    consequence,
    "Faaliyet durdurulur, ilk müdahale ve olay bildirimi süreçleri başlatılır.",
    "Kök neden analizi yapılır ve ilave kontrol tedbirleri tamamlanmadan benzer faaliyet güvenli kabul edilmez.",
  ];
}

export default function RiskAccidentScenario({
  record,
  scenario,
}: Props) {
  const steps =
    scenario && scenario.length > 0
      ? scenario
      : inferScenario(record);

  return (
    <section
      style={{
        borderRadius: 18,
        border: "1px solid #fecaca",
        background: "#fef2f2",
        padding: 15,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          color: "#b91c1c",
          fontWeight: 950,
        }}
      >
        <AlertOctagon size={19} />
        Muhtemel Olay Zinciri
      </div>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gap: 8,
        }}
      >
        {steps.map((step, index) => (
          <div
            key={`${index}-${step}`}
            style={{
              display: "grid",
              gridTemplateColumns:
                "25px 17px minmax(0,1fr)",
              gap: 7,
              alignItems: "start",
            }}
          >
            <div
              style={{
                width: 25,
                height: 25,
                borderRadius: 9,
                background: "#b91c1c",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                fontSize: 10,
                fontWeight: 950,
              }}
            >
              {index + 1}
            </div>

            <ArrowRight
              size={15}
              color="#b91c1c"
              style={{ marginTop: 5 }}
            />

            <div
              style={{
                color: "#334155",
                fontSize: 11,
                lineHeight: 1.5,
              }}
            >
              {step}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}