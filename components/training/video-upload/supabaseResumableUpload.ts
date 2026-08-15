import * as tus from "tus-js-client";
import type { HlsAsset, UploadSession } from "./types";

export async function createAssetUploadSession(params: {
  trainingId: string;
  uploadId: string;
  asset: HlsAsset;
}): Promise<UploadSession> {
  const response = await fetch("/api/admin/training-videos/upload-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      trainingId: params.trainingId,
      uploadId: params.uploadId,
      fileName: params.asset.name,
      contentType: params.asset.contentType,
      fileSize: params.asset.blob.size,
    }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json?.error || "Yükleme oturumu oluşturulamadı.");
  return json.data as UploadSession;
}

export function uploadHlsAsset(
  asset: HlsAsset,
  session: UploadSession,
  onProgress?: (uploaded: number, total: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(asset.blob, {
      endpoint: session.endpoint,
      retryDelays: [0, 2000, 5000, 10000, 20000],
      chunkSize: 6 * 1024 * 1024,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      headers: { "x-signature": session.token },
      metadata: {
        bucketName: session.bucket,
        objectName: session.objectPath,
        contentType: asset.contentType,
        cacheControl: "3600",
      },
      onError: (error) => reject(new Error(`${asset.name} yüklenemedi: ${error.message}`)),
      onProgress,
      onSuccess: () => resolve(),
    });
    upload.findPreviousUploads().then((previous) => {
      if (previous.length > 0) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    }).catch(reject);
  });
}