"use client";

import { useMemo, useState } from "react";
import styles from "./TrainingExamCenter.module.css";

export type ExamTrainingItem = {
  id: string;
  title: string;
  type: string;
  assigned_count: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
  pre_exam_count: number;
  final_exam_count: number;
};

type TrainingExamCenterProps = {
  trainings: ExamTrainingItem[];
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

function completionRate(item: ExamTrainingItem) {
  const total =
    item.assigned_count > 0
      ? item.assigned_count
      : item.completed_count +
        item.in_progress_count +
        item.not_started_count;

  if (total <= 0) return 0;

  return Math.min(
    100,
    Math.round((item.completed_count / total) * 100)
  );
}

export default function TrainingExamCenter({
  trainings,
  selectedTrainingId,
  onSelectTraining,
}: TrainingExamCenterProps) {
  const [filter, setFilter] = useState<
    "ALL" | "READY" | "MISSING_PRE" | "MISSING_FINAL"
  >("ALL");

  const asyncTrainings = useMemo(
    () =>
      trainings.filter(
        (training) => normalizeType(training.type) === "Asenkron"
      ),
    [trainings]
  );

  const summary = useMemo(() => {
    const ready = asyncTrainings.filter(
      (training) =>
        training.pre_exam_count > 0 &&
        training.final_exam_count > 0
    ).length;

    const missingPre = asyncTrainings.filter(
      (training) => training.pre_exam_count <= 0
    ).length;

    const missingFinal = asyncTrainings.filter(
      (training) => training.final_exam_count <= 0
    ).length;

    return {
      total: asyncTrainings.length,
      ready,
      missingPre,
      missingFinal,
    };
  }, [asyncTrainings]);

  const filtered = useMemo(() => {
    return asyncTrainings.filter((training) => {
      if (filter === "READY") {
        return (
          training.pre_exam_count > 0 &&
          training.final_exam_count > 0
        );
      }

      if (filter === "MISSING_PRE") {
        return training.pre_exam_count <= 0;
      }

      if (filter === "MISSING_FINAL") {
        return training.final_exam_count <= 0;
      }

      return true;
    });
  }, [asyncTrainings, filter]);

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            Assessment Management
          </span>
          <h2>Sınav Yönetim Merkezi</h2>
          <p>
            Ön sınav ve final sınavı hazırlık durumlarını,
            mevcut sınav motorunun kurallarını değiştirmeden izleyin.
          </p>
        </div>

        <div className={styles.summaryGrid}>
          <div>
            <span>Asenkron</span>
            <strong>{summary.total}</strong>
          </div>
          <div>
            <span>Hazır</span>
            <strong>{summary.ready}</strong>
          </div>
          <div>
            <span>Ön Sınav Eksik</span>
            <strong>{summary.missingPre}</strong>
          </div>
          <div>
            <span>Final Eksik</span>
            <strong>{summary.missingFinal}</strong>
          </div>
        </div>
      </header>

      <div className={styles.filterBar}>
        {[
          ["ALL", "Tümü"],
          ["READY", "Hazır"],
          ["MISSING_PRE", "Ön Sınav Eksik"],
          ["MISSING_FINAL", "Final Eksik"],
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
                  | "MISSING_PRE"
                  | "MISSING_FINAL"
              )
            }
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          Bu filtreye uygun eğitim bulunamadı.
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((training) => {
            const preReady = training.pre_exam_count > 0;
            const finalReady = training.final_exam_count > 0;
            const fullyReady = preReady && finalReady;
            const selected =
              selectedTrainingId === training.id;
            const completion = completionRate(training);

            return (
              <article
                key={training.id}
                className={`${styles.card} ${
                  selected ? styles.selectedCard : ""
                }`}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <span>Asenkron Eğitim</span>
                    <h3>{training.title}</h3>
                  </div>

                  <strong
                    className={
                      fullyReady
                        ? styles.readyScore
                        : styles.warningScore
                    }
                  >
                    {fullyReady ? "Hazır" : "Eksik"}
                  </strong>
                </div>

                <div className={styles.examGrid}>
                  <div
                    className={
                      preReady
                        ? styles.examReady
                        : styles.examMissing
                    }
                  >
                    <span>Ön Sınav</span>
                    <strong>{training.pre_exam_count}</strong>
                    <em>
                      {preReady
                        ? "Soru seti mevcut"
                        : "Soru seti eksik"}
                    </em>
                  </div>

                  <div
                    className={
                      finalReady
                        ? styles.examReady
                        : styles.examMissing
                    }
                  >
                    <span>Final Sınavı</span>
                    <strong>{training.final_exam_count}</strong>
                    <em>
                      {finalReady
                        ? "Soru seti mevcut"
                        : "Soru seti eksik"}
                    </em>
                  </div>
                </div>

                <div className={styles.performance}>
                  <div>
                    <span>Tamamlama</span>
                    <strong>{completion}%</strong>
                  </div>
                  <div>
                    <span>Atanan</span>
                    <strong>{training.assigned_count}</strong>
                  </div>
                  <div>
                    <span>Tamamlanan</span>
                    <strong>{training.completed_count}</strong>
                  </div>
                </div>

                <div className={styles.progress}>
                  <i style={{ width: `${completion}%` }} />
                </div>

                <div className={styles.ruleNote}>
                  Video tamamlanma, sınava geçiş ve başarı puanı
                  kuralları mevcut sınav motoru tarafından yönetilir.
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
