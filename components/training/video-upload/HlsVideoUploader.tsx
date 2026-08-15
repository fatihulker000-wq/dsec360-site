"use client";

import { useMemo, useState } from "react";
import { prepareHlsVideo } from "./hlsVideoProcessor";
import { createAssetUploadSession, uploadHlsAsset } from "./supabaseResumableUpload";
import styles from "./HlsVideoUploader.module.css";

type Props = {
  trainingId: string;
  trainingTitle: string;
  nextSortOrder: number;
  onCompleted?: () => Promise<void> | void;
};
type Stage = "idle" | "processing" | "uploading" | "finalizing" | "done" | "error";
const MAX_SOURCE_BYTES = 512 * 1024 * 1024;

export default function HlsVideoUploader({
  trainingId, trainingTitle, nextSortOrder, onCompleted,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [processPercent, setProcessPercent] = useState(0);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const busy = ["processing", "uploading", "finalizing"].includes(stage);
  const sizeText = useMemo(
    () => file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "", [file]
  );

  const selectFile = (selected: File | null) => {
    setError(""); setMessage(""); setStage("idle");
    if (!selected) return setFile(null);
    if (!selected.type.startsWith("video/") || !/\.(mp4|mov)$/i.test(selected.name)) {
      setFile(null); return setError("Yalnızca MP4 veya MOV video seçilebilir.");
    }
    if (selected.size > MAX_SOURCE_BYTES) {
      setFile(null);
      return setError("Bu tarayıcı işleme hattında kaynak video en fazla 512 MB olabilir.");
    }
    setFile(selected);
    setTitle((current) => current || selected.name.replace(/\.[^.]+$/, ""));
  };

  const startUpload = async () => {
    if (!file || !title.trim() || !trainingId) {
      setError("Video dosyası ve başlık zorunludur."); return;
    }
    try {
      setError(""); setMessage(""); setProcessPercent(0); setUploadPercent(0);
      setStage("processing");
      const prepared = await prepareHlsVideo(file, setProcessPercent);
      const uploadId = crypto.randomUUID();
      let completedBytes = 0;

      // İşlemci manifesti zaten en sona koyar. Manifestin son yüklenmesi,
      // yarım yüklemenin oynatılabilir görünmesini engeller.
      setStage("uploading");
      while (prepared.assets.length > 0) {
        const asset = prepared.assets.shift();
        if (!asset) break;
        const session = await createAssetUploadSession({ trainingId, uploadId, asset });
        await uploadHlsAsset(asset, session, (uploaded) => {
          setUploadPercent(Math.min(99, Math.round(
            ((completedBytes + uploaded) / prepared.totalOutputBytes) * 100
          )));
        });
        completedBytes += asset.blob.size;
        setUploadPercent(Math.min(99, Math.round(
          (completedBytes / prepared.totalOutputBytes) * 100
        )));
      }

      setStage("finalizing");
      const response = await fetch("/api/admin/training-videos/finalize-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          trainingId, uploadId, title: title.trim(), description: description.trim(),
          originalFileName: file.name, originalSizeBytes: file.size,
          durationSeconds: prepared.durationSeconds, sortOrder: nextSortOrder,
          expectedSegmentCount: prepared.segmentCount,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json?.detail || json?.error || "Video kaydı tamamlanamadı.");

      setUploadPercent(100); setStage("done");
      setMessage(`Video hazır: ${prepared.segmentCount} parça güvenli biçimde yüklendi.`);
      setFile(null); setTitle(""); setDescription("");
      await onCompleted?.();
    } catch (cause) {
      console.error(cause); setStage("error");
      setError(cause instanceof Error ? cause.message : "Video yüklenemedi.");
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <div><span>Büyük Video • HLS</span><h3>Bilgisayardan Video Yükle</h3></div>
        <strong>{trainingTitle}</strong>
      </div>
      <div className={styles.grid}>
        <label className={styles.fileBox}>
          <span>MP4 veya MOV seç</span>
          <input type="file" accept="video/mp4,video/quicktime,.mp4,.mov" disabled={busy}
            onChange={(event) => selectFile(event.currentTarget.files?.[0] || null)} />
          <small>{file ? `${file.name} • ${sizeText}` : "50 MB üzeri video HLS parçalarına ayrılır (en fazla 512 MB kaynak)."}</small>
        </label>
        <label><span>Video başlığı</span><input value={title} disabled={busy}
          onChange={(event) => setTitle(event.currentTarget.value)} placeholder="Ör. Yangın güvenliği" /></label>
        <label className={styles.full}><span>Açıklama</span><textarea rows={3} value={description} disabled={busy}
          onChange={(event) => setDescription(event.currentTarget.value)} /></label>
      </div>
      {stage !== "idle" && <div className={styles.progressArea}>
        <div><span>Video hazırlama</span><b>%{processPercent}</b></div>
        <progress max={100} value={processPercent} />
        <div><span>Supabase yükleme</span><b>%{uploadPercent}</b></div>
        <progress max={100} value={uploadPercent} />
        <small>{stage === "processing" ? "Video 6 saniyelik HLS parçalarına ayrılıyor. Sayfayı kapatmayın."
          : stage === "uploading" ? "Parçalar sırayla yükleniyor; bağlantı kesilirse yeniden denenecek."
          : stage === "finalizing" ? "Manifest ve parça sayısı doğrulanıyor."
          : stage === "done" ? "Video yayınlanmaya hazır." : "İşlem durdu."}</small>
      </div>}
      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}
      <button type="button" className={styles.button} disabled={busy || !file || !title.trim()} onClick={startUpload}>
        {stage === "processing" ? "Video hazırlanıyor..." : stage === "uploading" ? "Yükleniyor..."
          : stage === "finalizing" ? "Doğrulanıyor..." : "Videoyu Hazırla ve Yükle"}
      </button>
    </section>
  );
}