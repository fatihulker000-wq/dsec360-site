import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

type AssignmentRow = {
  id: string;
  user_id: string;
  training_id: string | null;
  status: "not_started" | "in_progress" | "completed" | null;
  watch_completed: boolean | null;
  pre_exam_completed: boolean | null;
  final_exam_passed: boolean | null;
  final_exam_score: number | null;
  final_exam_attempts: number | null;
  training_reset_required: boolean | null;
  training_repeat_count: number | null;
  watch_seconds: number | null;
  click_count: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
};

type TrainingRow = {
  id: string;
  title: string | null;
  description: string | null;
  type: string | null;
  content_url: string | null;
  duration_minutes: number | null;
};

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
      .select(
        "id, user_id, training_id, status, watch_completed, pre_exam_completed, final_exam_passed, final_exam_score, final_exam_attempts, training_reset_required, training_repeat_count, watch_seconds, click_count, started_at, completed_at, created_at"
      )
      .order("created_at", { ascending: false });

    if (userId !== "admin-1") {
      assignmentsQuery = assignmentsQuery.eq("user_id", userId);
    }

    const { data: assignments, error: assignmentsError } =
      await assignmentsQuery.returns<AssignmentRow[]>();

    if (assignmentsError) {
      return NextResponse.json(
        { error: "Assignments hata", detail: assignmentsError.message },
        { status: 500 }
      );
    }

    const safeAssignments = assignments || [];

    const trainingIds = Array.from(
      new Set(safeAssignments.map((a) => a.training_id).filter(Boolean))
    ) as string[];

    let trainingsMap: Record<string, TrainingRow> = {};

    if (trainingIds.length > 0) {
      const { data: trainings, error: trainingsError } = await supabase
        .from("trainings")
        .select("id, title, description, type, content_url, duration_minutes")
        .in("id", trainingIds)
        .returns<TrainingRow[]>();

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

    const result = safeAssignments.map((item) => ({
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