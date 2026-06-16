import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function isAdminAllowed(role?: string) {
  return role === "super_admin" || role === "company_admin";
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
  const adminRole = cookieStore.get("dsec_admin_role")?.value;

  if (adminAuth !== "ok" || !isAdminAllowed(adminRole)) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const url = new URL(request.url);
  const trainingId = url.searchParams.get("trainingId");

  if (!trainingId) {
    return NextResponse.json({ error: "trainingId gerekli." }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("training_videos")
    .select("*")
    .eq("training_id", trainingId)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Videolar alınamadı." }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
  const adminRole = cookieStore.get("dsec_admin_role")?.value;

  if (adminAuth !== "ok" || !isAdminAllowed(adminRole)) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const body = await request.json();

  const trainingId = String(body.trainingId || "").trim();
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const videoUrl = String(body.videoUrl || "").trim();
  const durationSeconds = Math.max(0, Number(body.durationSeconds || 0));
  const sortOrder = Math.max(1, Number(body.sortOrder || 1));

  if (!trainingId || !title || !videoUrl) {
    return NextResponse.json(
      { error: "Eğitim, video başlığı ve video URL zorunludur." },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("training_videos")
    .insert({
      training_id: trainingId,
      title,
      description,
      video_url: videoUrl,
      duration_seconds: durationSeconds,
      sort_order: sortOrder,
      is_required: true,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Video eklenemedi.", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}