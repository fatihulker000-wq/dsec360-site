"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import styles from "./DashboardV3.module.css";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export default function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Icon size={28} />
      </div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
