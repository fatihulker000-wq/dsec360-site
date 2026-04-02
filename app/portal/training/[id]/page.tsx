"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

type TrainingStatus = "not_started" | "in_progress" | "completed";

type TrainingDetail = {
  id: string;
  status: TrainingStatus;
  watch_completed?: boolean;
  started_at?: string | null;
  completed_at?: string | null;
  training?: {
    id: string;
    title?: string;
    description?: string;
    content_url?: string;
    type?: string;
  } | null;
};

const CHECKPOINT_SECONDS = 30;
const HEARTBEAT_SECONDS = 15;

function extractYouTubeId(url?: string) {
  if (!url) return null;

  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#/]+)/,
    /youtube\.com\/embed\/([^?&#/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function normalizeType(type?: string | null) {
  const value = (type || "").trim().toLowerCase();

  if (value === "senkron") return "senkron";
  if (value === "asenkron") return "asenkron";

  return "asenkron";
}


function isDirectVideoUrl(url?: string | null) {
  if (!url) return false;

  const normalized = url.toLowerCase().split("?")[0].split("#")[0];

  return (
    normalized.endsWith(".mp4") ||
    normalized.endsWith(".webm") ||
    normalized.endsWith(".ogg") ||
    normalized.endsWith(".mov") ||
    normalized.endsWith(".m4v")
  );
}

export default function TrainingPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;

  const [training, setTraining] = useState<TrainingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchCompleted, setWatchCompleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [playerError, setPlayerError] = useState("");

  const [videoDuration, setVideoDuration] = useState(0);
  const [currentSecond, setCurrentSecond] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [attentionOpen, setAttentionOpen] = useState(false);
  const [attentionReason, setAttentionReason] = useState(
    "Eğitimi izlediğini doğrulaman gerekiyor."
  );
  const [attentionCount, setAttentionCount] = useState(0);

  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const htmlVideoRef = useRef<HTMLVideoElement | null>(null);
const playerRef = useRef<any>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextCheckpointRef = useRef(CHECKPOINT_SECONDS);
  const completingRef = useRef(false);
  const openingMarkedRef = useRef(false);
  const blurCooldownRef = useRef(false);

 const activeTraining = training?.training || null;
const normalizedType = normalizeType(activeTraining?.type);
const contentUrl = activeTraining?.content_url || "";
const youtubeVideoId = extractYouTubeId(contentUrl);
const supportsDirectVideo = isDirectVideoUrl(contentUrl);

const isYouTubeTraining =
  normalizedType === "asenkron" && Boolean(youtubeVideoId);

const isDirectVideoTraining =
  normalizedType === "asenkron" && !youtubeVideoId && supportsDirectVideo;

const isSyncTraining = normalizedType === "senkron";

  const stopProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const stopHeartbeatTimer = () => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  };

  const destroyYouTubePlayer = () => {
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (err) {
        console.error(err);
      } finally {
        playerRef.current = null;
      }
    }
  };

  const sendHeartbeat = async () => {
    try {
      await fetch("/api/training/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId,
          action: "heartbeat",
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const markOpenIfNeeded = async () => {
    if (openingMarkedRef.current) return;

    openingMarkedRef.current = true;

    try {
      const res = await fetch("/api/training/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId,
          action: "open",
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        console.error("Open hatası:", json);
      } else {
        await fetchTraining();
      }
    } catch (err) {
      console.error(err);
    }
  };

 const pauseVideoForAttention = (reason: string) => {
  setAttentionReason(reason);
  setAttentionOpen(true);
  setIsPlaying(false);

  stopProgressTimer();
  stopHeartbeatTimer();

  try {
    if (playerRef.current?.pauseVideo) {
      playerRef.current.pauseVideo();
    }
  } catch (err) {
    console.error(err);
  }

  try {
    if (htmlVideoRef.current) {
      htmlVideoRef.current.pause();
    }
  } catch (err) {
    console.error(err);
  }
};


  const fetchTraining = async () => {
    try {
      setError("");

      const res = await fetch("/api/training/my", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Eğitim alınamadı.");
        setTraining(null);
        return;
      }

      const found = (data.data || []).find(
        (item: TrainingDetail) => item.id === assignmentId
      );

      if (!found) {
        setError("Eğitim kaydı bulunamadı.");
        setTraining(null);
        return;
      }

      setTraining(found);
      setWatchCompleted(Boolean(found.watch_completed));
    } catch (err) {
      console.error(err);
      setError("Bağlantı hatası oluştu.");
      setTraining(null);
    } finally {
      setLoading(false);
    }
  };

  const finalizeTraining = async () => {
    if (completingRef.current) return;

    try {
      completingRef.current = true;
      setBusy(true);

      const markWatchedRes = await fetch("/api/training/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId,
          action: "mark_watched",
        }),
      });

      const markWatchedJson = await markWatchedRes.json();

      if (!markWatchedRes.ok) {
        alert(markWatchedJson?.error || "İzleme tamamlanamadı.");
        return;
      }

      setWatchCompleted(true);

      const completeRes = await fetch("/api/training/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId,
          action: "complete",
        }),
      });

      const completeJson = await completeRes.json();

      if (!completeRes.ok) {
        alert(completeJson?.error || "Eğitim tamamlanamadı.");
        return;
      }

      alert(
        "Eğitim otomatik olarak tamamlandı. Sertifika ve katılım belgesi artık aktif."
      );
      router.push("/portal/training");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Tamamlama sırasında hata oluştu.");
    } finally {
      setBusy(false);
      completingRef.current = false;
    }
  };

  const markOpenForSyncTraining = async () => {
    try {
      const res = await fetch("/api/training/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId,
          action: "open",
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        console.error("Senkron eğitim open hatası:", json);
      } else {
        await fetchTraining();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!assignmentId) return;
    fetchTraining();
  }, [assignmentId]);

  useEffect(() => {
    if (
      !assignmentId ||
      !contentUrl ||
      !isYouTubeTraining ||
      !playerContainerRef.current
    ) {
      destroyYouTubePlayer();
      return;
    }

    const initPlayer = () => {
      if (
        !window.YT ||
        !window.YT.Player ||
        !playerContainerRef.current ||
        !youtubeVideoId
      ) {
        return;
      }

      destroyYouTubePlayer();
      setPlayerError("");

      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId: youtubeVideoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            try {
              const duration = Number(playerRef.current?.getDuration?.() || 0);
              setVideoDuration(duration);
            } catch (err) {
              console.error(err);
            }
          },

          onStateChange: async (event: any) => {
            const playerState = event?.data;

            if (playerState === 1) {
              setIsPlaying(true);
              setAttentionOpen(false);
              await markOpenIfNeeded();

              if (!progressTimerRef.current) {
                progressTimerRef.current = setInterval(() => {
                  try {
                    const current = Number(
                      playerRef.current?.getCurrentTime?.() || 0
                    );
                    const duration = Number(
                      playerRef.current?.getDuration?.() || 0
                    );

                    setCurrentSecond(current);

                    if (duration > 0) {
                      setVideoDuration(duration);
                    }

                    if (
                      current >= nextCheckpointRef.current &&
                      !watchCompleted
                    ) {
                      nextCheckpointRef.current += CHECKPOINT_SECONDS;
                      pauseVideoForAttention(
                        "Devam etmek için ekranda olduğunu onayla."
                      );
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }, 1000);
              }

              if (!heartbeatTimerRef.current) {
                heartbeatTimerRef.current = setInterval(() => {
                  void sendHeartbeat();
                }, HEARTBEAT_SECONDS * 1000);
              }
            }

            if (playerState === 2) {
              setIsPlaying(false);
              stopProgressTimer();
              stopHeartbeatTimer();
            }

            if (playerState === 0) {
              setIsPlaying(false);
              stopProgressTimer();
              stopHeartbeatTimer();
              setCurrentSecond(videoDuration || currentSecond || 0);
              await finalizeTraining();
            }
          },

          onError: (event: any) => {
            console.error("YouTube player error:", event?.data);
            setPlayerError(
              "Bu YouTube videosu gömülü oynatmaya izin vermiyor olabilir. Aşağıdaki bağlantıdan açmayı deneyin."
            );
            setIsPlaying(false);
            stopProgressTimer();
            stopHeartbeatTimer();
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const scriptId = "youtube-iframe-api-script";
      let script = document.getElementById(
        scriptId
      ) as HTMLScriptElement | null;

      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }

      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      stopProgressTimer();
      stopHeartbeatTimer();
      destroyYouTubePlayer();
    };
  }, [
    assignmentId,
    contentUrl,
    isYouTubeTraining,
    youtubeVideoId,
    watchCompleted,
   ]);

 useEffect(() => {
  if (!isDirectVideoTraining || !htmlVideoRef.current) return;

  const video = htmlVideoRef.current;

  const handleLoadedMetadata = () => {
    const duration = Number(video.duration || 0);
    if (duration > 0) {
      setVideoDuration(duration);
    }
  };

  const handlePlay = async () => {
    setIsPlaying(true);
    setAttentionOpen(false);

    if (!openingMarkedRef.current) {
      openingMarkedRef.current = true;

      try {
        const res = await fetch("/api/training/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignmentId,
            action: "open",
          }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          console.error("Direct video open hatası:", json);
        } else {
          await fetchTraining();
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!progressTimerRef.current) {
      progressTimerRef.current = setInterval(() => {
        try {
          const current = Number(video.currentTime || 0);
          const duration = Number(video.duration || 0);

          setCurrentSecond(current);

          if (duration > 0) {
            setVideoDuration(duration);
          }

          if (current >= nextCheckpointRef.current && !watchCompleted) {
            nextCheckpointRef.current += CHECKPOINT_SECONDS;
            pauseVideoForAttention(
              "Devam etmek için ekranda olduğunu onayla."
            );
          }
        } catch (err) {
          console.error(err);
        }
      }, 1000);
    }

    if (!heartbeatTimerRef.current) {
      heartbeatTimerRef.current = setInterval(() => {
        void sendHeartbeat();
      }, HEARTBEAT_SECONDS * 1000);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    stopProgressTimer();
    stopHeartbeatTimer();
  };

  const handleEnded = async () => {
    setIsPlaying(false);
    stopProgressTimer();
    stopHeartbeatTimer();
    setCurrentSecond(Number(video.duration || 0));
    await finalizeTraining();
  };

  video.addEventListener("loadedmetadata", handleLoadedMetadata);
  video.addEventListener("play", handlePlay);
  video.addEventListener("pause", handlePause);
  video.addEventListener("ended", handleEnded);

  return () => {
    video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    video.removeEventListener("play", handlePlay);
    video.removeEventListener("pause", handlePause);
    video.removeEventListener("ended", handleEnded);
  };
}, [isDirectVideoTraining, watchCompleted, assignmentId]);

  useEffect(() => {
    if (!isSyncTraining || openingMarkedRef.current) return;

    openingMarkedRef.current = true;
    void markOpenForSyncTraining();
  }, [isSyncTraining]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isPlaying && !watchCompleted) {
        pauseVideoForAttention(
          "Sekmeden ayrıldığın için video durduruldu. Devam etmek için onay ver."
        );
      }
    };

    const handleBlur = () => {
      if (blurCooldownRef.current) return;
      blurCooldownRef.current = true;

      setTimeout(() => {
        blurCooldownRef.current = false;
      }, 800);

      if (isPlaying && !watchCompleted) {
        pauseVideoForAttention(
          "Eğitim sırasında ekranda kalman gerekiyor. Devam etmek için onay ver."
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isPlaying, watchCompleted]);

  const progressPercent = useMemo(() => {
    if (training?.status === "completed" || watchCompleted) return 100;
    if (videoDuration > 0) {
      return Math.min(100, Math.round((currentSecond / videoDuration) * 100));
    }
    if (training?.status === "in_progress") return 1;
    return 0;
  }, [training?.status, watchCompleted, currentSecond, videoDuration]);

  const remainingSeconds = useMemo(() => {
    if (videoDuration <= 0) return 0;
    return Math.max(0, Math.floor(videoDuration - currentSecond));
  }, [videoDuration, currentSecond]);

  const confirmAttention = () => {
  setAttentionOpen(false);
  setAttentionCount((prev) => prev + 1);

  try {
    if (playerRef.current?.playVideo) {
      playerRef.current.playVideo();
    }
  } catch (err) {
    console.error(err);
  }

  try {
    if (htmlVideoRef.current) {
      void htmlVideoRef.current.play();
    }
  } catch (err) {
    console.error(err);
  }
};


  if (loading) {
    return (
      <main className="page-container" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="card">Yükleniyor...</div>
      </main>
    );
  }

  if (error || !training) {
    return (
      <main className="page-container" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="card">
          <h3 className="card-title">Hata</h3>
          <p className="card-text">{error || "Eğitim bulunamadı."}</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC Eğitim Oynatıcı</div>
          <h1 className="hero-title">{activeTraining?.title || "Eğitim"}</h1>
          <p className="hero-desc">
            Eğitim sırasında ekranda kalmalı, doğrulama uyarılarını onaylamalı ve videoyu %100 bitirmelisin.
          </p>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "18px",
              marginBottom: "24px",
            }}
          >
            <div className="card">
              <div style={{ fontSize: "13px", color: "#6b7280" }}>İlerleme</div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                %{progressPercent}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: "13px", color: "#1d4ed8" }}>Onay Sayısı</div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                {attentionCount}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: "13px", color: "#92400e" }}>Geçen Süre</div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                {formatDuration(currentSecond)}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: "13px", color: "#166534" }}>Kalan Süre</div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                {formatDuration(remainingSeconds)}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 className="card-title" style={{ marginBottom: 12 }}>
              Eğitim İçeriği
            </h3>
            <p className="card-text" style={{ marginTop: 0 }}>
              {activeTraining?.description || "Açıklama bulunmuyor."}
            </p>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div
              style={{
                marginBottom: "14px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  fontSize: "12px",
                  fontWeight: 800,
                }}
              >
                Aktif İzleme Koruması Açık
              </div>

              <div
                style={{
                  display: "inline-flex",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  color: "#374151",
                  fontSize: "12px",
                  fontWeight: 800,
                }}
              >
                Eğitim Türü: {normalizedType}
              </div>
            </div>

 {isYouTubeTraining ? (
  <>
    <div
      ref={playerContainerRef}
      style={{
        width: "100%",
        minHeight: "420px",
        borderRadius: "16px",
        overflow: "hidden",
        background: "#000",
      }}
    />

    {playerError ? (
      <div
        style={{
          marginTop: "14px",
          padding: "14px 16px",
          borderRadius: "14px",
          background: "#fff7ed",
          border: "1px solid #fdba74",
          color: "#9a3412",
          fontSize: "14px",
          lineHeight: 1.7,
        }}
      >
        {playerError}
        <div style={{ marginTop: "10px" }}>
          <a
            href={contentUrl}
            target="_blank"
            rel="noreferrer"
            className="cbs-button"
            style={{
              background: "#ea580c",
              textDecoration: "none",
            }}
          >
            YouTube’da Aç
          </a>
        </div>
      </div>
    ) : null}
  </>
) : isDirectVideoTraining ? (
  <>
    <video
      ref={htmlVideoRef}
      controls
      controlsList="nodownload"
      playsInline
      preload="metadata"
      style={{
        width: "100%",
        minHeight: "420px",
        borderRadius: "16px",
        background: "#000",
      }}
    >
      <source src={contentUrl} />
      Tarayıcı bu video biçimini desteklemiyor.
    </video>

    {playerError ? (
      <div
        style={{
          marginTop: "14px",
          padding: "14px 16px",
          borderRadius: "14px",
          background: "#fff7ed",
          border: "1px solid #fdba74",
          color: "#9a3412",
          fontSize: "14px",
          lineHeight: 1.7,
        }}
      >
        {playerError}
        <div style={{ marginTop: "10px" }}>
          <a
            href={contentUrl}
            target="_blank"
            rel="noreferrer"
            className="cbs-button"
            style={{
              background: "#ea580c",
              textDecoration: "none",
            }}
          >
            Videoyu Yeni Sekmede Aç
          </a>
        </div>
      </div>
    ) : null}
  </>
) : isSyncTraining ? (
              <div
                style={{
                  width: "100%",
                  minHeight: "320px",
                  borderRadius: "16px",
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "32px 20px",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    color: "#b91c1c",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  Canlı Eğitim Linki
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: "28px",
                    fontWeight: 900,
                    color: "#111827",
                  }}
                >
                  Senkron Eğitim
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: "#4b5563",
                    lineHeight: 1.7,
                    maxWidth: "680px",
                  }}
                >
                  Bu eğitim canlı bağlantı ile yürütülür. Aşağıdaki butondan toplantı bağlantısını yeni sekmede açabilirsin.
                </p>

                {contentUrl ? (
                  <a
                    href={contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="cbs-button"
                    style={{
                      background: "#2563eb",
                      textDecoration: "none",
                    }}
                  >
                    Canlı Eğitime Katıl
                  </a>
                ) : (
                  <div
                    style={{
                      color: "#b91c1c",
                      fontWeight: 700,
                    }}
                  >
                    Canlı eğitim linki bulunamadı.
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  minHeight: "320px",
                  borderRadius: "16px",
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6b7280",
                  textAlign: "center",
                  padding: "24px",
                }}
              >
                Bu eğitim için oynatılabilir içerik bulunamadı.
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#374151",
                marginBottom: "10px",
              }}
            >
              Eğitim İlerlemesi
            </div>

            <div
              style={{
                width: "100%",
                height: "14px",
                background: "#e5e7eb",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: progressPercent === 100 ? "#16a34a" : "#f59e0b",
                  transition: "width 0.25s ease",
                }}
              />
            </div>

            <div
              style={{
                marginTop: "10px",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              {progressPercent === 100
                ? "Video tamamlandı. Eğitim otomatik olarak kapatılıyor..."
                : "Video devam ederken ara ara onay vermen gerekir. Sekmeden ayrılırsan video durur."}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 className="card-title" style={{ marginBottom: 12 }}>
              Kurallar
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: "18px",
                color: "#4b5563",
                lineHeight: 1.8,
                fontSize: "14px",
              }}
            >
              <li>Video açılınca eğitim otomatik başlar.</li>
              <li>Belirli aralıklarda “İzliyorum” onayı vermelisin.</li>
              <li>Sekme değiştirirsen veya başka pencereye geçersen video durur.</li>
              <li>Aktif izleme sırasında sistem arka planda heartbeat kaydı tutar.</li>
              <li>YouTube ve direkt video içerikleri bitince eğitim otomatik tamamlanır.</li>
              <li>Tamamlanan eğitimlerde sertifika ve katılım belgesi aktif olur.</li>
            </ul>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/portal/training"
              className="cbs-button"
              style={{
                background: "#111827",
                textDecoration: "none",
              }}
            >
              Listeye Dön
            </a>

            {isSyncTraining && training.status !== "completed" && (
              <button
                type="button"
                className="cbs-button"
                style={{ background: "#16a34a" }}
                onClick={async () => {
                  await finalizeTraining();
                }}
                disabled={busy}
              >
                {busy ? "Tamamlanıyor..." : "Senkron Eğitimi Tamamla"}
              </button>
            )}
          </div>
        </div>
      </section>

      {attentionOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.62)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              background: "#ffffff",
              borderRadius: "22px",
              padding: "24px",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.20)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: "999px",
                background: "#fef3c7",
                border: "1px solid #fcd34d",
                color: "#92400e",
                fontSize: "12px",
                fontWeight: 800,
                marginBottom: "14px",
              }}
            >
              İzleme Doğrulaması
            </div>

            <h3
              style={{
                fontSize: "26px",
                fontWeight: 900,
                color: "#111827",
                margin: 0,
              }}
            >
              Devam etmek için onay ver
            </h3>

            <p
              style={{
                marginTop: "12px",
                color: "#4b5563",
                lineHeight: 1.7,
                fontSize: "15px",
              }}
            >
              {attentionReason}
            </p>

            <button
              type="button"
              onClick={confirmAttention}
              style={{
                marginTop: "14px",
                border: "none",
                borderRadius: "14px",
                background: "#16a34a",
                color: "#ffffff",
                padding: "14px 22px",
                fontSize: "15px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              İzliyorum, Devam Et
            </button>
          </div>
        </div>
      )}
    </main>
  );
}