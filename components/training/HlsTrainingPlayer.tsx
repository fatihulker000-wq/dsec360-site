"use client";

import Hls from "hls.js";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { ReactEventHandler } from "react";

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

const HlsTrainingPlayer = forwardRef<
  HTMLVideoElement,
  HlsTrainingPlayerProps
>(function HlsTrainingPlayer(
  {
    src,
    disabled = false,
    onLoadedMetadata,
    onCanPlay,
    onTimeUpdate,
    onSeeking,
    onSeeked,
    onRateChange,
    onEnded,
    onError,
  },
  forwardedRef
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const onErrorRef = useRef(onError);

  useImperativeHandle(forwardedRef, () => videoRef.current!, []);

  // Callback değiştiğinde HLS motorunu yeniden kurma. Yalnızca en güncel
  // callback'i ref içinde tut. Aksi halde parent render'ında video sıfırlanır.
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

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
      if (hlsRef.current === hls) {
        hlsRef.current = null;
      }
    };
  }, [src]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) videoRef.current?.pause();
    };
    const pauseWhenBlurred = () => videoRef.current?.pause();

    document.addEventListener("visibilitychange", pauseWhenHidden);
    window.addEventListener("blur", pauseWhenBlurred);
    return () => {
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      window.removeEventListener("blur", pauseWhenBlurred);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      controls={!disabled}
      controlsList="nodownload noplaybackrate noremoteplayback"
      disablePictureInPicture
      disableRemotePlayback
      preload="metadata"
      onContextMenu={(event) => event.preventDefault()}
      onPlay={(event) => {
        if (disabled) event.currentTarget.pause();
        event.currentTarget.playbackRate = 1;
      }}
      onLoadedMetadata={onLoadedMetadata}
      onCanPlay={onCanPlay}
      onTimeUpdate={onTimeUpdate}
      onSeeking={onSeeking}
      onSeeked={onSeeked}
      onRateChange={(event) => {
        if (event.currentTarget.playbackRate !== 1) {
          event.currentTarget.playbackRate = 1;
        }
        onRateChange?.(event);
      }}
      onEnded={onEnded}
      onError={() => onErrorRef.current?.("Video dosyası yüklenemedi.")}
      style={{
        width: "100%",
        borderRadius: 16,
        background: "#000",
        pointerEvents: disabled ? "none" : "auto",
        opacity: disabled ? 0.65 : 1,
      }}
    />
  );
});

export default HlsTrainingPlayer;