import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil.");
  }

  return createClient(url, serviceRoleKey);
}

type TrainingStatus = "not_started" | "in_progress" | "completed";

type UserRow = {
  id: string;
  full_name: string | null;
};

type TrainingRow = {
  id: string;
  title: string | null;
  description: string | null;
  content_url: string | null;
  type: string | null;
};

type TrainingAssignmentRow = {
  id: string;
  user_id: string;
  training_id: string;
  status: TrainingStatus;
  started_at: string | null;
  completed_at: string | null;
  watch_completed: boolean | null;
  watch_seconds: number | null;
  click_count: number | null;
  pre_exam_completed: boolean;
  pre_exam_score: number;
  final_exam_score: number;
  final_exam_attempts: number;
  final_exam_passed: boolean;
  training_reset_required: boolean;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("dsec_user_id")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı yok (cookie gelmedi)" },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    let user: UserRow | { id: string; full_name: string } | null = null;

    if (userId === "admin-1") {
      user = {
        id: "admin-1",
        full_name: "Admin Kullanıcı",
      };
    } else {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("id", userId)
        .maybeSingle<UserRow>();

      if (userError || !userData) {
        console.error("Kullanıcı fetch hatası:", userError);
        return NextResponse.json(
          { error: "Kullanıcı DB'de yok" },
          { status: 401 }
        );
      }

      user = userData;
    }

    let assignmentsQuery = supabase
      .from("training_assignments")
      .select(
        "id, user_id, training_id, status, started_at, completed_at, watch_completed, watch_seconds, click_count, pre_exam_completed, pre_exam_score, final_exam_score, final_exam_attempts, final_exam_passed, training_reset_required"
      )
      .order("started_at", { ascending: false })
      .order("id", { ascending: false });

    if (userId !== "admin-1") {
      assignmentsQuery = assignmentsQuery.eq("user_id", userId);
    }

    const { data: assignments, error: assignmentsError } =
      await assignmentsQuery.returns<TrainingAssignmentRow[]>();

    if (assignmentsError) {
      console.error("training_assignments fetch hatası:", assignmentsError);
      return NextResponse.json(
        { error: "Eğitim verileri alınamadı" },
        { status: 500 }
      );
    }

    const safeAssignments = assignments || [];

    const trainingIds = safeAssignments
      .map((item) => item.training_id)
      .filter(Boolean);

    let trainingsMap: Record<string, TrainingRow> = {};

    if (trainingIds.length > 0) {
      const { data: trainings, error: trainingsError } = await supabase
        .from("trainings")
        .select("id, title, description, content_url, type")
        .in("id", trainingIds)
        .returns<TrainingRow[]>();

      if (trainingsError) {
        console.error("trainings fetch hatası:", trainingsError);
        return NextResponse.json(
          { error: "Eğitim detayları alınamadı" },
          { status: 500 }
        );
      }

      trainingsMap = Object.fromEntries(
        (trainings || []).map((item) => [item.id, item])
      );
    }

    const result = safeAssignments.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      training_id: item.training_id,
      status: item.status,
      started_at: item.started_at,
      completed_at: item.completed_at,
      watch_completed: item.watch_completed,
      watch_seconds: item.watch_seconds,
      click_count: item.click_count,
      pre_exam_completed: item.pre_exam_completed,
      pre_exam_score: item.pre_exam_score,
      final_exam_score: item.final_exam_score,
      final_exam_attempts: item.final_exam_attempts,
      final_exam_passed: item.final_exam_passed,
      training_reset_required: item.training_reset_required,
      training: item.training_id ? trainingsMap[item.training_id] || null : null,
    }));

    return NextResponse.json({
      success: true,
      user,
      data: result,
    });
  } catch (err) {
    console.error("training/my genel hata:", err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
