"use client";

import { useMemo, useState } from "react";
import styles from "./TrainingComplianceEngine.module.css";
import {
  COMPLIANCE_RULES,
  type DangerClass,
  formatMinutes,
  getComplianceRule,
  percentage,
} from "./rules";

export type ComplianceTrainingItem = {
  id: string;
  title: string;
  type: string;
  duration_minutes: number | null;
  assigned_count: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
  video_count: number;
  final_exam_count: number;
};

type TrainingComplianceEngineProps = {
  trainings: ComplianceTrainingItem[];
  totalEmployees: number;
  selectedCompanyName: string;
};

function normalizeType(value?: string | null) {
  const text = String(value || "").toLocaleLowerCase("tr-TR");

  if (text.includes("asenkron") || text.includes("online")) {
    return "Asenkron";
  }

  if (text.includes("senkron")) return "Senkron";
  if (text.includes("orgun") || text.includes("örgün")) {
    return "Örgün";
  }

  if (text.includes("ozel") || text.includes("özel")) {
    return "Özel";
  }

  return "Eğitim";
}

export default function TrainingComplianceEngine({
  trainings,
  totalEmployees,
  selectedCompanyName,
}: TrainingComplianceEngineProps) {
  const [dangerClass, setDangerClass] =
    useState<DangerClass>("LOW");
  const [trainingMode, setTrainingMode] = useState<
    "INITIAL" | "REPEAT"
  >("INITIAL");

  const rule = getComplianceRule(dangerClass);

  const metrics = useMemo(() => {
    const requiredMinutes =
      trainingMode === "INITIAL"
        ? rule.initialMinimumMinutes
        : rule.repeatMinimumMinutes;

    const totalCatalogMinutes = trainings.reduce(
      (sum, training) =>
        sum + Math.max(0, Number(training.duration_minutes || 0)),
      0
    );

    const completedWeightedMinutes = trainings.reduce(
      (sum, training) => {
        if (training.assigned_count <= 0) return sum;

        const completionRatio =
          training.completed_count / training.assigned_count;

        return (
          sum +
          Math.max(
            0,
            Number(training.duration_minutes || 0)
          ) *
            Math.min(1, Math.max(0, completionRatio))
        );
      },
      0
    );

    const averageCompletedMinutes =
      trainings.length > 0
        ? Math.round(completedWeightedMinutes)
        : 0;

    const remainingMinutes = Math.max(
      0,
      requiredMinutes - averageCompletedMinutes
    );

    const complianceScore = percentage(
      averageCompletedMinutes,
      requiredMinutes
    );

    const assigned = trainings.reduce(
      (sum, training) => sum + training.assigned_count,
      0
    );

    const completed = trainings.reduce(
      (sum, training) => sum + training.completed_count,
      0
    );

    const inProgress = trainings.reduce(
      (sum, training) => sum + training.in_progress_count,
      0
    );

    const notStarted = trainings.reduce(
      (sum, training) => sum + training.not_started_count,
      0
    );

    const asyncMissingContent = trainings.filter(
      (training) =>
        normalizeType(training.type) === "Asenkron" &&
        (training.video_count <= 0 ||
          training.final_exam_count <= 0)
    );

    return {
      requiredMinutes,
      totalCatalogMinutes,
      averageCompletedMinutes,
      remainingMinutes,
      complianceScore,
      assigned,
      completed,
      inProgress,
      notStarted,
      asyncMissingContent,
    };
  }, [rule, trainingMode, trainings]);

  const recommendations = useMemo(() => {
    const rows: Array<{
      level: "critical" | "warning" | "success";
      title: string;
      description: string;
    }> = [];

    if (metrics.remainingMinutes > 0) {
      rows.push({
        level:
          metrics.complianceScore < 50 ? "critical" : "warning",
        title: `${formatMinutes(
          metrics.remainingMinutes
        )} eğitim açığı görünüyor`,
        description:
          "Bu değer mevcut eğitim kataloğu ve tamamlanma oranlarından hesaplanan yönetim göstergesidir.",
      });
    }

    if (metrics.notStarted > 0) {
      rows.push({
        level: "warning",
        title: `${metrics.notStarted} atama başlamadı`,
        description:
          "Başlamayan çalışanlar için hatırlatma ve yeniden planlama yapılmalıdır.",
      });
    }

    if (metrics.asyncMissingContent.length > 0) {
      rows.push({
        level: "warning",
        title: `${metrics.asyncMissingContent.length} asenkron eğitimde içerik eksik`,
        description:
          "Video veya final sınavı bulunmayan eğitimler tamamlanma kanıtı açısından kontrol edilmelidir.",
      });
    }

    if (rows.length === 0) {
      rows.push({
        level: "success",
        title: "Kritik eğitim uyum açığı görünmüyor",
        description:
          "Mevcut süre, atama ve içerik göstergeleri seçilen kurala göre yeterli görünüyor.",
      });
    }

    return rows;
  }, [metrics]);

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            Regulatory Compliance Engine
          </span>
          <h2>Eğitim Süre ve Uyum Motoru</h2>
          <p>
            {selectedCompanyName} için temel eğitim süresini,
            tekrar periyodunu ve mevcut eğitim açığını izleyin.
          </p>
        </div>

        <div className={styles.headerBadge}>
          <span>2026 Kural Seti</span>
          <strong>{rule.label}</strong>
        </div>
      </header>

      <div className={styles.controls}>
        <label>
          <span>Tehlike Sınıfı</span>
          <select
            value={dangerClass}
            onChange={(event) =>
              setDangerClass(event.target.value as DangerClass)
            }
          >
            {Object.values(COMPLIANCE_RULES).map((item) => (
              <option
                key={item.dangerClass}
                value={item.dangerClass}
              >
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Eğitim Dönemi</span>
          <select
            value={trainingMode}
            onChange={(event) =>
              setTrainingMode(
                event.target.value as "INITIAL" | "REPEAT"
              )
            }
          >
            <option value="INITIAL">İlk Temel Eğitim</option>
            <option value="REPEAT">Tekrar Eğitimi</option>
          </select>
        </label>
      </div>

      <div className={styles.ruleGrid}>
        <article>
          <span>Asgari Süre</span>
          <strong>
            {formatMinutes(metrics.requiredMinutes)}
          </strong>
          <p>
            {trainingMode === "INITIAL"
              ? "İlk temel eğitim için seçilen tehlike sınıfı asgari süresi."
              : "Tekrar eğitimleri için tüm tehlike sınıflarında asgari süre."}
          </p>
        </article>

        <article>
          <span>Tekrar Aralığı</span>
          <strong>
            {Math.round(rule.repeatIntervalMonths / 12)} yıl
          </strong>
          <p>
            Temel eğitimin en geç tekrar edilmesi gereken
            düzenli periyot.
          </p>
        </article>

        <article>
          <span>İşe Özgü Konular</span>
          <strong>
            {formatMinutes(
              rule.workplaceSpecificMinimumMinutes
            )}
          </strong>
          <p>
            İlk ve tekrar eğitimlerinde işe/işyerine özgü konu
            başlığı için asgari süre.
          </p>
        </article>

        <article>
          <span>Çalışan Sayısı</span>
          <strong>{totalEmployees}</strong>
          <p>Seçili firma filtresindeki toplam çalışan.</p>
        </article>
      </div>

      <div className={styles.scoreLayout}>
        <article className={styles.scoreCard}>
          <div
            className={styles.scoreRing}
            style={
              {
                "--compliance-score": `${metrics.complianceScore}%`,
              } as React.CSSProperties
            }
          >
            <strong>{metrics.complianceScore}%</strong>
            <span>Uyum</span>
          </div>

          <div>
            <span>Ortalama Eğitim Süresi</span>
            <h3>
              {formatMinutes(metrics.averageCompletedMinutes)}
            </h3>
            <p>
              Eğitim sürelerinin tamamlanma oranlarıyla
              ağırlıklandırılmış yönetim göstergesi.
            </p>
          </div>
        </article>

        <div className={styles.metricGrid}>
          <article>
            <span>Katalog Süresi</span>
            <strong>
              {formatMinutes(metrics.totalCatalogMinutes)}
            </strong>
          </article>
          <article>
            <span>Eksik Süre</span>
            <strong>
              {formatMinutes(metrics.remainingMinutes)}
            </strong>
          </article>
          <article>
            <span>Toplam Atama</span>
            <strong>{metrics.assigned}</strong>
          </article>
          <article>
            <span>Tamamlanan</span>
            <strong>{metrics.completed}</strong>
          </article>
          <article>
            <span>Devam Eden</span>
            <strong>{metrics.inProgress}</strong>
          </article>
          <article>
            <span>Başlamayan</span>
            <strong>{metrics.notStarted}</strong>
          </article>
        </div>
      </div>

      <div className={styles.recommendations}>
        <div className={styles.sectionHeader}>
          <div>
            <span>DORA Uyum Analizi</span>
            <h3>Öncelikli Aksiyonlar</h3>
          </div>
          <strong>{recommendations.length}</strong>
        </div>

        <div className={styles.recommendationGrid}>
          {recommendations.map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className={styles[item.level]}
            >
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.legalNote}>
        Bu motor yönetim ve ön kontrol amacıyla çalışır. Nihai
        eğitim planı; çalışanın yaptığı iş, işyeri risk
        değerlendirmesi, değişen riskler, işe başlama ve ilave
        eğitim ihtiyaçları dikkate alınarak yetkili kişilerce
        onaylanmalıdır.
      </div>
    </section>
  );
}
