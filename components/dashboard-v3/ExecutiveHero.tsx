"use client";

import { ExecutiveCard } from "@/components/atlas";
import type { HeroStat } from "./types";
import styles from "./DashboardV3.module.css";

type ExecutiveHeroProps = {
  title: string;
  description: string;
  stats: HeroStat[];
};

export default function ExecutiveHero({
  title,
  description,
  stats,
}: ExecutiveHeroProps) {
  return (
    <ExecutiveCard
      eyebrow="D-SEC Enterprise Intelligence"
      title={title}
      description={description}
    >
      <div className={styles.heroStats}>
        {stats.map((item) => (
          <div className={styles.heroStat} key={item.label}>
            <div className={styles.heroLabel}>{item.label}</div>
            <div className={styles.heroValue}>{item.value}</div>
          </div>
        ))}
      </div>
    </ExecutiveCard>
  );
}
