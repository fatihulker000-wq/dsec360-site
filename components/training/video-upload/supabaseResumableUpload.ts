import type {
  HlsAsset,
  UploadSession,
} from "./types";

export async function createAssetUploadSession(
  params: {
    trainingId: string;
    uploadId: string;
    asset: HlsAsset;
  }
): Promise<UploadSession> {
  const response = await fetch(
    "/api/admin/training-videos/upload-session",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        trainingId:
          params.trainingId,
        uploadId:
          params.uploadId,
        fileName:
          params.asset.name,
        contentType:
          params.asset.contentType,
        fileSize:
          params.asset.blob.size,
      }),
    }
  );

  const json = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      json?.error ||
        "Yükleme oturumu oluşturulamadı."
    );
  }

  return json.data as UploadSession;
}

export function uploadHlsAsset(
  asset: HlsAsset,
  session: UploadSession,
  onProgress?: (
    uploaded: number,
    total: number
  ) => void
) {
  return new Promise<void>(
    (resolve, reject) => {
      const params =
        new URLSearchParams({
          trainingId:
            session.objectPath
              .split("/")[1],
          uploadId:
            session.basePath
              .split("/")[2],
          fileName:
            asset.name,
        });

      const request =
        new XMLHttpRequest();

      request.open(
        "POST",
        `/api/admin/training-videos/upload-asset?${params.toString()}`
      );

      request.withCredentials =
        true;

      request.setRequestHeader(
        "Content-Type",
        asset.contentType
      );

      request.upload.onprogress = (
        event
      ) => {
        if (
          event.lengthComputable
        ) {
          onProgress?.(
            event.loaded,
            event.total
          );
        }
      };

      request.onerror = () => {
        reject(
          new Error(
            `${asset.name} yüklenemedi: bağlantı hatası.`
          )
        );
      };

      request.onload = () => {
        let json: {
          error?: string;
        } = {};

        try {
          json = JSON.parse(
            request.responseText ||
              "{}"
          );
        } catch {
          // Yanıt JSON değilse aşağıdaki genel hata kullanılır.
        }

        if (
          request.status >= 200 &&
          request.status < 300
        ) {
          onProgress?.(
            asset.blob.size,
            asset.blob.size
          );

          resolve();
          return;
        }

        reject(
          new Error(
            json.error ||
              `${asset.name} yüklenemedi (${request.status}).`
          )
        );
      };

      request.send(
        asset.blob
      );
    }
  );
}