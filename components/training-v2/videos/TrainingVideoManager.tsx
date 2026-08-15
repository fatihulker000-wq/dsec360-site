"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./VideoManager.module.css";
import HlsVideoUploader from "../../../components/training/video-upload/HlsVideoUploader";

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
        throw new Error(json?.error || "Eğitim alt konuları alınamadı.");
      }

      setVideos(normalizeRows(json?.data));
    } catch (cause) {
      console.error(cause);
      setVideos([]);
      setError(
        cause instanceof Error
          ? cause.message
          : "Eğitim alt konuları alınırken hata oluştu."
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

  const totalDurationSeconds = useMemo(
    () =>
      orderedVideos.reduce(
        (sum, video) => sum + Math.max(0, Number(video.duration_seconds || 0)),
        0
      ),
    [orderedVideos]
  );

  const requiredTopicCount = useMemo(
    () => orderedVideos.filter((video) => video.is_required !== false).length,
    [orderedVideos]
  );

  const notifyChanged = async () => {
    await loadVideos();
    await onChanged?.();
  };

  const validateDraft = (value: VideoDraft) => {
    if (!value.title.trim()) return "Alt konu başlığı zorunlu.";
    if (!value.videoUrl.trim()) return "Alt konu videosu URL bilgisi zorunlu.";
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
        throw new Error(json?.error || "Alt konu eklenemedi.");
      }

      setDraft({
        ...EMPTY_DRAFT,
        sortOrder: String(videos.length + 2),
      });
      setMessage("Alt konu başarıyla eklendi.");
      await notifyChanged();
    } catch (cause) {
      console.error(cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Alt konu eklenirken hata oluştu."
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
        throw new Error(json?.error || "Alt konu güncellenemedi.");
      }

      cancelEditing();
      setMessage("Alt konu başarıyla güncellendi.");
      await notifyChanged();
    } catch (cause) {
      console.error(cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Alt konu güncellenirken hata oluştu."
      );
    } finally {
      setActionId(null);
    }
  };

  const deleteVideo = async (video: TrainingVideoRow) => {
    const confirmed = window.confirm(
      `"${video.title}" alt konusunu silmek istediğine emin misin?`
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
        throw new Error(json?.error || "Alt konu silinemedi.");
      }

      if (editingId === video.id) {
        cancelEditing();
      }

      setMessage("Alt konu başarıyla silindi.");
      await notifyChanged();
    } catch (cause) {
      console.error(cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Alt konu silinirken hata oluştu."
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
            Ana Eğitim → Alt Konular
          </div>
          <h2>Eğitim Alt Konuları / Bölümleri</h2>
          <p>
            <strong>{trainingTitle}</strong> tek ana eğitim olarak kalır. Alt konuları ayrı videolar halinde sıraya göre ekleyin. Çalışan, bu bölümleri tek eğitim içinde sırasıyla tamamlar.
          </p>
        </div>

        <div className={styles.counter}>
          <span>Toplam Alt Konu</span>
          <strong>{videos.length}</strong>
        </div>
      </header>

      {error ? (
        <div className={styles.errorMessage}>{error}</div>
      ) : null}

      {message ? (
        <div className={styles.successMessage}>{message}</div>
      ) : null}

      <div
        style={{
          marginBottom: 16,
          padding: 14,
          border: "1px solid #dbeafe",
          background: "#eff6ff",
          borderRadius: 14,
          color: "#1e3a8a",
          lineHeight: 1.6,
        }}
      >
        <strong>Yeni bölüm kurgusu:</strong> Çalışan bu içeriklerin tamamını
        tek bir “{trainingTitle}” eğitimi altında görür. Bölümler sıra numarasına
        göre açılır; önceki zorunlu bölüm tamamlanmadan sonraki zorunlu bölüm
        eğitim akışında açılmaz. Video izleme, ekran başı doğrulama ve final
        kuralları çalışan portalındaki mevcut güvenli mekanizma tarafından
        uygulanmaya devam eder.
        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          <span>Alt konu: {orderedVideos.length}</span>
          <span>Zorunlu: {requiredTopicCount}</span>
          <span>Toplam süre: {formatDuration(totalDurationSeconds)}</span>
        </div>
      </div>

      <HlsVideoUploader
        trainingId={trainingId}
        trainingTitle={trainingTitle}
        nextSortOrder={videos.length + 1}
        onCompleted={notifyChanged}
      />

      <div className={styles.createPanel}>
        <div className={styles.formGrid}>
          <label>
            <span>Alt konu başlığı</span>
            <input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Ör. Meslek hastalıklarının nedenleri ve korunma yöntemleri"
            />
          </label>

          <label>
            <span>Alt konu video URL</span>
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
            <span>Alt konu süresi (saniye)</span>
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
          <span>Alt konu açıklaması</span>
          <textarea
            rows={3}
            value={draft.description}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Alt konunun amacı, kapsamı ve öğrenme hedefi"
          />
        </label>

        <button
          type="button"
          className={styles.primaryButton}
          disabled={saving}
          onClick={saveVideo}
        >
          {saving ? "Kaydediliyor..." : "Alt Konu Ekle"}
        </button>
      </div>

      {editingId ? (
        <div className={styles.editPanel}>
          <div className={styles.editHeader}>
            <div>
              <span>Düzenlenen alt konu</span>
              <strong>{editingDraft.title || "Alt Konu"}</strong>
            </div>
            <button type="button" onClick={cancelEditing}>
              Kapat
            </button>
          </div>

          <div className={styles.formGrid}>
            <label>
              <span>Alt konu başlığı</span>
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
              <span>Alt konu video URL</span>
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
              <span>Alt konu süresi (saniye)</span>
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
            <span>Alt konu açıklaması</span>
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
          Alt konular yükleniyor...
        </div>
      ) : orderedVideos.length === 0 ? (
        <div className={styles.emptyState}>
          Bu ana eğitime henüz alt konu videosu eklenmemiş.
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
                        "Alt konu açıklaması girilmemiş."}
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
                  <span>Sıralı eğitim akışına hazır</span>
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