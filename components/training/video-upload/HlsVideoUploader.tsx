"use client";

import { useMemo, useRef, useState } from "react";
import { prepareHlsVideo } from "./hlsVideoProcessor";
import { uploadHlsAsset } from "./supabaseResumableUpload";
import type { PreparedHlsVideo } from "./types";
import styles from "./HlsVideoUploader.module.css";

type Props = {
  trainingId: string;
  trainingTitle: string;
  nextSortOrder: number;
  onCompleted?: () => Promise<void> | void;
};
type Stage = "idle" | "processing" | "uploading" | "finalizing" | "done" | "error";
const MAX_SOURCE_BYTES = 512 * 1024 * 1024;

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

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

  const preparedRef = useRef<PreparedHlsVideo | null>(null);
  const preparedFileKeyRef = useRef("");
  const uploadIdRef = useRef("");
  const uploadedNamesRef = useRef(new Set<string>());

  const busy = ["processing", "uploading", "finalizing"].includes(stage);
  const canRetryUpload = stage === "error" && preparedRef.current !== null;
  const sizeText = useMemo(
    () => file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "", [file]
  );

  const resetPrepared = () => {
    preparedRef.current = null;
    preparedFileKeyRef.current = "";
    uploadIdRef.current = "";
    uploadedNamesRef.current = new Set<string>();
    setProcessPercent(0);
    setUploadPercent(0);
  };

  const selectFile = (selected: File | null) => {
    setError(""); setMessage(""); setStage("idle"); resetPrepared();
    if (!selected) return setFile(null);
    if (!selected.type.startsWith("video/") || !/\.(mp4|mov)$/i.test(selected.name)) {
      setFile(null); return setError("Yalnızca MP4 veya MOV video seçilebilir.");
    }
    if (selected.size > MAX_SOURCE_BYTES) {
      setFile(null);
      return setError("Bu tarayıcı işleme hattında kaynak video en fazla 512 MB olabilir.");
    }
    setFile(selected);
    setTitle(selected.name.replace(/\.[^.]+$/, ""));
  };

  const startUpload = async () => {
    if (!file || !title.trim() || !trainingId) {
      setError("Video dosyası ve başlık zorunludur."); return;
    }

    try {
      setError(""); setMessage("");
      const selectedKey = fileKey(file);
      let prepared = preparedRef.current;

      if (!prepared || preparedFileKeyRef.current !== selectedKey) {
        resetPrepared();
        setStage("processing");
        prepared = await prepareHlsVideo(file, setProcessPercent);
        preparedRef.current = prepared;
        preparedFileKeyRef.current = selectedKey;
        uploadIdRef.current = crypto.randomUUID();
        uploadedNamesRef.current = new Set<string>();
      } else {
        setProcessPercent(100);
      }

      const uploadId = uploadIdRef.current || crypto.randomUUID();
      uploadIdRef.current = uploadId;
      const uploadedNames = uploadedNamesRef.current;
      const completedBefore = prepared.assets
        .filter((asset) => uploadedNames.has(asset.name))
        .reduce((sum, asset) => sum + asset.blob.size, 0);
      let completedBytes = completedBefore;
      setUploadPercent(Math.min(99, Math.round(
        (completedBytes / prepared.totalOutputBytes) * 100
      )));

      setStage("uploading");
      for (const asset of prepared.assets) {
        if (uploadedNames.has(asset.name)) continue;
        await uploadHlsAsset({
          trainingId,
          uploadId,
          asset,
          onProgress: (uploaded) => {
            setUploadPercent(Math.min(99, Math.round(
              ((completedBytes + uploaded) / prepared!.totalOutputBytes) * 100
            )));
          },
        });
        uploadedNames.add(asset.name);
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
      setFile(null); setTitle(""); setDescription(""); resetPrepared();
      setProcessPercent(100); setUploadPercent(100);
      await onCompleted?.();
    } catch (cause) {
      console.error(cause); setStage("error");
      const detail = cause instanceof Error ? cause.message : "Video yüklenemedi.";
      setError(
        preparedRef.current
          ? `${detail} Hazırlanan video korundu; sayfayı yenilemeden yalnızca yüklemeyi tekrar deneyin.`
          : detail
      );
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
          <small>{file ? `${file.name} • ${sizeText}` : "50 MB üzeri video küçük HLS parçalarına ayrılır (en fazla 512 MB kaynak)."}</small>
        </label>
        <label><span>Video başlığı</span><input value={title} disabled={busy}
          onChange={(event) => setTitle(event.currentTarget.value)} placeholder="Ör. Yangın güvenliği" /></label>
        <label className={styles.full}><span>Açıklama</span><textarea rows={3} value={description} disabled={busy}
          onChange={(event) => setDescription(event.currentTarget.value)} /></label>
      </div>
      {stage !== "idle" && <div className={styles.progressArea}>
        <div><span>Video hazırlama</span><b>%{processPercent}</b></div>
        <progress max={100} value={processPercent} />
        <div><span>Güvenli yükleme</span><b>%{uploadPercent}</b></div>
        <progress max={100} value={uploadPercent} />
        <small>{stage === "processing" ? "Video küçük HLS parçalarına ayrılıyor. Sayfayı kapatmayın."
          : stage === "uploading" ? "Parçalar D-SEC güvenli API üzerinden yükleniyor."
          : stage === "finalizing" ? "Manifest ve parça sayısı doğrulanıyor."
          : stage === "done" ? "Video yayınlanmaya hazır."
          : canRetryUpload ? "Video hazır tutuluyor. Sayfayı yenilemeden yüklemeyi tekrar deneyebilirsiniz."
          : "İşlem durdu."}</small>
      </div>}
      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}
      <button type="button" className={styles.button} disabled={busy || !file || !title.trim()} onClick={startUpload}>
        {stage === "processing" ? "Video hazırlanıyor..." : stage === "uploading" ? "Yükleniyor..."
          : stage === "finalizing" ? "Doğrulanıyor..." : canRetryUpload ? "Yalnızca Yüklemeyi Tekrar Dene"
          : "Videoyu Hazırla ve Yükle"}
      </button>
    </section>
  );
}