"use client";

import { useMemo } from "react";

import DoraEmployeeMetrics from "./DoraEmployeeMetrics";
import DoraEmployeeRecommendations from "./DoraEmployeeRecommendations";
import DoraEmployeeScoreCard from "./DoraEmployeeScoreCard";
import DoraEmployeeSignals from "./DoraEmployeeSignals";

import { analyzeEmployeeWithDora } from "./DoraEmployeeScoreEngine";

import type {
  DoraEmployeeAnalysisInput,
} from "./types";

export default function DoraEmployeeAnalysisPanel({
  input,
}: {
  input: DoraEmployeeAnalysisInput;
}) {
  const analysis = useMemo(
    () => analyzeEmployeeWithDora(input),
    [input]
  );

  return (
    <section
      style={{
        display: "grid",
        gap: 16,
      }}
    >
      <DoraEmployeeScoreCard
        analysis={analysis}
      />

      <DoraEmployeeMetrics
        metrics={analysis.metrics}
      />

      <DoraEmployeeSignals
        positiveSignals={
          analysis.positiveSignals
        }
        riskSignals={
          analysis.riskSignals
        }
      />

      <DoraEmployeeRecommendations
        recommendations={
          analysis.recommendations
        }
      />

      <div
        style={{
          padding: 12,
          borderRadius: 13,
          background: "#f8fafc",
          color: "#64748b",
          fontSize: 11,
          lineHeight: 1.55,
        }}
      >
        Bu analiz, D-SEC içindeki mevcut çalışan, eğitim, sağlık, KKD, risk, kaza, belge ve ajanda kayıtlarından üretilen karar destek değerlendirmesidir. Nihai İSG ve sağlık kararları yetkili profesyoneller tarafından verilmelidir.
      </div>
    </section>
  );
}
