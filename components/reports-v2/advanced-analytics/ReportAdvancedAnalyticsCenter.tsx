"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchAdvancedAnalytics,
} from "./ReportAdvancedAnalyticsClient";

import {
  mapAdvancedAnalytics,
} from "./ReportAdvancedAnalyticsMapper";

import ReportAdvancedHeatmap from "./ReportAdvancedHeatmap";
import ReportCompanyComparisonTable from "./ReportCompanyComparisonTable";

import type {
  AdvancedAnalyticsResponse,
} from "./types";

export interface ReportAdvancedAnalyticsCenterProps {
  companyId: string;
  months?: number;
}

export default function ReportAdvancedAnalyticsCenter({
  companyId,
  months = 12,
}: ReportAdvancedAnalyticsCenterProps) {
  const [response, setResponse] =
    useState<AdvancedAnalyticsResponse | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!companyId) {
        setResponse(null);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result =
          await fetchAdvancedAnalytics(
            companyId,
            months
          );

        if (!active) return;

        if (!result.success) {
          setResponse(null);
          setError(
            result.error ||
              "Gelişmiş analitik verileri alınamadı."
          );
          return;
        }

        setResponse(result);
      } catch (errorValue: unknown) {
        if (!active) return;

        setResponse(null);
        setError(
          errorValue instanceof Error
            ? errorValue.message
            : "Gelişmiş analitik verileri alınamadı."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [companyId, months]);

  const data = useMemo(
    () => mapAdvancedAnalytics(response),
    [response]
  );

  if (loading) {
    return (
      <section
        data-pdf-section="true"
        style={panelStyle}
      >
        Gelişmiş analitik verileri yükleniyor...
      </section>
    );
  }

  if (error) {
    return (
      <section
        data-pdf-section="true"
        style={{
          ...panelStyle,
          color: "#991b1b",
          background: "#fff7f7",
          borderColor: "#fecaca",
        }}
      >
        {error}
      </section>
    );
  }

  const latest =
    data.trends[data.trends.length - 1];

  return (
    <section
      style={{
        display: "grid",
        gap: 18,
      }}
    >
      <section
        data-pdf-section="true"
        style={{
          ...panelStyle,
          color: "#fff",
          background:
            "linear-gradient(135deg,#111827 0%,#1e3a8a 48%,#2563eb 100%)",
          border: "none",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            opacity: 0.82,
            letterSpacing: 1,
          }}
        >
          D-SEC ADVANCED ANALYTICS
        </div>

        <h2
          style={{
            margin: "8px 0 0",
            fontSize: 28,
            fontWeight: 950,
          }}
        >
          Gelişmiş Analitik Merkezi
        </h2>

        <p
          style={{
            margin: "10px 0 0",
            lineHeight: 1.7,
            opacity: 0.9,
          }}
        >
          Son {months} aylık eğitim, denetim,
          DÖF, risk ve olay eğilimleri.
        </p>
      </section>

      <section
        data-pdf-section="true"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(170px,1fr))",
          gap: 12,
        }}
      >
        <Metric
          label="Tamamlanan Eğitim"
          value={latest?.trainingCompleted || 0}
        />

        <Metric
          label="Tamamlanan Denetim"
          value={latest?.auditsCompleted || 0}
        />

        <Metric
          label="Açık DÖF"
          value={latest?.openDof || 0}
        />

        <Metric
          label="Yüksek Risk"
          value={latest?.highRisk || 0}
        />

        <Metric
          label="İş Kazası"
          value={latest?.accident || 0}
        />
      </section>

      <section
        data-pdf-section="true"
        style={panelStyle}
      >
        <h3 style={titleStyle}>
          Aylık Performans Trendleri
        </h3>

        {data.trends.length === 0 ? (
          <div style={emptyStyle}>
            Trend verisi bulunamadı.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 10,
            }}
          >
            {data.trends.map((item) => (
              <article
                key={item.period}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "90px repeat(5,minmax(80px,1fr))",
                  gap: 10,
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 14,
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  overflowX: "auto",
                }}
              >
                <strong>{item.period}</strong>

                <SmallMetric
                  label="Eğitim"
                  value={item.trainingCompleted}
                />

                <SmallMetric
                  label="Denetim"
                  value={item.auditsCompleted}
                />

                <SmallMetric
                  label="Açık DÖF"
                  value={item.openDof}
                />

                <SmallMetric
                  label="Yüksek Risk"
                  value={item.highRisk}
                />

                <SmallMetric
                  label="Kaza"
                  value={item.accident}
                />
              </article>
            ))}
          </div>
        )}
      </section>

      <div data-pdf-section="true">
        <ReportCompanyComparisonTable
          rows={data.comparisons}
        />
      </div>

      <div data-pdf-section="true">
        <ReportAdvancedHeatmap
          cells={data.heatmap}
        />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        background: "#fff",
        border: "1px solid #e5e7eb",
        boxShadow:
          "0 8px 24px rgba(15,23,42,.05)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 850,
          color: "#64748b",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 7,
          fontSize: 28,
          fontWeight: 950,
          color: "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SmallMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: "#64748b",
          fontWeight: 800,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 17,
          fontWeight: 950,
          color: "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 20,
  background: "#fff",
  border: "1px solid #e5e7eb",
  breakInside: "avoid",
  pageBreakInside: "avoid",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 14px",
  fontSize: 20,
  fontWeight: 950,
};

const emptyStyle: React.CSSProperties = {
  padding: 18,
  textAlign: "center",
  color: "#64748b",
  background: "#f8fafc",
  borderRadius: 14,
};
