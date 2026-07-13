"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { QuickActionItem } from "./types";
import styles from "./DashboardV3.module.css";

type QuickActionsProps = {
  items: QuickActionItem[];
};

export default function QuickActions({ items }: QuickActionsProps) {
  if (!items.length) return null;

  return (
    <section>
      <div className={styles.sectionHeading}>
        <div>
          <h2>Hızlı İşlemler</h2>
          <p>En sık kullanılan operasyonlara doğrudan erişim.</p>
        </div>
      </div>

      <div className={styles.quickActions}>
        {items.map(({ title, description, href, icon: Icon }) => (
          <Link className={styles.quickAction} href={href} key={title}>
            <div className={styles.quickActionTop}>
              <div className={styles.quickActionIcon}>
                <Icon size={21} />
              </div>
              <ArrowUpRight size={18} />
            </div>

            <h3>{title}</h3>
            <p>{description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
