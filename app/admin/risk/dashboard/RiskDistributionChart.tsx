"use client";

import { useMemo } from "react";
import {
  BarChart3,
  CircleDot,
  Gauge,
  PieChart,
} from "lucide-react";

import type { RiskDashboardTotals } from "../types";

type Props = {
  totals: RiskDashboardTotals;
  loading?: boolean;
};

type DistributionItem = {
  key:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "VERY_HIGH"
    | "INTOLERABLE";
  label: string;
  value: number;
  color: string;
  background: string;
  text: string;
};

function percent(value: number, total: number) {
  if (total <= 0) return 0;

  return Math.round((value / total) * 100);
}

function safeNumber(value: unknown) {
  if (typeof value !== "number") return 0;

  if (!Number.isFinite(value)) return 0;

  return Math.max(0, value);
}

export default function RiskDistributionChart({
  totals,
  loading = false,
}: Props) {
  /**
   * =========================================================
   * V2 RISK DISTRIBUTION
   *
   * RiskDashboardTotals artık her risk seviyesini:
   *
   * {
   *   open,
   *   closed,
   *   total
   * }
   *
   * şeklinde döndürüyor.
   *
   * Bu nedenle eski:
   * lowRisk
   * mediumRisk
   * highRisk
   * criticalRisk
   * intolerableRisk
   *
   * alanları kullanılmıyor.
   * =========================================================
   */

  const items = useMemo<DistributionItem[]>(
    () => [
      {
        key: "LOW",
        label: "Düşük",
        value: safeNumber(totals.low?.total),
        color: "#16a34a",
        background: "#dcfce7",
        text: "#166534",
      },
      {
        key: "MEDIUM",
        label: "Orta",
        value: safeNumber(totals.medium?.total),
        color: "#eab308",
        background: "#fef9c3",
        text: "#854d0e",
      },
      {
        key: "HIGH",
        label: "Yüksek",
        value: safeNumber(totals.high?.total),
        color: "#f97316",
        background: "#ffedd5",
        text: "#9a3412",
      },
      {
        key: "VERY_HIGH",
        label: "Çok Yüksek",
        value: safeNumber(totals.veryHigh?.total),
        color: "#dc2626",
        background: "#fee2e2",
        text: "#991b1b",
      },
      {
        key: "INTOLERABLE",
        label: "Kabul Edilemez",
        value: safeNumber(
          totals.intolerable?.total
        ),
        color: "#7f1d1d",
        background: "#fecaca",
        text: "#7f1d1d",
      },
    ],
    [totals]
  );

  /**
   * totalRisk API tarafından gönderilen ana toplamdır.
   *
   * Güvenlik amacıyla sayı değilse veya negatifse 0 kabul edilir.
   */
  const total = safeNumber(totals.totalRisk);

  /**
   * Grafikteki dağılım toplamı.
   *
   * Normal şartlarda totalRisk ile aynı olmalıdır.
   * Ancak backend geçişlerinde veri tutarsızlığı olması halinde
   * SVG oranlarının bozulmaması için grafik toplamı ayrıca tutulur.
   */
  const distributionTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.value,
        0
      ),
    [items]
  );

  /**
   * Görsel yüzdelerde risk seviyelerinin gerçek toplamını
   * esas alıyoruz.
   *
   * Eğer dağılım henüz oluşmamış ancak totalRisk gelmişse
   * totalRisk fallback olarak kullanılır.
   */
  const chartTotal =
    distributionTotal > 0
      ? distributionTotal
      : total;

  const dominant = useMemo(() => {
    return [...items].sort(
      (a, b) => b.value - a.value
    )[0];
  }, [items]);

  /**
   * V2 modelinde:
   *
   * criticalIntervention =
   * Açık Çok Yüksek + Açık Kabul Edilemez
   *
   * Bu sayı yönetim müdahalesi gerektiren aktif kritik riskleri
   * temsil eder.
   */
  const criticalIntervention = safeNumber(
    totals.criticalIntervention
  );

  /**
   * Risk kapanma yüzdesi backend tarafından hesaplanıyor.
   * Değeri 0-100 sınırında tutuyoruz.
   */
  const closureRate = Math.min(
    100,
    safeNumber(totals.closureRate)
  );

  const circumference = 2 * Math.PI * 78;

  let runningOffset = 0;

  return (
    <section
      style={{
        borderRadius: 22,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        padding: 18,
        boxShadow:
          "0 14px 35px rgba(15,23,42,0.05)",
      }}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#0f172a",
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            <PieChart
              size={19}
              color="#6d28d9"
            />

            Risk Dağılımı
          </div>

          <p
            style={{
              margin: "5px 0 0",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            Risk seviyelerinin kurumsal dağılım
            görünümü
          </p>
        </div>

        <span
          style={{
            borderRadius: 999,
            padding: "6px 10px",
            background: "#f5f3ff",
            color: "#6d28d9",
            border: "1px solid #ddd6fe",
            fontSize: 12,
            fontWeight: 850,
          }}
        >
          {loading
            ? "Yükleniyor"
            : `${total} kayıt`}
        </span>
      </div>

      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <div
          className="distributionSkeleton"
          style={{
            height: 320,
            borderRadius: 18,
            background:
              "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
            backgroundSize: "200% 100%",
          }}
        />
      ) : total === 0 &&
        distributionTotal === 0 ? (
        /* =================================================
           EMPTY STATE
        ================================================== */

        <div
          style={{
            height: 320,
            borderRadius: 18,
            border: "1px dashed #cbd5e1",
            display: "grid",
            placeItems: "center",
            color: "#94a3b8",
            textAlign: "center",
            padding: 24,
          }}
        >
          <div>
            <CircleDot size={36} />

            <p
              style={{
                margin: "10px 0 0",
                fontWeight: 800,
              }}
            >
              Dağılım oluşturacak risk kaydı
              yok.
            </p>
          </div>
        </div>
      ) : (
        /* =================================================
           DISTRIBUTION CONTENT
        ================================================== */

        <div
          className="distributionGrid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr)",
            gap: 18,
            alignItems: "start",
            minWidth: 0,
          }}
        >
          {/* =================================================
              DONUT
          ================================================== */}

          <div
            style={{
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "min(210px, 72vw)",
                height: "min(210px, 72vw)",
              }}
            >
              <svg
                viewBox="0 0 200 200"
                width="100%"
                height="100%"
                role="img"
                aria-label="Risk dağılım grafiği"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="78"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="22"
                />

                {items.map((item) => {
                  const ratio =
                    chartTotal > 0
                      ? item.value /
                        chartTotal
                      : 0;

                  const segmentLength =
                    circumference * ratio;

                  const dashOffset =
                    -runningOffset;

                  runningOffset +=
                    segmentLength;

                  return (
                    <circle
                      key={item.key}
                      cx="100"
                      cy="100"
                      r="78"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="22"
                      strokeDasharray={`${segmentLength} ${
                        circumference -
                        segmentLength
                      }`}
                      strokeDashoffset={
                        dashOffset
                      }
                      strokeLinecap="butt"
                      transform="rotate(-90 100 100)"
                    />
                  );
                })}
              </svg>

              {/* CENTER */}

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#0f172a",
                      fontSize: 34,
                      fontWeight: 950,
                      lineHeight: 1,
                    }}
                  >
                    {total ||
                      distributionTotal}
                  </div>

                  <div
                    style={{
                      marginTop: 7,
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 850,
                    }}
                  >
                    Toplam Risk
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                DOMINANT LEVEL
            ================================================== */}

            <div
              style={{
                marginTop: 16,
                width: "100%",
                borderRadius: 16,
                background:
                  dominant.background,
                border: `1px solid ${dominant.color}33`,
                padding: 13,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: 11,
                      fontWeight: 850,
                    }}
                  >
                    En yoğun seviye
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      color: dominant.text,
                      fontSize: 17,
                      fontWeight: 950,
                    }}
                  >
                    {dominant.label}
                  </div>
                </div>

                <div
                  style={{
                    color: dominant.text,
                    fontSize: 23,
                    fontWeight: 950,
                  }}
                >
                  %
                  {percent(
                    dominant.value,
                    chartTotal
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              DISTRIBUTION LIST
          ================================================== */}

          <div
            style={{
              display: "grid",
              gap: 12,
              minWidth: 0,
            }}
          >
            {items.map((item) => {
              const itemPercent =
                percent(
                  item.value,
                  chartTotal
                );

              return (
                <div
                  key={item.key}
                  style={{
                    display: "grid",
                    gap: 7,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "space-between",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 11,
                          height: 11,
                          borderRadius: 999,
                          background:
                            item.color,
                          flex: "0 0 auto",
                        }}
                      />

                      <span
                        style={{
                          color: "#475569",
                          fontSize: 12,
                          fontWeight: 850,
                          minWidth: 0,
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>

                    <div
                      style={{
                        color: "#0f172a",
                        fontSize: 12,
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                        flex: "0 0 auto",
                      }}
                    >
                      {item.value} · %
                      {itemPercent}
                    </div>
                  </div>

                  <div
                    style={{
                      height: 10,
                      borderRadius: 999,
                      background: "#e2e8f0",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${itemPercent}%`,
                        minWidth:
                          item.value > 0
                            ? 8
                            : 0,
                        height: "100%",
                        borderRadius: 999,
                        background:
                          item.color,
                        transition:
                          "width .25s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* =================================================
                MANAGEMENT KPI CARDS
            ================================================== */}

            <div
              style={{
                marginTop: 5,
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {/* CLOSURE RATE */}

              <div
                style={{
                  borderRadius: 15,
                  padding: 13,
                  background: "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                }}
              >
                <Gauge
                  size={17}
                  color="#475569"
                />

                <div
                  style={{
                    marginTop: 8,
                    color: "#0f172a",
                    fontSize: 22,
                    fontWeight: 950,
                  }}
                >
                  %{Math.round(
                    closureRate
                  )}
                </div>

                <div
                  style={{
                    color: "#64748b",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  Risk kapanma oranı
                </div>
              </div>

              {/* CRITICAL INTERVENTION */}

              <div
                style={{
                  borderRadius: 15,
                  padding: 13,
                  background:
                    criticalIntervention >
                    0
                      ? "#fff7f7"
                      : "#f8fafc",
                  border:
                    criticalIntervention >
                    0
                      ? "1px solid #fecaca"
                      : "1px solid #e2e8f0",
                }}
              >
                <BarChart3
                  size={17}
                  color={
                    criticalIntervention >
                    0
                      ? "#b91c1c"
                      : "#475569"
                  }
                />

                <div
                  style={{
                    marginTop: 8,
                    color:
                      criticalIntervention >
                      0
                        ? "#991b1b"
                        : "#0f172a",
                    fontSize: 22,
                    fontWeight: 950,
                  }}
                >
                  {
                    criticalIntervention
                  }
                </div>

                <div
                  style={{
                    color: "#64748b",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  Kritik müdahale
                </div>

                <div
                  style={{
                    marginTop: 3,
                    color: "#94a3b8",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  Açık Çok Yüksek +
                  Kabul Edilemez
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .distributionSkeleton {
          animation: distribution-loading
            1.2s linear infinite;
        }

        @keyframes distribution-loading {
          from {
            background-position: 200% 0;
          }

          to {
            background-position: -200% 0;
          }
        }

        @media (max-width: 850px) {
          .distributionGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}