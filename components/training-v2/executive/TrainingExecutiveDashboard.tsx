"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./TrainingExecutiveDashboard.module.css";

export type ExecutiveTrainingItem = {
  id: string;
  title: string;
  type: string;
  assigned_count: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
  video_count: number;
  pre_exam_count: number;
  final_exam_count: number;
};

type AuditSummary = {
  total: number;
  completed: number;
  watched: number;
  passed: number;
  certificated: number;
  average_evidence_score: number;
};

type TrainingExecutiveDashboardProps = {
  trainings: ExecutiveTrainingItem[];
  totalEmployees: number;
  selectedCompanyName: string;
};

function percentage(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

function normalizeType(value?: string | null) {
  const text = String(value || "").toLocaleLowerCase("tr-TR");

  if (text.includes("asenkron") || text.includes("online")) return "Asenkron";
  if (text.includes("senkron")) return "Senkron";
  if (text.includes("orgun") || text.includes("örgün")) return "Örgün";
  if (text.includes("ozel") || text.includes("özel")) return "Özel";

  return "Eğitim";
}

export default function TrainingExecutiveDashboard({
  trainings,
  totalEmployees,
  selectedCompanyName,
}: TrainingExecutiveDashboardProps) {
  const [audit, setAudit] = useState<AuditSummary>({
    total: 0,
    completed: 0,
    watched: 0,
    passed: 0,
    certificated: 0,
    average_evidence_score: 0,
  });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");

  const loadAuditSummary = useCallback(async () => {
    try {
      setAuditLoading(true);
      setAuditError("");

      const response = await fetch("/api/admin/training-audit?limit=500", {
        cache: "no-store",
        credentials: "include",
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json?.error || "Kanıt özeti alınamadı.");
      }

      setAudit(
        json?.summary || {
          total: 0,
          completed: 0,
          watched: 0,
          passed: 0,
          certificated: 0,
          average_evidence_score: 0,
        }
      );
    } catch (cause) {
      console.error(cause);
      setAuditError(
        cause instanceof Error
          ? cause.message
          : "Kanıt özeti alınamadı."
      );
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAuditSummary();
  }, [loadAuditSummary]);

  const totals = useMemo(() => {
    return trainings.reduce(
      (accumulator, training) => {
        accumulator.assigned += training.assigned_count;
        accumulator.completed += training.completed_count;
        accumulator.inProgress += training.in_progress_count;
        accumulator.notStarted += training.not_started_count;

        if (training.video_count > 0) accumulator.withVideo += 1;
        if (training.final_exam_count > 0) accumulator.withFinal += 1;
        if (
          normalizeType(training.type) !== "Asenkron" ||
          (
            training.video_count > 0 &&
            training.final_exam_count > 0
          )
        ) {
          accumulator.contentReady += 1;
        }

        return accumulator;
      },
      {
        assigned: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        withVideo: 0,
        withFinal: 0,
        contentReady: 0,
      }
    );
  }, [trainings]);

  const completionRate = percentage(
    totals.completed,
    totals.assigned
  );

  const activeRate = percentage(
    totals.completed + totals.inProgress,
    totals.assigned
  );

  const contentReadiness = percentage(
    totals.contentReady,
    trainings.length
  );

  const certificateRate = percentage(
    audit.certificated,
    audit.completed
  );

  const riskItems = useMemo(() => {
    const items: Array<{
      level: "critical" | "warning" | "info";
      title: string;
      description: string;
    }> = [];

    if (totals.notStarted > 0) {
      items.push({
        level: totals.notStarted > totals.completed
          ? "critical"
          : "warning",
        title: `${totals.notStarted} atama henüz başlamadı`,
        description:
          "Başlamayan atamalar için çalışan ve firma bazlı takip yapılmalı.",
      });
    }

    const missingContent = Math.max(
      0,
      trainings.length - totals.contentReady
    );

    if (missingContent > 0) {
      items.push({
        level: "warning",
        title: `${missingContent} eğitimde içerik hazırlığı eksik`,
        description:
          "Asenkron eğitimlerde video ve final sınavı kontrolleri tamamlanmalı.",
      });
    }

    if (audit.completed > audit.certificated) {
      items.push({
        level: "warning",
        title: `${
          audit.completed - audit.certificated
        } tamamlanmış kayıtta sertifika görünmüyor`,
        description:
          "Mevcut sertifika motoru ve tamamlanma kayıtları birlikte kontrol edilmeli.",
      });
    }

    if (audit.average_evidence_score < 75 && audit.total > 0) {
      items.push({
        level: "critical",
        title: `Ortalama kanıt skoru %${audit.average_evidence_score}`,
        description:
          "Başlama, izleme, sınav, tamamlama ve sertifika kayıtlarında eksik alanlar var.",
      });
    }

    if (items.length === 0) {
      items.push({
        level: "info",
        title: "Kritik eğitim riski görünmüyor",
        description:
          "Mevcut eğitim, içerik, sınav ve kanıt kayıtları dengeli görünüyor.",
      });
    }

    return items.slice(0, 4);
  }, [
    audit.average_evidence_score,
    audit.certificated,
    audit.completed,
    audit.total,
    totals.contentReady,
    totals.notStarted,
    totals.completed,
    trainings.length,
  ]);

  const topTrainings = useMemo(() => {
    return [...trainings]
      .sort((first, second) => {
        const firstRate = percentage(
          first.completed_count,
          first.assigned_count
        );
        const secondRate = percentage(
          second.completed_count,
          second.assigned_count
        );

        return secondRate - firstRate;
      })
      .slice(0, 5)
      .map((training) => ({
        id: training.id,
        title: training.title,
        rate: percentage(
          training.completed_count,
          training.assigned_count
        ),
        assigned: training.assigned_count,
        completed: training.completed_count,
      }));
  }, [trainings]);

  const statusDistribution = [
    {
      label: "Tamamlandı",
      value: totals.completed,
      percent: percentage(totals.completed, totals.assigned),
      tone: "green",
    },
    {
      label: "Devam Ediyor",
      value: totals.inProgress,
      percent: percentage(totals.inProgress, totals.assigned),
      tone: "blue",
    },
    {
      label: "Başlamadı",
      value: totals.notStarted,
      percent: percentage(totals.notStarted, totals.assigned),
      tone: "amber",
    },
  ];

  return (
    <section className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Executive Intelligence</span>
          <h2>Eğitim Yönetici Kontrol Merkezi</h2>
          <p>
            {selectedCompanyName} için eğitim, içerik, sınav,
            sertifika ve kanıt performansını tek ekranda izleyin.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          disabled={auditLoading}
          onClick={() => void loadAuditSummary()}
        >
          {auditLoading ? "Yenileniyor..." : "Verileri Yenile"}
        </button>
      </header>

      <div className={styles.scoreGrid}>
        <article className={styles.primaryScore}>
          <div
            className={styles.scoreRing}
            style={
              {
                "--score": `${completionRate}%`,
              } as React.CSSProperties
            }
          >
            <strong>{completionRate}%</strong>
            <span>Tamamlama</span>
          </div>

          <div>
            <span>Kurumsal Eğitim Uygunluğu</span>
            <h3>
              {completionRate >= 90
                ? "Çok İyi"
                : completionRate >= 75
                  ? "İyi"
                  : completionRate >= 50
                    ? "Geliştirilmeli"
                    : "Kritik"}
            </h3>
            <p>
              Tamamlanan atamaların toplam atamalara oranı.
            </p>
          </div>
        </article>

        {[
          ["Toplam Çalışan", totalEmployees],
          ["Toplam Eğitim", trainings.length],
          ["Toplam Atama", totals.assigned],
          ["Aktif Katılım", `${activeRate}%`],
          ["İçerik Hazırlığı", `${contentReadiness}%`],
          ["Kanıt Skoru", `${audit.average_evidence_score}%`],
          ["Sertifika Oranı", `${certificateRate}%`],
        ].map(([label, value]) => (
          <article key={String(label)} className={styles.metricCard}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      {auditError ? (
        <div className={styles.warningMessage}>
          Kanıt özeti alınamadı: {auditError}
        </div>
      ) : null}

      <div className={styles.mainGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Atama Durumu</span>
              <h3>Eğitim Katılım Dağılımı</h3>
            </div>
            <strong>{totals.assigned}</strong>
          </div>

          <div className={styles.distributionList}>
            {statusDistribution.map((item) => (
              <div key={item.label}>
                <div className={styles.distributionTop}>
                  <span>{item.label}</span>
                  <strong>
                    {item.value} • %{item.percent}
                  </strong>
                </div>
                <div className={styles.track}>
                  <i
                    className={styles[item.tone]}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Kanıt ve Sertifika</span>
              <h3>Kayıt Kalitesi</h3>
            </div>
            <strong>{audit.average_evidence_score}%</strong>
          </div>

          <div className={styles.evidenceGrid}>
            <div>
              <span>Kanıt Kaydı</span>
              <strong>{audit.total}</strong>
            </div>
            <div>
              <span>İçerik Tamam</span>
              <strong>{audit.watched}</strong>
            </div>
            <div>
              <span>Final Başarılı</span>
              <strong>{audit.passed}</strong>
            </div>
            <div>
              <span>Sertifikalı</span>
              <strong>{audit.certificated}</strong>
            </div>
          </div>
        </article>

        <article className={`${styles.panel} ${styles.riskPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <span>DORA Öncelikleri</span>
              <h3>Yönetici Aksiyonları</h3>
            </div>
            <strong>{riskItems.length}</strong>
          </div>

          <div className={styles.riskList}>
            {riskItems.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className={styles[item.level]}
              >
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Performans</span>
              <h3>En Yüksek Tamamlama</h3>
            </div>
            <strong>{topTrainings.length}</strong>
          </div>

          {topTrainings.length === 0 ? (
            <div className={styles.emptyState}>
              Eğitim performans verisi bulunamadı.
            </div>
          ) : (
            <div className={styles.trainingList}>
              {topTrainings.map((training, index) => (
                <div key={training.id}>
                  <span className={styles.rank}>{index + 1}</span>
                  <div>
                    <strong>{training.title}</strong>
                    <span>
                      {training.completed}/{training.assigned} tamamlandı
                    </span>
                  </div>
                  <em>{training.rate}%</em>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
