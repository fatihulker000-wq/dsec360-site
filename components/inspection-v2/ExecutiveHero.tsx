import styles from "./Inspection.module.css";

type ExecutiveHeroProps = {
  activeFirmName: string;
  totalInspections: number;
  openDof: number;
  closedDof: number;
  conformityRate: number;
  criticalFindings: number;
};

export default function ExecutiveHero({
  activeFirmName,
  totalInspections,
  openDof,
  closedDof,
  conformityRate,
  criticalFindings,
}: ExecutiveHeroProps) {
  const healthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        conformityRate -
          Math.min(25, criticalFindings * 2) +
          Math.min(10, closedDof)
      )
    )
  );

  return (
    <section className={styles.hero}>
      <div className={styles.heroGlow} />
      <div className={styles.heroContent}>
        <div>
          <div className={styles.eyebrow}>D-SEC Inspection Command Center</div>
          <h1 className={styles.heroTitle}>Kurumsal Denetim Yönetimi</h1>
          <p className={styles.heroDescription}>
            Denetim, bulgu ve DÖF süreçlerini tek merkezden izleyin.
            Aktif kapsam: <strong>{activeFirmName}</strong>
          </p>

          <div className={styles.heroStats}>
            <div><span>Toplam denetim</span><strong>{totalInspections}</strong></div>
            <div><span>Açık DÖF</span><strong>{openDof}</strong></div>
            <div><span>Kritik bulgu</span><strong>{criticalFindings}</strong></div>
            <div><span>Uygunluk</span><strong>%{conformityRate}</strong></div>
          </div>
        </div>

        <div className={styles.scoreCard}>
          <div className={styles.scoreLabel}>Denetim Sağlık Skoru</div>
          <div className={styles.scoreValue}>{healthScore}</div>
          <div className={styles.scoreSuffix}>/100</div>
          <div className={styles.scoreBar}>
            <span style={{ width: `${healthScore}%` }} />
          </div>
          <div className={styles.scoreMeta}>
            {healthScore >= 85
              ? "Güçlü"
              : healthScore >= 70
              ? "Kontrollü"
              : healthScore >= 50
              ? "İyileştirme gerekli"
              : "Kritik müdahale"}
          </div>
        </div>
      </div>
    </section>
  );
}
