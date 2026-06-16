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

async function checkAdmin() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
  const adminRole = cookieStore.get("dsec_admin_role")?.value;

  return adminAuth === "ok" && isAdminAllowed(adminRole);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id } = await context.params;
    const videoId = String(id || "").trim();

    if (!videoId) {
      return NextResponse.json({ error: "videoId gerekli." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("training_videos")
      .select("*")
      .eq("id", videoId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Video alınamadı.", detail: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Video bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id } = await context.params;
    const videoId = String(id || "").trim();

    if (!videoId) {
      return NextResponse.json({ error: "videoId gerekli." }, { status: 400 });
    }

    const body = await request.json();

    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const videoUrl = String(body.videoUrl || "").trim();
    const durationSeconds = Math.max(
      0,
      Math.floor(Number(body.durationSeconds || 0))
    );
    const sortOrder = Math.max(1, Math.floor(Number(body.sortOrder || 1)));
    const isRequired =
      typeof body.isRequired === "boolean" ? body.isRequired : true;
    const isActive =
      typeof body.isActive === "boolean" ? body.isActive : true;

    if (!title || !videoUrl) {
      return NextResponse.json(
        { error: "Video başlığı ve video URL zorunludur." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("training_videos")
      .update({
        title,
        description,
        video_url: videoUrl,
        duration_seconds: durationSeconds,
        sort_order: sortOrder,
        is_required: isRequired,
        is_active: isActive,
      })
      .eq("id", videoId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Video güncellenemedi.", detail: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Video bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id } = await context.params;
    const videoId = String(id || "").trim();

    if (!videoId) {
      return NextResponse.json({ error: "videoId gerekli." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("training_videos")
      .delete()
      .eq("id", videoId);

    if (error) {
      return NextResponse.json(
        { error: "Video silinemedi.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}