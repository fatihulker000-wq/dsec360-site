"use client";

import { useMemo, useState } from "react";
import styles from "./TrainingCertificateCenter.module.css";

export type CertificateTrainingItem = {
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

type TrainingCertificateCenterProps = {
  trainings: CertificateTrainingItem[];
  selectedTrainingId: string;
  onSelectTraining: (trainingId: string) => void;
};

function normalizeType(value?: string | null) {
  const text = String(value || "").toLocaleLowerCase("tr-TR");

  if (text.includes("asenkron") || text.includes("online")) {
    return "Asenkron";
  }

  if (text.includes("senkron")) return "Senkron";
  if (text.includes("orgun") || text.includes("örgün")) return "Örgün";
  if (text.includes("ozel") || text.includes("özel")) return "Özel";

  return "Eğitim";
}

function certificateReadiness(item: CertificateTrainingItem) {
  const type = normalizeType(item.type);
  const videoReady = type !== "Asenkron" || item.video_count > 0;
  const examReady =
    type !== "Asenkron" || item.final_exam_count > 0;
  const completionReady = item.completed_count > 0;

  const score =
    [videoReady, examReady, completionReady].filter(Boolean).length *
    33.3333;

  return {
    videoReady,
    examReady,
    completionReady,
    score: Math.round(score),
    eligibleCount: item.completed_count,
  };
}

export default function TrainingCertificateCenter({
  trainings,
  selectedTrainingId,
  onSelectTraining,
}: TrainingCertificateCenterProps) {
  const [filter, setFilter] = useState<
    "ALL" | "READY" | "WAITING" | "NO_COMPLETION"
  >("ALL");

  const rows = useMemo(
    () =>
      trainings.map((training) => ({
        training,
        readiness: certificateReadiness(training),
      })),
    [trainings]
  );

  const summary = useMemo(() => {
    return rows.reduce(
      (accumulator, row) => {
        accumulator.total += 1;
        accumulator.eligible += row.readiness.eligibleCount;

        if (row.readiness.score >= 99) {
          accumulator.ready += 1;
        } else {
          accumulator.waiting += 1;
        }

        if (row.readiness.eligibleCount === 0) {
          accumulator.noCompletion += 1;
        }

        return accumulator;
      },
      {
        total: 0,
        ready: 0,
        waiting: 0,
        eligible: 0,
        noCompletion: 0,
      }
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filter === "READY") {
        return row.readiness.score >= 99;
      }

      if (filter === "WAITING") {
        return row.readiness.score < 99;
      }

      if (filter === "NO_COMPLETION") {
        return row.readiness.eligibleCount === 0;
      }

      return true;
    });
  }, [filter, rows]);

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            Certificate Readiness
          </span>
          <h2>Sertifika Hazırlık Merkezi</h2>
          <p>
            Mevcut sertifika üretim motorunu değiştirmeden,
            eğitimlerin sertifika üretimine uygunluk durumunu
            izleyin.
          </p>
        </div>

        <div className={styles.summaryGrid}>
          <div>
            <span>Eğitim</span>
            <strong>{summary.total}</strong>
          </div>
          <div>
            <span>Hazır</span>
            <strong>{summary.ready}</strong>
          </div>
          <div>
            <span>Bekleyen</span>
            <strong>{summary.waiting}</strong>
          </div>
          <div>
            <span>Uygun Çalışan</span>
            <strong>{summary.eligible}</strong>
          </div>
        </div>
      </header>

      <div className={styles.filterBar}>
        {[
          ["ALL", "Tümü"],
          ["READY", "Sertifikaya Hazır"],
          ["WAITING", "Eksik Hazırlık"],
          ["NO_COMPLETION", "Tamamlayan Yok"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={
              filter === value ? styles.activeFilter : ""
            }
            onClick={() =>
              setFilter(
                value as
                  | "ALL"
                  | "READY"
                  | "WAITING"
                  | "NO_COMPLETION"
              )
            }
          >
            {label}
          </button>
        ))}
      </div>

      {filteredRows.length === 0 ? (
        <div className={styles.emptyState}>
          Bu filtreye uygun eğitim bulunamadı.
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredRows.map(({ training, readiness }) => {
            const selected =
              selectedTrainingId === training.id;
            const type = normalizeType(training.type);

            return (
              <article
                key={training.id}
                className={`${styles.card} ${
                  selected ? styles.selectedCard : ""
                }`}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <span>{type}</span>
                    <h3>{training.title}</h3>
                  </div>

                  <div
                    className={
                      readiness.score >= 99
                        ? styles.readyBadge
                        : styles.warningBadge
                    }
                  >
                    {readiness.score}%
                  </div>
                </div>

                <div className={styles.eligiblePanel}>
                  <span>Sertifika Üretimine Uygun Çalışan</span>
                  <strong>{readiness.eligibleCount}</strong>
                  <em>
                    Eğitim tamamlanma kayıtlarına göre hesaplandı.
                  </em>
                </div>

                <div className={styles.checkGrid}>
                  <div
                    className={
                      readiness.videoReady
                        ? styles.checkReady
                        : styles.checkMissing
                    }
                  >
                    <span>İçerik</span>
                    <strong>
                      {readiness.videoReady ? "Hazır" : "Eksik"}
                    </strong>
                    <em>
                      {type === "Asenkron"
                        ? `Video: ${training.video_count}`
                        : "Video şartı uygulanmaz"}
                    </em>
                  </div>

                  <div
                    className={
                      readiness.examReady
                        ? styles.checkReady
                        : styles.checkMissing
                    }
                  >
                    <span>Final Sınavı</span>
                    <strong>
                      {readiness.examReady ? "Hazır" : "Eksik"}
                    </strong>
                    <em>
                      {type === "Asenkron"
                        ? `Final: ${training.final_exam_count}`
                        : "Final şartı uygulanmaz"}
                    </em>
                  </div>

                  <div
                    className={
                      readiness.completionReady
                        ? styles.checkReady
                        : styles.checkMissing
                    }
                  >
                    <span>Tamamlama</span>
                    <strong>
                      {readiness.completionReady
                        ? "Kayıt Var"
                        : "Kayıt Yok"}
                    </strong>
                    <em>
                      Tamamlayan: {training.completed_count}
                    </em>
                  </div>
                </div>

                <div className={styles.progress}>
                  <i style={{ width: `${readiness.score}%` }} />
                </div>

                <div className={styles.auditNote}>
                  Sertifika üretimi, doğrulama kodu, PDF ve
                  geçerlilik kuralları mevcut sertifika motoru
                  tarafından yürütülür.
                </div>

                <button
                  type="button"
                  className={
                    selected
                      ? styles.selectedButton
                      : styles.selectButton
                  }
                  onClick={() =>
                    onSelectTraining(
                      selected ? "" : training.id
                    )
                  }
                >
                  {selected
                    ? "Seçimi Kaldır"
                    : "Bu Eğitimi Seç"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
