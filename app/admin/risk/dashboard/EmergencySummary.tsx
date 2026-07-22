"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ShieldAlert,
  Siren,
  UserCheck,
  Users,
} from "lucide-react";

import type {
  EmergencyDrill,
  EmergencyPlan,
  EmergencySupportMember,
} from "../types";

type Props = {
  plans: EmergencyPlan[];
  teams: EmergencySupportMember[];
  drills: EmergencyDrill[];
  loading?: boolean;
  onOpenPlans?: () => void;
  onOpenTeams?: () => void;
  onOpenDrills?: () => void;
};

function formatDate(value?: number | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function EmergencySummary({
  plans,
  teams,
  drills,
  loading = false,
  onOpenPlans,
  onOpenTeams,
  onOpenDrills,
}: Props) {
  const summary = useMemo(() => {
    const now = Date.now();
    const currentYear = new Date().getFullYear();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const expiredPlans = plans.filter(
      (plan) =>
        plan.validUntilMillis !== null &&
        plan.validUntilMillis < now
    );

    const revisionSoon = plans.filter(
      (plan) =>
        plan.validUntilMillis !== null &&
        plan.validUntilMillis >= now &&
        plan.validUntilMillis <= now + thirtyDays
    );

    const activeMembers = teams.filter(
      (member) => member.isActive
    );

    const pendingSignatures = teams.filter(
      (member) =>
        member.signatureStatus === "IMZA_BEKLIYOR"
    );

    const teamCount = new Set(
      activeMembers.map((member) => member.teamType)
    ).size;

    const upcomingDrills = drills
      .filter(
        (drill) =>
          drill.nextDrillDueMillis !== null &&
          drill.nextDrillDueMillis >= now
      )
      .sort(
        (a, b) =>
          Number(a.nextDrillDueMillis || 0) -
          Number(b.nextDrillDueMillis || 0)
      );

    const overdueDrills = drills.filter(
      (drill) =>
        drill.nextDrillDueMillis !== null &&
        drill.nextDrillDueMillis < now
    );

    const drillsThisYear = drills.filter(
      (drill) =>
        new Date(
          drill.drillDateMillis
        ).getFullYear() === currentYear
    );

    return {
      expiredPlans,
      revisionSoon,
      activeMembers,
      pendingSignatures,
      teamCount,
      upcomingDrills,
      overdueDrills,
      drillsThisYear,
    };
  }, [plans, teams, drills]);

  const alertCount =
    summary.expiredPlans.length +
    summary.revisionSoon.length +
    summary.pendingSignatures.length +
    summary.overdueDrills.length;

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
            <ShieldAlert size={19} color="#b91c1c" />
            Acil Durum Özeti
          </div>

          <p
            style={{
              margin: "5px 0 0",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            Plan, ekip ve tatbikat durumlarının
            yönetici görünümü
          </p>
        </div>

        <span
          style={{
            borderRadius: 999,
            padding: "6px 10px",
            background:
              alertCount > 0 ? "#fef2f2" : "#ecfdf5",
            color:
              alertCount > 0 ? "#b91c1c" : "#047857",
            border:
              alertCount > 0
                ? "1px solid #fecaca"
                : "1px solid #a7f3d0",
            fontSize: 12,
            fontWeight: 850,
          }}
        >
          {loading
            ? "Yükleniyor"
            : alertCount > 0
              ? `${alertCount} uyarı`
              : "Durum uygun"}
        </span>
      </div>

      {loading ? (
        <div
          className="emergencySummarySkeleton"
          style={{
            height: 320,
            borderRadius: 18,
            background:
              "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
            backgroundSize: "200% 100%",
          }}
        />
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <div
            className="emergencySummaryGrid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={onOpenPlans}
              style={{
                borderRadius: 16,
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
                padding: 14,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <ClipboardCheck
                size={18}
                color="#1d4ed8"
              />

              <div
                style={{
                  marginTop: 9,
                  color: "#1e3a8a",
                  fontSize: 23,
                  fontWeight: 950,
                }}
              >
                {plans.length}
              </div>

              <div
                style={{
                  marginTop: 4,
                  color: "#1d4ed8",
                  fontSize: 12,
                  fontWeight: 850,
                }}
              >
                Toplam plan
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenTeams}
              style={{
                borderRadius: 16,
                border: "1px solid #a7f3d0",
                background: "#ecfdf5",
                padding: 14,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <Users size={18} color="#047857" />

              <div
                style={{
                  marginTop: 9,
                  color: "#065f46",
                  fontSize: 23,
                  fontWeight: 950,
                }}
              >
                {summary.activeMembers.length}
              </div>

              <div
                style={{
                  marginTop: 4,
                  color: "#047857",
                  fontSize: 12,
                  fontWeight: 850,
                }}
              >
                Aktif ekip üyesi
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenDrills}
              style={{
                borderRadius: 16,
                border: "1px solid #ddd6fe",
                background: "#f5f3ff",
                padding: 14,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <Siren size={18} color="#6d28d9" />

              <div
                style={{
                  marginTop: 9,
                  color: "#5b21b6",
                  fontSize: 23,
                  fontWeight: 950,
                }}
              >
                {summary.drillsThisYear.length}
              </div>

              <div
                style={{
                  marginTop: 4,
                  color: "#6d28d9",
                  fontSize: 12,
                  fontWeight: 850,
                }}
              >
                Bu yıl tatbikat
              </div>
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
            }}
          >
            {[
              {
                title: "Süresi dolan plan",
                value: summary.expiredPlans.length,
                icon: <AlertTriangle size={17} />,
                color: "#b91c1c",
                background: "#fef2f2",
                border: "#fecaca",
              },
              {
                title: "30 gün içinde revizyon",
                value: summary.revisionSoon.length,
                icon: <CalendarClock size={17} />,
                color: "#c2410c",
                background: "#fff7ed",
                border: "#fed7aa",
              },
              {
                title: "İmza bekleyen üye",
                value: summary.pendingSignatures.length,
                icon: <UserCheck size={17} />,
                color: "#92400e",
                background: "#fffbeb",
                border: "#fde68a",
              },
              {
                title: "Süresi geçen tatbikat",
                value: summary.overdueDrills.length,
                icon: <Siren size={17} />,
                color: "#b91c1c",
                background: "#fef2f2",
                border: "#fecaca",
              },
              {
                title: "Aktif ekip türü",
                value: summary.teamCount,
                icon: <Users size={17} />,
                color: "#047857",
                background: "#ecfdf5",
                border: "#a7f3d0",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  borderRadius: 14,
                  padding: "12px 13px",
                  background: item.background,
                  border: `1px solid ${item.border}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    color: item.color,
                    fontSize: 13,
                    fontWeight: 850,
                  }}
                >
                  {item.icon}
                  {item.title}
                </div>

                <div
                  style={{
                    color: item.color,
                    fontSize: 19,
                    fontWeight: 950,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 11,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                <CalendarClock
                  size={17}
                  color="#6d28d9"
                />
                Yaklaşan Tatbikatlar
              </div>

              <span
                style={{
                  color: "#64748b",
                  fontSize: 11,
                  fontWeight: 850,
                }}
              >
                İlk 3 kayıt
              </span>
            </div>

            {summary.upcomingDrills.length === 0 ? (
              <div
                style={{
                  minHeight: 90,
                  display: "grid",
                  placeItems: "center",
                  color: "#94a3b8",
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                Yaklaşan tatbikat bulunmuyor.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 8,
                }}
              >
                {summary.upcomingDrills
                  .slice(0, 3)
                  .map((drill) => (
                    <div
                      key={drill.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "space-between",
                        gap: 12,
                        borderRadius: 12,
                        border:
                          "1px solid #e2e8f0",
                        background: "#ffffff",
                        padding: "10px 11px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: "#0f172a",
                            fontSize: 13,
                            fontWeight: 900,
                          }}
                        >
                          {drill.drillTitle ||
                            drill.drillType}
                        </div>

                        <div
                          style={{
                            marginTop: 3,
                            color: "#94a3b8",
                            fontSize: 11,
                          }}
                        >
                          {drill.responsible ||
                            "Sorumlu belirtilmemiş"}
                        </div>
                      </div>

                      <div
                        style={{
                          color: "#6d28d9",
                          fontSize: 12,
                          fontWeight: 900,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(
                          drill.nextDrillDueMillis
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div
            style={{
              borderRadius: 14,
              border:
                alertCount > 0
                  ? "1px solid #fecaca"
                  : "1px solid #a7f3d0",
              background:
                alertCount > 0
                  ? "#fef2f2"
                  : "#ecfdf5",
              color:
                alertCount > 0
                  ? "#b91c1c"
                  : "#047857",
              padding: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 850,
            }}
          >
            {alertCount > 0 ? (
              <AlertTriangle size={17} />
            ) : (
              <CheckCircle2 size={17} />
            )}

            {alertCount > 0
              ? "Acil durum kayıtlarında takip edilmesi gereken açık maddeler bulunuyor."
              : "Acil durum planı, ekip ve tatbikat kayıtlarında kritik uyarı bulunmuyor."}
          </div>
        </div>
      )}

      <style jsx>{`
        .emergencySummarySkeleton {
          animation: emergency-summary-loading
            1.2s linear infinite;
        }

        @keyframes emergency-summary-loading {
          from {
            background-position: 200% 0;
          }

          to {
            background-position: -200% 0;
          }
        }

        @media (max-width: 780px) {
          .emergencySummaryGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}