"use client";

import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Save,
  Video,
  X,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import styles from "./TrainingCatalog.module.css";

export type TrainingCatalogItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  duration_seconds?: number | null;
  duration_minutes: number | null;
  catalog_visible?: boolean;
  catalog_key?: string | null;
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
  onSelectTraining: (
    trainingId: string
  ) => void;
  onChanged?: () =>
    | Promise<void>
    | void;
};

type CreateTrainingForm = {
  title: string;
  description: string;
  type:
    | "asenkron"
    | "senkron"
    | "orgun"
    | "ozel";
};

const EMPTY_FORM: CreateTrainingForm = {
  title: "",
  description: "",
  type: "asenkron",
};

function normalizeType(
  value?: string | null
) {
  const text =
    String(value || "")
      .toLocaleLowerCase(
        "tr-TR"
      );

  if (
    text.includes("asenkron") ||
    text.includes("online")
  ) {
    return "Asenkron";
  }

  if (text.includes("senkron")) {
    return "Senkron";
  }

  if (
    text.includes("orgun") ||
    text.includes("örgün")
  ) {
    return "Örgün";
  }

  if (
    text.includes("ozel") ||
    text.includes("özel")
  ) {
    return "Özel";
  }

  return "Eğitim";
}

function calculateCompletion(
  item: TrainingCatalogItem
) {
  const denominator =
    item.assigned_count > 0
      ? item.assigned_count
      : item.completed_count +
        item.in_progress_count +
        item.not_started_count;

  if (denominator <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (item.completed_count /
        denominator) *
        100
    )
  );
}

function formatDurationSeconds(
  seconds?: number | null
) {
  const totalSeconds =
    Math.max(
      0,
      Number(seconds || 0)
    );

  if (totalSeconds <= 0) {
    return "—";
  }

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) /
        60
    );

  if (
    hours > 0 &&
    minutes > 0
  ) {
    return `${hours} sa ${minutes} dk`;
  }

  if (hours > 0) {
    return `${hours} sa`;
  }

  if (minutes > 0) {
    return `${minutes} dk`;
  }

  return "< 1 dk";
}

