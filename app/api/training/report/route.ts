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

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("training_exam_results")
      .select("*");

    if (error) {
      console.error("training report fetch error:", error);
      return NextResponse.json(
        { error: error.message || "Rapor verisi alınamadı." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("training report route error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}