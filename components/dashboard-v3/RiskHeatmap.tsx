"use client";

import { Grid3X3, ShieldCheck } from "lucide-react";
import styles from "./DashboardV3.module.css";

type RiskHeatmapProps = {
  matrix: number[][];
};

const severityLabels = ["Çok düşük", "Düşük", "Orta", "Yüksek", "Çok yüksek"];

function getRiskLevel(probability: number, severity: number) {
  const score = probability * severity;

  if (score >= 20) return "critical";
  if (score >= 12) return "high";
  if (score >= 6) return "medium";
  return "low";
}

export default function RiskHeatmap({ matrix }: RiskHeatmapProps) {
  const total = matrix.flat().reduce((sum, value) => sum + value, 0);
  const maxValue = Math.max(1, ...matrix.flat());

  return (
    <section className={styles.insightPanel}>
      <div className={styles.panelHeader}>
        <div>
          <div className={styles.panelEyebrow}>
            <Grid3X3 size={14} />
            5×5 Risk matrisi
          </div>
          <h2>Risk Yoğunluk Haritası</h2>
          <p>Olasılık ve şiddet ekseninde risk kayıtlarının görsel dağılımı.</p>
        </div>

        <div className={styles.scorePill}>
          <ShieldCheck size={16} />
          {total} kayıt
        </div>
      </div>

      <div className={styles.heatmapLayout}>
        <div className={styles.verticalAxisLabel}>Olasılık</div>

        <div className={styles.heatmapBody}>
          <div className={styles.heatmapGrid}>
            {[...matrix].reverse().map((row, reversedRowIndex) => {
              const probability = 5 - reversedRowIndex;

              return row.map((value, columnIndex) => {
                const severity = columnIndex + 1;
                const riskLevel = getRiskLevel(probability, severity);
                const opacity = 0.42 + (value / maxValue) * 0.58;

                return (
                  <div
                    className={`${styles.heatCell} ${styles[`heat${riskLevel}`]}`}
                    key={`${probability}-${severity}`}
                    style={{ opacity }}
                    title={`Olasılık ${probability}, Şiddet ${severity}: ${value} kayıt`}
                  >
                    <span>{value}</span>
                    <small>{probability}×{severity}</small>
                  </div>
                );
              });
            })}
          </div>

          <div className={styles.heatmapSeverityLabels}>
            {severityLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className={styles.horizontalAxisLabel}>Şiddet</div>
        </div>
      </div>

      <div className={styles.heatLegend}>
        <span><i className={styles.legendLow} /> Düşük</span>
        <span><i className={styles.legendMedium} /> Orta</span>
        <span><i className={styles.legendHigh} /> Yüksek</span>
        <span><i className={styles.legendCritical} /> Kritik</span>
      </div>

      <p className={styles.panelFootnote}>
        Matris, mevcut risk sınıflarının 5×5 yönetici görünümüne dağıtılmış özetidir.
      </p>
    </section>
  );
}
