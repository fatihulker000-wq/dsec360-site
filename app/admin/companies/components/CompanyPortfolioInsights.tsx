"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Company,
} from "../types";

import {
  getDemoCompanyData,
  type DemoActivity,
  type DemoMetrics,
} from "../services/demoCompanyService";

interface Props {
  companies: Company[];
}

export default function CompanyPortfolioInsights({
  companies,
}: Props) {
  const demo =
    useMemo(
      () =>
        companies.find(
          (company) =>
            company.name
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                "d-sec demo lojistik"
              )
        ) || null,
      [companies]
    );

  const [
    metrics,
    setMetrics,
  ] =
    useState<DemoMetrics | null>(
      null
    );

  const [
    activities,
    setActivities,
  ] =
    useState<DemoActivity[]>([]);

  useEffect(() => {
    if (!demo?.id) {
      setMetrics(null);
      setActivities([]);
      return;
    }

    let active = true;

    void getDemoCompanyData(
      demo.id
    )
      .then((result) => {
        if (!active) {
          return;
        }

        setMetrics(
          result.metrics ||
            null
        );

        setActivities(
          Array.isArray(
            result.activities
          )
            ? result.activities
            : []
        );
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setMetrics(null);
        setActivities([]);
      });

    return () => {
      active = false;
    };
  }, [demo?.id]);

  if (!metrics) {
    return null;
  }

  const trainingRate =
    metrics.training_total > 0
      ? Math.round(
          (
            metrics.training_completed /
            metrics.training_total
          ) * 100
        )
      : 0;

  const inspectionRate =
    metrics.inspection_total > 0
      ? Math.round(
          (
            metrics.inspection_completed /
            metrics.inspection_total
          ) * 100
        )
      : 0;

  const healthRate =
    metrics.health_total > 0
      ? Math.round(
          (
            metrics.health_current /
            metrics.health_total
          ) * 100
        )
      : 0;

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(0,1.3fr) minmax(300px,0.7fr)",
        gap: 16,
        marginBottom: 18,
      }}
    >
      <div
        style={{
          padding: 20,
          borderRadius: 18,
          border:
            "1px solid #e5e7eb",
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            gap: 16,
            alignItems:
              "flex-start",
          }}
        >
          <div>
            <div
              style={{
                color:
                  "#6b7280",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              DEMO FİRMA KARNESİ
            </div>

            <h3
              style={{
                margin:
                  "5px 0 0",
                fontSize: 22,
              }}
            >
              Operasyonel Görünüm
            </h3>
          </div>

          <div
            style={{
              minWidth: 82,
              textAlign: "center",
              padding:
                "10px 12px",
              borderRadius: 16,
              background:
                metrics.overall_score >=
                80
                  ? "#ecfdf5"
                  : "#fff7ed",
              color:
                metrics.overall_score >=
                80
                  ? "#047857"
                  : "#c2410c",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 950,
              }}
            >
              {metrics.overall_score}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
              }}
            >
              GENEL SKOR
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(150px,1fr))",
            gap: 12,
            marginTop: 18,
          }}
        >
          <Metric
            label="Eğitim"
            value={`${trainingRate}%`}
            tone="#2563eb"
          />
          <Metric
            label="Denetim"
            value={`${inspectionRate}%`}
            tone="#7c3aed"
          />
          <Metric
            label="Sağlık"
            value={`${healthRate}%`}
            tone="#059669"
          />
          <Metric
            label="Açık DÖF"
            value={String(
              metrics.open_dof
            )}
            tone="#dc2626"
          />
          <Metric
            label="Risk Skoru"
            value={String(
              metrics.risk_score
            )}
            tone="#ea580c"
          />
          <Metric
            label="Kaza / Ramak Kala"
            value={String(
              metrics.accident_count +
                metrics.near_miss_count
            )}
            tone="#be123c"
          />
        </div>
      </div>

      <div
        style={{
          padding: 20,
          borderRadius: 18,
          color: "#fff",
          background:
            "linear-gradient(145deg,#172554,#1e3a8a)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            color:
              "rgba(255,255,255,0.7)",
          }}
        >
          DORA AI • SON AKTİVİTELER
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
            marginTop: 14,
          }}
        >
          {activities
            .slice(0, 4)
            .map(
              (activity) => (
                <div
                  key={
                    activity.id
                  }
                  style={{
                    padding: 11,
                    borderRadius: 12,
                    background:
                      "rgba(255,255,255,0.08)",
                    border:
                      "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    {activity.title}
                  </div>
                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 11,
                      lineHeight: 1.45,
                      color:
                        "rgba(255,255,255,0.72)",
                    }}
                  >
                    {activity.description}
                  </div>
                </div>
              )
            )}
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 14,
        background:
          "#f8fafc",
        border:
          "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 5,
          color: tone,
          fontSize: 24,
          fontWeight: 950,
        }}
      >
        {value}
      </div>
    </div>
  );
}
