import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type TrainingJoin =
  | { duration_minutes: number | null }
  | { duration_minutes: number | null }[]
  | null;

type AssignmentRow = {
  id: string;
  user_id: string;
  watch_seconds: number | null;
  click_count: number | null;
  training_id: string | null;
  final_exam_passed: boolean | null;
  training: TrainingJoin;
};

function getDurationMinutes(training: TrainingJoin): number {
  if (Array.isArray(training)) {
    return Number(training[0]?.duration_minutes || 0);
  }

  return Number(training?.duration_minutes || 0);
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("dsec_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();

    const assignmentId = body.assignmentId;
    const watchSeconds = Number(body.watchSeconds || 0);
    const clickCount = Number(body.clickCount || 0);
    const completed = body.completed === true;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignmentId gerekli" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: assignment, error } = await supabase
      .from("training_assignments")
      .select(
        `
        id,
        user_id,
        watch_seconds,
        click_count,
        training_id,
        final_exam_passed,
        training:trainings(duration_minutes)
      `
      )
      .eq("id", assignmentId)
      .single<AssignmentRow>();

    if (error || !assignment) {
      return NextResponse.json(
        { error: "Kayıt bulunamadı" },
        { status: 404 }
      );
    }

    if (assignment.user_id !== userId && userId !== "admin-1") {
      return NextResponse.json(
        { error: "Yetkisiz erişim" },
        { status: 403 }
      );
    }

    const durationMinutes = getDurationMinutes(assignment.training);
    const durationSeconds = Math.max(0, durationMinutes * 60);

    const existingWatch = Number(assignment.watch_seconds || 0);
    const existingClick = Number(assignment.click_count || 0);

    const mergedWatch = Math.max(existingWatch, watchSeconds);
    const mergedClick = Math.max(existingClick, clickCount);

    const cappedWatch =
      durationSeconds > 0 ? Math.min(mergedWatch, durationSeconds) : mergedWatch;

    const finalWatchSeconds =
      completed || assignment.final_exam_passed
        ? durationSeconds > 0
          ? durationSeconds
          : cappedWatch
        : cappedWatch;

    const watchCompleted =
      durationSeconds > 0
        ? finalWatchSeconds >= durationSeconds
        : completed || assignment.final_exam_passed === true;

    const updatePayload: Record<string, unknown> = {
      watch_seconds: finalWatchSeconds,
      watch_completed: watchCompleted,
      click_count: mergedClick,
    };

    const { error: updateError } = await supabase
      .from("training_assignments")
      .update(updatePayload)
      .eq("id", assignmentId);

    if (updateError) {
      console.error("PROGRESS UPDATE ERROR:", updateError);
      return NextResponse.json(
        { error: "Kayıt güncellenemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      watch_seconds: finalWatchSeconds,
      click_count: mergedClick,
      watch_completed: watchCompleted,
      duration_seconds: durationSeconds,
    });
  } catch (err) {
    console.error("progress route error:", err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}