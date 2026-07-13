"use client";

import Link from "next/link";
import styles from "./MetricCard.module.css";
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

type Trend = "up" | "down" | "neutral";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;

  trend?: Trend;
  change?: number;
  description?: string;

  href?: string;

  color?: "red" | "green" | "blue" | "orange" | "purple";
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  trend = "neutral",
  change,
  description,
  href,
  color = "red",
}: MetricCardProps) {
  const TrendIcon =
    trend === "up"
      ? ArrowUpRight
      : trend === "down"
      ? ArrowDownRight
      : Minus;

  const card = (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.header}>
        <div className={styles.iconBox}>
          <Icon size={22} />
        </div>

        {change !== undefined && (
          <div
            className={`${styles.change} ${
              trend === "up"
                ? styles.up
                : trend === "down"
                ? styles.down
                : styles.neutral
            }`}
          >
            <TrendIcon size={16} />
            {change}%
          </div>
        )}
      </div>

      <div className={styles.body}>
        <h4>{title}</h4>

        <div className={styles.value}>{value}</div>

        {description && (
          <p className={styles.description}>{description}</p>
        )}
      </div>

      <div className={styles.sparkline}>
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={styles.link}>
        {card}
      </Link>
    );
  }

  return card;
}