"use client";

import Hls from "hls.js";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactEventHandler } from "react";

export type HlsTrainingPlayerProps = {
  src: string;
  disabled?: boolean;
  onLoadedMetadata?: ReactEventHandler<HTMLVideoElement>;
  onCanPlay?: ReactEventHandler<HTMLVideoElement>;
  onTimeUpdate?: ReactEventHandler<HTMLVideoElement>;
  onSeeking?: ReactEventHandler<HTMLVideoElement>;
  onSeeked?: ReactEventHandler<HTMLVideoElement>;
  onRateChange?: ReactEventHandler<HTMLVideoElement>;
  onEnded?: ReactEventHandler<HTMLVideoElement>;
  onError?: (message: string) => void;
};

function isHlsSource(src: string) {
  return src.toLowerCase().split("?")[0].endsWith(".m3u8");
}

function formatTime(value: number) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const HlsTrainingPlayer = forwardRef<HTMLVideoElement, HlsTrainingPlayerProps>(
  function HlsTrainingPlayer(
    { src, disabled = false, onLoadedMetadata, onCanPlay, onTimeUpdate, onSeeking, onSeeked, onRateChange, onEnded, onError },
    forwardedRef
  ) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const onErrorRef = useRef(onError);
    const maxPlayedRef = useRef(0);
    const correctingSeekRef = useRef(false);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [muted, setMuted] = useState(false);

    useImperativeHandle(forwardedRef, () => videoRef.current!, []);

    useEffect(() => {
      onErrorRef.current = onError;
    }, [onError]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !src) return;

      maxPlayedRef.current = 0;
      setCurrentTime(0);
      setDuration(0);
      setPlaying(false);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.pause();
      video.removeAttribute("src");
      video.load();

      if (!isHlsSource(src)) {
        video.src = src;
        video.load();
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.load();
        return;
      }
      if (!Hls.isSupported()) {
        onErrorRef.current?.("Bu tarayıcı HLS eğitim videosunu desteklemiyor.");
        return;
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
        maxBufferLength: 30,
        manifestLoadingMaxRetry: 4,
        levelLoadingMaxRetry: 4,
        fragLoadingMaxRetry: 6,
      });
      hlsRef.current = hls;
      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src));
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
          onErrorRef.current?.("Video bağlantısı kesildi; yeniden bağlanılıyor.");
          return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          onErrorRef.current?.("Video oynatma hatası düzeltilmeye çalışılıyor.");
          return;
        }
        onErrorRef.current?.("HLS eğitim videosu yüklenemedi.");
        hls.destroy();
      });

      return () => {
        hls.destroy();
        if (hlsRef.current === hls) hlsRef.current = null;
      };
    }, [src]);

    useEffect(() => {
      const pauseForInactivity = () => {
        videoRef.current?.pause();
        setPlaying(false);
      };
      const visibility = () => {
        if (document.hidden) pauseForInactivity();
      };
      document.addEventListener("visibilitychange", visibility);
      window.addEventListener("blur", pauseForInactivity);
      window.addEventListener("pagehide", pauseForInactivity);
      return () => {
        document.removeEventListener("visibilitychange", visibility);
        window.removeEventListener("blur", pauseForInactivity);
        window.removeEventListener("pagehide", pauseForInactivity);
      };
    }, []);

    const togglePlayback = async () => {
      const video = videoRef.current;
      if (!video || disabled) return;
      video.playbackRate = 1;
      video.defaultPlaybackRate = 1;
      if (video.paused) await video.play().catch(() => undefined);
      else video.pause();
    };

    const handleKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
      const blocked = ["ArrowLeft", "ArrowRight", "Home", "End", "j", "J", "l", "L", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
      if (blocked.includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if ([" ", "k", "K"].includes(event.key)) {
        event.preventDefault();
        void togglePlayback();
      }
    };

    const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    return (
      <div tabIndex={0} onKeyDown={handleKeyboard} onContextMenu={(event) => event.preventDefault()} onDoubleClick={(event) => event.preventDefault()} style={{ width: "100%", overflow: "hidden", borderRadius: 16, background: "#050505", opacity: disabled ? 0.65 : 1, outline: "none" }}>
        <video
          ref={videoRef}
          controls={false}
          controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
          disablePictureInPicture
          disableRemotePlayback
          playsInline
          preload="metadata"
          onClick={() => void togglePlayback()}
          onPlay={(event) => {
            if (disabled || document.hidden || !document.hasFocus()) {
              event.currentTarget.pause();
              return;
            }
            event.currentTarget.playbackRate = 1;
            event.currentTarget.defaultPlaybackRate = 1;
            setPlaying(true);
          }}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            setDuration(Number.isFinite(video.duration) ? video.duration : 0);
            onLoadedMetadata?.(event);
            // Parent güvenli kayıtlı konuma devam ettirdiyse bunu izin verilen
            // başlangıç noktası kabul et. Aksi hâlde özgeçmişten devam etme de
            // ileri sarma sanılarak sıfıra döndürülürdü.
            maxPlayedRef.current = Math.max(maxPlayedRef.current, video.currentTime || 0);
          }}
          onCanPlay={onCanPlay}
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            const now = Number(video.currentTime || 0);
            if (!video.seeking && !video.paused && video.playbackRate === 1) maxPlayedRef.current = Math.max(maxPlayedRef.current, now);
            setCurrentTime(now);
            onTimeUpdate?.(event);
          }}
          onSeeking={(event) => {
            const video = event.currentTarget;
            if (!correctingSeekRef.current && video.currentTime > maxPlayedRef.current + 1.5) {
              correctingSeekRef.current = true;
              video.currentTime = Math.max(0, maxPlayedRef.current);
            }
            onSeeking?.(event);
          }}
          onSeeked={(event) => {
            correctingSeekRef.current = false;
            setCurrentTime(event.currentTarget.currentTime || 0);
            onSeeked?.(event);
          }}
          onRateChange={(event) => {
            if (event.currentTarget.playbackRate !== 1) event.currentTarget.playbackRate = 1;
            if (event.currentTarget.defaultPlaybackRate !== 1) event.currentTarget.defaultPlaybackRate = 1;
            onRateChange?.(event);
          }}
          onEnded={(event) => {
            setPlaying(false);
            setCurrentTime(event.currentTarget.duration || event.currentTarget.currentTime || 0);
            onEnded?.(event);
          }}
          onError={() => onErrorRef.current?.("Video dosyası yüklenemedi.")}
          style={{ width: "100%", display: "block", background: "#000", cursor: disabled ? "not-allowed" : "pointer" }}
        />
        <div style={{ padding: "12px 14px 14px", color: "#fff" }}>
          <div aria-label={`İzleme ilerlemesi yüzde ${Math.floor(progress)}`} style={{ height: 7, borderRadius: 999, background: "#374151", overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "#22c55e" }} />
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <button type="button" disabled={disabled} onClick={() => void togglePlayback()} style={controlButton}>{playing ? "Duraklat" : "Oynat"}</button>
            <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 14 }}>{formatTime(currentTime)} / {formatTime(duration)}</span>
            <button type="button" disabled={disabled} onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              video.muted = !video.muted;
              setMuted(video.muted);
            }} style={controlButton}>{muted ? "Sesi Aç" : "Sesi Kapat"}</button>
          </div>
          <div style={{ marginTop: 8, color: "#d1d5db", fontSize: 12, textAlign: "center" }}>İleri sarma ve oynatma hızı kurumsal eğitim kuralları gereği kapalıdır.</div>
        </div>
      </div>
    );
  }
);

const controlButton: CSSProperties = { border: "1px solid #4b5563", borderRadius: 9, padding: "8px 12px", background: "#111827", color: "#fff", fontWeight: 700, cursor: "pointer" };

export default HlsTrainingPlayer;