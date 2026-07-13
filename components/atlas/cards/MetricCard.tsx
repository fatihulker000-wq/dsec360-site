"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";
import styles from "./MetricCard.module.css";

export type MetricTrend = "up" | "down" | "neutral";
export type MetricIntent =
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "violet"
  | "neutral";

type MetricCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  eyebrow?: string;
  suffix?: string;
  description?: string;
  change?: number;
  changeLabel?: string;
  trend?: MetricTrend;
  intent?: MetricIntent;
  progress?: number;
  href?: string;
  linkLabel?: string;
  footer?: ReactNode;
  ariaLabel?: string;
};

const palette: Record<MetricIntent, { accent: string; soft: string; glow: string }> = {
  brand: { accent: "#e11d48", soft: "#fff1f2", glow: "rgba(225,29,72,.15)" },
  success: { accent: "#059669", soft: "#ecfdf5", glow: "rgba(5,150,105,.14)" },
  warning: { accent: "#d97706", soft: "#fffbeb", glow: "rgba(217,119,6,.14)" },
  danger: { accent: "#dc2626", soft: "#fef2f2", glow: "rgba(220,38,38,.14)" },
  info: { accent: "#2563eb", soft: "#eff6ff", glow: "rgba(37,99,235,.14)" },
  violet: { accent: "#7c3aed", soft: "#f5f3ff", glow: "rgba(124,58,237,.14)" },
  neutral: { accent: "#475569", soft: "#f1f5f9", glow: "rgba(71,85,105,.13)" },
};

function clampProgress(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.min(100, Math.max(0, value));
}

function getTrendIcon(trend: MetricTrend) {
  if (trend === "up") return ArrowUpRight;
  if (trend === "down") return ArrowDownRight;
  return Minus;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  eyebrow,
  suffix,
  description,
  change,
  changeLabel,
  trend = "neutral",
  intent = "info",
  progress,
  href,
  linkLabel = "Detay",
  footer,
  ariaLabel,
}: MetricCardProps) {
  const router = useRouter();
  const TrendIcon = getTrendIcon(trend);
  const colors = palette[intent];
  const safeProgress = clampProgress(progress);
  const clickable = Boolean(href);

  const cssVars = {
    "--atlas-accent": colors.accent,
    "--atlas-soft": colors.soft,
    "--atlas-glow": colors.glow,
  } as CSSProperties;

  const open = () => {
    if (href) router.push(href);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!clickable) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  };

  const changeClass =
    trend === "up"
      ? styles.changePositive
      : trend === "down"
        ? styles.changeNegative
        : styles.changeNeutral;

  return (
    <article
      className={`${styles.card} ${clickable ? styles.clickable : ""}`}
      style={cssVars}
      onClick={clickable ? open : undefined}
      onKeyDown={onKeyDown}
      role={clickable ? "link" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={ariaLabel || (clickable ? `${title}: ${value}. ${linkLabel}` : `${title}: ${value}`)}
    >
      <div className={styles.topRow}>
        <div className={styles.identity}>
          <span className={styles.iconWrap} aria-hidden="true">
            <Icon size={22} strokeWidth={2.2} />
          </span>
          <div>
            <h3 className={styles.title}>{title}</h3>
            {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          </div>
        </div>

        {typeof change === "number" || changeLabel ? (
          <span className={`${styles.change} ${changeClass}`}>
            <TrendIcon size={14} strokeWidth={2.5} aria-hidden="true" />
            {changeLabel || `${Math.abs(change || 0).toLocaleString("tr-TR")}%`}
          </span>
        ) : null}
      </div>

      <div className={styles.valueRow}>
        <span className={styles.value}>{value}</span>
        {suffix ? <span className={styles.suffix}>{suffix}</span> : null}
      </div>

      {description ? <p className={styles.description}>{description}</p> : null}

      {footer || typeof safeProgress === "number" || clickable ? (
        <div className={styles.footer}>
          {footer || typeof safeProgress === "number" ? (
            footer || (
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(safeProgress || 0)}
                aria-label={`${title} ilerleme oranı`}
              >
                <div
                  className={styles.progressValue}
                  style={{ width: `${safeProgress}%` }}
                />
              </div>
            )
          ) : (
            <span />
          )}

          {clickable ? (
            <span className={styles.linkHint}>
              {linkLabel}
              <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
