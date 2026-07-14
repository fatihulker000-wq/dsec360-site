"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./VideoManager.module.css";

export type TrainingVideoRow = {
  id: string;
  training_id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration_seconds: number | null;
  sort_order: number | null;
  is_required: boolean | null;
  is_active: boolean | null;
};

type TrainingVideoManagerProps = {
  trainingId: string;
  trainingTitle: string;
  onChanged?: () => Promise<void> | void;
};

type VideoDraft = {
  title: string;
  description: string;
  videoUrl: string;
  durationSeconds: string;
  sortOrder: string;
};

const EMPTY_DRAFT: VideoDraft = {
  title: "",
  description: "",
  videoUrl: "",
  durationSeconds: "",
  sortOrder: "1",
};

function normalizeRows(value: unknown): TrainingVideoRow[] {
  return Array.isArray(value) ? (value as TrainingVideoRow[]) : [];
}

function parsePositiveNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function formatDuration(seconds?: number | null) {
  const total = Number(seconds || 0);

  if (total <= 0) return "Süre girilmedi";

  const minutes = Math.floor(total / 60);
  const remainder = total % 60;

  if (minutes <= 0) return `${remainder} sn`;
  if (remainder === 0) return `${minutes} dk`;

  return `${minutes} dk ${remainder} sn`;
}

