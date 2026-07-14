"use client";

import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Lightbulb,
  Sparkles,
} from "lucide-react";

type ExecutiveSummaryProps = {
  insights: string[];
  criticalCount: number;
  recommendation?: string;
};

export default function ExecutiveSummary({
  insights,
  criticalCount,
  recommendation,
}: ExecutiveSummaryProps) {
  const visibleInsights = insights
    .filter((item) => item.trim().length > 0)
    .slice(0, 4);

  const safeRecommendation =
    recommendation?.trim() ||
    (criticalCount > 0
      ? "Kritik risk ve geciken aksiyonları önceliklendirerek sorumlu kişileri görevlendirin."
      : "Mevcut performansı koruyun ve yaklaşan faaliyetlerin planlamasını kontrol edin.");

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        padding: 24,
        border: "1px solid #ddd6fe",
        borderRadius: 24,
        background:
          "radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent 34%), linear-gradient(145deg, #ffffff, #faf7ff)",
        boxShadow: "0 14px 34px rgba(76, 29, 149, 0.08)",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 220,
          height: 220,
          top: -130,
          right: -80,
          borderRadius: 999,
          background: "rgba(139, 92, 246, 0.08)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
                borderRadius: 16,
                color: "#ffffff",
                background:
                  "linear-gradient(135deg, #7c3aed, #a855f7)",
                boxShadow:
                  "0 10px 24px rgba(124, 58, 237, 0.22)",
              }}
            >
              <Bot size={24} />
            </div>

            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#7c3aed",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                <Sparkles size={14} />
                DORA Intelligence
              </div>

              <h2
                style={{
                  margin: "6px 0 0",
                  color: "#111827",
                  fontSize: 20,
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                }}
              >
                Yönetici Özeti
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#6b7280",
                  fontSize: 13,
                }}
              >
                Canlı operasyon verilerinden oluşturulan karar desteği.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 12px",
              borderRadius: 999,
              background:
                criticalCount > 0 ? "#fee2e2" : "#dcfce7",
              color:
                criticalCount > 0 ? "#b91c1c" : "#15803d",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {criticalCount > 0 ? (
              <AlertTriangle size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )}

            {criticalCount > 0
              ? `${criticalCount} kritik konu`
              : "Kritik konu yok"}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginTop: 22,
          }}
        >
          {visibleInsights.length > 0 ? (
            visibleInsights.map((insight, index) => (
              <div
                key={`${insight}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: 14,
                  border: "1px solid #ede9fe",
                  borderRadius: 15,
                  background: "rgba(255, 255, 255, 0.8)",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    marginTop: 7,
                    flex: "0 0 auto",
                    borderRadius: 999,
                    background: "#8b5cf6",
                    boxShadow:
                      "0 0 0 5px rgba(139, 92, 246, 0.1)",
                  }}
                />

                <p
                  style={{
                    margin: 0,
                    color: "#374151",
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                >
                  {insight}
                </p>
              </div>
            ))
          ) : (
            <div
              style={{
                padding: 16,
                border: "1px dashed #ddd6fe",
                borderRadius: 15,
                color: "#6b7280",
                fontSize: 13,
              }}
            >
              Yönetici özeti oluşturmak için yeterli veri henüz
              bulunmuyor.
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            marginTop: 18,
            padding: 16,
            border: "1px solid #fde68a",
            borderRadius: 16,
            background:
              "linear-gradient(135deg, #fffbeb, #fff7ed)",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              display: "grid",
              placeItems: "center",
              flex: "0 0 auto",
              borderRadius: 12,
              color: "#b45309",
              background: "#fef3c7",
            }}
          >
            <Lightbulb size={19} />
          </div>

          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <strong
              style={{
                display: "block",
                color: "#92400e",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              Önerilen aksiyon
            </strong>

            <p
              style={{
                margin: "5px 0 0",
                color: "#78350f",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {safeRecommendation}
            </p>
          </div>

          <ArrowRight
            size={18}
            style={{
              marginTop: 9,
              flex: "0 0 auto",
              color: "#b45309",
            }}
          />
        </div>
      </div>
    </section>
  );
}