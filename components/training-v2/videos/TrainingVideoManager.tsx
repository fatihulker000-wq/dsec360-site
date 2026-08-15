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

function isTopicReady(video: TrainingVideoRow) {
  return (
    Boolean(String(video.title || "").trim()) &&
    Boolean(String(video.video_url || "").trim()) &&
    Number(video.duration_seconds || 0) > 0 &&
    video.is_active !== false
  );
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

  const readyTopicCount = useMemo(
    () => orderedVideos.filter(isTopicReady).length,
    [orderedVideos]
  );

  const missingDurationCount = useMemo(
    () =>
      orderedVideos.filter(
        (video) => Number(video.duration_seconds || 0) <= 0
      ).length,
    [orderedVideos]
  );

  const duplicateSortOrders = useMemo(() => {
    const counts = new Map<number, number>();

    orderedVideos.forEach((video) => {
      const order = Number(video.sort_order || 0);
      if (order > 0) {
        counts.set(order, (counts.get(order) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([order]) => order)
      .sort((a, b) => a - b);
  }, [orderedVideos]);

  const readinessPercent =
    orderedVideos.length > 0
      ? Math.round((readyTopicCount / orderedVideos.length) * 100)
      : 0;

  const nextSuggestedSortOrder =
    orderedVideos.length > 0
      ? Math.max(
          ...orderedVideos.map((video) => Number(video.sort_order || 0)),
          0
        ) + 1
      : 1;

  useEffect(() => {
    setDraft((current) => {
      const currentOrder = Number(current.sortOrder || 0);
      const draftIsUntouched =
        !current.title.trim() &&
        !current.description.trim() &&
        !current.videoUrl.trim() &&
        !current.durationSeconds.trim();

      if (!draftIsUntouched || currentOrder === nextSuggestedSortOrder) {
        return current;
      }

      return {
        ...current,
        sortOrder: String(nextSuggestedSortOrder),
      };
    });
  }, [nextSuggestedSortOrder]);

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

    const requestedSortOrder = Math.max(
      1,
      parsePositiveNumber(draft.sortOrder, nextSuggestedSortOrder)
    );

    if (
      orderedVideos.some(
        (video) => Number(video.sort_order || 0) === requestedSortOrder
      )
    ) {
      setError(
        `${requestedSortOrder}. sıra zaten kullanılıyor. Her alt konu için farklı bir sıra numarası girin.`
      );
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
          sortOrder: requestedSortOrder,
        }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json?.error || "Alt konu eklenemedi.");
      }

      setDraft({
        ...EMPTY_DRAFT,
        sortOrder: String(nextSuggestedSortOrder + 1),
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

    const requestedSortOrder = Math.max(
      1,
      parsePositiveNumber(editingDraft.sortOrder, 1)
    );

    if (
      orderedVideos.some(
        (video) =>
          video.id !== editingId &&
          Number(video.sort_order || 0) === requestedSortOrder
      )
    ) {
      setError(
        `${requestedSortOrder}. sıra başka bir alt konu tarafından kullanılıyor.`
      );
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
            sortOrder: requestedSortOrder,
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
          padding: 16,
          border: "1px solid #dbeafe",
          background: "#eff6ff",
          borderRadius: 14,
          color: "#1e3a8a",
          lineHeight: 1.6,
        }}
      >
        <strong>Alt konu zinciri:</strong> Çalışan bu içeriklerin tamamını
        tek bir “{trainingTitle}” eğitimi altında görür. Bölümler sıra numarasına
        göre ilerler. Mevcut video izleme, ekran başı doğrulama ve final
        güvenlik kuralları değiştirilmez.

        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
          }}
        >
          <div style={{ padding: 12, borderRadius: 12, background: "#fff" }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
              İçerik Hazırlığı
            </div>
            <div style={{ marginTop: 3, fontSize: 20, fontWeight: 900 }}>
              {readyTopicCount} / {orderedVideos.length}
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 12, background: "#fff" }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
              Hazırlık Oranı
            </div>
            <div style={{ marginTop: 3, fontSize: 20, fontWeight: 900 }}>
              %{readinessPercent}
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 12, background: "#fff" }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
              Zorunlu Alt Konu
            </div>
            <div style={{ marginTop: 3, fontSize: 20, fontWeight: 900 }}>
              {requiredTopicCount}
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 12, background: "#fff" }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
              Toplam Eğitim Süresi
            </div>
            <div style={{ marginTop: 3, fontSize: 20, fontWeight: 900 }}>
              {formatDuration(totalDurationSeconds)}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            height: 8,
            borderRadius: 999,
            background: "#dbeafe",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${readinessPercent}%`,
              background: readinessPercent === 100 ? "#16a34a" : "#2563eb",
              transition: "width .2s ease",
            }}
          />
        </div>

        {missingDurationCount > 0 ? (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 10,
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#9a3412",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {missingDurationCount} alt konuda süre bilgisi eksik. Eğitim
            hazırlığı tamamlanmış sayılması için süre bilgisini girin.
          </div>
        ) : null}

        {duplicateSortOrders.length > 0 ? (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 10,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Aynı sıra numarası birden fazla kez kullanılmış:{" "}
            {duplicateSortOrders.join(", ")}. Alt konu sıralamasını düzeltin.
          </div>
        ) : null}

        {orderedVideos.length > 0 &&
        readinessPercent === 100 &&
        duplicateSortOrders.length === 0 ? (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 10,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            ✓ Eğitim içeriği hazır. {orderedVideos.length} alt konu sıralı
            eğitim akışına uygun durumda.
          </div>
        ) : null}
      </div>

      <HlsVideoUploader
        trainingId={trainingId}
        trainingTitle={trainingTitle}
        nextSortOrder={nextSuggestedSortOrder}
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

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "5px 9px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 800,
                        background: isTopicReady(video) ? "#dcfce7" : "#fff7ed",
                        color: isTopicReady(video) ? "#166534" : "#9a3412",
                        border: isTopicReady(video)
                          ? "1px solid #bbf7d0"
                          : "1px solid #fed7aa",
                      }}
                    >
                      {isTopicReady(video) ? "İçerik Hazır" : "Hazırlık Eksik"}
                    </span>

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