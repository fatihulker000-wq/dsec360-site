import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BUCKET = "egitim-videolari";
const ALLOWED_FILES = /^(index\.m3u8|segment-\d{5}\.ts)$/;

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
  const fileName = String(body?.fileName || "").trim();
  const fileSize = Math.max(0, Number(body?.fileSize || 0));
  if (!trainingId || !uploadId || !ALLOWED_FILES.test(fileName) || fileSize <= 0) {
    return NextResponse.json({ error: "Geçersiz yükleme bilgisi." }, { status: 400 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(trainingId) || !/^[0-9a-f-]{36}$/i.test(uploadId)) {
    return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: training } = await supabase.from("trainings").select("id").eq("id", trainingId).maybeSingle();
  if (!training) return NextResponse.json({ error: "Eğitim bulunamadı." }, { status: 404 });

  const basePath = `trainings/${trainingId}/${uploadId}`;
  const objectPath = `${basePath}/${fileName}`;
  const { data, error } = await supabase.storage.from(BUCKET)
    .createSignedUploadUrl(objectPath, { upsert: false });
  if (error || !data?.token) {
    return NextResponse.json({ error: "İmzalı yükleme oluşturulamadı.", detail: error?.message }, { status: 500 });
  }

  const projectUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const projectId = new URL(projectUrl).hostname.split(".")[0];
  return NextResponse.json({
    success: true,
    data: {
      bucket: BUCKET,
      basePath,
      objectPath,
      token: data.token,
      endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
    },
  });
}