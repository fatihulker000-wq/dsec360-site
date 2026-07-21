"use client";

import { Fragment, useMemo } from "react";
import { Grid3X3 } from "lucide-react";

export type HeatMapRisk = {
  id: string;
  method: "MATRIX" | "FINE_KINNEY";
  probability?: number | null;
  severity?: number | null;
};

type Props = {
  risks: HeatMapRisk[];
  selectedCell?: { probability: number; severity: number } | null;
  onCellClick?: (
    probability: number,
    severity: number,
    riskIds: string[]
  ) => void;
};

function getCellColors(score: number) {
  if (score >= 20) {
    return {
      background: "#dc2626",
      color: "#ffffff",
      border: "#b91c1c",
    };
  }

  if (score >= 15) {
    return {
      background: "#f97316",
      color: "#ffffff",
      border: "#ea580c",
    };
  }

  if (score >= 8) {
    return {
      background: "#facc15",
      color: "#713f12",
      border: "#eab308",
    };
  }

  return {
    background: "#22c55e",
    color: "#ffffff",
    border: "#16a34a",
  };
}

export default function RiskHeatMap({
  risks,
  selectedCell,
  onCellClick,
}: Props) {
  const matrixRisks = useMemo(
    () =>
      risks.filter(
        (risk) =>
          risk.method === "MATRIX" &&
          Number(risk.probability) >= 1 &&
          Number(risk.probability) <= 5 &&
          Number(risk.severity) >= 1 &&
          Number(risk.severity) <= 5
      ),
    [risks]
  );

  const cells = useMemo(() => {
    const next = new Map<string, string[]>();

    matrixRisks.forEach((risk) => {
      const probability = Number(risk.probability);
      const severity = Number(risk.severity);
      const key = `${probability}-${severity}`;

      next.set(key, [...(next.get(key) || []), risk.id]);
    });

    return next;
  }, [matrixRisks]);

  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 22,
        padding: 18,
        boxShadow: "0 14px 35px rgba(15,23,42,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
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
            <Grid3X3 size={19} />
            5×5 Risk Isı Haritası
          </div>

          <p
            style={{
              margin: "5px 0 0",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            Hücreye tıklayarak ilgili matris riskini seçebilirsiniz.
          </p>
        </div>

        <span
          style={{
            borderRadius: 999,
            padding: "6px 10px",
            background: "#f1f5f9",
            color: "#475569",
            fontSize: 12,
            fontWeight: 850,
          }}
        >
          {matrixRisks.length} matris kaydı
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div
          style={{
            minWidth: 560,
            display: "grid",
            gridTemplateColumns: "52px repeat(5, minmax(82px, 1fr))",
            gap: 8,
          }}
        >
          <div />

          {[1, 2, 3, 4, 5].map((severity) => (
            <div
              key={`severity-${severity}`}
              style={{
                minHeight: 34,
                display: "grid",
                placeItems: "center",
                color: "#64748b",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              Ş {severity}
            </div>
          ))}

          {[5, 4, 3, 2, 1].map((probability) => (
            <Fragment key={`row-${probability}`}>
              <div
                style={{
                  minHeight: 72,
                  display: "grid",
                  placeItems: "center",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                O {probability}
              </div>

              {[1, 2, 3, 4, 5].map((severity) => {
                const key = `${probability}-${severity}`;
                const riskIds = cells.get(key) || [];
                const score = probability * severity;
                const colors = getCellColors(score);
                const active =
                  selectedCell?.probability === probability &&
                  selectedCell?.severity === severity;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      onCellClick?.(
                        probability,
                        severity,
                        riskIds
                      )
                    }
                    title={`Olasılık ${probability}, Şiddet ${severity}, Skor ${score}, ${riskIds.length} kayıt`}
                    style={{
                      minHeight: 72,
                      borderRadius: 14,
                      border: active
                        ? "3px solid #111827"
                        : `1px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.color,
                      cursor: "pointer",
                      padding: 8,
                      boxShadow: active
                        ? "0 0 0 3px rgba(15,23,42,0.15)"
                        : "none",
                      transition: "transform .15s ease",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 950,
                        lineHeight: 1,
                      }}
                    >
                      {riskIds.length}
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        fontWeight: 800,
                        opacity: 0.9,
                      }}
                    >
                      Skor {score}
                    </div>
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 16,
          color: "#64748b",
          fontSize: 12,
          fontWeight: 750,
        }}
      >
        {[
          ["#22c55e", "Düşük"],
          ["#facc15", "Orta"],
          ["#f97316", "Yüksek"],
          ["#dc2626", "Kritik"],
        ].map(([color, label]) => (
          <span
            key={label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: color,
              }}
            />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}