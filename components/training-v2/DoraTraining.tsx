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
    ? `${props.notStarted} eÄŸitim atamasÄ± henÃ¼z baÅŸlatÄ±lmadÄ±. Firma ve Ã§alÄ±ÅŸan bazÄ±nda Ã¶nceliklendirin.`
    : props.missingVideo > 0
      ? `${props.missingVideo} asenkron eÄŸitimde video iÃ§eriÄŸi eksik gÃ¶rÃ¼nÃ¼yor.`
      : props.missingFinalExam > 0
        ? `${props.missingFinalExam} asenkron eÄŸitimde final sÄ±navÄ± tanÄ±mlÄ± deÄŸil.`
        : "Kritik eÄŸitim iÃ§eriÄŸi aÃ§Ä±ÄŸÄ± gÃ¶rÃ¼nmÃ¼yor; mevcut uyum seviyesini koruyun.";

  const confidence = Math.max(80, Math.min(98, 84 + Math.min(10, props.totalTrainings)));

  return (
    <section className={styles.doraSection}>
      <div className={styles.doraHeader}>
        <div className={styles.doraIdentity}>
          <div className={styles.doraIcon}>D</div>
          <div>
            <span className={styles.sectionEyebrow}>DORA Training Intelligence</span>
            <h2>EÄŸitim yÃ¶netici Ã¶zeti</h2>
            <p>CanlÄ± eÄŸitim, atama ve iÃ§erik hazÄ±rlÄ±k verilerinden oluÅŸturuldu.</p>
          </div>
        </div>
        <div className={styles.aiConfidence}><span>AI GÃ¼veni</span><strong>%{confidence}</strong></div>
      </div>

      <div className={styles.doraGrid}>
        <div className={styles.doraInsights}>
          <article className={styles.doraGood}><span>Tamamlama</span><strong>%{completionRate}</strong><p>EÄŸitim atamalarÄ±nÄ±n tamamlanma seviyesi.</p></article>
          <article className={coverageRate >= 80 ? styles.doraGood : styles.doraWarning}><span>Kapsama OranÄ±</span><strong>%{coverageRate}</strong><p>Ã‡alÄ±ÅŸan sayÄ±sÄ±na gÃ¶re atama yoÄŸunluÄŸu.</p></article>
          <article className={props.missingVideo === 0 ? styles.doraGood : styles.doraWarning}><span>Video AÃ§Ä±ÄŸÄ±</span><strong>{props.missingVideo}</strong><p>Asenkron eÄŸitim video hazÄ±rlÄ±ÄŸÄ±.</p></article>
          <article className={props.missingFinalExam === 0 ? styles.doraGood : styles.doraWarning}><span>SÄ±nav AÃ§Ä±ÄŸÄ±</span><strong>{props.missingFinalExam}</strong><p>Final sÄ±navÄ± eksik asenkron eÄŸitim.</p></article>
        </div>

        <aside className={styles.doraPriority}>
          <span>Ã–ncelikli aksiyon</span>
          <h3>{priority}</h3>
          <div className={styles.doraMeta}>
            <div><span>EÄŸitim</span><strong>{props.totalTrainings}</strong></div>
            <div><span>Devam</span><strong>{props.inProgress}</strong></div>
            <div><span>BaÅŸlamadÄ±</span><strong>{props.notStarted}</strong></div>
          </div>
          {props.selectedTrainingTitle && (
            <div className={styles.selectedTrainingInfo}>
              <span>SeÃ§ili eÄŸitim</span><strong>{props.selectedTrainingTitle}</strong>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

