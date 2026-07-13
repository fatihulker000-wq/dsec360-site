"use client";

import { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import styles from "./ExecutiveCard.module.css";

interface ExecutiveCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export default function ExecutiveCard({
  eyebrow = "D-SEC Executive",
  title,
  description,
  actions,
  children,
}: ExecutiveCardProps) {
  return (
    <section className={styles.card}>
      <div className={styles.glowOne} />
      <div className={styles.glowTwo} />

      <div className={styles.content}>
        <div className={styles.eyebrow}>
          <Sparkles size={16} />
          <span>{eyebrow}</span>
        </div>

        <div className={styles.mainRow}>
          <div className={styles.textArea}>
            <h2>{title}</h2>

            {description && <p>{description}</p>}
          </div>

          {actions && <div className={styles.actions}>{actions}</div>}
        </div>

        {children && <div className={styles.extra}>{children}</div>}
      </div>
    </section>
  );
}