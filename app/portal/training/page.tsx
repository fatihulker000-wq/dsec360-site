"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type TrainingStatus = "not_started" | "in_progress" | "completed";

type TrainingDetail = {
  id: string;
  status: TrainingStatus;
  started_at?: string | null;
  completed_at?: string | null;
  watch_completed?: boolean | null;
  watch_seconds?: number | null;
  click_count?: number | null;
  pre_exam_completed?: boolean | null;
  pre_exam_score?: number | null;
  final_exam_score?: number | null;
  final_exam_attempts?: number | null;
  final_exam_passed?: boolean | null;
  training_reset_required?: boolean | null;
  training?: {
    id?: string;
    title?: string;
    description?: string;
    content_url?: string;
    type?: string;
  } | null;
};

function normalizeType(type?: string | null) {
  const value = (type || "").trim().toLowerCase();

  if (value === "senkron") return "senkron";
  if (value === "asenkron") return "asenkron";

  return "asenkron";
}

function formatSeconds(total: number) {
  const safe = Math.max(0, Math.floor(total));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes} dk ${String(seconds).padStart(2, "0")} sn`;
}

function isNativeVideoUrl(url: string) {
  const safe = (url || "").toLowerCase().split("?")[0];

  return (
    safe.endsWith(".mp4") ||
    safe.endsWith(".webm") ||
    safe.endsWith(".ogg") ||
    safe.endsWith(".mov")
  );
}

function isYoutubeUrl(url: string) {
  const safe = (url || "").toLowerCase();
  return safe.includes("youtube.com/watch") || safe.includes("youtu.be/");
}

function toEmbedUrl(url: string) {
  if (!url) return "";

  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }

  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }

  return url;
}

export default function TrainingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const maxReachedRef = useRef(0);
  const isProgrammaticSeekRef = useRef(false);

  const [training, setTraining] = useState<TrainingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressSaved, setProgressSaved] = useState(false);

  const [videoDuration, setVideoDuration] = useState(0);
  const [maxReachedTime, setMaxReachedTime] = useState(0);
  const [showPresencePopup, setShowPresencePopup] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [requiredClicks, setRequiredClicks] = useState(1);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [playbackReady, setPlaybackReady] = useState(false);



  // A3
  const [checkpointIndex, setCheckpointIndex] = useState(0);
  const checkpointsRef = useRef<number[]>([]);

  const fetchTraining = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/training/my", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error || "Eğitim alınamadı.");
        setTraining(null);
        return;
      }

      const found = Array.isArray(json?.data)
        ? json.data.find((item: TrainingDetail) => item.id === assignmentId)
        : null;

      if (!found) {
        setError("Eğitim kaydı bulunamadı.");
        setTraining(null);
        return;
      }

      const dbWatch = Number(found.watch_seconds || 0);
      const dbClicks = Number(found.click_count || 0);

      setTraining(found);
      setMaxReachedTime(dbWatch);
      maxReachedRef.current = dbWatch;
      setClickCount(dbClicks);
      setCheckpointIndex(dbClicks);
      setVideoCompleted(found.watch_completed === true);
    } catch (err) {
      console.error("training detail fetch hatası:", err);
      setError("Bağlantı hatası oluştu.");
      setTraining(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assignmentId) {
      void fetchTraining();
    }
  }, [assignmentId]);

  const trainingType = useMemo(
    () => normalizeType(training?.training?.type),
    [training?.training?.type]
  );

  const contentUrl = training?.training?.content_url || "";
  const embedUrl = useMemo(() => toEmbedUrl(contentUrl), [contentUrl]);

  const isAsync = trainingType === "asenkron";
  const isSync = trainingType === "senkron";
  const nativeVideo = isNativeVideoUrl(contentUrl);
  const youtubeVideo = isYoutubeUrl(contentUrl);

  const serverFinalAttempts = Number(training?.final_exam_attempts || 0);
  const finalAttemptsLeft = Math.max(0, 3 - serverFinalAttempts);
  const finalScore =
    training?.final_exam_score !== null &&
    training?.final_exam_score !== undefined
      ? Number(training.final_exam_score)
      : null;

  const preExamCompleted = training?.pre_exam_completed === true;

  const trainingCompleted =
    training?.status === "completed" || training?.final_exam_passed === true;

  useEffect(() => {
    if (videoDuration > 0) {
      const calculatedRequiredClicks = Math.max(
        1,
        Math.floor(videoDuration / 90)
      );
      setRequiredClicks(calculatedRequiredClicks);

      const arr: number[] = [];
      for (let sec = 90; sec < videoDuration; sec += 90) {
        arr.push(sec);
      }
      checkpointsRef.current = arr;
    }
  }, [videoDuration]);

  const handleLoadedMetadata = () => {
    const player = videoRef.current;
    if (!player) return;

    const duration = Math.floor(player.duration || 0);
    setVideoDuration(duration);

    if (maxReachedRef.current > 0 && maxReachedRef.current < duration) {
      isProgrammaticSeekRef.current = true;
      player.currentTime = maxReachedRef.current;
    }

    setPlaybackReady(true);
  };

  const handleTimeUpdate = () => {
    const player = videoRef.current;
    if (!player) return;

    const current = Math.floor(player.currentTime || 0);
    const prevMax = maxReachedRef.current;

    // A1 - ileri sarma engeli
    if (current > prevMax + 1) {
      isProgrammaticSeekRef.current = true;
      player.currentTime = prevMax;
      return;
    }

    if (current > prevMax) {
      maxReachedRef.current = current;
      setMaxReachedTime(current);
    }

    // A3 - checkpoint popup
    const checkpoints = checkpointsRef.current;
    if (
      checkpointIndex < checkpoints.length &&
      current >= checkpoints[checkpointIndex] &&
      !showPresencePopup
    ) {
      player.pause();
      setShowPresencePopup(true);
    }
  };

  const handleSeeking = () => {
    const player = videoRef.current;
    if (!player) return;

    if (isProgrammaticSeekRef.current) {
      isProgrammaticSeekRef.current = false;
      return;
    }

    const current = Math.floor(player.currentTime || 0);
    const allowedMax = maxReachedRef.current + 1;

    // geri sarma serbest, ileri sarma yasak
    if (current > allowedMax) {
      isProgrammaticSeekRef.current = true;
      player.currentTime = maxReachedRef.current;
    }
  };

  const effectiveWatchSeconds = Math.min(
    Math.max(Number(training?.watch_seconds || 0), Math.floor(maxReachedTime)),
    Math.floor(
      videoDuration ||
        Math.max(Number(training?.watch_seconds || 0), maxReachedTime)
    )
  );

  const effectiveClickCount = Math.max(
    Number(training?.click_count || 0),
    clickCount
  );

  // A2 - video gerçekten sona gelmeden tamam sayılmaz
  useEffect(() => {
    if (videoDuration <= 0) return;

    const completed =
      effectiveWatchSeconds >= Math.max(videoDuration - 1, 1);

    setVideoCompleted(completed);
  }, [effectiveWatchSeconds, videoDuration]);

  const progressPercent =
    videoDuration > 0
      ? Math.min(100, Math.round((effectiveWatchSeconds / videoDuration) * 100))
      : 0;

  useEffect(() => {
    if (!assignmentId) return;
    if (!videoCompleted) return;
    if (progressSaved) return;

    const saveProgress = async () => {
      try {
        const res = await fetch("/api/training/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignmentId,
            watchSeconds: effectiveWatchSeconds,
            clickCount: effectiveClickCount,
            completed: true,
          }),
        });

        if (res.ok) {
          setProgressSaved(true);
          await fetchTraining();
        }
      } catch (err) {
        console.error("training progress save error:", err);
      }
    };

    void saveProgress();
  }, [
    assignmentId,
    videoCompleted,
    effectiveWatchSeconds,
    effectiveClickCount,
    progressSaved,
  ]);

  const canTakeFinalExam =
    finalAttemptsLeft > 0 &&
    !trainingCompleted &&
    preExamCompleted &&
    (isSync ||
      (isAsync &&
        nativeVideo &&
        (training?.watch_completed === true || videoCompleted) &&
        effectiveWatchSeconds >= Math.floor(videoDuration) &&
        effectiveClickCount >= requiredClicks));

  const lockReason = useMemo(() => {
    if (trainingCompleted) return "";
    if (!preExamCompleted)
      return "Ön sınav tamamlanmadan eğitime/finale ilerlenemez.";
    if (finalAttemptsLeft <= 0) return "Final hakkı bitti.";
    if (isSync) return "";
    if (!contentUrl) return "Eğitim içeriği bulunamadı.";

    if (nativeVideo) {
      if (!(training?.watch_completed === true || videoCompleted)) {
        return "Video tamamen bitmeden final açılmaz.";
      }
      if (effectiveClickCount < requiredClicks) {
        return "Zorunlu ekran başı onayları tamamlanmadı.";
      }
      if (effectiveWatchSeconds < Math.floor(videoDuration)) {
        return "Eğitim süresi tamamlanmadan final açılmaz.";
      }
      return "";
    }

    if (youtubeVideo) {
      return "YouTube içerikleri açılır; ancak denetimli final kilidi doğrudan video dosyalarında tam çalışır.";
    }

    return "Bu içerik açılabilir; ancak zorunlu süre/izleme doğrulaması yapılamadığı için final kilitli kalır.";
  }, [
    trainingCompleted,
    preExamCompleted,
    finalAttemptsLeft,
    isSync,
    contentUrl,
    nativeVideo,
    youtubeVideo,
    training?.watch_completed,
    videoCompleted,
    effectiveClickCount,
    requiredClicks,
    effectiveWatchSeconds,
    videoDuration,
  ]);

  if (loading) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Yükleniyor...</h1>
      </main>
    );
  }

  if (error || !training) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Hata</h1>
        <p>{error || "Eğitim bulunamadı."}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
          }}
        >
          <h1 style={{ margin: 0 }}>{training.training?.title || "Eğitim"}</h1>

          <p style={{ marginTop: "12px", color: "#444", lineHeight: 1.7 }}>
            {training.training?.description || "Açıklama bulunmuyor."}
          </p>

          <div
            style={{
              marginTop: "16px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: "999px",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                color: "#374151",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              Tür: {trainingType}
            </div>

            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: "999px",
                background: trainingCompleted ? "#dcfce7" : "#eff6ff",
                border: trainingCompleted
                  ? "1px solid #86efac"
                  : "1px solid #bfdbfe",
                color: trainingCompleted ? "#166534" : "#1d4ed8",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {trainingCompleted ? "Eğitim Başarılı" : "Eğitim Devam Ediyor"}
            </div>

            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: "999px",
                background: preExamCompleted ? "#eff6ff" : "#fef2f2",
                border: preExamCompleted
                  ? "1px solid #bfdbfe"
                  : "1px solid #fecaca",
                color: preExamCompleted ? "#1d4ed8" : "#991b1b",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {preExamCompleted ? "Ön Sınav Tamamlandı" : "Ön Sınav Bekleniyor"}
            </div>

            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: "999px",
                background: "#fff7ed",
                border: "1px solid #fdba74",
                color: "#9a3412",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              Kalan Final Hakkı: {finalAttemptsLeft}
            </div>

            {finalScore !== null ? (
              <div
                style={{
                  display: "inline-flex",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: finalScore >= 60 ? "#dcfce7" : "#fee2e2",
                  border:
                    finalScore >= 60
                      ? "1px solid #86efac"
                      : "1px solid #fca5a5",
                  color: finalScore >= 60 ? "#166534" : "#b91c1c",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                Final Puanı: %{finalScore}
              </div>
            ) : null}
          </div>

          {isAsync && (
            <div
              style={{
                marginTop: "18px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "12px",
                fontSize: "13px",
              }}
            >
              <div>
                <div style={{ color: "#6b7280", marginBottom: "6px" }}>
                  Toplam Eğitim Süresi
                </div>
                <div style={{ fontWeight: 700 }}>
                  {formatSeconds(videoDuration)}
                </div>
              </div>
              <div>
                <div style={{ color: "#6b7280", marginBottom: "6px" }}>
                  Geçerli İzlenen Süre
                </div>
                <div style={{ fontWeight: 700 }}>
                  {formatSeconds(effectiveWatchSeconds)}
                </div>
              </div>
              <div>
                <div style={{ color: "#6b7280", marginBottom: "6px" }}>
                  Tıklama
                </div>
                <div style={{ fontWeight: 700 }}>
                  {effectiveClickCount} / {requiredClicks}
                </div>
              </div>
              <div>
                <div style={{ color: "#6b7280", marginBottom: "6px" }}>
                  İlerleme
                </div>
                <div style={{ fontWeight: 700 }}>%{progressPercent}</div>
              </div>
            </div>
          )}

          {isSync ? (
            <div style={{ marginTop: "24px" }}>
              {contentUrl ? (
                <a
                  href={contentUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    padding: "12px 18px",
                    background: "#2563eb",
                    color: "#fff",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  Canlı Eğitime Katıl
                </a>
              ) : (
                <p style={{ color: "#b91c1c" }}>
                  Canlı eğitim linki bulunamadı.
                </p>
              )}
            </div>
          ) : contentUrl ? (
            <div style={{ marginTop: "24px" }}>
              {nativeVideo ? (
                <video
                  ref={videoRef}
                  src={contentUrl}
                  controls
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onSeeking={handleSeeking}
                  onEnded={() => setVideoCompleted(true)}

                  style={{
                    width: "100%",
                    borderRadius: "16px",
                    background: "#000",
                  }}
                />
              ) : youtubeVideo ? (
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="500"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    border: "none",
                    borderRadius: "16px",
                    background: "#000",
                  }}
                  title="Eğitim İçeriği"
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    flexWrap: "wrap",
                    padding: "18px",
                    borderRadius: "12px",
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ color: "#374151", lineHeight: 1.7 }}>
                    Bu eğitim içeriği tarayıcıda doğrudan oynatılamayan bir bağlantı türünde.
                    İçeriği açıp izlemek için aşağıdaki bağlantıyı kullanabilirsiniz.
                  </div>

                  <a
                    href={contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-block",
                      padding: "12px 18px",
                      background: "#2563eb",
                      color: "#fff",
                      borderRadius: "10px",
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    Eğitimi Aç
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p style={{ marginTop: "24px", color: "#b91c1c" }}>
              Eğitim içeriği bulunamadı.
            </p>
          )}

          {!playbackReady && isAsync && nativeVideo && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1d4ed8",
                lineHeight: 1.6,
              }}
            >
              Video meta bilgileri yükleniyor. Eğitim süresi ve izleme takibi hazırlanıyor.
            </div>
          )}

          {!!lockReason && !trainingCompleted && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                lineHeight: 1.6,
              }}
            >
              {lockReason}
            </div>
          )}

          {isAsync && !nativeVideo && contentUrl && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1d4ed8",
                lineHeight: 1.6,
              }}
            >
              Bu içerik açılır ve izlenir. Ancak ileri sarma engeli, zorunlu tıklama ve süre takibi en sağlıklı şekilde doğrudan video dosyalarında çalışır.
            </div>
          )}

          <div
            style={{
              marginTop: "24px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {!preExamCompleted ? (
              <button
                onClick={() => router.push(`/portal/training/${assignmentId}/pre-exam`)}
                style={{
                  padding: "12px 20px",
                  background: "#2563eb",
                  color: "#fff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Ön Sınava Git
              </button>
            ) : canTakeFinalExam ? (
              <button
                onClick={() => {
                  router.push(`/portal/training/${assignmentId}/final-exam`);
                }}
                style={{
                  padding: "12px 20px",
                  background: "#7c3aed",
                  color: "#fff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Final Sınavına Gir
              </button>
            ) : trainingCompleted ? (
              <button
                disabled
                style={{
                  padding: "12px 20px",
                  background: "#16a34a",
                  color: "#fff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  opacity: 0.9,
                }}
              >
                Eğitim Tamamlandı
              </button>
            ) : (
              <button
                disabled
                style={{
                  padding: "12px 20px",
                  background: "#9ca3af",
                  color: "#fff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  opacity: 0.9,
                }}
              >
                Final Kilitli
              </button>
            )}

            <button
              onClick={() => {
                router.push("/portal/training");
              }}
              style={{
                padding: "12px 20px",
                background: "#111827",
                color: "#fff",
                borderRadius: "10px",
                border: "none",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Eğitim Listesine Dön
            </button>
          </div>

          {!trainingCompleted && finalAttemptsLeft <= 0 && (
            <div
              style={{
                marginTop: "18px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                lineHeight: 1.6,
              }}
            >
              Final sınav haklarınız bitti. Bu eğitim tamamlanmadı olarak değerlendirilecektir ve eğitimin yeniden alınması gerekir.
            </div>
          )}

          {trainingCompleted && (
            <>
              <div
                style={{
                  marginTop: "18px",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  lineHeight: 1.6,
                }}
              >
                Tebrikler. Final sınavı başarıyla tamamlandı. Eğitim başarılı durumda.
              </div>

              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() =>
                    window.open(`/api/training/certificate/${assignmentId}`, "_blank")
                  }
                  style={{
                    padding: "12px 18px",
                    background: "#7c3aed",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Eğitim Sertifikası
                </button>

                <button
                  onClick={() =>
                    window.open(
                      `/api/training/certificate/${assignmentId}?type=attendance`,
                      "_blank"
                    )
                  }
                  style={{
                    padding: "12px 18px",
                    background: "#0f766e",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Katılım Belgesi
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showPresencePopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              maxWidth: "460px",
              width: "100%",
              borderRadius: "18px",
              padding: "28px",
              textAlign: "center",
              boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
            }}
          >
 <h3 style={{ marginTop: 0, marginBottom: "10px" }}>
  90 saniyelik ekran başı doğrulaması
</h3>
<p style={{ color: "#4b5563", lineHeight: 1.7 }}>
  Eğitime aktif devam ettiğinizi doğrulamak için onay vermeniz gerekir.
  Onay verilmeden video devam etmez.
</p>

            <button
              onClick={async () => {
                const newCount = clickCount + 1;
                setClickCount(newCount);
                setShowPresencePopup(false);
                setCheckpointIndex((prev) => prev + 1);

                try {
                  await fetch("/api/training/progress", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      assignmentId,
                      watchSeconds: effectiveWatchSeconds,
                      clickCount: newCount,
                      completed: false,
                    }),
                  });
                } catch (err) {
                  console.error("presence save error:", err);
                }

                videoRef.current?.play().catch(() => undefined);
              }}
              style={{
                marginTop: "12px",
                padding: "12px 18px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Devam Et
            </button>
          </div>
        </div>
      )}
    </main>
  );
}