export default function TrainingVideoManager({
  trainingId,
  trainingTitle,
  onChanged,
}: TrainingVideoManagerProps) {
  const [videos, setVideos] = useState<TrainingVideoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [draft, setDraft] = useState<VideoDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] =
    useState<VideoDraft>(EMPTY_DRAFT);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadVideos = useCallback(async () => {
    if (!trainingId) {
      setVideos([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/training-videos?trainingId=${encodeURIComponent(
          trainingId
        )}`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json?.error || "Videolar alınamadı.");
      }

      setVideos(normalizeRows(json?.data));
    } catch (cause) {
      console.error(cause);
      setVideos([]);
      setError(
        cause instanceof Error
          ? cause.message
          : "Videolar alınırken hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }, [trainingId]);

  useEffect(() => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setEditingDraft(EMPTY_DRAFT);
    setMessage("");
    setError("");
    void loadVideos();
  }, [loadVideos]);

  const orderedVideos = useMemo(
    () =>
      [...videos].sort(
        (first, second) =>
          Number(first.sort_order || 0) -
          Number(second.sort_order || 0)
      ),
    [videos]
  );

  const notifyChanged = async () => {
    await loadVideos();
    await onChanged?.();
  };

  const validateDraft = (value: VideoDraft) => {
    if (!value.title.trim()) return "Video başlığı zorunlu.";
    if (!value.videoUrl.trim()) return "Video URL zorunlu.";
    return "";
  };

  const saveVideo = async () => {
    const validationError = validateDraft(draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/admin/training-videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          trainingId,
          title: draft.title.trim(),
          description: draft.description.trim(),
          videoUrl: draft.videoUrl.trim(),
          durationSeconds: parsePositiveNumber(
            draft.durationSeconds,
            0
          ),
          sortOrder: parsePositiveNumber(
            draft.sortOrder,
            videos.length + 1
          ),
        }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json?.error || "Video eklenemedi.");
      }

      setDraft({
        ...EMPTY_DRAFT,
        sortOrder: String(videos.length + 2),
      });
      setMessage("Video başarıyla eklendi.");
      await notifyChanged();
    } catch (cause) {
      console.error(cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Video eklenirken hata oluştu."
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (video: TrainingVideoRow) => {
    setEditingId(video.id);
    setEditingDraft({
      title: video.title || "",
      description: video.description || "",
      videoUrl: video.video_url || "",
      durationSeconds: video.duration_seconds
        ? String(video.duration_seconds)
        : "",
      sortOrder: video.sort_order
        ? String(video.sort_order)
        : "1",
    });
    setMessage("");
    setError("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingDraft(EMPTY_DRAFT);
  };

  const updateVideo = async () => {
    if (!editingId) return;

    const validationError = validateDraft(editingDraft);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setActionId(editingId);
      setMessage("");
      setError("");

      const response = await fetch(
        `/api/admin/training-videos/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: editingDraft.title.trim(),
            description: editingDraft.description.trim(),
            videoUrl: editingDraft.videoUrl.trim(),
            durationSeconds: parsePositiveNumber(
              editingDraft.durationSeconds,
              0
            ),
            sortOrder: parsePositiveNumber(
              editingDraft.sortOrder,
              1
            ),
          }),
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json?.error || "Video güncellenemedi.");
      }

      cancelEditing();
      setMessage("Video başarıyla güncellendi.");
      await notifyChanged();
    } catch (cause) {
      console.error(cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Video güncellenirken hata oluştu."
      );
    } finally {
      setActionId(null);
    }
  };

  const deleteVideo = async (video: TrainingVideoRow) => {
    const confirmed = window.confirm(
      `"${video.title}" videosunu silmek istediğine emin misin?`
    );

    if (!confirmed) return;

    try {
      setActionId(video.id);
      setMessage("");
      setError("");

      const response = await fetch(
        `/api/admin/training-videos/${video.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json?.error || "Video silinemedi.");
      }

      if (editingId === video.id) {
        cancelEditing();
      }

      setMessage("Video başarıyla silindi.");
      await notifyChanged();
    } catch (cause) {
      console.error(cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Video silinirken hata oluştu."
      );
    } finally {
      setActionId(null);
    }
  };

  if (!trainingId) return null;

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            Asenkron Eğitim İçerikleri
          </div>
          <h2>Video Yönetimi</h2>
          <p>
            <strong>{trainingTitle}</strong> eğitimine bağlı
            videoları sıraya göre ekleyin ve yönetin.
          </p>
        </div>

        <div className={styles.counter}>
          <span>Toplam Video</span>
          <strong>{videos.length}</strong>
        </div>
      </header>

      {error ? (
        <div className={styles.errorMessage}>{error}</div>
      ) : null}

      {message ? (
        <div className={styles.successMessage}>{message}</div>
      ) : null}

      <div className={styles.createPanel}>
        <div className={styles.formGrid}>
          <label>
            <span>Video başlığı</span>
            <input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Ör. Yangın güvenliği giriş"
            />
          </label>

          <label>
            <span>Video URL</span>
            <input
              value={draft.videoUrl}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  videoUrl: event.target.value,
                }))
              }
              placeholder="https://.../video.mp4"
            />
          </label>

          <label>
            <span>Süre (saniye)</span>
            <input
              type="number"
              min="0"
              value={draft.durationSeconds}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  durationSeconds: event.target.value,
                }))
              }
              placeholder="900"
            />
          </label>

          <label>
            <span>Sıra</span>
            <input
              type="number"
              min="1"
              value={draft.sortOrder}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  sortOrder: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <label className={styles.descriptionField}>
          <span>Video açıklaması</span>
          <textarea
            rows={3}
            value={draft.description}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Videonun amacı ve kapsamı"
          />
        </label>

        <button
          type="button"
          className={styles.primaryButton}
          disabled={saving}
          onClick={saveVideo}
        >
          {saving ? "Kaydediliyor..." : "Video Ekle"}
        </button>
      </div>

      {editingId ? (
        <div className={styles.editPanel}>
          <div className={styles.editHeader}>
            <div>
              <span>Düzenlenen video</span>
              <strong>{editingDraft.title || "Video"}</strong>
            </div>
            <button type="button" onClick={cancelEditing}>
              Kapat
            </button>
          </div>

          <div className={styles.formGrid}>
            <label>
              <span>Video başlığı</span>
              <input
                value={editingDraft.title}
                onChange={(event) =>
                  setEditingDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              <span>Video URL</span>
              <input
                value={editingDraft.videoUrl}
                onChange={(event) =>
                  setEditingDraft((current) => ({
                    ...current,
                    videoUrl: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              <span>Süre (saniye)</span>
              <input
                type="number"
                min="0"
                value={editingDraft.durationSeconds}
                onChange={(event) =>
                  setEditingDraft((current) => ({
                    ...current,
                    durationSeconds: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              <span>Sıra</span>
              <input
                type="number"
                min="1"
                value={editingDraft.sortOrder}
                onChange={(event) =>
                  setEditingDraft((current) => ({
                    ...current,
                    sortOrder: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label className={styles.descriptionField}>
            <span>Video açıklaması</span>
            <textarea
              rows={3}
              value={editingDraft.description}
              onChange={(event) =>
                setEditingDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>

          <div className={styles.editActions}>
            <button
              type="button"
              className={styles.successButton}
              disabled={actionId === editingId}
              onClick={updateVideo}
            >
              {actionId === editingId
                ? "Güncelleniyor..."
                : "Değişiklikleri Kaydet"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={cancelEditing}
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className={styles.emptyState}>
          Videolar yükleniyor...
        </div>
      ) : orderedVideos.length === 0 ? (
        <div className={styles.emptyState}>
          Bu eğitime henüz video eklenmemiş.
        </div>
      ) : (
        <div className={styles.videoGrid}>
          {orderedVideos.map((video) => (
            <article key={video.id} className={styles.videoCard}>
              <div className={styles.orderBadge}>
                {video.sort_order || "-"}
              </div>

              <div className={styles.videoMain}>
                <div className={styles.videoTitleRow}>
                  <div>
                    <h3>{video.title}</h3>
                    <p>
                      {video.description ||
                        "Video açıklaması girilmemiş."}
                    </p>
                  </div>

                  <span
                    className={
                      video.is_active
                        ? styles.activeBadge
                        : styles.passiveBadge
                    }
                  >
                    {video.is_active ? "Aktif" : "Pasif"}
                  </span>
                </div>

                <div className={styles.videoMeta}>
                  <span>{formatDuration(video.duration_seconds)}</span>
                  <span>
                    {video.is_required === false
                      ? "İsteğe bağlı"
                      : "Zorunlu içerik"}
                  </span>
                  <span>Audit izine hazır</span>
                </div>

                <div className={styles.urlText}>
                  {video.video_url}
                </div>
              </div>

              <div className={styles.cardActions}>
                <a
                  href={video.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.openButton}
                >
                  Aç
                </a>

                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => startEditing(video)}
                >
                  Düzenle
                </button>

                <button
                  type="button"
                  className={styles.deleteButton}
                  disabled={actionId === video.id}
                  onClick={() => deleteVideo(video)}
                >
                  {actionId === video.id ? "İşleniyor..." : "Sil"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
