import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase ENV eksik.");
  }

  return createClient(url, serviceRoleKey);
}

type TrainingStatus = "assigned" | "not_started" | "in_progress" | "completed";

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
  training_id: string | null;
  status: TrainingStatus | null;
  started_at: string | null;
  completed_at: string | null;
  watch_completed: boolean | null;
  watch_seconds: number | null;
  click_count: number | null;
  pre_exam_completed: boolean | null;
  pre_exam_score: number | null;
  final_exam_score: number | null;
  final_exam_attempts: number | null;
  final_exam_passed: boolean | null;
  training_reset_required: boolean | null;
  training_repeat_count?: number | null;
};

export async function GET() {
  try {
  
   const userId = "d13323a8-a148-43fb-89f5-054ae56666c8"; // TEST

    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı yok" },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    // ---------------- USER ----------------
    let user: UserRow | null = null;

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 401 }
      );
    }

    user = userData;

    // ---------------- ASSIGNMENTS ----------------
    const { data: assignments, error: assignmentsError } = await supabase
      .from("training_assignments")
      .select("*")
      .eq("user_id", userId);

    if (assignmentsError) {
      console.error(assignmentsError);
      return NextResponse.json(
        { error: "Eğitim verileri alınamadı." },
        { status: 500 }
      );
    }

    const safeAssignments = (assignments || []) as TrainingAssignmentRow[];

    // ---------------- TRAININGS ----------------
    const trainingIds = safeAssignments
      .map((x) => x.training_id)
      .filter((id): id is string => !!id);

    let trainingsMap: Record<string, TrainingRow> = {};

    if (trainingIds.length > 0) {
      const { data: trainings } = await supabase
        .from("trainings")
        .select("*")
        .in("id", trainingIds);

      trainingsMap = Object.fromEntries(
        (trainings || []).map((t) => [t.id, t])
      );
    }

    // ---------------- RESULT ----------------
    const result = safeAssignments.map((item) => {
      const training = item.training_id
        ? trainingsMap[item.training_id] || null
        : null;

      const isReset = item.training_reset_required === true;

      return {
        id: item.id,
        training_id: item.training_id,
        status: isReset ? "not_started" : item.status || "not_started",
        started_at: isReset ? null : item.started_at,
        completed_at: isReset ? null : item.completed_at,
        watch_completed: isReset ? false : !!item.watch_completed,
        watch_seconds: isReset ? 0 : Number(item.watch_seconds || 0),
        click_count: isReset ? 0 : Number(item.click_count || 0),
        pre_exam_completed: isReset ? false : !!item.pre_exam_completed,
        pre_exam_score: isReset ? 0 : Number(item.pre_exam_score || 0),
        final_exam_score: item.final_exam_score ?? null,
        final_exam_attempts: isReset ? 0 : Number(item.final_exam_attempts || 0),
        final_exam_passed: !!item.final_exam_passed,
        training_repeat_count: Number(item.training_repeat_count || 0),
        training,
      };
    });

    return NextResponse.json({
      success: true,
      user,
      data: result,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}