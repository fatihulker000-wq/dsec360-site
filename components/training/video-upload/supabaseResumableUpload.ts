import type { HlsAsset } from "./types";

const MAX_API_ASSET_BYTES = 3.5 * 1024 * 1024;

export async function uploadHlsAsset(params: {
  trainingId: string;
  uploadId: string;
  asset: HlsAsset;
  onProgress?: (uploaded: number, total: number) => void;
}) {
  const { trainingId, uploadId, asset, onProgress } = params;

  if (asset.blob.size > MAX_API_ASSET_BYTES) {
    throw new Error(
      `${asset.name} güvenli API yükleme sınırını aşıyor. Video yeniden hazırlanmalıdır.`
    );
  }

  const query = new URLSearchParams({
    trainingId,
    uploadId,
    fileName: asset.name,
  });

  onProgress?.(0, asset.blob.size);
  const response = await fetch(
    `/api/admin/training-videos/upload-asset?${query.toString()}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": asset.contentType,
        "X-DSEC-File-Size": String(asset.blob.size),
      },
      body: asset.blob,
    }
  );
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `${asset.name} yüklenemedi: ${json?.detail || json?.error || response.statusText}`
    );
  }
  onProgress?.(asset.blob.size, asset.blob.size);
}