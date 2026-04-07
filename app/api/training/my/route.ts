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
    const userId = cookieStore.get("dsec_user_id")?.value?.trim();

    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı oturumu bulunamadı." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    let assignmentsQuery = supabase
      .from("training_assignments")
      .select("*")
      .order("created_at", { ascending: false });

    // admin-1 uuid değil, o yüzden user_id filtre uygulanmaz
    if (userId !== "admin-1") {
      assignmentsQuery = assignmentsQuery.eq("user_id", userId);
    }

    const { data: assignments, error: assignmentsError } = await assignmentsQuery;

    if (assignmentsError) {
      return NextResponse.json(
        { error: "Assignments hata", detail: assignmentsError.message },
        { status: 500 }
      );
    }

    const trainingIds = Array.from(
      new Set((assignments || []).map((a) => a.training_id).filter(Boolean))
    );

    let trainingsMap: Record<string, any> = {};

    if (trainingIds.length > 0) {
      const { data: trainings, error: trainingsError } = await supabase
        .from("trainings")
        .select("*")
        .in("id", trainingIds);

      if (trainingsError) {
        return NextResponse.json(
          { error: "Trainings hata", detail: trainingsError.message },
          { status: 500 }
        );
      }

      trainingsMap = Object.fromEntries(
        (trainings || []).map((t) => [t.id, t])
      );
    }

    const result = (assignments || []).map((item) => ({
      ...item,
      training: item.training_id ? trainingsMap[item.training_id] || null : null,
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