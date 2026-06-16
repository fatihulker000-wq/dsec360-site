"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type TrainingStatus = "not_started" | "in_progress" | "completed";

type TrainingDetail = {
  id: string;
  status: TrainingStatus;
  watch_completed?: boolean | null;
  watch_seconds?: number | null;
  click_count?: number | null;
  pre_exam_completed?: boolean | null;
  final_exam_score?: number | null;
  final_exam_attempts?: number | null;
  final_exam_passed?: boolean | null;
  training_reset_required?: boolean | null;
  training_repeat_count?: number | null;
  video_chain_completed?: boolean | null;
  total_videos?: number | null;
  completed_videos?: number | null;
  training?: {
    id?: string;
    title?: string;
    description?: string;
    content_url?: string;
    type?: string;
  } | null;
};

type VideoProgress = {
  watch_seconds?: number | null;
  max_watched_seconds?: number | null;
  last_position_seconds?: number | null;
  locked_duration_seconds?: number | null;
  presence_clicks?: number | null;
  required_presence_clicks?: number | null;
  watch_completed?: boolean | null;
};

type TrainingVideo = {
  id: string;
  title: string;
  description?: string | null;
  video_url: string;
  duration_seconds?: number | null;
  sort_order?: number | null;
  unlocked?: boolean;
  progress?: VideoProgress | null;
};

const PRESENCE_INTERVAL_SECONDS = 360;

function normalizeType(type?: string | null) {
  const value = (type || "").trim().toLowerCase();
  if (value === "senkron") return "senkron";
  if (value === "asenkron") return "asenkron";
  return "asenkron";
}

function normalizeFinalScore(score?: number | null) {
  if (score === null || score === undefined) return null;
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function shouldShowFinalScore(params: {
  final_exam_score?: number | null;
  final_exam_attempts?: number | null;
  final_exam_passed?: boolean | null;
}) {
  const attempts = Number(params.final_exam_attempts || 0);
  const passed = params.final_exam_passed === true;
  const hasRawScore =
    params.final_exam_score !== null && params.final_exam_score !== undefined;

  return hasRawScore && (attempts > 0 || passed);
}

function isYoutubeUrl(url: string) {
  const safe = (url || "").toLowerCase();
  return safe.includes("youtube.com/watch") || safe.includes("youtu.be/");
}

function isNativeVideoUrl(url: string) {
  if (!url) return false;
  const cleanUrl = url.split("?")[0].toLowerCase();

  return (
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".ogg") ||
    cleanUrl.endsWith(".mov") ||
    cleanUrl.endsWith(".avi") ||
    cleanUrl.endsWith(".mkv") ||
    cleanUrl.endsWith(".m3u8")
  );
}

function inferVideoMimeType(url: string) {
  const safe = (url || "").toLowerCase().split("?")[0];
  if (safe.endsWith(".webm")) return "video/webm";
  if (safe.endsWith(".ogg")) return "video/ogg";
  if (safe.endsWith(".mov")) return "video/mp4";
  if (safe.endsWith(".m3u8")) return "application/x-mpegURL";
  return "video/mp4";
}

