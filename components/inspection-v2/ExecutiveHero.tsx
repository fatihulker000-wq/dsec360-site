import styles from "./Inspection.module.css";

type Props = {
  activeFirmName: string;
  totalInspections: number;
  openDof: number;
  closedDof: number;
  conformityRate: number;
  criticalFindings: number;
};

function getScoreLabel(score: number) {
  if (score >= 90) return "Mükemmel görünüm";
  if (score >= 80) return "Güçlü görünüm";
  if (score >= 65) return "Kontrollü görünüm";
  if (score >= 45) return "İyileştirme gerekli";
  return "Kritik müdahale gerekli";
}

function getRiskLabel(criticalFindings: number, openDof: number) {
  if (criticalFindings > 0) return "Kritik takip";
  if (openDof > 0) return "Aksiyon takibi";
  return "Kontrollü";
}

export default function ExecutiveHero({
  activeFirmName,
  totalInspections,
  openDof,
  closedDof,
  conformityRate,
  criticalFindings,
}: Props) {
  const healthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        conformityRate -
          Math.min(28, criticalFindings * 3) -
          Math.min(12, openDof) +
          Math.min(10, closedDof)
      )
    )
  );

  const totalDof = openDof + closedDof;
  const closureRate =
    totalDof > 0 ? Math.round((closedDof / totalDof) * 100) : 100;

  const aiConfidence = Math.max(
    82,
    Math.min(98, Math.round(88 + Math.min(8, totalInspections / 3)))
  );

  const now = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  return (
    <section className={styles.heroV2}>
      <div className={styles.heroV2GlowOne} />
      <div className={styles.heroV2GlowTwo} />

      <div className={styles.heroV2Topbar}>
        <div className={styles.heroV2Brand}>
          <span className={styles.heroV2BrandMark}>D</span>
          <div>
            <span>D-SEC Inspection Intelligence</span>
            <strong>Denetim Komuta Merkezi</strong>
          </div>
        </div>

        <div className={styles.livePill}>
          <span />
          CANLI VERİ
        </div>
      </div>

      <div className={styles.heroV2Main}>
        <div className={styles.heroV2Content}>
          <span className={styles.heroV2Eyebrow}>Enterprise Command Center</span>

          <h1>
            Denetim, bulgu ve DÖF süreçlerini
            <span> tek ekrandan yönetin.</span>
          </h1>

          <p>
            Canlı operasyon görünümü, firma bazlı performans analizi ve DORA
            karar desteği ile denetim süreçlerini merkezi olarak izleyin.
          </p>

          <div className={styles.heroV2Scope}>
            <div>
              <span>Aktif kapsam</span>
              <strong>{activeFirmName}</strong>
            </div>
            <div>
              <span>Risk durumu</span>
              <strong>{getRiskLabel(criticalFindings, openDof)}</strong>
            </div>
            <div>
              <span>Son güncelleme</span>
              <strong>{now}</strong>
            </div>
          </div>
        </div>

        <aside className={styles.heroV2ScorePanel}>
          <div className={styles.heroV2ScoreHeader}>
            <div>
              <span>Denetim Sağlık Skoru</span>
              <strong>{getScoreLabel(healthScore)}</strong>
            </div>
            <span className={styles.heroV2ScoreDelta}>DORA aktif</span>
          </div>

          <div className={styles.heroV2GaugeWrap}>
            <div
              className={styles.heroV2Gauge}
              style={{ "--hero-score": healthScore } as React.CSSProperties}
            >
              <div>
                <strong>{healthScore}</strong>
                <span>/100</span>
              </div>
            </div>
          </div>

          <div className={styles.heroV2ScoreMeta}>
            <div>
              <span>DÖF kapanma</span>
              <strong>%{closureRate}</strong>
            </div>
            <div>
              <span>AI güveni</span>
              <strong>%{aiConfidence}</strong>
            </div>
          </div>
        </aside>
      </div>

      <div className={styles.heroV2Stats}>
        <div>
          <span className={styles.heroV2StatIcon}>01</span>
          <div><small>Toplam denetim</small><strong>{totalInspections}</strong></div>
        </div>
        <div>
          <span className={styles.heroV2StatIcon}>02</span>
          <div><small>Açık DÖF</small><strong>{openDof}</strong></div>
        </div>
        <div>
          <span className={styles.heroV2StatIcon}>03</span>
          <div><small>Kritik bulgu</small><strong>{criticalFindings}</strong></div>
        </div>
        <div>
          <span className={styles.heroV2StatIcon}>04</span>
          <div><small>Uygunluk</small><strong>%{conformityRate}</strong></div>
        </div>
      </div>
    </section>
  );
}
