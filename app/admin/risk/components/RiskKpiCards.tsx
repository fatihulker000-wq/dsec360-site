"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Flame,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

export type RiskKpiTotals = {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  openDof: number;
  closedDof: number;
  overdue: number;
};

type Tone = "blue" | "red" | "orange" | "green" | "purple";

type Props = {
  totals: RiskKpiTotals;
};

type CardProps = {
  title: string;
  value: number | string;
  subtitle: string;
  icon: ReactNode;
  tone: Tone;
};

const TONES: Record<
  Tone,
  { bg: string; text: string; border: string }
> = {
  blue: {
    bg: "#eff6ff",
    text: "#1d4ed8",
    border: "#bfdbfe",
  },
  red: {
    bg: "#fef2f2",
    text: "#b91c1c",
    border: "#fecaca",
  },
  orange: {
    bg: "#fff7ed",
    text: "#c2410c",
    border: "#fed7aa",
  },
  green: {
    bg: "#ecfdf5",
    text: "#047857",
    border: "#a7f3d0",
  },
  purple: {
    bg: "#f5f3ff",
    text: "#6d28d9",
    border: "#ddd6fe",
  },
};

function Card({
  title,
  value,
  subtitle,
  icon,
  tone,
}: CardProps) {
  const selected = TONES[tone];

  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 22,
        padding: 18,
        boxShadow: "0 14px 35px rgba(15,23,42,0.06)",
        minHeight: 142,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          display: "grid",
          placeItems: "center",
          borderRadius: 14,
          color: selected.text,
          background: selected.bg,
          border: `1px solid ${selected.border}`,
          marginBottom: 14,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color: "#64748b",
          fontSize: 13,
          fontWeight: 800,
          marginBottom: 5,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "#0f172a",
          fontSize: 30,
          fontWeight: 900,
          lineHeight: 1,
          marginBottom: 9,
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#94a3b8",
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        {subtitle}
      </div>
    </section>
  );
}

export default function RiskKpiCards({ totals }: Props) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: 14,
      }}
    >
      <Card
        title="Toplam Risk"
        value={totals.total}
        subtitle="Tüm aktif 5x5 ve Fine-Kinney kayıtları"
        icon={<BarChart3 size={20} />}
        tone="blue"
      />

      <Card
        title="Kritik Risk"
        value={totals.critical}
        subtitle="Derhal aksiyon gerektiren kayıtlar"
        icon={<Flame size={20} />}
        tone="red"
      />

      <Card
        title="Yüksek Risk"
        value={totals.high}
        subtitle="Öncelikli iyileştirme gerektiren riskler"
        icon={<TrendingUp size={20} />}
        tone="orange"
      />

      <Card
        title="Açık DÖF"
        value={totals.openDof}
        subtitle={`${totals.overdue} geciken aksiyon bulunuyor`}
        icon={<ShieldAlert size={20} />}
        tone="purple"
      />

      <Card
        title="Kapalı DÖF"
        value={totals.closedDof}
        subtitle="Tamamlanmış düzeltici faaliyetler"
        icon={<CheckCircle2 size={20} />}
        tone="green"
      />

      <Card
        title="Geciken DÖF"
        value={totals.overdue}
        subtitle="Termin tarihi geçmiş açık aksiyonlar"
        icon={<AlertTriangle size={20} />}
        tone="red"
      />
    </section>
  );
}