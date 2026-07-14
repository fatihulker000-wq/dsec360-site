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
          <h2>Eğitim performans görünümü</h2>
          <p>Atama, tamamlama ve eğitim türlerini tek ekranda değerlendirin.</p>
        </div>
        <div className={styles.sectionCounter}>
          <span>Toplam Eğitim</span>
          <strong>{props.totalTrainings}</strong>
        </div>
      </div>

      <div className={styles.analyticsGrid}>
        <article className={styles.analyticsCard}>
          <div className={styles.analyticsCardHeader}>
            <div><span>Atama durumu</span><strong>Tamamlama performansı</strong></div>
            <em>%{completionRate}</em>
          </div>

          <div className={styles.completionLayout}>
            <div
              className={styles.completionRing}
              style={{ "--training-score": completionRate } as CSSProperties}
            >
              <strong>%{completionRate}</strong>
              <span>Tamamlandı</span>
            </div>

            <div className={styles.analyticsRows}>
              <div><span>Tamamlanan</span><strong>{props.completed}</strong><em>%{completionRate}</em></div>
              <div><span>Devam Eden</span><strong>{props.inProgress}</strong><em>%{progressRate}</em></div>
              <div><span>Başlamayan</span><strong>{props.notStarted}</strong><em>%{notStartedRate}</em></div>
            </div>
          </div>
        </article>

        <article className={styles.analyticsCard}>
          <div className={styles.analyticsCardHeader}>
            <div><span>Portföy</span><strong>Eğitim türü dağılımı</strong></div>
            <em>{props.typeDistribution.length} tür</em>
          </div>

          <div className={styles.typeDistribution}>
            {props.typeDistribution.length === 0 ? (
              <div className={styles.emptyInline}>Eğitim türü verisi bulunmuyor.</div>
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
