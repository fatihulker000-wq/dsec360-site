import { createClient } from "@supabase/supabase-js";
import type { HlsAsset, UploadSession } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getBrowserSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_ANON_KEY eksik."
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

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
  if (!response.ok) {
    throw new Error(json?.detail || json?.error || "Yükleme oturumu oluşturulamadı.");
  }
  return json.data as UploadSession;
}

export async function uploadHlsAsset(
  asset: HlsAsset,
  session: UploadSession,
  onProgress?: (uploaded: number, total: number) => void
) {
  onProgress?.(0, asset.blob.size);

  // createSignedUploadUrl ile üretilen token TUS x-signature değildir.
  // Token yalnızca uploadToSignedUrl üzerinden kullanılmalıdır.
  const supabase = getBrowserSupabase();
  const { error } = await supabase.storage
    .from(session.bucket)
    .uploadToSignedUrl(session.objectPath, session.token, asset.blob, {
      contentType: asset.contentType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`${asset.name} yüklenemedi: ${error.message}`);
  }
  onProgress?.(asset.blob.size, asset.blob.size);
}