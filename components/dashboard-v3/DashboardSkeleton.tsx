"use client";

import styles from "./DashboardV3.module.css";

export default function DashboardSkeleton() {
  return (
    <div className={styles.skeletonShell} aria-label="Dashboard yükleniyor">
      <div className={`${styles.skeletonBlock} ${styles.skeletonHeader}`} />
      <div className={`${styles.skeletonBlock} ${styles.skeletonHero}`} />

      <div className={styles.skeletonGrid}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div className={`${styles.skeletonBlock} ${styles.skeletonCard}`} key={index} />
        ))}
      </div>

      <div className={styles.skeletonAnalytics}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonChart}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonSide}`} />
      </div>
    </div>
  );
}
