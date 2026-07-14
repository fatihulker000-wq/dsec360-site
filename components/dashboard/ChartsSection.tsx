"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { BRAND, cardStyle } from "./styles";
import type { CbsSummary, TrendItem } from "./types";

type RiskCompanyItem = {
  name: string;
  count: number;
};

type ChartsSectionProps = {
  isMobile: boolean;
  dashboardTrendData: TrendItem[];
  dashboardPieData: {
    name: string;
    value: number;
  }[];
  groupedRiskCompanies: RiskCompanyItem[];
  completionRate: number;
  inProgressRate: number;
  riskRate: number;
  cbsSummary: CbsSummary | null;
  inspectionSummary?: {
    total?: number;
    completed?: number;
    planned?: number;
    overdue?: number;
  } | null;
};

type SummaryTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

const PIE_COLORS = ["#16a34a", "#2563eb", "#f59e0b"];

const clamp = (value: number) =>
  Math.max(0, Math.min(100, Number(value) || 0));

function PanelTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg,#fff1f2,#ffe4e6)",
          color: BRAND.red,
          flex: "0 0 auto",
        }}
      >
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <h2
          style={{
            margin: 0,
            color: BRAND.text,
            fontSize: 18,
            fontWeight: 900,
            lineHeight: 1.25,
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin: "5px 0 0",
            color: BRAND.muted,
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  tone?: SummaryTone;
  icon?: React.ReactNode;
}) {
  const palette = {
    success: {
      background: "#f0fdf4",
      color: "#166534",
      border: "#bbf7d0",
    },
    warning: {
      background: "#fffbeb",
      color: "#92400e",
      border: "#fde68a",
    },
    danger: {
      background: "#fff1f2",
      color: "#b91c1c",
      border: "#fecdd3",
    },
    info: {
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "#bfdbfe",
    },
    neutral: {
      background: "#f8fafc",
      color: BRAND.text,
      border: "#e2e8f0",
    },
  }[tone];

  return (
    <div
      style={{
        minWidth: 0,
        padding: "11px 12px",
        borderRadius: 13,
        border: `1px solid ${palette.border}`,
        background: palette.background,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: palette.color,
          fontSize: 10,
          fontWeight: 850,
          whiteSpace: "nowrap",
        }}
      >
        {icon}
        {label}
      </div>

      <div
        style={{
          marginTop: 5,
          color: palette.color,
          fontSize: 17,
          fontWeight: 900,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const normalized = clamp(value);

  const color =
    normalized >= 85
      ? "#16a34a"
      : normalized >= 70
      ? "#2563eb"
      : normalized >= 50
      ? "#f59e0b"
      : "#dc2626";

  return (
    <div>
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
            color: BRAND.text,
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {label}
        </span>

        <strong
          style={{
            color,
            fontSize: 12,
          }}
        >
          %{Math.round(normalized)}
        </strong>
      </div>

      <div
        style={{
          height: 7,
          marginTop: 6,
          overflow: "hidden",
          borderRadius: 999,
          background: "#e5e7eb",
        }}
      >
        <div
          style={{
            width: `${normalized}%`,
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg,${color},${color}cc)`,
          }}
        />
      </div>
    </div>
  );
}

function SecureEmptyState({
  totalCompanies,
}: {
  totalCompanies: number;
}) {
  return (
    <div
      style={{
        minHeight: 250,
        display: "grid",
        placeItems: "center",
        alignContent: "center",
        gap: 14,
        padding: 22,
        borderRadius: 18,
        border: "1px dashed #bbf7d0",
        background:
          "radial-gradient(circle at top,rgba(22,163,74,.08),transparent 42%),linear-gradient(180deg,#f8fff9,#ffffff)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 62,
          height: 62,
          display: "grid",
          placeItems: "center",
          borderRadius: 20,
          color: "#15803d",
          background: "#dcfce7",
          boxShadow: "0 10px 24px rgba(22,163,74,.12)",
        }}
      >
        <ShieldCheck size={30} />
      </div>

      <div>
        <div
          style={{
            color: "#166534",
            fontSize: 15,
            fontWeight: 900,
          }}
        >
          Tüm firmalar güvenli seviyede
        </div>

        <p
          style={{
            maxWidth: 380,
            margin: "7px auto 0",
            color: "#64748b",
            fontSize: 12,
            lineHeight: 1.55,
          }}
        >
          Firma bazlı kritik risk yoğunluğu tespit edilmedi.
        </p>
      </div>

      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(3,minmax(0,1fr))",
          gap: 9,
        }}
      >
        <SummaryMetric
          label="Toplam firma"
          value={String(totalCompanies)}
          tone="info"
        />
        <SummaryMetric
          label="Riskli firma"
          value="0"
          tone="success"
        />
        <SummaryMetric
          label="Kritik kayıt"
          value="0"
          tone="success"
        />
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          padding: "10px 12px",
          borderRadius: 13,
          color: "#166534",
          background: "#f0fdf4",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        <CheckCircle2 size={15} />
        Kritik bulgu görünmüyor
      </div>
    </div>
  );
}

export default function ChartsSection({
  isMobile,
  dashboardTrendData,
  dashboardPieData,
  groupedRiskCompanies,
  completionRate,
  inProgressRate,
  riskRate,
  cbsSummary,
  inspectionSummary,
}: ChartsSectionProps) {
  const pieTotal = dashboardPieData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const maxRisk = Math.max(
    1,
    ...groupedRiskCompanies.map((item) => item.count)
  );

  const inspectionTotal = inspectionSummary?.total || 0;
  const inspectionCompleted = inspectionSummary?.completed || 0;

  const inspectionScore = inspectionTotal
    ? (inspectionCompleted / inspectionTotal) * 100
    : 72;

  const cbsScore = cbsSummary?.total
    ? ((cbsSummary.closed || 0) / cbsSummary.total) * 100
    : 76;

  const processScore = clamp(100 - inProgressRate / 2);
  const riskScore = clamp(100 - riskRate);

  const radarData = [
    { subject: "Eğitim", score: clamp(completionRate) },
    { subject: "Süreç", score: processScore },
    { subject: "Risk", score: riskScore },
    { subject: "Denetim", score: clamp(inspectionScore) },
    { subject: "ÇBS", score: clamp(cbsScore) },
  ];

  const firstTrendValue = dashboardTrendData[0]?.value || 0;
  const lastTrendValue =
    dashboardTrendData[dashboardTrendData.length - 1]?.value ||
    completionRate;

  const trendDifference = Math.round(
    lastTrendValue - firstTrendValue
  );

  const trendValues = dashboardTrendData.map(
    (item) => Number(item.value) || 0
  );

  const trendAverage = trendValues.length
    ? trendValues.reduce((sum, value) => sum + value, 0) /
      trendValues.length
    : completionRate;

  const trendMaximum = trendValues.length
    ? Math.max(...trendValues)
    : completionRate;

  const trendMinimum = trendValues.length
    ? Math.min(...trendValues)
    : completionRate;

  const strongestRadar = [...radarData].sort(
    (a, b) => b.score - a.score
  )[0];

  const weakestRadar = [...radarData].sort(
    (a, b) => a.score - b.score
  )[0];

  const topRiskCompany = groupedRiskCompanies[0];

  const inferredCompanyCount = groupedRiskCompanies.length;

  return (
    <section
      style={{
        display: "grid",
        gap: 18,
        marginBottom: 22,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "minmax(0,1.55fr) minmax(320px,.75fr)",
          gap: 18,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            ...cardStyle(isMobile),
            overflow: "hidden",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <PanelTitle
              icon={<Activity size={20} />}
              title="Kurumsal performans trendi"
              description="Tamamlanma oranının dönemsel gelişimi ve hedef seviyesi"
            />

            <div
              style={{
                padding: "9px 12px",
                borderRadius: 12,
                background:
                  completionRate >= 80
                    ? BRAND.greenSoft
                    : BRAND.amberSoft,
                color:
                  completionRate >= 80
                    ? BRAND.green
                    : BRAND.amber,
                fontWeight: 900,
                fontSize: 13,
                alignSelf: "flex-start",
              }}
            >
              Güncel %{Math.round(completionRate)}
            </div>
          </div>

          <div
            style={{
              height: isMobile ? 210 : 220,
              marginTop: 14,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dashboardTrendData}
                margin={{
                  top: 10,
                  right: 8,
                  left: -18,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="performanceFillFinal"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={BRAND.red}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor={BRAND.red}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#eef2f7"
                />

                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: BRAND.muted,
                    fontSize: 11,
                  }}
                />

                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: BRAND.muted,
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  formatter={(value) => [
                    `%${value}`,
                    "Tamamlanma",
                  ]}
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid #e5e7eb",
                    boxShadow: BRAND.shadow,
                  }}
                />

                <ReferenceLine
                  y={80}
                  stroke="#16a34a"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                >
                  <Label
                    value="Hedef %80"
                    position="insideTopRight"
                    fill="#166534"
                    fontSize={11}
                  />
                </ReferenceLine>

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={BRAND.red}
                  fill="url(#performanceFillFinal)"
                  strokeWidth={3}
                  activeDot={{
                    r: 5,
                    strokeWidth: 3,
                    stroke: "#fff",
                    fill: BRAND.red,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(2,minmax(0,1fr))"
                : "repeat(3,minmax(0,1fr))",
              gap: 9,
              marginTop: 12,
            }}
          >
            <SummaryMetric
              label="Dönem değişimi"
              value={`${
                trendDifference >= 0 ? "+" : ""
              }${trendDifference} puan`}
              tone={
                trendDifference >= 0
                  ? "success"
                  : "danger"
              }
              icon={
                trendDifference >= 0 ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )
              }
            />

            <SummaryMetric
              label="Dönem ortalaması"
              value={`%${Math.round(trendAverage)}`}
              tone="info"
              icon={<Activity size={14} />}
            />

            <SummaryMetric
              label="Hedefe uzaklık"
              value={`${Math.abs(
                Math.round(completionRate - 80)
              )} puan`}
              tone={
                completionRate >= 80
                  ? "success"
                  : "warning"
              }
              icon={<Target size={14} />}
            />

            <SummaryMetric
              label="En yüksek"
              value={`%${Math.round(trendMaximum)}`}
              tone="success"
              icon={<TrendingUp size={14} />}
            />

            <SummaryMetric
              label="En düşük"
              value={`%${Math.round(trendMinimum)}`}
              tone={
                trendMinimum >= 80
                  ? "success"
                  : "warning"
              }
              icon={<TrendingDown size={14} />}
            />

            <SummaryMetric
              label="Risk oranı"
              value={`%${Math.round(riskRate)}`}
              tone={
                riskRate >= 30
                  ? "danger"
                  : "success"
              }
              icon={<AlertTriangle size={14} />}
            />
          </div>
        </div>

        <div
          style={{
            ...cardStyle(isMobile),
            height: "100%",
          }}
        >
          <PanelTitle
            icon={<Target size={20} />}
            title="Durum dağılımı"
            description="Atamaların mevcut operasyonel durumu"
          />

          <div
            style={{
              height: isMobile ? 185 : 190,
              marginTop: 6,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={54}
                  outerRadius={78}
                  paddingAngle={4}
                  stroke="none"
                >
                  {dashboardPieData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={
                        PIE_COLORS[
                          index % PIE_COLORS.length
                        ]
                      }
                    />
                  ))}

                  <Label
                    value={`%${Math.round(completionRate)}`}
                    position="center"
                    style={{
                      fontSize: 26,
                      fontWeight: 900,
                      fill: BRAND.text,
                    }}
                  />
                </Pie>

                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid #e5e7eb",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3,minmax(0,1fr))",
              gap: 8,
            }}
          >
            {dashboardPieData.map((item, index) => (
              <div
                key={item.name}
                style={{
                  minWidth: 0,
                  padding: "10px 6px",
                  borderRadius: 12,
                  background: "#f8fafc",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    margin: "0 auto 6px",
                    borderRadius: 99,
                    background: PIE_COLORS[index],
                  }}
                />

                <div
                  style={{
                    color: BRAND.muted,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {item.name}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    color: BRAND.text,
                    fontSize: 16,
                    fontWeight: 900,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2,minmax(0,1fr))",
              gap: 9,
              marginTop: 10,
            }}
          >
            <SummaryMetric
              label="Toplam atama"
              value={pieTotal.toLocaleString("tr-TR")}
              tone="info"
            />

            <SummaryMetric
              label="Başarı durumu"
              value={
                completionRate >= 90
                  ? "Mükemmel"
                  : completionRate >= 80
                  ? "Hedefte"
                  : "Geliştirilmeli"
              }
              tone={
                completionRate >= 80
                  ? "success"
                  : "warning"
              }
            />
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "minmax(0,1.15fr) minmax(340px,.85fr)",
          gap: 18,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            ...cardStyle(isMobile),
            height: "100%",
          }}
        >
          <PanelTitle
            icon={<Building2 size={20} />}
            title="Firma bazlı risk yoğunluğu"
            description="En fazla riskli kullanıcı bulunan ilk firmalar"
          />

          <div
            style={{
              minHeight: 250,
              marginTop: 14,
            }}
          >
            {groupedRiskCompanies.length ? (
              <ResponsiveContainer
                width="100%"
                height={Math.max(
                  250,
                  groupedRiskCompanies.length * 44
                )}
              >
                <BarChart
                  data={groupedRiskCompanies}
                  layout="vertical"
                  margin={{
                    top: 0,
                    right: 24,
                    left: isMobile ? 6 : 34,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                    stroke="#eef2f7"
                  />

                  <XAxis
                    type="number"
                    hide
                    domain={[0, maxRisk]}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={isMobile ? 98 : 135}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: BRAND.text,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid #e5e7eb",
                    }}
                  />

                  <Bar
                    dataKey="count"
                    name="Riskli kullanıcı"
                    fill={BRAND.red}
                    radius={[0, 9, 9, 0]}
                    barSize={17}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <SecureEmptyState
                totalCompanies={inferredCompanyCount}
              />
            )}
          </div>

          {groupedRiskCompanies.length > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: "13px 14px",
                borderRadius: 14,
                background: "#fff7ed",
                border: "1px solid #fed7aa",
              }}
            >
              <div
                style={{
                  color: BRAND.muted,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                En yüksek risk yoğunluğu
              </div>

              <div
                style={{
                  marginTop: 5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <strong
                  style={{
                    color: BRAND.text,
                    fontSize: 14,
                  }}
                >
                  {topRiskCompany?.name}
                </strong>

                <span
                  style={{
                    color: BRAND.red,
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                >
                  {topRiskCompany?.count || 0} kayıt
                </span>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            ...cardStyle(isMobile),
            height: "100%",
            background:
              "linear-gradient(145deg,#ffffff,#f8fafc)",
          }}
        >
          <PanelTitle
            icon={<BarChart3 size={20} />}
            title="EHS performans radarı"
            description="Ana operasyon alanlarının dengeli görünümü"
          />

          <div
            style={{
              height: isMobile ? 215 : 220,
              marginTop: 6,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={radarData}
                outerRadius="64%"
              >
                <PolarGrid stroke="#dbe3ed" />

                <PolarAngleAxis
                  dataKey="subject"
                  tick={{
                    fill: BRAND.text,
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                />

                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />

                <Radar
                  name="Performans"
                  dataKey="score"
                  stroke={BRAND.red}
                  fill={BRAND.red}
                  fillOpacity={0.18}
                  strokeWidth={2.5}
                />

                <Tooltip
                  formatter={(value) => [
                    `%${Math.round(Number(value))}`,
                    "Skor",
                  ]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 6,
            }}
          >
            {radarData.map((item) => (
              <ProgressRow
                key={item.subject}
                label={item.subject}
                value={item.score}
              />
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2,minmax(0,1fr))",
              gap: 9,
              marginTop: 13,
            }}
          >
            <SummaryMetric
              label="En güçlü alan"
              value={`${strongestRadar.subject} %${Math.round(
                strongestRadar.score
              )}`}
              tone="success"
              icon={<TrendingUp size={14} />}
            />

            <SummaryMetric
              label="Gelişim alanı"
              value={`${weakestRadar.subject} %${Math.round(
                weakestRadar.score
              )}`}
              tone={
                weakestRadar.score < 70
                  ? "warning"
                  : "info"
              }
              icon={<Target size={14} />}
            />
          </div>
        </div>
      </div>
    </section>
  );
}