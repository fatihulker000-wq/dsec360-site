import {
  createClient,
} from "@supabase/supabase-js";

import type {
  HlsAsset,
  UploadSession,
} from "./types";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getBrowserSupabase() {
  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    throw new Error(
      "Supabase tarayıcı ortam değişkenleri eksik."
    );
  }

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

function wait(
  milliseconds: number
) {
  return new Promise<void>(
    (resolve) => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}

function readableError(
  cause: unknown
) {
  if (
    cause instanceof Error &&
    cause.message
  ) {
    return cause.message;
  }

  if (
    typeof cause === "string" &&
    cause.trim()
  ) {
    return cause;
  }

  return "Bilinmeyen yükleme hatası";
}

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

  if (
    !json?.data?.bucket ||
    !json?.data?.objectPath ||
    !json?.data?.token
  ) {
    throw new Error(
      "İmzalı yükleme bilgileri eksik."
    );
  }

  return json.data as UploadSession;
}

export async function uploadHlsAsset(
  asset: HlsAsset,
  session: UploadSession,
  onProgress?: (
    uploaded: number,
    total: number
  ) => void
) {
  const supabase =
    getBrowserSupabase();

  const retryDelays = [
    0,
    1500,
    3000,
    5000,
    10000,
  ];

  let lastError = "";

  onProgress?.(
    0,
    asset.blob.size
  );

  for (
    let attempt = 0;
    attempt < retryDelays.length;
    attempt += 1
  ) {
    if (
      retryDelays[attempt] > 0
    ) {
      await wait(
        retryDelays[attempt]
      );
    }

    try {
      const {
        data,
        error,
      } = await supabase.storage
        .from(session.bucket)
        .uploadToSignedUrl(
          session.objectPath,
          session.token,
          asset.blob,
          {
            contentType:
              asset.contentType,
            cacheControl: "3600",
            upsert: false,
          }
        );

      if (error) {
        lastError =
          error.message;

        continue;
      }

      if (!data?.path) {
        lastError =
          "Supabase yükleme yolu döndürmedi.";

        continue;
      }

      onProgress?.(
        asset.blob.size,
        asset.blob.size
      );

      return;
    } catch (cause) {
      lastError =
        readableError(cause);
    }
  }

  throw new Error(
    `${asset.name} yüklenemedi: ${
      lastError ||
      "Supabase yükleme hatası"
    }`
  );
}