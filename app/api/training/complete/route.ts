export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase ortam değişkenleri eksik.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const trainingId = String(body?.training_id || "").trim();

    if (!trainingId) {
      return NextResponse.json(
        { error: "training_id gerekli." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const userId = "demo-user";

    const { error } = await supabase
      .from("training_assignments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("training_id", trainingId)
      .eq("user_id", userId);

    if (error) {
      console.error("training complete update error:", error);
      return NextResponse.json(
        { error: "Eğitim tamamlama kaydı güncellenemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("training complete route error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}