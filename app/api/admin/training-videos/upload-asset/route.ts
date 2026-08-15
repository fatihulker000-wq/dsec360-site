export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BUCKET = "egitim-videolari";
const MAX_BODY_BYTES = Math.floor(3.5 * 1024 * 1024);

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase sunucu ortam değişkenleri eksik.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function validId(value: string) {
  return /^[a-zA-Z0-9_-]{8,100}$/.test(value);
}

function validFileName(value: string) {
  return value === "index.m3u8" || /^segment-\d{5}\.ts$/.test(value);
}

export async function POST(request: Request) {
  try {
    const store = await cookies();
    const auth = store.get("dsec_admin_auth")?.value;
    const role = store.get("dsec_admin_role")?.value;
    if (auth !== "ok" || !["super_admin", "company_admin"].includes(role || "")) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const url = new URL(request.url);
    const trainingId = url.searchParams.get("trainingId")?.trim() || "";
    const uploadId = url.searchParams.get("uploadId")?.trim() || "";
    const fileName = url.searchParams.get("fileName")?.trim() || "";
    if (!validId(trainingId) || !validId(uploadId) || !validFileName(fileName)) {
      return NextResponse.json({ error: "Geçersiz yükleme bilgisi." }, { status: 400 });
    }

    const declaredSize = Number(request.headers.get("x-dsec-file-size") || 0);
    if (!Number.isFinite(declaredSize) || declaredSize <= 0 || declaredSize > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Video parçası güvenli boyut sınırını aşıyor." }, { status: 413 });
    }

    const contentType = fileName.endsWith(".m3u8")
      ? "application/vnd.apple.mpegurl"
      : "video/mp2t";
    const body = new Uint8Array(await request.arrayBuffer());
    if (body.byteLength <= 0 || body.byteLength > MAX_BODY_BYTES || body.byteLength !== declaredSize) {
      return NextResponse.json({ error: "Video parçasının boyutu doğrulanamadı." }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const objectPath = `trainings/${trainingId}/${uploadId}/${fileName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, body, {
      contentType,
      cacheControl: "3600",
      upsert: true,
    });
    if (error) {
      return NextResponse.json(
        { error: "Video parçası Storage alanına yazılamadı.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, fileName, size: body.byteLength });
  } catch (cause) {
    console.error("training video asset upload error:", cause);
    return NextResponse.json(
      { error: "Video parçası yüklenemedi.", detail: cause instanceof Error ? cause.message : undefined },
      { status: 500 }
    );
  }
}