export default function TrainingCatalog({
  trainings,
  selectedTrainingId,
  onSelectTraining,
  onChanged,
}: TrainingCatalogProps) {
  const [search, setSearch] =
    useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("ALL");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  const [
    showCreate,
    setShowCreate,
  ] = useState(false);

  const [form, setForm] =
    useState<CreateTrainingForm>(
      EMPTY_FORM
    );

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    createError,
    setCreateError,
  ] = useState("");

  const [
    createMessage,
    setCreateMessage,
  ] = useState("");

  const visibleTrainings =
    useMemo(
      () =>
        trainings.filter(
          (training) =>
            training.catalog_visible !==
            false
        ),
      [trainings]
    );

  const typeOptions =
    useMemo(
      () =>
        Array.from(
          new Set(
            visibleTrainings.map(
              (item) =>
                normalizeType(
                  item.type
                )
            )
          )
        ).sort(
          (first, second) =>
            first.localeCompare(
              second,
              "tr"
            )
        ),
      [visibleTrainings]
    );

  const filteredTrainings =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      return visibleTrainings.filter(
        (training) => {
          const normalizedType =
            normalizeType(
              training.type
            );

          const completion =
            calculateCompletion(
              training
            );

          const text =
            `${training.title} ${training.description} ${normalizedType}`
              .toLocaleLowerCase(
                "tr-TR"
              );

          const searchOk =
            !query ||
            text.includes(query);

          const typeOk =
            typeFilter === "ALL" ||
            normalizedType ===
              typeFilter;

          const statusOk =
            statusFilter === "ALL" ||
            (statusFilter ===
              "COMPLETED" &&
              completion === 100) ||
            (statusFilter ===
              "ACTIVE" &&
              training.assigned_count >
                0 &&
              completion < 100) ||
            (statusFilter ===
              "EMPTY" &&
              training.assigned_count ===
                0);

          return (
            searchOk &&
            typeOk &&
            statusOk
          );
        }
      );
    }, [
      search,
      statusFilter,
      typeFilter,
      visibleTrainings,
    ]);

  const selectedTraining =
    visibleTrainings.find(
      (training) =>
        training.id ===
        selectedTrainingId
    ) || null;

  const createTraining =
    async () => {
      const title =
        form.title.trim();

      if (!title) {
        setCreateError(
          "Eğitim adı zorunludur."
        );
        return;
      }

      try {
        setCreating(true);
        setCreateError("");
        setCreateMessage("");

        const response =
          await fetch(
            "/api/admin/trainings",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              credentials:
                "include",
              body: JSON.stringify({
                title,
                description:
                  form.description.trim(),
                type: form.type,
              }),
            }
          );

        const json =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            json?.detail ||
              json?.error ||
              "Eğitim oluşturulamadı."
          );
        }

        const newTrainingId =
          String(
            json?.data?.id || ""
          );

        setForm(EMPTY_FORM);
        setShowCreate(false);
        setCreateMessage(
          "Yeni eğitim kataloğa eklendi."
        );

        await onChanged?.();

        if (newTrainingId) {
          onSelectTraining(
            newTrainingId
          );
        }
      } catch (cause) {
        setCreateError(
          cause instanceof Error
            ? cause.message
            : "Eğitim oluşturulamadı."
        );
      } finally {
        setCreating(false);
      }
    };

  return (
    <section
      className={
        styles.catalog
      }
    >
      <header
        className={
          styles.header
        }
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            Learning Portfolio
          </span>

          <h2>
            Eğitim Kataloğu
          </h2>

          <p>
            Ana eğitimleri yönetin.
            Eğitim süresi, eğitime
            eklenen aktif videoların
            toplam süresinden otomatik
            hesaplanır.
          </p>
        </div>

        <div
          className={
            styles.headerActions
          }
        >
          <div
            className={
              styles.headerStat
            }
          >
            <span>
              Toplam Eğitim
            </span>
            <strong>
              {
                visibleTrainings.length
              }
            </strong>
          </div>

          <button
            type="button"
            className={
              styles.createButton
            }
            onClick={() => {
              setShowCreate(
                (current) =>
                  !current
              );
              setCreateError("");
              setCreateMessage("");
            }}
          >
            {showCreate ? (
              <X size={16} />
            ) : (
              <Plus size={16} />
            )}

            {showCreate
              ? "Formu Kapat"
              : "Yeni Eğitim Ekle"}
          </button>
        </div>
      </header>

      {createError ? (
        <div
          className={
            styles.errorBox
          }
        >
          {createError}
        </div>
      ) : null}

      {createMessage ? (
        <div
          className={
            styles.successBox
          }
        >
          <CheckCircle2
            size={16}
          />
          {createMessage}
        </div>
      ) : null}

      {showCreate ? (
        <div
          className={
            styles.createPanel
          }
        >
          <div
            className={
              styles.createPanelHeader
            }
          >
            <div
              className={
                styles.createPanelIcon
              }
            >
              <BookOpen
                size={20}
              />
            </div>

            <div>
              <strong>
                Yeni Ana Eğitim
              </strong>
              <p>
                Süre girişi yapılmaz.
                Video eklendikçe süre
                otomatik hesaplanır.
              </p>
            </div>
          </div>

          <div
            className={
              styles.createGrid
            }
          >
            <label>
              <span>
                Eğitim Adı *
              </span>

              <input
                value={form.title}
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      title:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder="Ör. Acil Durum Eğitimi"
              />
            </label>

            <label>
              <span>
                Eğitim Türü *
              </span>

              <select
                value={form.type}
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      type:
                        event
                          .target
                          .value as CreateTrainingForm["type"],
                    })
                  )
                }
              >
                <option value="asenkron">
                  Asenkron
                </option>
                <option value="senkron">
                  Senkron
                </option>
                <option value="orgun">
                  Örgün
                </option>
                <option value="ozel">
                  Özel
                </option>
              </select>
            </label>

            <label
              className={
                styles.descriptionField
              }
            >
              <span>
                Açıklama
              </span>

              <textarea
                rows={3}
                value={
                  form.description
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      description:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder="Eğitimin amacı ve kapsamı"
              />
            </label>
          </div>

          <div
            className={
              styles.durationRule
            }
          >
            <Clock3 size={16} />
            Eğitim süresi manuel
            girilemez. Aktif eğitim
            videolarının süreleri
            otomatik toplanır.
          </div>

          <div
            className={
              styles.createActions
            }
          >
            <button
              type="button"
              className={
                styles.cancelButton
              }
              disabled={creating}
              onClick={() => {
                setForm(
                  EMPTY_FORM
                );
                setShowCreate(
                  false
                );
                setCreateError(
                  ""
                );
              }}
            >
              İptal
            </button>

            <button
              type="button"
              className={
                styles.saveButton
              }
              disabled={creating}
              onClick={() =>
                void createTraining()
              }
            >
              {creating ? (
                <Loader2
                  size={16}
                  className={
                    styles.spin
                  }
                />
              ) : (
                <Save
                  size={16}
                />
              )}

              {creating
                ? "Oluşturuluyor..."
                : "Eğitimi Oluştur"}
            </button>
          </div>
        </div>
      ) : null}

      <div
        className={
          styles.toolbar
        }
      >
        <label
          className={
            styles.searchField
          }
        >
          <span>Ara</span>
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Eğitim adı veya açıklama ara..."
          />
        </label>

        <label>
          <span>Tür</span>
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              Tüm Türler
            </option>

            {typeOptions.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          <span>Durum</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              Tüm Durumlar
            </option>
            <option value="ACTIVE">
              Aktif Atamalar
            </option>
            <option value="COMPLETED">
              %100 Tamamlanan
            </option>
            <option value="EMPTY">
              Atama Yapılmamış
            </option>
          </select>
        </label>
      </div>

      {selectedTraining ? (
        <div
          className={
            styles.selectedPanel
          }
        >
          <div>
            <span>
              Seçili Eğitim
            </span>
            <strong>
              {
                selectedTraining.title
              }
            </strong>
            <p>
              {
                selectedTraining.description
              }
            </p>
          </div>

          <div
            className={
              styles.selectedBadges
            }
          >
            <span>
              {normalizeType(
                selectedTraining.type
              )}
            </span>

            <span>
              Süre:{" "}
              {formatDurationSeconds(
                selectedTraining.duration_seconds
              )}
            </span>

            <span>
              Video:{" "}
              {
                selectedTraining.video_count
              }
            </span>

            <span>
              Ön Sınav:{" "}
              {
                selectedTraining.pre_exam_count
              }
            </span>

            <span>
              Final:{" "}
              {
                selectedTraining.final_exam_count
              }
            </span>
          </div>
        </div>
      ) : (
        <div
          className={
            styles.selectedEmpty
          }
        >
          Video, sınav ve atama
          yönetimi için katalogdan
          eğitim seçin.
        </div>
      )}

      {filteredTrainings.length ===
      0 ? (
        <div
          className={
            styles.emptyState
          }
        >
          Filtrelere uygun eğitim
          bulunamadı.
        </div>
      ) : (
        <div
          className={
            styles.grid
          }
        >
          {filteredTrainings.map(
            (training) => {
              const completion =
                calculateCompletion(
                  training
                );

              const selected =
                training.id ===
                selectedTrainingId;

              const hasVideo =
                training.video_count >
                0;

              return (
                <article
                  key={
                    training.id
                  }
                  className={`${
                    styles.card
                  } ${
                    selected
                      ? styles.cardSelected
                      : ""
                  }`}
                >
                  <div
                    className={
                      styles.cardTop
                    }
                  >
                    <div>
                      <span
                        className={
                          styles.typeBadge
                        }
                      >
                        {normalizeType(
                          training.type
                        )}
                      </span>

                      <h3>
                        {
                          training.title
                        }
                      </h3>

                      <p>
                        {
                          training.description
                        }
                      </p>
                    </div>

                    <div
                      className={
                        styles.scoreBox
                      }
                    >
                      <strong>
                        {completion}%
                      </strong>
                      <span>
                        Tamamlama
                      </span>
                    </div>
                  </div>

                  <div
                    className={
                      styles.progressTrack
                    }
                  >
                    <i
                      style={{
                        width: `${completion}%`,
                      }}
                    />
                  </div>

                  <div
                    className={
                      styles.metaGrid
                    }
                  >
                    <div>
                      <span>
                        Süre
                      </span>
                      <strong>
                        {formatDurationSeconds(
                          training.duration_seconds
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Atanan
                      </span>
                      <strong>
                        {
                          training.assigned_count
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Tamamlanan
                      </span>
                      <strong>
                        {
                          training.completed_count
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Devam Eden
                      </span>
                      <strong>
                        {
                          training.in_progress_count
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Başlamayan
                      </span>
                      <strong>
                        {
                          training.not_started_count
                        }
                      </strong>
                    </div>
                  </div>

                  <div
                    className={
                      styles.readiness
                    }
                  >
                    <span
                      className={
                        hasVideo
                          ? styles.ready
                          : styles.missing
                      }
                    >
                      <Video
                        size={11}
                      />{" "}
                      Video{" "}
                      {
                        training.video_count
                      }
                    </span>

                    <span
                      className={
                        training.pre_exam_count >
                        0
                          ? styles.ready
                          : styles.missing
                      }
                    >
                      Ön Sınav{" "}
                      {
                        training.pre_exam_count
                      }
                    </span>

                    <span
                      className={
                        training.final_exam_count >
                        0
                          ? styles.ready
                          : styles.missing
                      }
                    >
                      Final{" "}
                      {
                        training.final_exam_count
                      }
                    </span>

                    <span
                      className={
                        hasVideo
                          ? styles.ready
                          : styles.neutral
                      }
                    >
                      {hasVideo
                        ? "İçerik Hazır"
                        : "Henüz video eklenmedi"}
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
                        selected
                          ? ""
                          : training.id
                      )
                    }
                  >
                    {selected
                      ? "Seçimi Kaldır"
                      : "Eğitimi Seç ve Yönet"}
                  </button>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}