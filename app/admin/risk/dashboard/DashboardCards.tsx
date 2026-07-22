"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import type {
  EmergencyDashboard,
  RiskDashboardTotals,
} from "../types";

type Tone =
  | "blue"
  | "red"
  | "orange"
  | "green"
  | "purple"
  | "slate";

type Props = {
  risk: RiskDashboardTotals;
  emergency?: EmergencyDashboard;
  loading?: boolean;
};

type CardProps = {
  title: string;
  value: number | string;
  subtitle: string;
  icon: ReactNode;
  tone: Tone;
  loading?: boolean;
};

const TONES: Record<
  Tone,
  {
    background: string;
    color: string;
    border: string;
  }
> = {
  blue: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "#bfdbfe",
  },
  red: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "#fecaca",
  },
  orange: {
    background: "#fff7ed",
    color: "#c2410c",
    border: "#fed7aa",
  },
  green: {
    background: "#ecfdf5",
    color: "#047857",
    border: "#a7f3d0",
  },
  purple: {
    background: "#f5f3ff",
    color: "#6d28d9",
    border: "#ddd6fe",
  },
  slate: {
    background: "#f8fafc",
    color: "#475569",
    border: "#e2e8f0",
  },
};

function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  tone,
  loading = false,
}: CardProps) {
  const selectedTone = TONES[tone];

  return (
    <article
      style={{
        minHeight: 150,
        borderRadius: 22,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        padding: 18,
        boxShadow: "0 14px 35px rgba(15,23,42,0.06)",
        display: "grid",
        alignContent: "space-between",
        gap: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            color: selectedTone.color,
            background: selectedTone.background,
            border: `1px solid ${selectedTone.border}`,
          }}
        >
          {icon}
        </div>

        <span
          style={{
            borderRadius: 999,
            padding: "5px 9px",
            color: selectedTone.color,
            background: selectedTone.background,
            border: `1px solid ${selectedTone.border}`,
            fontSize: 11,
            fontWeight: 850,
          }}
        >
          {loading ? "Yükleniyor" : "Güncel"}
        </span>
      </div>

      <div>
        <div
          style={{
            color: "#64748b",
            fontSize: 13,
            fontWeight: 850,
            marginBottom: 7,
          }}
        >
          {title}
        </div>

        <div
          style={{
            minHeight: 34,
            color: "#0f172a",
            fontSize: 31,
            lineHeight: 1,
            fontWeight: 950,
          }}
        >
          {loading ? (
            <span
              className="dashboardCardSkeleton"
              style={{
                display: "inline-block",
                width: 78,
                height: 30,
                borderRadius: 8,
                background: "#e2e8f0",
              }}
            />
          ) : (
            value
          )}
        </div>

        <div
          style={{
            marginTop: 9,
            color: "#94a3b8",
            fontSize: 12,
            lineHeight: 1.45,
          }}
        >
          {subtitle}
        </div>
      </div>
    </article>
  );
}

export default function DashboardCards({
  risk,
  emergency,
  loading = false,
}: Props) {
  const emergencyStats: EmergencyDashboard = emergency ?? {
    totalPlans: 0,
    expiredPlans: 0,
    totalMembers: 0,
    pendingSignatures: 0,
    totalDrills: 0,
    upcomingDrills: 0,
  };

  const cards: CardProps[] = [
    {
      title: "Toplam Risk",
      value: risk.totalRisk,
      subtitle: "Sistemde kayıtlı tüm aktif riskler",
      icon: <BarChart3 size={21} />,
      tone: "blue",
      loading,
    },
    {
      title: "Kritik Risk",
      value: risk.criticalRisk,
      subtitle: "Çok yüksek ve kabul edilemez riskler",
      icon: <Flame size={21} />,
      tone: "red",
      loading,
    },
    {
      title: "Kabul Edilemez",
      value: risk.intolerableRisk,
      subtitle: "Derhal kontrol altına alınması gerekenler",
      icon: <ShieldAlert size={21} />,
      tone: "red",
      loading,
    },
    {
      title: "Yüksek Risk",
      value: risk.highRisk,
      subtitle: "Öncelikli aksiyon gerektiren riskler",
      icon: <TrendingUp size={21} />,
      tone: "orange",
      loading,
    },
    {
      title: "Açık DÖF",
      value: risk.openDof,
      subtitle: "Henüz tamamlanmamış düzeltici faaliyetler",
      icon: <AlertTriangle size={21} />,
      tone: "purple",
      loading,
    },
    {
      title: "Kapalı DÖF",
      value: risk.closedDof,
      subtitle: "Tamamlanmış düzeltici faaliyetler",
      icon: <CheckCircle2 size={21} />,
      tone: "green",
      loading,
    },
    {
      title: "Ortalama Risk Skoru",
      value: risk.averageScore,
      subtitle: "Tüm risklerin ortalama puanı",
      icon: <BarChart3 size={21} />,
      tone: "slate",
      loading,
    },
    {
      title: "Acil Durum Planı",
      value: emergencyStats.totalPlans,
      subtitle: "Firma için oluşturulan eylem planları",
      icon: <ClipboardCheck size={21} />,
      tone: "blue",
      loading,
    },
    {
      title: "Süresi Dolan Plan",
      value: emergencyStats.expiredPlans,
      subtitle: "Revizyon veya yenileme bekleyen planlar",
      icon: <AlertTriangle size={21} />,
      tone: "red",
      loading,
    },
    {
      title: "Destek Ekibi Üyesi",
      value: emergencyStats.totalMembers,
      subtitle: "Aktif ve pasif tüm destek ekibi üyeleri",
      icon: <Users size={21} />,
      tone: "green",
      loading,
    },
    {
      title: "İmza Bekleyen",
      value: emergencyStats.pendingSignatures,
      subtitle: "Atama imzası tamamlanmamış üyeler",
      icon: <UserCheck size={21} />,
      tone: "orange",
      loading,
    },
    {
      title: "Yaklaşan Tatbikat",
      value: emergencyStats.upcomingDrills,
      subtitle: `${emergencyStats.totalDrills} toplam tatbikat kaydı`,
      icon: <CalendarClock size={21} />,
      tone: "purple",
      loading,
    },
  ];

  return (
    <section
      className="dashboardCardsGrid"
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 14,
      }}
    >
      {cards.map((card) => (
        <DashboardCard
          key={card.title}
          {...card}
        />
      ))}

      <style jsx>{`
        .dashboardCardSkeleton {
          animation: dashboard-card-pulse 1.2s ease-in-out infinite;
        }

        @keyframes dashboard-card-pulse {
          0%,
          100% {
            opacity: 0.55;
          }

          50% {
            opacity: 1;
          }
        }

        @media (max-width: 700px) {
          .dashboardCardsGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}