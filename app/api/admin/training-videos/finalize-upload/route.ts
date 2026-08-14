import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BUCKET = "egitim-videolari";
function supabaseAdmin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function POST(request: Request) {
  const store = await cookies();
  const auth = store.get("dsec_admin_auth")?.value;
  const role = store.get("dsec_admin_role")?.value;
  if (auth !== "ok" || !["super_admin", "company_admin"].includes(role || "")) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const body = await request.json();
  const trainingId = String(body?.trainingId || "").trim();
  const uploadId = String(body?.uploadId || "").trim();
  const title = String(body?.title || "").trim();
  const description = String(body?.description || "").trim();
  const originalFileName = String(body?.originalFileName || "").trim();
  const durationSeconds = Math.max(0, Math.floor(Number(body?.durationSeconds || 0)));
  const originalSizeBytes = Math.max(0, Math.floor(Number(body?.originalSizeBytes || 0)));
  const sortOrder = Math.max(1, Math.floor(Number(body?.sortOrder || 1)));
  if (!trainingId || !uploadId || !title || durationSeconds <= 0) {
    return NextResponse.json({ error: "Eksik video bilgisi." }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const basePath = `trainings/${trainingId}/${uploadId}`;
  const { data: files, error: listError } = await supabase.storage.from(BUCKET).list(basePath, { limit: 1000 });
  if (listError) return NextResponse.json({ error: "Yüklenen parçalar doğrulanamadı." }, { status: 500 });

  const names = new Set((files || []).map((file) => file.name));
  const segmentCount = [...names].filter((name) => /^segment-\d{5}\.ts$/.test(name)).length;
  if (!names.has("index.m3u8") || segmentCount <= 0) {
    return NextResponse.json({ error: "Manifest veya video parçaları eksik." }, { status: 409 });
  }

  const manifestPath = `${basePath}/index.m3u8`;
  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(manifestPath);
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("training_videos").insert({
    training_id: trainingId,
    title,
    description,
    video_url: publicData.publicUrl,
    duration_seconds: durationSeconds,
    sort_order: sortOrder,
    is_required: true,
    is_active: true,
    required_watch_percent: 100,
    allow_skip: false,
    allow_speed: false,
    certificate_blocking: true,
    media_type: "HLS",
    storage_bucket: BUCKET,
    storage_path: basePath,
    manifest_path: manifestPath,
    original_file_name: originalFileName,
    original_size_bytes: originalSizeBytes,
    upload_status: "READY",
    processing_status: "READY",
    segment_count: segmentCount,
    mime_type: "application/vnd.apple.mpegurl",
    uploaded_at: now,
    published_at: now,
  }).select().single();

  if (error) return NextResponse.json({ error: "Video kaydı oluşturulamadı.", detail: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}