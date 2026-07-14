"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";
import Sparkline from "./Sparkline";
import type { DashboardMetric } from "./types";
import styles from "./DashboardV3.module.css";

type KPICardV2Props = DashboardMetric;

export default function KPICardV2({
  title,
  value,
  icon: Icon,
  trend = "neutral",
  change,
  color = "red",
  description,
  href,
  sparkline = [],
  statusLabel,
}: KPICardV2Props) {
  const TrendIcon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  const content = (
    <article className={`${styles.kpiCardV2} ${styles[`kpiTone${color}`]}`}>
      <div className={styles.kpiTopRow}>
        <div className={styles.kpiIconV2}>
          <Icon size={22} />
        </div>

        <div className={`${styles.kpiTrendV2} ${styles[`trend${trend}`]}`}>
          <TrendIcon size={15} />
          {change === undefined ? "Sabit" : `%${Math.abs(change)}`}
        </div>
      </div>

      <div className={styles.kpiTitleV2}>{title}</div>
      <div className={styles.kpiValueV2}>{value}</div>

      <div className={styles.kpiSparklineV2}>
        <Sparkline values={sparkline} tone={color} />
      </div>

      <div className={styles.kpiBottomV2}>
        <p>{description || "Güncel kurumsal gösterge"}</p>
        {statusLabel && <span>{statusLabel}</span>}
      </div>
    </article>
  );

  return href ? (
    <Link className={styles.kpiLinkV2} href={href}>
      {content}
    </Link>
  ) : (
    content
  );
}
