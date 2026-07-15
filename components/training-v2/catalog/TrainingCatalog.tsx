"use client";

import { useMemo, useState } from "react";
import styles from "./TrainingCatalog.module.css";

export type TrainingCatalogItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  duration_minutes: number | null;
  assigned_count: number;
  not_started_count: number;
  in_progress_count: number;
  completed_count: number;
  video_count: number;
  pre_exam_count: number;
  final_exam_count: number;
};

type TrainingCatalogProps = {
  trainings: TrainingCatalogItem[];
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

function calculateCompletion(item: TrainingCatalogItem) {
  const denominator =
    item.assigned_count > 0
      ? item.assigned_count
      : item.completed_count +
        item.in_progress_count +
        item.not_started_count;

  if (denominator <= 0) return 0;

  return Math.min(
    100,
    Math.round((item.completed_count / denominator) * 100)
  );
}

function formatDuration(value?: number | null) {
  if (!value || value <= 0) return "Süre tanımlı değil";

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (hours <= 0) return `${minutes} dk`;
  if (minutes === 0) return `${hours} sa`;

  return `${hours} sa ${minutes} dk`;
}

export default function TrainingCatalog({
  trainings,
  selectedTrainingId,
  onSelectTraining,
}: TrainingCatalogProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set(trainings.map((item) => normalizeType(item.type)))
      ).sort((first, second) =>
        first.localeCompare(second, "tr")
      ),
    [trainings]
  );

  const filteredTrainings = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return trainings.filter((training) => {
      const normalizedType = normalizeType(training.type);
      const completion = calculateCompletion(training);
      const text = `${training.title} ${training.description} ${normalizedType}`
        .toLocaleLowerCase("tr-TR");

      const searchOk = !query || text.includes(query);
      const typeOk =
        typeFilter === "ALL" || normalizedType === typeFilter;

      const statusOk =
        statusFilter === "ALL" ||
        (statusFilter === "COMPLETED" && completion === 100) ||
        (statusFilter === "ACTIVE" &&
          training.assigned_count > 0 &&
          completion < 100) ||
        (statusFilter === "EMPTY" &&
          training.assigned_count === 0);

      return searchOk && typeOk && statusOk;
    });
  }, [search, statusFilter, trainings, typeFilter]);

  const selectedTraining =
    trainings.find(
      (training) => training.id === selectedTrainingId
    ) || null;

  return (
    <section className={styles.catalog}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            Learning Portfolio
          </span>
          <h2>Eğitim Kataloğu</h2>
          <p>
            Eğitim içeriklerini, atama sayılarını ve tamamlama
            performansını tek merkezden yönetin.
          </p>
        </div>

        <div className={styles.headerStat}>
          <span>Toplam Eğitim</span>
          <strong>{trainings.length}</strong>
        </div>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.searchField}>
          <span>Ara</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Eğitim adı veya açıklama ara..."
          />
        </label>

        <label>
          <span>Tür</span>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="ALL">Tüm Türler</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Durum</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="ACTIVE">Aktif Atamalar</option>
            <option value="COMPLETED">%100 Tamamlanan</option>
            <option value="EMPTY">Atama Yapılmamış</option>
          </select>
        </label>
      </div>

      {selectedTraining ? (
        <div className={styles.selectedPanel}>
          <div>
            <span>Seçili Eğitim</span>
            <strong>{selectedTraining.title}</strong>
            <p>{selectedTraining.description}</p>
          </div>

          <div className={styles.selectedBadges}>
            <span>{normalizeType(selectedTraining.type)}</span>
            <span>
              {formatDuration(
                selectedTraining.duration_minutes
              )}
            </span>
            <span>Video: {selectedTraining.video_count}</span>
            <span>
              Ön Sınav: {selectedTraining.pre_exam_count}
            </span>
            <span>
              Final: {selectedTraining.final_exam_count}
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.selectedEmpty}>
          Video ve atama yönetimi için katalogdan eğitim seçin.
        </div>
      )}

      {filteredTrainings.length === 0 ? (
        <div className={styles.emptyState}>
          Filtrelere uygun eğitim bulunamadı.
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredTrainings.map((training) => {
            const completion = calculateCompletion(training);
            const selected =
              training.id === selectedTrainingId;

            return (
              <article
                key={training.id}
                className={`${styles.card} ${
                  selected ? styles.cardSelected : ""
                }`}
              >
                <div className={styles.cardTop}>
                  <div>
                    <span className={styles.typeBadge}>
                      {normalizeType(training.type)}
                    </span>
                    <h3>{training.title}</h3>
                    <p>{training.description}</p>
                  </div>

                  <div className={styles.scoreBox}>
                    <strong>{completion}%</strong>
                    <span>Tamamlama</span>
                  </div>
                </div>

                <div className={styles.progressTrack}>
                  <i style={{ width: `${completion}%` }} />
                </div>

                <div className={styles.metaGrid}>
                  <div>
                    <span>Süre</span>
                    <strong>
                      {formatDuration(training.duration_minutes)}
                    </strong>
                  </div>
                  <div>
                    <span>Atanan</span>
                    <strong>{training.assigned_count}</strong>
                  </div>
                  <div>
                    <span>Tamamlanan</span>
                    <strong>{training.completed_count}</strong>
                  </div>
                  <div>
                    <span>Devam Eden</span>
                    <strong>{training.in_progress_count}</strong>
                  </div>
                  <div>
                    <span>Başlamayan</span>
                    <strong>{training.not_started_count}</strong>
                  </div>
                </div>

                <div className={styles.readiness}>
                  <span
                    className={
                      training.video_count > 0
                        ? styles.ready
                        : styles.missing
                    }
                  >
                    Video {training.video_count}
                  </span>
                  <span
                    className={
                      training.pre_exam_count > 0
                        ? styles.ready
                        : styles.missing
                    }
                  >
                    Ön Sınav {training.pre_exam_count}
                  </span>
                  <span
                    className={
                      training.final_exam_count > 0
                        ? styles.ready
                        : styles.missing
                    }
                  >
                    Final {training.final_exam_count}
                  </span>
                  <span className={styles.neutral}>
                    Kayıt İzine Hazır
                  </span>
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
                    : "Eğitimi Seç ve Yönet"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
