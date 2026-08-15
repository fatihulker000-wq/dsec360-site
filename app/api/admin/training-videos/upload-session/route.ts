import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BUCKET = "egitim-videolari";
const ALLOWED_FILES = /^(index\.m3u8|segment-\d{5}\.ts)$/;
const MAX_OBJECT_BYTES = 45 * 1024 * 1024;

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase sunucu ortam değişkenleri eksik.");
  return createClient(url, key);
}

export async function POST(request: Request) {
  try {
    const store = await cookies();
    const auth = store.get("dsec_admin_auth")?.value;
    const role = store.get("dsec_admin_role")?.value;
    if (auth !== "ok" || !["super_admin", "company_admin"].includes(role || "")) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await request.json();
    const trainingId = String(body?.trainingId || "").trim();
    const uploadId = String(body?.uploadId || "").trim();
    const fileName = String(body?.fileName || "").trim();
    const fileSize = Math.floor(Number(body?.fileSize || 0));
    if (!trainingId || !uploadId || !ALLOWED_FILES.test(fileName) || fileSize <= 0) {
      return NextResponse.json({ error: "Geçersiz yükleme bilgisi." }, { status: 400 });
    }
    if (fileSize > MAX_OBJECT_BYTES) {
      return NextResponse.json({ error: "HLS parçası 45 MB güvenli sınırını aşıyor." }, { status: 413 });
    }
    if (!/^[0-9a-f-]{36}$/i.test(trainingId) || !/^[0-9a-f-]{36}$/i.test(uploadId)) {
      return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: training, error: trainingError } = await supabase
      .from("trainings").select("id").eq("id", trainingId).maybeSingle();
    if (trainingError) {
      return NextResponse.json({ error: "Eğitim doğrulanamadı.", detail: trainingError.message }, { status: 500 });
    }
    if (!training) return NextResponse.json({ error: "Eğitim bulunamadı." }, { status: 404 });

    const basePath = `trainings/${trainingId}/${uploadId}`;
    const objectPath = `${basePath}/${fileName}`;
    const { data, error } = await supabase.storage.from(BUCKET)
      .createSignedUploadUrl(objectPath, { upsert: false });
    if (error || !data?.token) {
      return NextResponse.json({
        error: "İmzalı yükleme oluşturulamadı.", detail: error?.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { bucket: BUCKET, basePath, objectPath, token: data.token },
    });
  } catch (cause) {
    return NextResponse.json({
      error: cause instanceof Error ? cause.message : "Sunucu hatası.",
    }, { status: 500 });
  }
}