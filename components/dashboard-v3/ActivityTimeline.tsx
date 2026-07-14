"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  HeartPulse,
  ShieldAlert,
} from "lucide-react";
import type { DashboardActivity } from "@/components/dashboard/types";
import styles from "./DashboardV3.module.css";

type ActivityTimelineProps = {
  activities: DashboardActivity[];
};

function formatActivityTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getActivityPresentation(type: string) {
  const normalized = type.toLocaleLowerCase("tr-TR");

  if (normalized.includes("inspection") || normalized.includes("denetim")) {
    return {
      Icon: ClipboardCheck,
      className: styles.timelineInfo,
    };
  }

  if (normalized.includes("training") || normalized.includes("eğitim")) {
    return {
      Icon: GraduationCap,
      className: styles.timelinePurple,
    };
  }

  if (normalized.includes("health") || normalized.includes("sağlık")) {
    return {
      Icon: HeartPulse,
      className: styles.timelineSuccess,
    };
  }

  if (
    normalized.includes("risk") ||
    normalized.includes("danger") ||
    normalized.includes("kritik")
  ) {
    return {
      Icon: ShieldAlert,
      className: styles.timelineDanger,
    };
  }

  if (normalized.includes("warning") || normalized.includes("uyarı")) {
    return {
      Icon: AlertTriangle,
      className: styles.timelineWarning,
    };
  }

  return {
    Icon: CheckCircle2,
    className: styles.timelineNeutral,
  };
}

export default function ActivityTimeline({
  activities,
}: ActivityTimelineProps) {
  return (
    <section className={styles.insightPanel}>
      <div className={styles.panelHeader}>
        <div>
          <div className={styles.panelEyebrow}>
            <Activity size={14} />
            Canlı operasyon
          </div>
          <h2>Aktivite Akışı</h2>
          <p>Platformdaki son işlemler ve operasyon hareketleri.</p>
        </div>

        <span className={styles.liveBadge}>
          <span />
          Canlı
        </span>
      </div>

      {activities.length === 0 ? (
        <div className={styles.compactEmpty}>
          <Activity size={28} />
          <strong>Henüz aktivite oluşmadı</strong>
          <span>Yeni işlemler gerçekleştirildiğinde burada görüntülenecek.</span>
        </div>
      ) : (
        <div className={styles.timelineList}>
          {activities.slice(0, 8).map((activity) => {
            const { Icon, className } = getActivityPresentation(activity.type);

            return (
              <article className={styles.timelineItem} key={activity.id}>
                <div className={`${styles.timelineIcon} ${className}`}>
                  <Icon size={17} />
                </div>

                <div className={styles.timelineContent}>
                  <div className={styles.timelineTitleRow}>
                    <h3>{activity.title}</h3>
                    <time>{formatActivityTime(activity.created_at)}</time>
                  </div>

                  <p>{activity.company || "Genel operasyon"}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
