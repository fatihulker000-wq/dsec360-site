"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import styles from "./DashboardV3.module.css";

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
};

export default function SectionTitle({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
}: SectionTitleProps) {
  return (
    <div className={styles.sectionTitleV2}>
      <div className={styles.sectionTitleMain}>
        {Icon && (
          <div className={styles.sectionTitleIcon}>
            <Icon size={20} />
          </div>
        )}

        <div>
          {eyebrow && <div className={styles.sectionTitleEyebrow}>{eyebrow}</div>}
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>

      {actions && <div className={styles.sectionTitleActions}>{actions}</div>}
    </div>
  );
}
