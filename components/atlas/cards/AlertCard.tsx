"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CircleAlert,
  Info,
  CheckCircle2,
} from "lucide-react";
import styles from "./AlertCard.module.css";

type AlertVariant = "critical" | "warning" | "info" | "success";

interface AlertCardProps {
  title: string;
  value: string | number;
  description?: string;
  variant?: AlertVariant;
  href?: string;
  actionLabel?: string;
}

const iconMap = {
  critical: CircleAlert,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

export default function AlertCard({
  title,
  value,
  description,
  variant = "warning",
  href,
  actionLabel = "Detaya git",
}: AlertCardProps) {
  const Icon = iconMap[variant];

  return (
    <section className={`${styles.card} ${styles[variant]}`}>
      <div className={styles.top}>
        <div className={styles.iconBox}>
          <Icon size={22} />
        </div>

        <span className={styles.variantLabel}>
          {variant === "critical" && "Kritik"}
          {variant === "warning" && "Uyarı"}
          {variant === "info" && "Bilgi"}
          {variant === "success" && "Başarılı"}
        </span>
      </div>

      <div className={styles.value}>{value}</div>
      <h3>{title}</h3>

      {description && <p>{description}</p>}

      {href && (
        <Link href={href} className={styles.action}>
          <span>{actionLabel}</span>
          <ArrowRight size={16} />
        </Link>
      )}
    </section>
  );
}