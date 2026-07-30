"use client";

import styles from "./Training.module.css";

type TrainingItem = {
  id: string;
  title: string;
  type: string;
  duration: string;
  assigned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  videoCount: number;
  preExamCount: number;
  finalExamCount: number;
};

type Props = {
  asyncCount: number;
  withVideo: number;
  withPreExam: number;
  withFinalExam: number;
  trainings: TrainingItem[];
};

export default function TrainingContentReadiness(props: Props) {
  const rate = (value: number) => props.asyncCount > 0
    ? Math.round((value / props.asyncCount) * 100)
    : 100;

  return (
    <section className={styles.readinessSection}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>Content Readiness</span>
          <h2>Asenkron eÄŸitim iÃ§erik hazÄ±rlÄ±ÄŸÄ±</h2>
          <p>Video ve sÄ±nav kurallarÄ±nÄ± deÄŸiÅŸtirmeden iÃ§eriklerin hazÄ±rlÄ±k durumunu izleyin.</p>
        </div>
        <div className={styles.sectionCounter}><span>Asenkron</span><strong>{props.asyncCount}</strong></div>
      </div>

      <div className={styles.readinessStats}>
        <div><span>Video hazÄ±r</span><strong>{props.withVideo}</strong><em>%{rate(props.withVideo)}</em></div>
        <div><span>Ã–n sÄ±nav hazÄ±r</span><strong>{props.withPreExam}</strong><em>%{rate(props.withPreExam)}</em></div>
        <div><span>Final hazÄ±r</span><strong>{props.withFinalExam}</strong><em>%{rate(props.withFinalExam)}</em></div>
      </div>

      <div className={styles.trainingOverviewGrid}>
        {props.trainings.length === 0 ? (
          <div className={styles.emptyInline}>EÄŸitim kaydÄ± bulunmuyor.</div>
        ) : props.trainings.map((training) => {
          const completion = training.assigned > 0
            ? Math.round((training.completed / training.assigned) * 100)
            : 0;
          return (
            <article className={styles.trainingOverviewCard} key={training.id}>
              <div className={styles.trainingOverviewTop}>
                <div><span>{training.type}</span><h3>{training.title}</h3></div>
                <strong>%{completion}</strong>
              </div>
              <p>{training.duration} â€¢ {training.assigned} atama</p>
              <div className={styles.trainingProgress}><i style={{ width: `${completion}%` }} /></div>
              <div className={styles.contentBadges}>
                <span className={training.videoCount > 0 ? styles.readyBadge : styles.missingBadge}>Video {training.videoCount}</span>
                <span className={training.preExamCount > 0 ? styles.readyBadge : styles.neutralBadge}>Ã–n SÄ±nav {training.preExamCount}</span>
                <span className={training.finalExamCount > 0 ? styles.readyBadge : styles.missingBadge}>Final {training.finalExamCount}</span>
              </div>
              <div className={styles.trainingMiniStats}>
                <span>Tamam {training.completed}</span><span>Devam {training.inProgress}</span><span>BaÅŸlamadÄ± {training.notStarted}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

