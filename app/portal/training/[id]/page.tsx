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
  training_repeat_count?: number | null;
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

function normalizeFinalScore(score?: number | null) {
  if (score === null || score === undefined) return null;

  const numeric = Number(score);
  if (!Number.isFinite(numeric)) return null;

  const clamped = Math.max(0, Math.min(100, numeric));

  return Math.round(clamped / 10) * 10;
}

function shouldShowFinalScore(params: {
  final_exam_score?: number | null;
  final_exam_attempts?: number | null;
  final_exam_passed?: boolean | null;
  status?: TrainingStatus;
}) {
  const attempts = Number(params.final_exam_attempts || 0);
  const passed = params.final_exam_passed === true;
  const completed = params.status === "completed";
  const hasRawScore =
    params.final_exam_score !== null && params.final_exam_score !== undefined;

  if (!hasRawScore) return false;

  return attempts > 0 || passed || completed;
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

function formatSeconds(total: number) {
  const safe = Math.max(0, Math.floor(total));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes} dk ${String(seconds).padStart(2, "0")} sn`;
}

function isYoutubeUrl(url: string) {
  const safe = (url || "").toLowerCase();
  return safe.includes("youtube.com/watch") || safe.includes("youtu.be/");
}

function inferVideoMimeType(url: string) {
  const safe = (url || "").toLowerCase().split("?")[0];
  if (safe.endsWith(".webm")) return "video/webm";
  if (safe.endsWith(".ogg")) return "video/ogg";
  if (safe.endsWith(".mov")) return "video/mp4";
  if (safe.endsWith(".m3u8")) return "application/x-mpegURL";
  return "video/mp4";
}

function LoadingShell() {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "18px",
        padding: "24px",
        boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          height: "34px",
          width: "55%",
          borderRadius: "10px",
          background: "#f3f4f6",
          marginBottom: "16px",
        }}
      />
      <div
        style={{
          height: "15px",
          width: "100%",
          borderRadius: "8px",
          background: "#f3f4f6",
          marginBottom: "10px",
        }}
      />
      <div
        style={{
          height: "15px",
          width: "88%",
          borderRadius: "8px",
          background: "#f3f4f6",
          marginBottom: "16px",
        }}
      />
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: "34px",
              width:
                i === 1 ? "110px" : i === 2 ? "160px" : i === 3 ? "160px" : "140px",
              borderRadius: "999px",
              background: "#f3f4f6",
            }}
          />
        ))}
      </div>
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: "16px",
          background: "#e5e7eb",
        }}
      />
    </div>
  );
}

export default function TrainingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;

  const completeTrainingFlow = async (
    finalWatchSeconds: number,
    finalClicks: number
  ) => {
    await fetch("/api/training/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assignmentId,
        watchSeconds: finalWatchSeconds,
        clickCount: finalClicks,
        completed: true,
      }),
    });

    await fetch("/api/training/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assignmentId,
        action: "mark_watched",
        currentSecond: finalWatchSeconds,
        duration: finalWatchSeconds,
      }),
    });

    await fetch("/api/training/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assignmentId,
        action: "complete",
        currentSecond: finalWatchSeconds,
        duration: finalWatchSeconds,
      }),
    });

    try {
      localStorage.setItem(
        `training_watch_${assignmentId}`,
        String(finalWatchSeconds)
      );
      localStorage.setItem(
        `training_click_${assignmentId}`,
        String(finalClicks)
      );
    } catch {}
  };

  const clearLocalProgress = () => {
    try {
      localStorage.removeItem(`training_watch_${assignmentId}`);
      localStorage.removeItem(`training_click_${assignmentId}`);
      localStorage.removeItem(`preExamScore_${assignmentId}`);
      localStorage.removeItem(`preExamCompleted_${assignmentId}`);
    } catch {}
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const maxReachedRef = useRef(0);
  const lastAllowedTimeRef = useRef(0);
  const isProgrammaticSeekRef = useRef(false);
  const blockSeekRef = useRef(false);

  const [training, setTraining] = useState<TrainingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressSaved, setProgressSaved] = useState(false);

  const [videoDuration, setVideoDuration] = useState(0);
  const [maxReachedTime, setMaxReachedTime] = useState(0);
  const [showPresencePopup, setShowPresencePopup] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [requiredClicks, setRequiredClicks] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [playbackReady, setPlaybackReady] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState("");

  const [checkpointIndex, setCheckpointIndex] = useState(0);
  const checkpointsRef = useRef<number[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [assignmentId]);

  const fetchTraining = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/training/my", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        setError(`API hata verdi: ${res.status}`);
        setTraining(null);
        return;
      }

      const json = await res.json();

      if (!json || !json.data) {
        setError("Eğitim verisi bulunamadı.");
        setTraining(null);
        return;
      }

      const found = Array.isArray(json.data)
        ? json.data.find((item: TrainingDetail) => item.id === assignmentId)
        : null;

      if (!found) {
        setError("Eğitim kaydı bulunamadı.");
        setTraining(null);
        return;
      }

      const shouldForceFreshStart =
        found.training_reset_required === true ||
        found.pre_exam_completed !== true ||
        (Number(found.watch_seconds || 0) <= 0 &&
          Number(found.click_count || 0) <= 0 &&
          found.watch_completed !== true &&
          found.final_exam_passed !== true);

      if (shouldForceFreshStart) {
        clearLocalProgress();
      }

      const localWatch = shouldForceFreshStart
        ? 0
        : Number(
            typeof window !== "undefined"
              ? localStorage.getItem(`training_watch_${assignmentId}`) || 0
              : 0
          );

      const localClicks = shouldForceFreshStart
        ? 0
        : Number(
            typeof window !== "undefined"
              ? localStorage.getItem(`training_click_${assignmentId}`) || 0
              : 0
          );

      const dbWatch = shouldForceFreshStart
        ? Number(found.watch_seconds || 0)
        : Math.max(Number(found.watch_seconds || 0), localWatch);

      const dbClicks = shouldForceFreshStart
        ? Number(found.click_count || 0)
        : Math.max(Number(found.click_count || 0), localClicks);

      const dbCompleted = found.watch_completed === true;

      setTraining(found);
      setMaxReachedTime(Math.max(0, dbWatch));
      maxReachedRef.current = Math.max(0, dbWatch);
      setClickCount(Math.max(0, dbClicks));
      setCheckpointIndex(Math.max(0, dbClicks));
      setVideoCompleted(dbCompleted);
      setProgressSaved(dbCompleted);
      setVideoLoadError("");

      if (shouldForceFreshStart && videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    } catch (err) {
      console.error("training detail fetch hatası:", err);
      setError("Bağlantı hatası oluştu.");
      setTraining(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!assignmentId) return;

    const initTraining = async () => {
      try {
        await fetch("/api/training/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignmentId,
            action: "open",
            currentSecond: 0,
            duration: 0,
          }),
        });
      } catch (err) {
        console.error("training open error:", err);
      }

      await fetchTraining();
    };

    void initTraining();
  }, [assignmentId]);

  const trainingType = useMemo(
    () => normalizeType(training?.training?.type),
    [training?.training?.type]
  );

  const contentUrl = training?.training?.content_url || "";
  const nativeVideo = isNativeVideoUrl(contentUrl);
  const isAsync = trainingType === "asenkron";
  const isSync = trainingType === "senkron";
  const youtubeVideo = isYoutubeUrl(contentUrl);
  const canTryNativeVideo = nativeVideo && !youtubeVideo;

  const resetRequired = training?.training_reset_required === true;
  const repeatCount = Math.max(0, Number(training?.training_repeat_count || 0));
  const serverFinalAttempts = Number(training?.final_exam_attempts || 0);
  const finalAttemptsLeft = resetRequired
    ? 3
    : Math.max(0, 3 - serverFinalAttempts);

  const finalScore = normalizeFinalScore(training?.final_exam_score);
  const showFinalScore = shouldShowFinalScore({
    final_exam_score: training?.final_exam_score,
    final_exam_attempts: training?.final_exam_attempts,
    final_exam_passed: training?.final_exam_passed,
    status: training?.status,
  });

  const preExamCompleted = training?.pre_exam_completed === true;
  const finalPassed = training?.final_exam_passed === true;

  useEffect(() => {
    if (videoDuration > 0) {
      const arr: number[] = [];
      for (let sec = 90; sec < videoDuration; sec += 90) {
        arr.push(sec);
      }
      checkpointsRef.current = arr;
      setRequiredClicks(arr.length);
    } else {
      checkpointsRef.current = [];
      setRequiredClicks(0);
    }
  }, [videoDuration]);

  const handleLoadedMetadata = () => {
    const player = videoRef.current;
    if (!player) return;

    const duration = Math.floor(player.duration || 0);
    setVideoDuration(duration);

    const shouldResume =
      preExamCompleted &&
      !resetRequired &&
      maxReachedRef.current > 0 &&
      maxReachedRef.current < duration;

    if (shouldResume) {
      const safeResume = Math.floor(maxReachedRef.current);
      isProgrammaticSeekRef.current = true;
      player.currentTime = safeResume;
      maxReachedRef.current = safeResume;
      lastAllowedTimeRef.current = safeResume;
      setMaxReachedTime(safeResume);
    } else {
      isProgrammaticSeekRef.current = true;
      player.currentTime = 0;
      maxReachedRef.current = 0;
      lastAllowedTimeRef.current = 0;
      setMaxReachedTime(0);
    }

    player.playbackRate = 1;

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
    const allowedForwardGap = 1.2;

    if (!isProgrammaticSeekRef.current && current > prevMax + allowedForwardGap) {
      blockSeekRef.current = true;
      player.pause();
      isProgrammaticSeekRef.current = true;
      player.currentTime = prevMax;
      return;
    }

    if (current >= prevMax && current <= prevMax + allowedForwardGap) {
      maxReachedRef.current = current;
      lastAllowedTimeRef.current = current;
      setMaxReachedTime(flooredCurrent);

      try {
        localStorage.setItem(
          `training_watch_${assignmentId}`,
          String(flooredCurrent)
        );
      } catch {}

      if (flooredCurrent > 0 && flooredCurrent % 15 === 0) {
        fetch("/api/training/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignmentId,
            action: "heartbeat",
            currentSecond: flooredCurrent,
            duration: Math.floor(videoDuration || 0),
          }),
        }).catch((err) => {
          console.error("training heartbeat error:", err);
        });
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
      return;
    }

    lastAllowedTimeRef.current = current;
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

  const actualAsyncVideoCompleted =
    isAsync &&
    preExamCompleted &&
    !resetRequired &&
    !videoLoadError &&
    canTryNativeVideo &&
    videoDuration > 0 &&
    effectiveWatchSeconds >= Math.max(Math.floor(videoDuration), 1) &&
    effectiveClickCount >= requiredClicks;

  const serverAsyncVideoCompleted =
    !resetRequired && training?.watch_completed === true;

  const videoWatchCompleted =
    finalPassed || actualAsyncVideoCompleted || serverAsyncVideoCompleted;

  const trainingCompleted = finalPassed;
  const canShowCompletedState =
    !finalPassed && !resetRequired && videoWatchCompleted;

  useEffect(() => {
    setVideoCompleted(actualAsyncVideoCompleted || serverAsyncVideoCompleted);
  }, [actualAsyncVideoCompleted, serverAsyncVideoCompleted]);

  const progressPercent =
    videoDuration > 0
      ? Math.min(100, Math.round((effectiveWatchSeconds / videoDuration) * 100))
      : 0;

  useEffect(() => {
    if (!assignmentId) return;
    if (progressSaved) return;
    if (videoDuration <= 0) return;
    if (!actualAsyncVideoCompleted) return;

    const saveProgress = async () => {
      try {
        await completeTrainingFlow(
          Math.floor(videoDuration),
          effectiveClickCount
        );

        setProgressSaved(true);
        await fetchTraining();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        console.error("training progress save error:", err);
      }
    };

    void saveProgress();
  }, [
    assignmentId,
    actualAsyncVideoCompleted,
    progressSaved,
    videoDuration,
    effectiveClickCount,
  ]);

  const canTakeFinalExam =
    !resetRequired &&
    finalAttemptsLeft > 0 &&
    !finalPassed &&
    preExamCompleted &&
    (isSync ||
      (isAsync &&
        !videoLoadError &&
        canTryNativeVideo &&
        videoWatchCompleted));

  const lockReason = useMemo(() => {
    if (resetRequired) {
      return "Bu eğitim yeniden başlatıldı. Ön sınavı tekrar tamamlayıp videoyu baştan izlemelisiniz.";
    }

    if (finalPassed) return "";
    if (!preExamCompleted) return "Ön sınav tamamlanmadan eğitime/finale ilerlenemez.";
    if (finalAttemptsLeft <= 0) return "Final hakkı bitti.";
    if (isSync) return "";
    if (!contentUrl) return "Eğitim içeriği bulunamadı.";

    if (youtubeVideo) {
      return "YouTube linkleri desteklenmiyor. Lütfen video dosyası yükleyin.";
    }

    if (videoLoadError) {
      return videoLoadError;
    }

    if (videoWatchCompleted) {
      return "";
    }

    if (effectiveClickCount < requiredClicks) {
      return "Zorunlu ekran başı onayları tamamlanmadı.";
    }

    if (effectiveWatchSeconds < Math.floor(videoDuration)) {
      return "Eğitim süresi tamamlanmadan final açılmaz.";
    }

    return "Video tamamen bitmeden final açılmaz.";
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

  useEffect(() => {
    if (videoWatchCompleted) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [videoWatchCompleted]);

  const openCertificate = () => {
    window.open(
      `/api/training/certificate/${assignmentId}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openAttendance = () => {
    window.open(
      `/api/training/attendance-certificate/${assignmentId}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (loading) {
    return (
      <main
        style={{
          padding: "40px",
          fontFamily: "Arial",
          background: "#f8fafc",
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <LoadingShell />
        </div>
      </main>
    );
  }

  if (error || !training) {
    return (
      <main
        style={{
          padding: "40px",
          fontFamily: "Arial",
          background: "#f8fafc",
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #fecaca",
              borderRadius: "18px",
              padding: "24px",
              color: "#991b1b",
            }}
          >
            <h1>Hata</h1>
            <p>{error || "Eğitim bulunamadı."}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "40px",
        fontFamily: "Arial",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
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
                background:
                  finalPassed || canShowCompletedState ? "#dcfce7" : "#eff6ff",
                border:
                  finalPassed || canShowCompletedState
                    ? "1px solid #86efac"
                    : "1px solid #bfdbfe",
                color:
                  finalPassed || canShowCompletedState ? "#166534" : "#1d4ed8",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {finalPassed
                ? "Eğitim Başarılı"
                : canShowCompletedState
                ? "Eğitim Tamamlandı"
                : "Eğitim Devam Ediyor"}
            </div>

            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: "999px",
                background: preExamCompleted ? "#eff6ff" : "#fef2f2",
                border: preExamCompleted ? "1px solid #bfdbfe" : "1px solid #fecaca",
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

            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: "999px",
                background: repeatCount > 0 ? "#fef2f2" : "#f9fafb",
                border: repeatCount > 0 ? "1px solid #fecaca" : "1px solid #e5e7eb",
                color: repeatCount > 0 ? "#991b1b" : "#374151",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              Tekrar Sayısı: {repeatCount}
            </div>

            {showFinalScore && finalScore !== null ? (
              <div
                style={{
                  display: "inline-flex",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: finalScore >= 60 ? "#dcfce7" : "#fee2e2",
                  border:
                    finalScore >= 60 ? "1px solid #86efac" : "1px solid #fca5a5",
                  color: finalScore >= 60 ? "#166534" : "#b91c1c",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                Final Puanı: {finalScore}
              </div>
            ) : null}
          </div>

          {!preExamCompleted ? (
            <div
              style={{
                marginTop: "16px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "#fff7ed",
                border: "1px solid #fdba74",
                color: "#9a3412",
                lineHeight: 1.6,
                fontWeight: 700,
              }}
            >
              Ön sınav tamamlanmadan eğitim videosu başlatılamaz.
            </div>
          ) : canShowCompletedState ? (
            <div
              style={{
                marginTop: "16px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "#f0fdf4",
                border: "1px solid #86efac",
                color: "#166534",
                fontWeight: 700,
                lineHeight: 1.6,
              }}
            >
              Eğitim videosu başarıyla tamamlandı. Final sınavına geçebilirsiniz.
            </div>
          ) : null}

          {resetRequired ? (
            <div
              style={{
                marginTop: "16px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                lineHeight: 1.6,
                fontWeight: 700,
              }}
            >
              Bu eğitim önceki final sonucu nedeniyle yeniden başlatıldı. Ön sınavı tekrar tamamlayıp eğitimi baştan almanız gerekir.
            </div>
          ) : null}

          {repeatCount > 0 && !finalPassed ? (
            <div
              style={{
                marginTop: "16px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "#fff7ed",
                border: "1px solid #fdba74",
                color: "#9a3412",
                lineHeight: 1.6,
                fontWeight: 700,
              }}
            >
              Bu eğitim şu ana kadar {repeatCount} kez tekrar alınmıştır.
            </div>
          ) : null}

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

          {!preExamCompleted ? (
            <div style={{ marginTop: "24px" }}>
              <button
                onClick={() =>
                  router.push(`/portal/training/${assignmentId}/pre-exam`)
                }
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
            </div>
          ) : isSync ? (
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
              {youtubeVideo ? (
                <div
                  style={{
                    padding: "18px",
                    borderRadius: "12px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    lineHeight: 1.6,
                  }}
                >
                  YouTube linkleri desteklenmiyor. Lütfen video dosyası yükleyin.
                </div>
              ) : nativeVideo ? (
                <>
                  <video
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
                      if (blockSeekRef.current) {
                        blockSeekRef.current = false;
                      }
                    }}
                    onRateChange={() => {
                      const player = videoRef.current;
                      if (!player) return;
                      if (player.playbackRate !== 1) {
                        player.playbackRate = 1;
                      }
                    }}
                    onEnded={async () => {
                      maxReachedRef.current = Math.max(
                        maxReachedRef.current,
                        Math.floor(videoDuration)
                      );
                      setMaxReachedTime(
                        Math.max(maxReachedRef.current, Math.floor(videoDuration))
                      );

                      try {
                        if (effectiveClickCount < requiredClicks) {
                          setVideoCompleted(false);
                          return;
                        }

                        setVideoCompleted(true);

                        const finalWatchSeconds = Math.floor(videoDuration);
                        const finalClicks = effectiveClickCount;

                        await completeTrainingFlow(finalWatchSeconds, finalClicks);

                        setProgressSaved(true);
                        await fetchTraining();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      } catch (err) {
                        console.error("video ended completion save error:", err);
                      }
                    }}
                    onError={() => {
                      setVideoLoadError(
                        "Video yüklenemedi. Dosya yolu, sunucu erişimi veya içerik tipi (Content-Type) kontrol edilmelidir."
                      );
                      setPlaybackReady(false);
                    }}
                    style={{
                      width: "100%",
                      borderRadius: "16px",
                      background: "#000",
                      pointerEvents: preExamCompleted ? "auto" : "none",
                      opacity: preExamCompleted ? 1 : 0.65,
                    }}
                  >
                    <source
                      src={contentUrl}
                      type={inferVideoMimeType(contentUrl)}
                    />
                    Tarayıcınız video oynatmayı desteklemiyor.
                  </video>

                  {videoLoadError ? (
                    <div
                      style={{
                        marginTop: "14px",
                        padding: "14px 16px",
                        borderRadius: "12px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#991b1b",
                        lineHeight: 1.6,
                      }}
                    >
                      {videoLoadError}
                    </div>
                  ) : null}
                </>
              ) : (
                <div
                  style={{
                    padding: "18px",
                    borderRadius: "12px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    lineHeight: 1.6,
                  }}
                >
                  Desteklenmeyen video formatı.
                </div>
              )}
            </div>
          ) : (
            <p style={{ marginTop: "24px", color: "#b91c1c" }}>
              Eğitim içeriği bulunamadı.
            </p>
          )}

          {!playbackReady &&
            isAsync &&
            canTryNativeVideo &&
            !videoLoadError &&
            preExamCompleted && (
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
                Video hazırlanıyor...
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
                onClick={() =>
                  router.push(`/portal/training/${assignmentId}/pre-exam`)
                }
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
            ) : finalPassed ? (
              <button
                disabled
                style={{
                  padding: "12px 20px",
                  background: "#16a34a",
                  color: "#fff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  opacity: 0.95,
                }}
              >
                Eğitim Başarılı
              </button>
            ) : canTakeFinalExam ? (
              <button
                onClick={() =>
                  router.push(`/portal/training/${assignmentId}/final-exam`)
                }
                style={{
                  padding: "12px 20px",
                  background: "#16a34a",
                  color: "#fff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Final Sınavına Gir
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

            {finalPassed ? (
              <>
                <button
                  onClick={openCertificate}
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
                  Sertifika
                </button>

                <button
                  onClick={openAttendance}
                  style={{
                    padding: "12px 20px",
                    background: "#0f766e",
                    color: "#fff",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Katılım Formu
                </button>
              </>
            ) : resetRequired || (showFinalScore && finalScore !== null && !finalPassed) ? (
              <button
                onClick={openAttendance}
                style={{
                  padding: "12px 20px",
                  background: "#b91c1c",
                  color: "#fff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Başarısız Katılım Formu
              </button>
            ) : null}

            <button
              onClick={() => router.push("/portal/training")}
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
              Ekran başı doğrulaması
            </h3>
            <p style={{ color: "#4b5563", lineHeight: 1.7 }}>
              Eğitime aktif devam ettiğinizi doğrulamak için onay vermeniz gerekir.
              Onay verilmeden video devam etmez.
            </p>

            <button
              onClick={async () => {
                const player = videoRef.current;
                const currentSecond = Math.floor(
                  player?.currentTime || effectiveWatchSeconds || 0
                );
                const newCount = clickCount + 1;

                maxReachedRef.current = Math.max(maxReachedRef.current, currentSecond);
                setMaxReachedTime(Math.max(maxReachedTime, currentSecond));
                setClickCount(newCount);
                setShowPresencePopup(false);
                setCheckpointIndex((prev) => prev + 1);

                try {
                  localStorage.setItem(
                    `training_watch_${assignmentId}`,
                    String(currentSecond)
                  );
                  localStorage.setItem(
                    `training_click_${assignmentId}`,
                    String(newCount)
                  );
                } catch {}

                try {
                  const res = await fetch("/api/training/progress", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      assignmentId,
                      watchSeconds: currentSecond,
                      clickCount: newCount,
                      completed: false,
                    }),
                  });

                  await fetch("/api/training/update", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      assignmentId,
                      action: "heartbeat",
                      currentSecond,
                      duration: Math.floor(videoDuration || 0),
                    }),
                  });

                  if (res.ok) {
                    const json = await res.json();

                    if (typeof json?.watch_seconds === "number") {
                      maxReachedRef.current = Math.max(
                        maxReachedRef.current,
                        Math.floor(json.watch_seconds)
                      );
                      setMaxReachedTime((prev) =>
                        Math.max(prev, Math.floor(json.watch_seconds))
                      );
                    }
                  }
                } catch (err) {
                  console.error("presence save error:", err);
                }

                requestAnimationFrame(() => {
                  player?.play().catch(() => undefined);
                });
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
