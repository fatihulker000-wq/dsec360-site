"use client";

import styles from "./Training.module.css";

type Props = {
  totalEmployees: number;
  totalTrainings: number;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  selectedCount: number;
};

export default function TrainingExecutiveHero(props: Props) {
  const completionRate = props.totalAssigned > 0
    ? Math.round((props.completed / props.totalAssigned) * 100)
    : 0;

  return (
    <section className={styles.hero}>
      <div className={styles.heroGlow} />
      <div className={styles.heroGrid}>
        <div>
          <span className={styles.heroBadge}>D-SEC Eğitim Command Center</span>
          <h1>Eğitim Yönetim Merkezi</h1>
          <p>Asenkron, senkron, örgün ve özel eğitim kayıtlarını; video, sınav, katılım ve atama süreçlerini tek merkezden yönetin.</p>
          <div className={styles.heroStats}>
            <div><span>Çalışan</span><strong>{props.totalEmployees}</strong></div>
            <div><span>Eğitim</span><strong>{props.totalTrainings}</strong></div>
            <div><span>Atama</span><strong>{props.totalAssigned}</strong></div>
            <div><span>Seçili</span><strong>{props.selectedCount}</strong></div>
          </div>
        </div>
        <div className={styles.scoreCard}>
          <span>Tamamlama Skoru</span>
          <strong>%{completionRate}</strong>
          <div className={styles.scoreTrack}><i style={{width:`${completionRate}%`}} /></div>
          <small>{props.completed} tamamlandı • {props.inProgress} devam • {props.notStarted} başlamadı</small>
        </div>
      </div>
    </section>
  );
}
