import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("cbs_forms")
      .select("id, full_name, email, message, created_at, status")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("CBS GET hatası:", error);
      return NextResponse.json(
        { error: "Kayıtlar alınamadı." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error("CBS GET genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body ?? {};

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID ve durum zorunludur." },
        { status: 400 }
      );
    }

    const allowedStatuses = ["new", "read", "processing"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Geçersiz durum değeri." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("cbs_forms")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("CBS PATCH hatası:", error);
      return NextResponse.json(
        { error: "Durum güncellenemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CBS PATCH genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body ?? {};

    if (!id) {
      return NextResponse.json(
        { error: "ID zorunludur." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("cbs_forms")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("CBS DELETE hatası:", error);
      return NextResponse.json(
        { error: "Kayıt silinemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CBS DELETE genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}