"use client";

import type { CSSProperties } from "react";
import styles from "./Training.module.css";

type DistributionItem = { label: string; value: number };

type Props = {
  totalAssigned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  typeDistribution: DistributionItem[];
  totalTrainings: number;
};

export default function TrainingAnalytics(props: Props) {
  const completionRate = props.totalAssigned > 0
    ? Math.round((props.completed / props.totalAssigned) * 100)
    : 0;
  const progressRate = props.totalAssigned > 0
    ? Math.round((props.inProgress / props.totalAssigned) * 100)
    : 0;
  const notStartedRate = props.totalAssigned > 0
    ? Math.round((props.notStarted / props.totalAssigned) * 100)
    : 0;

  return (
    <section className={styles.analyticsSection}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>Training Analytics</span>
          <h2>EÄŸitim performans gÃ¶rÃ¼nÃ¼mÃ¼</h2>
          <p>Atama, tamamlama ve eÄŸitim tÃ¼rlerini tek ekranda deÄŸerlendirin.</p>
        </div>
        <div className={styles.sectionCounter}>
          <span>Toplam EÄŸitim</span>
          <strong>{props.totalTrainings}</strong>
        </div>
      </div>

      <div className={styles.analyticsGrid}>
        <article className={styles.analyticsCard}>
          <div className={styles.analyticsCardHeader}>
            <div><span>Atama durumu</span><strong>Tamamlama performansÄ±</strong></div>
            <em>%{completionRate}</em>
          </div>

          <div className={styles.completionLayout}>
            <div
              className={styles.completionRing}
              style={{ "--training-score": completionRate } as CSSProperties}
            >
              <strong>%{completionRate}</strong>
              <span>TamamlandÄ±</span>
            </div>

            <div className={styles.analyticsRows}>
              <div><span>Tamamlanan</span><strong>{props.completed}</strong><em>%{completionRate}</em></div>
              <div><span>Devam Eden</span><strong>{props.inProgress}</strong><em>%{progressRate}</em></div>
              <div><span>BaÅŸlamayan</span><strong>{props.notStarted}</strong><em>%{notStartedRate}</em></div>
            </div>
          </div>
        </article>

        <article className={styles.analyticsCard}>
          <div className={styles.analyticsCardHeader}>
            <div><span>PortfÃ¶y</span><strong>EÄŸitim tÃ¼rÃ¼ daÄŸÄ±lÄ±mÄ±</strong></div>
            <em>{props.typeDistribution.length} tÃ¼r</em>
          </div>

          <div className={styles.typeDistribution}>
            {props.typeDistribution.length === 0 ? (
              <div className={styles.emptyInline}>EÄŸitim tÃ¼rÃ¼ verisi bulunmuyor.</div>
            ) : props.typeDistribution.map((item, index) => {
              const rate = props.totalTrainings > 0
                ? Math.round((item.value / props.totalTrainings) * 100)
                : 0;
              return (
                <div className={styles.typeRow} key={item.label}>
                  <div><span>{item.label}</span><strong>{item.value}</strong></div>
                  <div className={styles.typeTrack}>
                    <i style={{ width: `${rate}%` }} data-index={index} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}

