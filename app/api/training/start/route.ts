import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const userId = cookieStore.get("dsec_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();
    const trainingId = body.trainingId;

    if (!trainingId) {
      return NextResponse.json(
        { error: "trainingId gerekli" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // VAR MI KONTROL
    const { data: existing } = await supabase
      .from("training_assignments")
      .select("id")
      .eq("user_id", userId)
      .eq("training_id", trainingId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, id: existing.id });
    }

    // YOKSA OLUŞTUR
    const { data, error } = await supabase
      .from("training_assignments")
      .insert({
        user_id: userId,
        training_id: trainingId,
        status: "started",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data.id,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}