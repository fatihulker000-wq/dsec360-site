"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Legend,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, BarChart3, Building2, Target, TrendingDown, TrendingUp, ShieldCheck, AlertTriangle } from "lucide-react";

import { BRAND, cardStyle } from "./styles";
import type { CbsSummary, TrendItem } from "./types";

type RiskCompanyItem = { name: string; count: number };

type ChartsSectionProps = {
  isMobile: boolean;
  dashboardTrendData: TrendItem[];
  dashboardPieData: { name: string; value: number }[];
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

const PIE_COLORS = ["#16a34a", "#2563eb", "#f59e0b"];

const clamp = (value: number) => Math.max(0, Math.min(100, Number(value) || 0));

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
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
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
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: BRAND.text }}>
          {title}
        </h2>
        <p style={{ margin: "5px 0 0", color: BRAND.muted, fontSize: 12, lineHeight: 1.5 }}>
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
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
  icon?: React.ReactNode;
}) {
  const palette = {
    success: { background: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
    warning: { background: "#fffbeb", color: "#92400e", border: "#fde68a" },
    danger: { background: "#fff1f2", color: "#b91c1c", border: "#fecdd3" },
    info: { background: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    neutral: { background: "#f8fafc", color: BRAND.text, border: "#e2e8f0" },
  }[tone];

  return (
    <div
      style={{
        minWidth: 0,
        padding: "12px 14px",
        borderRadius: 14,
        border: `1px solid ${palette.border}`,
        background: palette.background,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          color: palette.color,
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {icon}
        {label}
      </div>
      <div
        style={{
          marginTop: 6,
          color: palette.color,
          fontSize: 18,
          fontWeight: 900,
        }}
      >
        {value}
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
  const pieTotal = dashboardPieData.reduce((sum, item) => sum + item.value, 0);
  const maxRisk = Math.max(1, ...groupedRiskCompanies.map((item) => item.count));
  const inspectionTotal = inspectionSummary?.total || 0;
  const inspectionCompleted = inspectionSummary?.completed || 0;
  const inspectionScore = inspectionTotal
    ? (inspectionCompleted / inspectionTotal) * 100
    : 72;
  const cbsScore = cbsSummary?.total
    ? ((cbsSummary.closed || 0) / cbsSummary.total) * 100
    : 76;

  const radarData = [
    { subject: "Eğitim", score: clamp(completionRate) },
    { subject: "Süreç", score: clamp(100 - inProgressRate / 2) },
    { subject: "Risk", score: clamp(100 - riskRate) },
    { subject: "Denetim", score: clamp(inspectionScore) },
    { subject: "ÇBS", score: clamp(cbsScore) },
  ];

  const firstTrendValue = dashboardTrendData[0]?.value || 0;
  const lastTrendValue =
    dashboardTrendData[dashboardTrendData.length - 1]?.value || completionRate;
  const trendDifference = Math.round(lastTrendValue - firstTrendValue);

  const strongestRadar = [...radarData].sort((a, b) => b.score - a.score)[0];
  const weakestRadar = [...radarData].sort((a, b) => a.score - b.score)[0];

  const topRiskCompany = groupedRiskCompanies[0];

  return (
    <section style={{ display: "grid", gap: 18, marginBottom: 22 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.55fr) minmax(320px,.75fr)",
          gap: 18,
        }}
      >
        <div style={{ ...cardStyle(isMobile), overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <PanelTitle
              icon={<Activity size={20} />}
              title="Kurumsal performans trendi"
              description="Tamamlanma oranının dönemsel gelişimi ve hedef seviyesi"
            />
            <div
              style={{
                padding: "9px 12px",
                borderRadius: 12,
                background: completionRate >= 80 ? BRAND.greenSoft : BRAND.amberSoft,
                color: completionRate >= 80 ? BRAND.green : BRAND.amber,
                fontWeight: 900,
                fontSize: 13,
                alignSelf: "flex-start",
              }}
            >
              Güncel %{Math.round(completionRate)}
            </div>
          </div>

          <div style={{ height: isMobile ? 260 : 315, marginTop: 18 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardTrendData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="performanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND.red} stopOpacity={0.30} />
                    <stop offset="100%" stopColor={BRAND.red} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: BRAND.muted, fontSize: 12 }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: BRAND.muted, fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`%${value}`, "Tamamlanma"]}
                  contentStyle={{ borderRadius: 14, border: "1px solid #e5e7eb", boxShadow: BRAND.shadow }}
                />
                <ReferenceLine y={80} stroke="#16a34a" strokeDasharray="5 5" strokeWidth={1.5}>
                  <Label value="Hedef %80" position="insideTopRight" fill="#166534" fontSize={11} />
                </ReferenceLine>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={BRAND.red}
                  fill="url(#performanceFill)"
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 3, stroke: "#fff", fill: BRAND.red }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(2,minmax(0,1fr))"
                : "repeat(4,minmax(0,1fr))",
              gap: 10,
              marginTop: 14,
            }}
          >
            <SummaryMetric
              label="Dönem değişimi"
              value={`${trendDifference >= 0 ? "+" : ""}${trendDifference} puan`}
              tone={trendDifference >= 0 ? "success" : "danger"}
              icon={trendDifference >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            />
            <SummaryMetric
              label="Tamamlanma"
              value={`%${Math.round(completionRate)}`}
              tone={completionRate >= 80 ? "success" : "warning"}
              icon={<ShieldCheck size={14} />}
            />
            <SummaryMetric
              label="Devam eden"
              value={`%${Math.round(inProgressRate)}`}
              tone="info"
              icon={<Activity size={14} />}
            />
            <SummaryMetric
              label="Risk oranı"
              value={`%${Math.round(riskRate)}`}
              tone={riskRate >= 30 ? "danger" : "success"}
              icon={<AlertTriangle size={14} />}
            />
          </div>
        </div>

        <div style={cardStyle(isMobile)}>
          <PanelTitle
            icon={<Target size={20} />}
            title="Durum dağılımı"
            description="Atamaların mevcut operasyonel durumu"
          />
          <div style={{ height: isMobile ? 245 : 255, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={98}
                  paddingAngle={4}
                  stroke="none"
                >
                  {dashboardPieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                  <Label
                    value={pieTotal.toLocaleString("tr-TR")}
                    position="center"
                    style={{ fontSize: 28, fontWeight: 900, fill: BRAND.text }}
                  />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #e5e7eb" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {dashboardPieData.map((item, index) => (
              <div key={item.name} style={{ textAlign: "center", padding: "9px 5px", borderRadius: 12, background: "#f8fafc" }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: PIE_COLORS[index], margin: "0 auto 6px" }} />
                <div style={{ fontSize: 11, color: BRAND.muted }}>{item.name}</div>
                <div style={{ marginTop: 3, fontWeight: 900, color: BRAND.text }}>
                  {pieTotal ? Math.round((item.value / pieTotal) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 12,
              padding: "12px 14px",
              borderRadius: 14,
              background: "linear-gradient(135deg,#f8fafc,#ffffff)",
              border: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ color: BRAND.muted, fontSize: 11, fontWeight: 700 }}>
                Toplam atama
              </div>
              <div style={{ marginTop: 4, color: BRAND.text, fontSize: 20, fontWeight: 900 }}>
                {pieTotal.toLocaleString("tr-TR")}
              </div>
            </div>
            <div
              style={{
                padding: "7px 10px",
                borderRadius: 999,
                background: completionRate >= 80 ? BRAND.greenSoft : BRAND.amberSoft,
                color: completionRate >= 80 ? BRAND.green : BRAND.amber,
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {completionRate >= 80 ? "Hedefte" : "İyileştirme gerekli"}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.15fr) minmax(340px,.85fr)",
          gap: 18,
        }}
      >
        <div style={cardStyle(isMobile)}>
          <PanelTitle
            icon={<Building2 size={20} />}
            title="Firma bazlı risk yoğunluğu"
            description="En fazla riskli kullanıcı bulunan ilk firmalar"
          />
          <div style={{ height: Math.max(250, groupedRiskCompanies.length * 48), marginTop: 16 }}>
            {groupedRiskCompanies.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={groupedRiskCompanies}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: isMobile ? 6 : 34, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis type="number" hide domain={[0, maxRisk]} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={isMobile ? 98 : 135}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: BRAND.text, fontSize: 12, fontWeight: 700 }}
                  />
                  <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #e5e7eb" }} />
                  <Bar dataKey="count" name="Riskli kullanıcı" fill={BRAND.red} radius={[0, 9, 9, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "grid", placeItems: "center", color: BRAND.muted }}>
                Firma bazlı risk verisi bulunmuyor.
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 14,
              padding: "13px 14px",
              borderRadius: 14,
              background: topRiskCompany ? "#fff7ed" : "#f8fafc",
              border: `1px solid ${topRiskCompany ? "#fed7aa" : "#e5e7eb"}`,
            }}
          >
            <div style={{ color: BRAND.muted, fontSize: 11, fontWeight: 700 }}>
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
              <strong style={{ color: BRAND.text, fontSize: 14 }}>
                {topRiskCompany?.name || "Riskli firma bulunmuyor"}
              </strong>
              <span style={{ color: BRAND.red, fontWeight: 900, fontSize: 14 }}>
                {topRiskCompany ? `${topRiskCompany.count} kayıt` : "0"}
              </span>
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle(isMobile), background: "linear-gradient(145deg,#ffffff,#f8fafc)" }}>
          <PanelTitle
            icon={<BarChart3 size={20} />}
            title="EHS performans radarı"
            description="Ana operasyon alanlarının dengeli görünümü"
          />
          <div style={{ height: isMobile ? 300 : 330, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="68%">
                <PolarGrid stroke="#dbe3ed" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: BRAND.text, fontSize: 12, fontWeight: 800 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Performans" dataKey="score" stroke={BRAND.red} fill={BRAND.red} fillOpacity={0.20} strokeWidth={2.5} />
                <Legend />
                <Tooltip formatter={(value) => [`%${Math.round(Number(value))}`, "Skor"]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,minmax(0,1fr))",
              gap: 10,
              marginTop: 10,
            }}
          >
            <SummaryMetric
              label="En güçlü alan"
              value={`${strongestRadar.subject} %${Math.round(strongestRadar.score)}`}
              tone="success"
              icon={<TrendingUp size={14} />}
            />
            <SummaryMetric
              label="Gelişim alanı"
              value={`${weakestRadar.subject} %${Math.round(weakestRadar.score)}`}
              tone={weakestRadar.score < 70 ? "warning" : "info"}
              icon={<Target size={14} />}
            />
          </div>
        </div>
      </div>
    </section>
  );
}