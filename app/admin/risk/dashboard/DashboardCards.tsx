"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ShieldAlert,
  TimerReset,
  TrendingDown,
  UserCheck,
  Users,
} from "lucide-react";

import type {
  EmergencyDashboard,
  RiskDashboardTotals,
  RiskStatusBreakdown,
} from "../types";

type Tone =
  | "blue"
  | "red"
  | "orange"
  | "amber"
  | "green"
  | "purple"
  | "slate";

type Props = {
  risk: RiskDashboardTotals;
  emergency?: EmergencyDashboard;
  loading?: boolean;
};

const TONES: Record<
  Tone,
  { background: string; color: string; border: string }
> = {
  blue: { background: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  red: { background: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
  orange: { background: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  amber: { background: "#fffbeb", color: "#b45309", border: "#fde68a" },
  green: { background: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
  purple: { background: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  slate: { background: "#f8fafc", color: "#475569", border: "#e2e8f0" },
};

function Skeleton() {
  return (
    <span
      className="dashboardCardSkeleton"
      style={{
        display: "inline-block",
        width: 72,
        height: 28,
        borderRadius: 8,
        background: "#e2e8f0",
      }}
    />
  );
}

function RiskLevelCard({
  title,
  description,
  values,
  tone,
  icon,
  loading,
}: {
  title: string;
  description: string;
  values: RiskStatusBreakdown;
  tone: Tone;
  icon: ReactNode;
  loading?: boolean;
}) {
  const selectedTone = TONES[tone];

  return (
    <article
      style={{
        minWidth: 0,
        width: "100%",
        boxSizing: "border-box",
        minHeight: 178,
        borderRadius: 22,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        padding: 18,
        boxShadow: "0 14px 35px rgba(15,23,42,0.06)",
        display: "grid",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, minWidth: 0 }}>
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
            alignSelf: "start",
          }}
        >
          {loading ? "Yükleniyor" : "Güncel"}
        </span>
      </div>

      <div>
        <div style={{ color: "#64748b", fontSize: 13, fontWeight: 900 }}>
          {title}
        </div>

        <div
          style={{
            marginTop: 7,
            color: "#0f172a",
            fontSize: 31,
            lineHeight: 1,
            fontWeight: 950,
          }}
        >
          {loading ? <Skeleton /> : values.total}
        </div>

        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          <div
            style={{
              padding: "8px 10px",
              borderRadius: 12,
              background: "#fff7ed",
              border: "1px solid #fed7aa",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, color: "#9a3412", overflowWrap: "anywhere" }}>
              AÇIK
            </div>
            <div style={{ marginTop: 2, fontSize: 18, fontWeight: 950, color: "#9a3412" }}>
              {loading ? "—" : values.open}
            </div>
          </div>

          <div
            style={{
              padding: "8px 10px",
              borderRadius: 12,
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, color: "#047857", overflowWrap: "anywhere" }}>
              KAPALI
            </div>
            <div style={{ marginTop: 2, fontSize: 18, fontWeight: 950, color: "#047857" }}>
              {loading ? "—" : values.closed}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 9, color: "#94a3b8", fontSize: 11, lineHeight: 1.4 }}>
          {description}
        </div>
      </div>
    </article>
  );
}

function ManagementCard({
  title,
  value,
  subtitle,
  tone,
  icon,
  loading,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  tone: Tone;
  icon: ReactNode;
  loading?: boolean;
}) {
  const selectedTone = TONES[tone];

  return (
    <article
      style={{
        minWidth: 0,
        width: "100%",
        boxSizing: "border-box",
        minHeight: 128,
        borderRadius: 20,
        border: `1px solid ${selectedTone.border}`,
        background: selectedTone.background,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{ color: selectedTone.color }}>{icon}</div>
        <div style={{ color: selectedTone.color, fontSize: 12, fontWeight: 900, minWidth: 0, overflowWrap: "anywhere" }}>
          {title}
        </div>
      </div>
      <div style={{ marginTop: 12, color: "#0f172a", fontSize: 26, fontWeight: 950 }}>
        {loading ? <Skeleton /> : value}
      </div>
      <div style={{ marginTop: 6, color: "#64748b", fontSize: 11, lineHeight: 1.45 }}>
        {subtitle}
      </div>
    </article>
  );
}

export default function DashboardCards({ risk, emergency, loading = false }: Props) {
  const emergencyStats: EmergencyDashboard = emergency ?? {
    totalPlans: 0,
    expiredPlans: 0,
    totalMembers: 0,
    pendingSignatures: 0,
    totalDrills: 0,
    upcomingDrills: 0,
  };

  return (
    <div
      style={{
        display: "grid",
        gap: 18,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <section>
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 950 }}>
            Risk Seviyesi ve Yaşam Döngüsü
          </div>
          <div style={{ marginTop: 3, color: "#64748b", fontSize: 12 }}>
            Her risk seviyesi için açık, kapalı ve toplam kayıt aynı kaynaktan hesaplanır.
          </div>
        </div>

        <div
          className="riskLevelGrid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 12,
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          <RiskLevelCard title="Toplam Risk" description="Tüm sınıflandırılmış risk kayıtları" values={risk.total} tone="blue" icon={<BarChart3 size={21} />} loading={loading} />
          <RiskLevelCard title="Düşük Risk" description="Mevcut kontrollerle izlenebilir seviyedeki riskler" values={risk.low} tone="green" icon={<TrendingDown size={21} />} loading={loading} />
          <RiskLevelCard title="Orta Risk" description="Planlı iyileştirme ve izleme gerektiren riskler" values={risk.medium} tone="amber" icon={<AlertTriangle size={21} />} loading={loading} />
          <RiskLevelCard title="Yüksek Risk" description="Öncelikli aksiyon gerektiren riskler" values={risk.high} tone="orange" icon={<AlertTriangle size={21} />} loading={loading} />
          <RiskLevelCard title="Çok Yüksek Risk" description="Kısa vadede kontrol altına alınması gereken riskler" values={risk.veryHigh} tone="red" icon={<ShieldAlert size={21} />} loading={loading} />
          <RiskLevelCard title="Kabul Edilemez" description="Faaliyet sürdürülmeden önce kontrol gerektiren riskler" values={risk.intolerable} tone="red" icon={<ShieldAlert size={21} />} loading={loading} />
        </div>
      </section>

      <section>
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 950 }}>
            Yönetim Öncelikleri
          </div>
          <div style={{ marginTop: 3, color: "#64748b", fontSize: 12 }}>
            Karar vermeyi kolaylaştıran operasyonel risk göstergeleri.
          </div>
        </div>

        <div
          className="managementGrid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 12,
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          <ManagementCard title="Kritik Müdahale" value={risk.criticalIntervention} subtitle="Açık Çok Yüksek + Açık Kabul Edilemez riskler" tone="red" icon={<ShieldAlert size={19} />} loading={loading} />
          <ManagementCard title="Geciken Risk Aksiyonu" value={risk.overdueAction} subtitle="Termin tarihi geçmiş ve DÖF'ü açık kayıtlar" tone="orange" icon={<TimerReset size={19} />} loading={loading} />
          <ManagementCard title="Risk Kapanma Oranı" value={`%${risk.closureRate}`} subtitle={`${risk.total.closed} kapalı / ${risk.total.total} toplam risk`} tone="green" icon={<CheckCircle2 size={19} />} loading={loading} />
          <ManagementCard title="Açık DÖF" value={risk.openDof} subtitle="Risklere bağlı tamamlanmamış düzeltici faaliyetler" tone="purple" icon={<AlertTriangle size={19} />} loading={loading} />
          <ManagementCard title="Kapalı DÖF" value={risk.closedDof} subtitle="Tamamlanmış düzeltici faaliyetler" tone="green" icon={<CheckCircle2 size={19} />} loading={loading} />
        </div>
      </section>

      <section>
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 950 }}>
            Acil Durum Hazırlığı
          </div>
        </div>
        <div
          className="emergencyGrid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 12,
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          <ManagementCard title="Acil Durum Planı" value={emergencyStats.totalPlans} subtitle="Firma için oluşturulan eylem planları" tone="blue" icon={<ClipboardCheck size={19} />} loading={loading} />
          <ManagementCard title="Süresi Dolan Plan" value={emergencyStats.expiredPlans} subtitle="Revizyon veya yenileme bekleyen planlar" tone="red" icon={<AlertTriangle size={19} />} loading={loading} />
          <ManagementCard title="Destek Ekibi Üyesi" value={emergencyStats.totalMembers} subtitle="Aktif ve pasif destek ekibi üyeleri" tone="green" icon={<Users size={19} />} loading={loading} />
          <ManagementCard title="İmza Bekleyen" value={emergencyStats.pendingSignatures} subtitle="Atama imzası tamamlanmamış üyeler" tone="orange" icon={<UserCheck size={19} />} loading={loading} />
          <ManagementCard title="Yaklaşan Tatbikat" value={emergencyStats.upcomingDrills} subtitle={`${emergencyStats.totalDrills} toplam tatbikat kaydı`} tone="purple" icon={<CalendarClock size={19} />} loading={loading} />
        </div>
      </section>

      <style jsx>{`
        .dashboardCardSkeleton {
          animation: dashboard-card-pulse 1.2s ease-in-out infinite;
        }
        @keyframes dashboard-card-pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        /*
         * Bu gridler viewport genişliğine değil, içinde bulundukları gerçek
         * panel genişliğine göre otomatik kolon kırar. Böylece sol menü açıkken
         * sağdaki son kart ekrandan taşmaz.
         */
        .riskLevelGrid,
        .managementGrid,
        .emergencyGrid {
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        @media (max-width: 760px) {
          .riskLevelGrid,
          .managementGrid,
          .emergencyGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
