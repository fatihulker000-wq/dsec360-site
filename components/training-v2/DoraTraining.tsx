"use client";

import styles from "./training.module.css";

type Props = {
  totalEmployees: number;
  totalTrainings: number;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  missingVideo: number;
  missingFinalExam: number;
  selectedTrainingTitle: string;
};

export default function DoraTraining(props: Props) {
  const completionRate = props.totalAssigned > 0
    ? Math.round((props.completed / props.totalAssigned) * 100)
    : 0;
  const coverageRate = props.totalEmployees > 0
    ? Math.min(100, Math.round((props.totalAssigned / props.totalEmployees) * 100))
    : 0;

  const priority = props.notStarted > 0
    ? `${props.notStarted} eğitim ataması henüz başlatılmadı. Firma ve çalışan bazında önceliklendirin.`
    : props.missingVideo > 0
      ? `${props.missingVideo} asenkron eğitimde video içeriği eksik görünüyor.`
      : props.missingFinalExam > 0
        ? `${props.missingFinalExam} asenkron eğitimde final sınavı tanımlı değil.`
        : "Kritik eğitim içeriği açığı görünmüyor; mevcut uyum seviyesini koruyun.";

  const confidence = Math.max(80, Math.min(98, 84 + Math.min(10, props.totalTrainings)));

  return (
    <section className={styles.doraSection}>
      <div className={styles.doraHeader}>
        <div className={styles.doraIdentity}>
          <div className={styles.doraIcon}>D</div>
          <div>
            <span className={styles.sectionEyebrow}>DORA Training Intelligence</span>
            <h2>Eğitim yönetici özeti</h2>
            <p>Canlı eğitim, atama ve içerik hazırlık verilerinden oluşturuldu.</p>
          </div>
        </div>
        <div className={styles.aiConfidence}><span>AI Güveni</span><strong>%{confidence}</strong></div>
      </div>

      <div className={styles.doraGrid}>
        <div className={styles.doraInsights}>
          <article className={styles.doraGood}><span>Tamamlama</span><strong>%{completionRate}</strong><p>Eğitim atamalarının tamamlanma seviyesi.</p></article>
          <article className={coverageRate >= 80 ? styles.doraGood : styles.doraWarning}><span>Kapsama Oranı</span><strong>%{coverageRate}</strong><p>Çalışan sayısına göre atama yoğunluğu.</p></article>
          <article className={props.missingVideo === 0 ? styles.doraGood : styles.doraWarning}><span>Video Açığı</span><strong>{props.missingVideo}</strong><p>Asenkron eğitim video hazırlığı.</p></article>
          <article className={props.missingFinalExam === 0 ? styles.doraGood : styles.doraWarning}><span>Sınav Açığı</span><strong>{props.missingFinalExam}</strong><p>Final sınavı eksik asenkron eğitim.</p></article>
        </div>

        <aside className={styles.doraPriority}>
          <span>Öncelikli aksiyon</span>
          <h3>{priority}</h3>
          <div className={styles.doraMeta}>
            <div><span>Eğitim</span><strong>{props.totalTrainings}</strong></div>
            <div><span>Devam</span><strong>{props.inProgress}</strong></div>
            <div><span>Başlamadı</span><strong>{props.notStarted}</strong></div>
          </div>
          {props.selectedTrainingTitle && (
            <div className={styles.selectedTrainingInfo}>
              <span>Seçili eğitim</span><strong>{props.selectedTrainingTitle}</strong>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
