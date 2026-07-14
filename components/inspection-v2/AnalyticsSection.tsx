import type { CSSProperties } from "react";
import styles from "./Inspection.module.css";

type TypeDistributionItem = {
  label: string;
  value: number;
  tone: "slate" | "blue" | "amber" | "green";
};

type CompanyPerformanceItem = {
  name: string;
  inspections: number;
  answers: number;
  conformity: number;
};

type AnalyticsSectionProps = {
  totalInspections: number;
  totalAnswers: number;
  suitable: number;
  partial: number;
  unsuitable: number;
  openDof: number;
  closedDof: number;
  closureRate: number;
  typeDistribution: TypeDistributionItem[];
  companyPerformance: CompanyPerformanceItem[];
};

function BarRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: TypeDistributionItem["tone"];
}) {
  const percent =
    total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className={styles.analyticsBarRow}>
      <div className={styles.analyticsBarHeader}>
        <span>{label}</span>

        <strong>
          {value} <em>%{percent}</em>
        </strong>
      </div>

      <div className={styles.analyticsTrack}>
        <span
          className={styles[`analyticsFill_${tone}`]}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsSection({
  totalInspections,
  totalAnswers,
  suitable,
  partial,
  unsuitable,
  openDof,
  closedDof,
  closureRate,
  typeDistribution,
  companyPerformance,
}: AnalyticsSectionProps) {
  const conformityRate =
    totalAnswers > 0
      ? Math.round((suitable / totalAnswers) * 100)
      : 100;

  const partialRate =
    totalAnswers > 0
      ? Math.round((partial / totalAnswers) * 100)
      : 0;

  const unsuitableRate =
    totalAnswers > 0
      ? Math.round((unsuitable / totalAnswers) * 100)
      : 0;

  return (
    <section className={styles.analyticsSection}>
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.sectionEyebrow}>
            Inspection Analytics
          </span>

          <h2>Denetim performans görünümü</h2>

          <p>
            Tür, uygunluk, firma ve DÖF performansını aynı
            ekranda değerlendirin.
          </p>
        </div>

        <div className={styles.sectionStatus}>
          <span>Aktif kayıt</span>
          <strong>{totalInspections}</strong>
        </div>
      </div>

      <div className={styles.analyticsGrid}>
        <article className={styles.analyticsCard}>
          <div className={styles.cardHeading}>
            <div>
              <span>Denetim türleri</span>
              <strong>Operasyon dağılımı</strong>
            </div>

            <em>{totalInspections} kayıt</em>
          </div>

          <div className={styles.analyticsBars}>
            {typeDistribution.map((item) => (
              <BarRow
                key={item.label}
                label={item.label}
                value={item.value}
                total={totalInspections}
                tone={item.tone}
              />
            ))}
          </div>
        </article>

        <article className={styles.analyticsCard}>
          <div className={styles.cardHeading}>
            <div>
              <span>Bulgu kalitesi</span>
              <strong>Uygunluk dağılımı</strong>
            </div>

            <em>{totalAnswers} madde</em>
          </div>

          <div className={styles.conformityHero}>
            <div>
              <span>Genel uygunluk</span>
              <strong>%{conformityRate}</strong>
            </div>

            <div className={styles.conformityRing}>
              <span
                style={
                  {
                    "--score": conformityRate,
                  } as CSSProperties
                }
              >
                %{conformityRate}
              </span>
            </div>
          </div>

          <div className={styles.conformityGrid}>
            <div className={styles.conformityGood}>
              <span>Uygun</span>
              <strong>{suitable}</strong>
            </div>

            <div className={styles.conformityWarning}>
              <span>Kısmen</span>
              <strong>{partial}</strong>
              <em>%{partialRate}</em>
            </div>

            <div className={styles.conformityDanger}>
              <span>Uygunsuz</span>
              <strong>{unsuitable}</strong>
              <em>%{unsuitableRate}</em>
            </div>
          </div>
        </article>

        <article className={styles.analyticsCard}>
          <div className={styles.cardHeading}>
            <div>
              <span>DÖF performansı</span>
              <strong>Kapanış görünümü</strong>
            </div>

            <em>%{closureRate}</em>
          </div>

          <div className={styles.dofPerformance}>
            <div className={styles.dofGauge}>
              <div
                className={styles.dofGaugeValue}
                style={
                  {
                    "--closure": closureRate,
                  } as CSSProperties
                }
              >
                <strong>%{closureRate}</strong>
                <span>Kapanma</span>
              </div>
            </div>

            <div className={styles.dofPerformanceStats}>
              <div>
                <span>Açık</span>
                <strong>{openDof}</strong>
              </div>

              <div>
                <span>Kapalı</span>
                <strong>{closedDof}</strong>
              </div>

              <div>
                <span>Toplam</span>
                <strong>{openDof + closedDof}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className={styles.analyticsCard}>
          <div className={styles.cardHeading}>
            <div>
              <span>Firma performansı</span>
              <strong>İlk 5 kuruluş</strong>
            </div>

            <em>Canlı</em>
          </div>

          <div className={styles.companyRanking}>
            {companyPerformance.length === 0 ? (
              <div className={styles.analyticsEmpty}>
                Firma performans verisi bulunmuyor.
              </div>
            ) : (
              companyPerformance.map((company, index) => (
                <div
                  className={styles.companyRankRow}
                  key={company.name}
                >
                  <div className={styles.rankNumber}>
                    {index + 1}
                  </div>

                  <div className={styles.rankMain}>
                    <strong>{company.name}</strong>

                    <span>
                      {company.inspections} denetim •{" "}
                      {company.answers} madde
                    </span>
                  </div>

                  <div className={styles.rankScore}>
                    %{company.conformity}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
}