import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("dsec_user_id")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı oturumu bulunamadı." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    // 🔥 assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from("training_assignments")
      .select("*")
      .eq("user_id", userId);

    if (assignmentsError) {
      return NextResponse.json(
        { error: "Assignments hata", detail: assignmentsError },
        { status: 500 }
      );
    }

    // 🔥 training detayları
    const trainingIds = (assignments || [])
      .map((a) => a.training_id)
      .filter(Boolean);

    const { data: trainings } = await supabase
      .from("trainings")
      .select("*")
      .in("id", trainingIds);

    const trainingsMap = Object.fromEntries(
      (trainings || []).map((t) => [t.id, t])
    );

    const result = (assignments || []).map((item) => ({
      ...item,
      training: trainingsMap[item.training_id] || null,
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Genel hata", detail: String(err) },
      { status: 500 }
    );
  }
}