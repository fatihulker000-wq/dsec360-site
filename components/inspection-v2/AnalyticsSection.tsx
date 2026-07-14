import type { CSSProperties } from "react";
import styles from "./Inspection.module.css";

type Item = { label: string; value: number; tone: "slate" | "blue" | "amber" | "green" };
type Company = { name: string; inspections: number; answers: number; conformity: number };
type Props = {
  totalInspections: number; totalAnswers: number; suitable: number; partial: number;
  unsuitable: number; openDof: number; closedDof: number; closureRate: number;
  typeDistribution: Item[]; companyPerformance: Company[];
};

function BarRow({ item, total }: { item: Item; total: number }) {
  const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
  return (
    <div>
      <div className={styles.analyticsBarHeader}>
        <span>{item.label}</span><strong>{item.value} <em>%{percent}</em></strong>
      </div>
      <div className={styles.analyticsTrack}>
        <span className={styles[`analyticsFill_${item.tone}`]} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function AnalyticsSection(props: Props) {
  const conformity = props.totalAnswers > 0 ? Math.round((props.suitable / props.totalAnswers) * 100) : 100;
  const partialRate = props.totalAnswers > 0 ? Math.round((props.partial / props.totalAnswers) * 100) : 0;
  const unsuitableRate = props.totalAnswers > 0 ? Math.round((props.unsuitable / props.totalAnswers) * 100) : 0;

  return (
    <section className={styles.analyticsSection}>
      <div className={styles.sectionHeading}>
        <div><span className={styles.sectionEyebrow}>Inspection Analytics</span>
          <h2>Denetim performans görünümü</h2>
          <p>Tür, uygunluk, firma ve DÖF performansını aynı ekranda değerlendirin.</p>
        </div>
        <div className={styles.sectionStatus}><span>Aktif kayıt</span><strong>{props.totalInspections}</strong></div>
      </div>

      <div className={styles.analyticsGrid}>
        <article className={styles.analyticsCard}>
          <div className={styles.cardHeading}><div><span>Denetim türleri</span><strong>Operasyon dağılımı</strong></div><em>{props.totalInspections} kayıt</em></div>
          <div className={styles.analyticsBars}>{props.typeDistribution.map((item) => <BarRow key={item.label} item={item} total={props.totalInspections} />)}</div>
        </article>

        <article className={styles.analyticsCard}>
          <div className={styles.cardHeading}><div><span>Bulgu kalitesi</span><strong>Uygunluk dağılımı</strong></div><em>{props.totalAnswers} madde</em></div>
          <div className={styles.conformityHero}>
            <div><span>Genel uygunluk</span><strong>%{conformity}</strong></div>
            <div className={styles.conformityRing}><span style={{ "--score": conformity } as CSSProperties}>%{conformity}</span></div>
          </div>
          <div className={styles.conformityGrid}>
            <div className={styles.conformityGood}><span>Uygun</span><strong>{props.suitable}</strong></div>
            <div className={styles.conformityWarning}><span>Kısmen</span><strong>{props.partial}</strong><em>%{partialRate}</em></div>
            <div className={styles.conformityDanger}><span>Uygunsuz</span><strong>{props.unsuitable}</strong><em>%{unsuitableRate}</em></div>
          </div>
        </article>

        <article className={styles.analyticsCard}>
          <div className={styles.cardHeading}><div><span>DÖF performansı</span><strong>Kapanış görünümü</strong></div><em>%{props.closureRate}</em></div>
          <div className={styles.dofPerformance}>
            <div className={styles.dofGauge}><div className={styles.dofGaugeValue} style={{ "--closure": props.closureRate } as CSSProperties}><strong>%{props.closureRate}</strong><span>Kapanma</span></div></div>
            <div className={styles.dofPerformanceStats}>
              <div><span>Açık</span><strong>{props.openDof}</strong></div>
              <div><span>Kapalı</span><strong>{props.closedDof}</strong></div>
              <div><span>Toplam</span><strong>{props.openDof + props.closedDof}</strong></div>
            </div>
          </div>
        </article>

        <article className={styles.analyticsCard}>
          <div className={styles.cardHeading}><div><span>Firma performansı</span><strong>İlk 5 kuruluş</strong></div><em>Canlı</em></div>
          <div className={styles.companyRanking}>
            {props.companyPerformance.length === 0 ? <div>Firma performans verisi bulunmuyor.</div> :
              props.companyPerformance.map((c, i) => (
                <div className={styles.companyRankRow} key={c.name}>
                  <div className={styles.rankNumber}>{i + 1}</div>
                  <div className={styles.rankMain}><strong>{c.name}</strong><span>{c.inspections} denetim • {c.answers} madde</span></div>
                  <div className={styles.rankScore}>%{c.conformity}</div>
                </div>
              ))}
          </div>
        </article>
      </div>
    </section>
  );
}
