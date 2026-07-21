"use client";

import { useMemo } from "react";
import {
  BarChart3,
  CheckCircle2,
  CircleDot,
  Gauge,
  ShieldAlert,
} from "lucide-react";

export type RiskChartLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskChartMethod = "MATRIX" | "FINE_KINNEY";
export type RiskChartDofStatus = "OPEN" | "CLOSED";

export type RiskChartRecord = {
  id: string;
  method: RiskChartMethod;
  level: RiskChartLevel;
  dofStatus: RiskChartDofStatus;
};

type Props = {
  records: RiskChartRecord[];
};

const LEVELS: Array<{
  key: RiskChartLevel;
  label: string;
  color: string;
}> = [
  { key: "CRITICAL", label: "Kritik", color: "#dc2626" },
  { key: "HIGH", label: "Yüksek", color: "#f97316" },
  { key: "MEDIUM", label: "Orta", color: "#facc15" },
  { key: "LOW", label: "Düşük", color: "#22c55e" },
];

function PercentBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div style={{ display: "grid", gap: 7 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span
          style={{
            color: "#475569",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {label}
        </span>

        <span
          style={{
            color: "#0f172a",
            fontSize: 13,
            fontWeight: 900,
          }}
        >
          {value} · %{percent}
        </span>
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
            width: `${percent}%`,
            minWidth: value > 0 ? 8 : 0,
            height: "100%",
            borderRadius: 999,
            background: color,
            transition: "width .25s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function RiskCharts({ records }: Props) {
  const stats = useMemo(() => {
    const total = records.length;

    const byLevel = {
      CRITICAL: records.filter((record) => record.level === "CRITICAL").length,
      HIGH: records.filter((record) => record.level === "HIGH").length,
      MEDIUM: records.filter((record) => record.level === "MEDIUM").length,
      LOW: records.filter((record) => record.level === "LOW").length,
    };

    const matrix = records.filter(
      (record) => record.method === "MATRIX"
    ).length;

    const fineKinney = records.filter(
      (record) => record.method === "FINE_KINNEY"
    ).length;

    const openDof = records.filter(
      (record) => record.dofStatus === "OPEN"
    ).length;

    const closedDof = records.filter(
      (record) => record.dofStatus === "CLOSED"
    ).length;

    return {
      total,
      byLevel,
      matrix,
      fineKinney,
      openDof,
      closedDof,
    };
  }, [records]);

  return (
    <section
      className="riskChartsGrid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 14,
      }}
    >
      <article
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
            alignItems: "center",
            gap: 9,
            marginBottom: 18,
          }}
        >
          <BarChart3 size={19} color="#1d4ed8" />
          <div>
            <h3
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 17,
                fontWeight: 900,
              }}
            >
              Risk Seviyesi Dağılımı
            </h3>

            <p
              style={{
                margin: "3px 0 0",
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              Aktif kayıtların seviye bazlı görünümü
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 15 }}>
          {LEVELS.map((item) => (
            <PercentBar
              key={item.key}
              label={item.label}
              value={stats.byLevel[item.key]}
              total={stats.total}
              color={item.color}
            />
          ))}
        </div>
      </article>

      <article
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
            alignItems: "center",
            gap: 9,
            marginBottom: 18,
          }}
        >
          <Gauge size={19} color="#6d28d9" />
          <div>
            <h3
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 17,
                fontWeight: 900,
              }}
            >
              Yöntem Dağılımı
            </h3>

            <p
              style={{
                margin: "3px 0 0",
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              5×5 Matris ve Fine-Kinney karşılaştırması
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 15 }}>
          <PercentBar
            label="5×5 Matris"
            value={stats.matrix}
            total={stats.total}
            color="#2563eb"
          />

          <PercentBar
            label="Fine-Kinney"
            value={stats.fineKinney}
            total={stats.total}
            color="#7c3aed"
          />
        </div>

        <div
          style={{
            marginTop: 22,
            padding: 14,
            borderRadius: 16,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              color: "#64748b",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            Toplam analiz
          </div>

          <div
            style={{
              marginTop: 5,
              color: "#0f172a",
              fontSize: 28,
              fontWeight: 950,
            }}
          >
            {stats.total}
          </div>
        </div>
      </article>

      <article
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
            alignItems: "center",
            gap: 9,
            marginBottom: 18,
          }}
        >
          <ShieldAlert size={19} color="#b91c1c" />
          <div>
            <h3
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 17,
                fontWeight: 900,
              }}
            >
              DÖF Durumu
            </h3>

            <p
              style={{
                margin: "3px 0 0",
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              Açık ve kapalı düzeltici faaliyetler
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 15 }}>
          <PercentBar
            label="Açık DÖF"
            value={stats.openDof}
            total={stats.total}
            color="#dc2626"
          />

          <PercentBar
            label="Kapalı DÖF"
            value={stats.closedDof}
            total={stats.total}
            color="#059669"
          />
        </div>

        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <div
            style={{
              padding: 13,
              borderRadius: 15,
              background: "#fef2f2",
              border: "1px solid #fecaca",
            }}
          >
            <CircleDot size={17} color="#b91c1c" />

            <div
              style={{
                marginTop: 8,
                color: "#b91c1c",
                fontSize: 22,
                fontWeight: 950,
              }}
            >
              {stats.openDof}
            </div>

            <div
              style={{
                color: "#991b1b",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              Açık
            </div>
          </div>

          <div
            style={{
              padding: 13,
              borderRadius: 15,
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
            }}
          >
            <CheckCircle2 size={17} color="#047857" />

            <div
              style={{
                marginTop: 8,
                color: "#047857",
                fontSize: 22,
                fontWeight: 950,
              }}
            >
              {stats.closedDof}
            </div>

            <div
              style={{
                color: "#065f46",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              Kapalı
            </div>
          </div>
        </div>
      </article>

      <style jsx>{`
        @media (max-width: 1050px) {
          .riskChartsGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}