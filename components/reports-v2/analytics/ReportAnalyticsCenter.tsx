"use client";

import { useMemo } from "react";

import ReportBarChart from "./ReportBarChart";
import ReportHeatmap from "./ReportHeatmap";
import ReportLineChart from "./ReportLineChart";
import ReportMonthlyChangeGrid from "./ReportMonthlyChangeGrid";

import {
  buildReportAnalyticsData,
} from "./ReportAnalyticsUtils";

import type {
  ReportAnalyticsInput,
} from "./types";

export default function ReportAnalyticsCenter({
  input,
}: {
  input: ReportAnalyticsInput;
}) {
  const data = useMemo(
    () => buildReportAnalyticsData(input),
    [input]
  );

  return (
    <section
      style={{
        display: "grid",
        gap: 17,
      }}
    >
      <div
        style={{
          padding: 22,
          borderRadius: 22,
          color: "#fff",
          background:
            "linear-gradient(135deg,#111827 0%,#1e3a8a 50%,#2563eb 100%)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            opacity: 0.82,
          }}
        >
          D-SEC ANALYTICS CENTER
        </div>

        <h2
          style={{
            margin: "8px 0 0",
            fontSize: 30,
            fontWeight: 950,
          }}
        >
          Grafik ve Trend Analizleri
        </h2>

        <p
          style={{
            margin: "10px 0 0",
            maxWidth: 850,
            lineHeight: 1.7,
            opacity: 0.9,
          }}
        >
          Eğitim, denetim, DÖF, risk, sağlık, KKD ve kaza performansını dönemsel olarak karşılaştırın.
        </p>
      </div>

      <ReportMonthlyChangeGrid
        items={data.monthlyChanges}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(360px,1fr))",
          gap: 16,
        }}
      >
        <ReportLineChart
          title="Eğitim Tamamlama Trendi"
          subtitle="Dönemsel eğitim performansı"
          rows={data.trainingTrend}
          primaryLabel="Tamamlanan"
          secondaryLabel="Eksik"
        />

        <ReportLineChart
          title="Denetim ve DÖF Trendi"
          subtitle="Tamamlanan denetimler ve açık DÖF değişimi"
          rows={data.auditTrend}
          primaryLabel="Denetim"
          secondaryLabel="Açık DÖF"
        />

        <ReportLineChart
          title="Kaza / Ramak Kala Trendi"
          subtitle="Olay sayılarının dönemsel değişimi"
          rows={data.accidentTrend}
          primaryLabel="Kaza"
          secondaryLabel="Ramak Kala"
        />

        <ReportLineChart
          title="Risk Trendi"
          subtitle="Yüksek ve orta risk yoğunluğu"
          rows={data.riskTrend}
          primaryLabel="Yüksek Risk"
          secondaryLabel="Orta Risk"
        />

        <ReportLineChart
          title="Sağlık Takip Trendi"
          subtitle="Muayene ve yaklaşan sağlık kayıtları"
          rows={data.healthTrend}
          primaryLabel="Tamamlanan"
          secondaryLabel="Yaklaşan"
        />

        <ReportLineChart
          title="KKD Teslim Trendi"
          subtitle="Teslim edilen ve bekleyen KKD kayıtları"
          rows={data.ppeTrend}
          primaryLabel="Teslim"
          secondaryLabel="Bekleyen"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(360px,1fr))",
          gap: 16,
        }}
      >
        <ReportBarChart
          rows={data.companyComparison}
        />

        <ReportHeatmap
          cells={data.heatmap}
        />
      </div>
    </section>
  );
}
