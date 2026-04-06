import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type AssignmentRow = {
  id: string;
  user_id: string;
  training_id: string | null;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  watch_seconds: number | null;
  click_count: number | null;
  watch_completed: boolean | null;
  watch_completed_at?: string | null;
  final_exam_passed: boolean | null;
  last_position_seconds?: number | null;
  max_watched_seconds?: number | null;
  locked_duration_seconds?: number | null;
};

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("dsec_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();

    const assignmentId = String(body?.assignmentId || "").trim();
    const watchSeconds = Math.max(
      0,
      Math.floor(Number(body?.watchSeconds || 0))
    );
    const clickCount = Math.max(
      0,
      Math.floor(Number(body?.clickCount || 0))
    );
    const completed = body?.completed === true;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignmentId gerekli" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: assignment, error: assignmentError } = await supabase
      .from("training_assignments")
      .select("*")
      .eq("id", assignmentId)
      .single<AssignmentRow>();

    if (assignmentError || !assignment) {
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

    const now = new Date().toISOString();

    const existingWatch = Math.max(0, Number(assignment.watch_seconds || 0));
    const existingClick = Math.max(0, Number(assignment.click_count || 0));
    const existingLastPosition = Math.max(
      0,
      Number(assignment.last_position_seconds || 0)
    );
    const existingMaxWatched = Math.max(
      0,
      Number(assignment.max_watched_seconds || 0)
    );

    const mergedWatch = Math.max(existingWatch, watchSeconds);
    const mergedClick = Math.max(existingClick, clickCount);
    const mergedLastPosition = Math.max(existingLastPosition, watchSeconds);
    const mergedMaxWatched = Math.max(existingMaxWatched, watchSeconds);

    const alreadyCompleted =
      assignment.watch_completed === true ||
      assignment.final_exam_passed === true;

    // KRİTİK FIX:
    // Artık sadece gerçekten completed:true gelirse eğitim tamamlanmış sayılacak.
    // İlk tıkta / ilk heartbeat'te tamamlandı olmayacak.
    const shouldMarkWatched = alreadyCompleted || completed === true;

    const updatePayload: Record<string, unknown> = {
      watch_seconds: mergedWatch,
      click_count: mergedClick,
      last_position_seconds: mergedLastPosition,
      max_watched_seconds: mergedMaxWatched,
    };

    if (!assignment.started_at) {
      updatePayload.started_at = now;
    }

    const currentStatus = String(assignment.status || "").trim().toLowerCase();

    if (shouldMarkWatched) {
      updatePayload.watch_completed = true;
      updatePayload.watch_completed_at =
        assignment.watch_completed_at || now;

      // Eğitim videosu tamamlandıysa status completed olabilir.
      updatePayload.status = "completed";
      updatePayload.completed_at = assignment.completed_at || now;
      updatePayload.locked_duration_seconds =
        Number(assignment.locked_duration_seconds || 0) > 0
          ? Number(assignment.locked_duration_seconds || 0)
          : mergedWatch;
    } else {
      updatePayload.watch_completed = Boolean(assignment.watch_completed);

      // Eğitim henüz tamamlanmadıysa sadece in_progress yap
      if (
        !currentStatus ||
        currentStatus === "assigned" ||
        currentStatus === "not_started"
      ) {
        updatePayload.status = "in_progress";
      } else if (currentStatus !== "completed") {
        updatePayload.status = "in_progress";
      }
    }

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
      watch_seconds: mergedWatch,
      click_count: mergedClick,
      watch_completed: shouldMarkWatched,
      status: shouldMarkWatched ? "completed" : "in_progress",
      last_position_seconds: mergedLastPosition,
      max_watched_seconds: mergedMaxWatched,
    });
  } catch (err) {
    console.error("progress route error:", err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}