function formatSeconds(total: number) {
  const safe = Math.max(0, Math.floor(total));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes} dk ${String(seconds).padStart(2, "0")} sn`;
}

export default function TrainingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = String(params?.id || "");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const maxReachedRef = useRef(0);
  const isProgrammaticSeekRef = useRef(false);
  const blockSeekRef = useRef(false);
  const checkpointsRef = useRef<number[]>([]);

  const [training, setTraining] = useState<TrainingDetail | null>(null);
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [activeVideoId, setActiveVideoId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [videoDuration, setVideoDuration] = useState(0);
  const [maxReachedTime, setMaxReachedTime] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [requiredClicks, setRequiredClicks] = useState(0);
  const [checkpointIndex, setCheckpointIndex] = useState(0);
  const [showPresencePopup, setShowPresencePopup] = useState(false);
  const [playbackReady, setPlaybackReady] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState("");
  const [progressSaved, setProgressSaved] = useState(false);

  const trainingType = normalizeType(training?.training?.type);
  const isAsync = trainingType === "asenkron";
  const isSync = trainingType === "senkron";

  const preExamCompleted = training?.pre_exam_completed === true;
  const finalPassed = training?.final_exam_passed === true;
  const resetRequired = training?.training_reset_required === true;
  const repeatCount = Math.max(0, Number(training?.training_repeat_count || 0));
  const finalAttemptsLeft = resetRequired
    ? 3
    : Math.max(0, 3 - Number(training?.final_exam_attempts || 0));

  const finalScore = normalizeFinalScore(training?.final_exam_score);
  const showFinalScore = shouldShowFinalScore({
    final_exam_score: training?.final_exam_score,
    final_exam_attempts: training?.final_exam_attempts,
    final_exam_passed: training?.final_exam_passed,
  });

  const hasV2Videos = videos.length > 0;

  const activeVideo = useMemo(() => {
    if (!hasV2Videos) return null;

    const selected = videos.find((v) => v.id === activeVideoId);
    if (selected) return selected;

    return (
      videos.find((v) => v.unlocked && v.progress?.watch_completed !== true) ||
      videos.find((v) => v.unlocked) ||
      videos[0]
    );
  }, [videos, activeVideoId, hasV2Videos]);

  const contentUrl = hasV2Videos
    ? activeVideo?.video_url || ""
    : training?.training?.content_url || "";

  const youtubeVideo = isYoutubeUrl(contentUrl);
  const nativeVideo = isNativeVideoUrl(contentUrl);
  const canTryNativeVideo = nativeVideo && !youtubeVideo;

  const completedVideos = hasV2Videos
    ? videos.filter((v) => v.progress?.watch_completed === true).length
    : training?.watch_completed
    ? 1
    : 0;

  const totalVideos = hasV2Videos ? videos.length : 1;
  const videoChainCompleted = hasV2Videos
    ? videos.length > 0 && completedVideos >= videos.length
    : training?.watch_completed === true;

  const activeProgress = activeVideo?.progress || null;

  const effectiveWatchSeconds = hasV2Videos
    ? Math.min(
        Math.max(
          Number(activeProgress?.watch_seconds || 0),
          Number(activeProgress?.max_watched_seconds || 0),
          Math.floor(maxReachedTime)
        ),
        Math.floor(
          videoDuration ||
            Number(activeProgress?.locked_duration_seconds || 0) ||
            Math.max(maxReachedTime, Number(activeProgress?.watch_seconds || 0))
        )
      )
    : Math.min(
        Math.max(Number(training?.watch_seconds || 0), Math.floor(maxReachedTime)),
        Math.floor(
          videoDuration ||
            Math.max(Number(training?.watch_seconds || 0), maxReachedTime)
        )
      );

  const effectiveClickCount = hasV2Videos
    ? Math.max(Number(activeProgress?.presence_clicks || 0), clickCount)
    : Math.max(Number(training?.click_count || 0), clickCount);

  const progressPercent =
    videoDuration > 0
      ? Math.min(100, Math.round((effectiveWatchSeconds / videoDuration) * 100))
      : 0;

  const videoWatchCompleted =
    finalPassed ||
    videoChainCompleted ||
    (!hasV2Videos && training?.watch_completed === true);

  const canShowCompletedState =
    !finalPassed && !resetRequired && videoWatchCompleted;

  const canTakeFinalExam =
  !resetRequired &&
  finalAttemptsLeft > 0 &&
  !finalPassed &&
  preExamCompleted &&
  (
    isSync ||
    (
      isAsync &&
      videoChainCompleted
    )
  );

  const fetchTraining = async () => {
    const res = await fetch("/api/training/my", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`API hata verdi: ${res.status}`);
    }

    const json = await res.json();
    const found = Array.isArray(json?.data)
      ? json.data.find((item: TrainingDetail) => item.id === assignmentId)
      : null;

    if (!found) {
      throw new Error("Eğitim kaydı bulunamadı.");
    }

    setTraining(found);
    return found as TrainingDetail;
  };

  const fetchVideos = async () => {
    const res = await fetch(`/api/training/videos?assignmentId=${assignmentId}`, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      setVideos([]);
      return [];
    }

    const json = await res.json();
    const rows = Array.isArray(json?.data) ? (json.data as TrainingVideo[]) : [];

    setVideos(rows);

    const firstActive =
      rows.find((v) => v.unlocked && v.progress?.watch_completed !== true) ||
      rows.find((v) => v.unlocked) ||
      rows[0];

    if (firstActive) {
      setActiveVideoId((prev) => prev || firstActive.id);
    }

    return rows;
  };

  const reloadAll = async () => {
    try {
      setLoading(true);
      setError("");

      await fetch("/api/training/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          assignmentId,
          action: "open",
          currentSecond: 0,
          duration: 0,
        }),
      }).catch(() => null);

      await fetchTraining();
      await fetchVideos();
      const unlocked = videos.find(
  (v) =>
    v.id !== activeVideo?.id &&
    v.unlocked &&
    v.progress?.watch_completed !== true
);

if (unlocked) {
  setActiveVideoId(unlocked.id);
}
    } catch (err: any) {
      setError(err?.message || "Eğitim yüklenemedi.");
      setTraining(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!assignmentId) return;
    window.scrollTo({ top: 0, behavior: "auto" });
    void reloadAll();
  }, [assignmentId]);

  useEffect(() => {
    const source = activeProgress;

    const dbWatch = Math.max(
      Number(source?.watch_seconds || 0),
      Number(source?.max_watched_seconds || 0)
    );

    setMaxReachedTime(dbWatch);
    maxReachedRef.current = dbWatch;
    setClickCount(Number(source?.presence_clicks || 0));
    setCheckpointIndex(Number(source?.presence_clicks || 0));
    setProgressSaved(source?.watch_completed === true);
    setVideoDuration(0);
    setPlaybackReady(false);
    setVideoLoadError("");

    if (videoRef.current) {
      isProgrammaticSeekRef.current = true;
      videoRef.current.currentTime = 0;
    }
  }, [activeVideo?.id]);

  useEffect(() => {
    if (videoDuration > 0) {
      const arr: number[] = [];
      for (let sec = PRESENCE_INTERVAL_SECONDS; sec < videoDuration; sec += PRESENCE_INTERVAL_SECONDS) {
        arr.push(sec);
      }
      checkpointsRef.current = arr;
      setRequiredClicks(arr.length);
    } else {
      checkpointsRef.current = [];
      setRequiredClicks(0);
    }
  }, [videoDuration]);

  const saveLegacyComplete = async (finalWatchSeconds: number, finalClicks: number) => {
    await fetch("/api/training/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        assignmentId,
        action: "complete",
        currentSecond: finalWatchSeconds,
        duration: finalWatchSeconds,
      }),
    });

    await fetch("/api/training/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        assignmentId,
        action: "mark_watched",
        currentSecond: finalWatchSeconds,
        duration: finalWatchSeconds,
      }),
    });
  };

  const saveVideoProgress = async (
    action: "heartbeat" | "presence" | "complete",
    currentSecond: number,
    duration: number
  ) => {
    if (hasV2Videos && activeVideo) {
      return fetch("/api/training/video-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          assignmentId,
          videoId: activeVideo.id,
          action,
          currentSecond,
          duration,
        }),
      });
    }

    if (action === "heartbeat") {
      return fetch("/api/training/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          assignmentId,
          action: "heartbeat",
          currentSecond,
          duration,
        }),
      });
    }

    return null;
  };

  const handleLoadedMetadata = () => {
    const player = videoRef.current;
    if (!player) return;

    const duration = Math.floor(player.duration || 0);
    setVideoDuration(duration);

    const resumeFrom = Math.max(
      Number(activeProgress?.last_position_seconds || 0),
      Number(activeProgress?.max_watched_seconds || 0),
      hasV2Videos ? 0 : Number(training?.watch_seconds || 0)
    );

    const shouldResume =
      preExamCompleted &&
      !resetRequired &&
      resumeFrom > 0 &&
      resumeFrom < duration &&
      activeProgress?.watch_completed !== true;

    const safeResume = shouldResume ? Math.floor(resumeFrom) : 0;

    isProgrammaticSeekRef.current = true;
    player.currentTime = safeResume;
    player.playbackRate = 1;

    maxReachedRef.current = safeResume;
    setMaxReachedTime(safeResume);
    setPlaybackReady(true);
    setVideoLoadError("");
  };

  const handleTimeUpdate = () => {
    const player = videoRef.current;
    if (!player) return;

    if (player.playbackRate !== 1) {
      player.playbackRate = 1;
    }

    const current = Number(player.currentTime || 0);
    const flooredCurrent = Math.floor(current);
    const prevMax = Number(maxReachedRef.current || 0);

    if (!isProgrammaticSeekRef.current && current > prevMax + 1.2) {
      blockSeekRef.current = true;
      player.pause();
      isProgrammaticSeekRef.current = true;
      player.currentTime = prevMax;
      return;
    }

    if (current >= prevMax && current <= prevMax + 1.2) {
      maxReachedRef.current = current;
      setMaxReachedTime(flooredCurrent);

      if (flooredCurrent > 0 && flooredCurrent % 15 === 0) {
        saveVideoProgress(
          "heartbeat",
          flooredCurrent,
          Math.floor(videoDuration || 0)
        ).catch((err) => console.error("heartbeat error:", err));
      }
    }

    const checkpoints = checkpointsRef.current;
    if (
      checkpointIndex < checkpoints.length &&
      flooredCurrent >= checkpoints[checkpointIndex] &&
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

    const current = Number(player.currentTime || 0);
    const allowedMax = Number(maxReachedRef.current || 0);

    if (current > allowedMax + 0.5) {
      blockSeekRef.current = true;
      player.pause();
      isProgrammaticSeekRef.current = true;
      player.currentTime = allowedMax;
    }
  };

  const handleVideoEnded = async () => {
    try {
      if (effectiveClickCount < requiredClicks) {
        return;
      }

      const finalWatchSeconds = Math.floor(videoDuration || 0);

      if (hasV2Videos && activeVideo) {
        await saveVideoProgress("complete", finalWatchSeconds, finalWatchSeconds);
      } else {
        await saveLegacyComplete(finalWatchSeconds, effectiveClickCount);
      }

      setProgressSaved(true);
      await fetchTraining();
      await fetchVideos();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("video complete error:", err);
    }
  };

  const lockReason = useMemo(() => {
    if (resetRequired) {
      return "Bu eğitim yeniden başlatıldı. Ön sınavı tekrar tamamlayıp videoyu baştan izlemelisiniz.";
    }

    if (finalPassed) return "";
    if (!preExamCompleted) return "Ön sınav tamamlanmadan eğitime/finale ilerlenemez.";
    if (finalAttemptsLeft <= 0) return "Final hakkı bitti.";
    if (isSync) return "";
    if (!contentUrl) return "Eğitim içeriği bulunamadı.";
    if (youtubeVideo) return "YouTube linkleri desteklenmiyor. Lütfen video dosyası yükleyin.";
    if (videoLoadError) return videoLoadError;
    if (videoWatchCompleted) return "";
    if (effectiveClickCount < requiredClicks) return "Zorunlu ekran başı onayları tamamlanmadı.";
    if (videoDuration > 0 && effectiveWatchSeconds < Math.floor(videoDuration)) {
      return "Eğitim süresi tamamlanmadan final açılmaz.";
    }

    return "Tüm videolar tamamlanmadan final açılmaz.";
  }, [
    resetRequired,
    finalPassed,
    preExamCompleted,
    finalAttemptsLeft,
    isSync,
    contentUrl,
    youtubeVideo,
    videoLoadError,
    videoWatchCompleted,
    effectiveClickCount,
    requiredClicks,
    effectiveWatchSeconds,
    videoDuration,
  ]);

  const openCertificate = () => {
    window.open(`/api/training/certificate/${assignmentId}`, "_blank", "noopener,noreferrer");
  };

  const openAttendance = () => {
    window.open(`/api/training/attendance-certificate/${assignmentId}`, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <main style={{ padding: 40, fontFamily: "Arial", background: "#f8fafc", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>Yükleniyor...</div>
      </main>
    );
  }

  if (error || !training) {
    return (
      <main style={{ padding: 40, fontFamily: "Arial", background: "#f8fafc", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", color: "#991b1b" }}>
          <h1>Hata</h1>
          <p>{error || "Eğitim bulunamadı."}</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 24 }}>
          <h1 style={{ margin: 0 }}>{training.training?.title || "Eğitim"}</h1>

          <p style={{ marginTop: 12, color: "#444", lineHeight: 1.7 }}>
            {training.training?.description || "Açıklama bulunmuyor."}
          </p>

          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Badge text={`Tür: ${trainingType}`} />
            <Badge
              text={
                finalPassed
                  ? "Eğitim Başarılı"
                  : canShowCompletedState
                  ? "Eğitim Tamamlandı"
                  : "Eğitim Devam Ediyor"
              }
              green={finalPassed || canShowCompletedState}
            />
            <Badge
              text={preExamCompleted ? "Ön Sınav Tamamlandı" : "Ön Sınav Bekleniyor"}
              danger={!preExamCompleted}
            />
            <Badge text={`Kalan Final Hakkı: ${finalAttemptsLeft}`} orange />
            <Badge text={`Tekrar Sayısı: ${repeatCount}`} danger={repeatCount > 0} />
            {showFinalScore && finalScore !== null ? (
              <Badge text={`Final Puanı: ${finalScore}`} green={finalScore >= 60} danger={finalScore < 60} />
            ) : null}
          </div>

          {hasV2Videos ? (
            <div style={{ marginTop: 22, padding: 16, borderRadius: 14, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
              <h3 style={{ marginTop: 0 }}>Eğitim Video Akışı</h3>

              <div style={{ display: "grid", gap: 10 }}>
                {videos.map((video, index) => {
                  const completed = video.progress?.watch_completed === true;
                  const selected = activeVideo?.id === video.id;
                  const locked = !video.unlocked;

                  return (
                    <button
                      key={video.id}
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        if (!locked) setActiveVideoId(video.id);
                      }}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: selected ? "2px solid #2563eb" : "1px solid #e5e7eb",
                        background: locked ? "#f3f4f6" : completed ? "#f0fdf4" : "#fff",
                        cursor: locked ? "not-allowed" : "pointer",
                      }}
                    >
                      <b>
                        {index + 1}. {video.title}
                      </b>
                      <div style={{ marginTop: 4, fontSize: 13, color: locked ? "#6b7280" : completed ? "#166534" : "#374151" }}>
                        {locked ? "Kilitli" : completed ? "Tamamlandı" : selected ? "Aktif Video" : "Açık"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {isAsync ? (
            <div
              style={{
                marginTop: 18,
                padding: "14px 16px",
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                fontSize: 13,
              }}
            >
              <Info label="Toplam Video" value={`${completedVideos} / ${totalVideos}`} />
              <Info label="Video Süresi" value={formatSeconds(videoDuration)} />
              <Info label="İzlenen Süre" value={formatSeconds(effectiveWatchSeconds)} />
              <Info label="Ekran Onayı" value={`${effectiveClickCount} / ${requiredClicks}`} />
              <Info label="İlerleme" value={`%${progressPercent}`} />
            </div>
          ) : null}

          {!preExamCompleted ? (
            <div style={{ marginTop: 24 }}>
              <button onClick={() => router.push(`/portal/training/${assignmentId}/pre-exam`)} style={primaryButton}>
                Ön Sınava Git
              </button>
            </div>
          ) : isSync ? (
            <div style={{ marginTop: 24 }}>
              {contentUrl ? (
                <a href={contentUrl} target="_blank" rel="noreferrer" style={{ ...primaryButton, display: "inline-block", textDecoration: "none" }}>
                  Canlı Eğitime Katıl
                </a>
              ) : (
                <p style={{ color: "#b91c1c" }}>Canlı eğitim linki bulunamadı.</p>
              )}
            </div>
          ) : contentUrl ? (
            <div style={{ marginTop: 24 }}>
              {youtubeVideo ? (
                <Warning text="YouTube linkleri desteklenmiyor. Lütfen video dosyası yükleyin." />
              ) : nativeVideo ? (
                <>
                  {activeVideo ? (
                    <h3 style={{ marginTop: 0 }}>{activeVideo.title}</h3>
                  ) : null}

                  <video
                    key={activeVideo?.id || contentUrl}
                    ref={videoRef}
                    controls={preExamCompleted}
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture
                    preload="metadata"
                    onLoadedMetadata={handleLoadedMetadata}
                    onCanPlay={() => {
                      setPlaybackReady(true);
                      setVideoLoadError("");
                    }}
                    onTimeUpdate={handleTimeUpdate}
                    onSeeking={handleSeeking}
                    onSeeked={() => {
                      if (blockSeekRef.current) blockSeekRef.current = false;
                    }}
                    onRateChange={() => {
                      const player = videoRef.current;
                      if (player && player.playbackRate !== 1) player.playbackRate = 1;
                    }}
                    onEnded={handleVideoEnded}
                    onError={() => {
                      setVideoLoadError("Video yüklenemedi. Dosya yolu veya içerik tipi kontrol edilmelidir.");
                      setPlaybackReady(false);
                    }}
                    style={{
                      width: "100%",
                      borderRadius: 16,
                      background: "#000",
                      pointerEvents: preExamCompleted ? "auto" : "none",
                      opacity: preExamCompleted ? 1 : 0.65,
                    }}
                  >
                    <source src={contentUrl} type={inferVideoMimeType(contentUrl)} />
                    Tarayıcınız video oynatmayı desteklemiyor.
                  </video>
                </>
              ) : (
                <Warning text="Desteklenmeyen video formatı." />
              )}
            </div>
          ) : (
            <Warning text="Eğitim içeriği bulunamadı." />
          )}

          {!playbackReady && isAsync && canTryNativeVideo && !videoLoadError && preExamCompleted ? (
            <div style={{ marginTop: 16, color: "#1d4ed8" }}>Video hazırlanıyor...</div>
          ) : null}

          {!!lockReason && !finalPassed ? <Warning text={lockReason} /> : null}

          <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
            {!preExamCompleted ? (
              <button onClick={() => router.push(`/portal/training/${assignmentId}/pre-exam`)} style={primaryButton}>
                Ön Sınava Git
              </button>
            ) : finalPassed ? (
              <button disabled style={{ ...successButton, opacity: 0.95 }}>
                Eğitim Başarılı
              </button>
            ) : canTakeFinalExam ? (
              <button onClick={() => router.push(`/portal/training/${assignmentId}/final-exam`)} style={successButton}>
                Final Sınavına Gir
              </button>
            ) : (
              <button disabled style={disabledButton}>
                Final Kilitli
              </button>
            )}

            {finalPassed ? (
              <>
                <button onClick={openCertificate} style={purpleButton}>Sertifika</button>
                <button onClick={openAttendance} style={tealButton}>Katılım Formu</button>
              </>
            ) : resetRequired || (showFinalScore && finalScore !== null && !finalPassed) ? (
              <button onClick={openAttendance} style={dangerButton}>Başarısız Katılım Formu</button>
            ) : null}

            <button onClick={() => router.push("/portal/training")} style={darkButton}>
              Eğitim Listesine Dön
            </button>
          </div>
        </div>
      </div>

      {showPresencePopup ? (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginTop: 0 }}>Ekran başı doğrulaması</h3>
            <p style={{ color: "#4b5563", lineHeight: 1.7 }}>
              Eğitime aktif devam ettiğinizi doğrulamak için onay vermeniz gerekir.
              Onay verilmeden video devam etmez.
            </p>

            <button
              onClick={async () => {
                const player = videoRef.current;
                const currentSecond = Math.floor(player?.currentTime || effectiveWatchSeconds || 0);
                const newCount = clickCount + 1;

                maxReachedRef.current = Math.max(maxReachedRef.current, currentSecond);
                setMaxReachedTime((prev) => Math.max(prev, currentSecond));
                setClickCount(newCount);
                setCheckpointIndex((prev) => prev + 1);
                setShowPresencePopup(false);

                try {
                  await saveVideoProgress("presence", currentSecond, Math.floor(videoDuration || 0));
                  await fetchVideos();
                } catch (err) {
                  console.error("presence save error:", err);
                }

                requestAnimationFrame(() => {
                  player?.play().catch(() => undefined);
                });
              }}
              style={primaryButton}
            >
              Ekrandayım, Devam Et
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Badge({
  text,
  green,
  danger,
  orange,
}: {
  text: string;
  green?: boolean;
  danger?: boolean;
  orange?: boolean;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        padding: "8px 12px",
        borderRadius: 999,
        background: green ? "#dcfce7" : danger ? "#fef2f2" : orange ? "#fff7ed" : "#f9fafb",
        border: green ? "1px solid #86efac" : danger ? "1px solid #fecaca" : orange ? "1px solid #fdba74" : "1px solid #e5e7eb",
        color: green ? "#166534" : danger ? "#991b1b" : orange ? "#9a3412" : "#374151",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {text}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: "#6b7280", marginBottom: 6 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Warning({ text }: { text: string }) {
  return (
    <div
      style={{
        marginTop: 16,
        padding: "12px 14px",
        borderRadius: 10,
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#991b1b",
        lineHeight: 1.6,
      }}
    >
      {text}
    </div>
  );
}

const primaryButton = {
  padding: "12px 20px",
  background: "#2563eb",
  color: "#fff",
  borderRadius: 10,
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
};

const successButton = {
  ...primaryButton,
  background: "#16a34a",
};

const disabledButton = {
  ...primaryButton,
  background: "#9ca3af",
  cursor: "not-allowed",
  opacity: 0.9,
};

const purpleButton = {
  ...primaryButton,
  background: "#7c3aed",
};

const tealButton = {
  ...primaryButton,
  background: "#0f766e",
};

const dangerButton = {
  ...primaryButton,
  background: "#b91c1c",
};

const darkButton = {
  ...primaryButton,
  background: "#111827",
};

const modalOverlay = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: 20,
};

const modalBox = {
  background: "#ffffff",
  maxWidth: 460,
  width: "100%",
  borderRadius: 18,
  padding: 28,
  textAlign: "center" as const,
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
};
