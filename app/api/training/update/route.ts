import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type TrainingStatus = "assigned" | "not_started" | "in_progress" | "completed";
type TrainingAction = "open" | "mark_watched" | "complete" | "heartbeat";

type TrainingAssignmentRow = {
  id: string;
  user_id: string;
  status: TrainingStatus;
  started_at: string | null;
  completed_at: string | null;
  last_opened_at: string | null;
  watch_completed: boolean | null;
  watch_completed_at: string | null;
  watch_seconds?: number | null;
  click_count?: number | null;
  last_position_seconds: number | null;
  max_watched_seconds: number | null;
  locked_duration_seconds: number | null;
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("dsec_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı yok." }, { status: 401 });
    }

    const body = await request.json();
    const assignmentId = String(body?.assignmentId || "").trim();
    const action = body?.action as TrainingAction;
    const currentSecond = Math.max(
      0,
      Math.floor(Number(body?.currentSecond || 0))
    );
    const duration = Math.max(0, Math.floor(Number(body?.duration || 0)));

    if (!assignmentId || !action) {
      return NextResponse.json({ error: "Eksik veri." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: row, error: rowError } = await supabase
      .from("training_assignments")
      .select("*")
      .eq("id", assignmentId)
      .eq("user_id", userId)
      .single<TrainingAssignmentRow>();

    if (rowError || !row) {
      return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
    }

    if (action === "open") {
      const now = new Date().toISOString();

      const payload: Record<string, unknown> = {
        last_opened_at: now,
      };

      if (row.status === "assigned" || row.status === "not_started") {
        payload.status = "in_progress";
      }

      if (!row.started_at) {
        payload.started_at = now;
      }

      const { error } = await supabase
        .from("training_assignments")
        .update(payload)
        .eq("id", assignmentId);

      if (error) {
        return NextResponse.json(
          { error: "Açılış kaydı güncellenemedi." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === "heartbeat") {
      const maxWatched = Math.max(
        Number(row.max_watched_seconds || 0),
        currentSecond
      );

      const watchSeconds = Math.max(
        Number(row.watch_seconds || 0),
        currentSecond
      );

      const payload: Record<string, unknown> = {
        last_opened_at: new Date().toISOString(),
        last_position_seconds: currentSecond,
        max_watched_seconds: maxWatched,
        watch_seconds: watchSeconds,
      };

      if (row.status === "assigned" || row.status === "not_started") {
        payload.status = "in_progress";
      }

      if (!row.started_at) {
        payload.started_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("training_assignments")
        .update(payload)
        .eq("id", assignmentId);

      if (error) {
        return NextResponse.json(
          { error: "Heartbeat kaydı güncellenemedi." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        max_watched_seconds: maxWatched,
        watch_seconds: watchSeconds,
      });
    }

    if (action === "mark_watched") {
      const now = new Date().toISOString();

      const safeWatchSeconds = Math.max(
        Number(row.watch_seconds || 0),
        Number(row.max_watched_seconds || 0),
        currentSecond,
        duration
      );

      const payload: Record<string, unknown> = {
        watch_completed: true,
        watch_completed_at: now,
        watch_seconds: safeWatchSeconds,
        last_position_seconds: Math.max(
          Number(row.last_position_seconds || 0),
          currentSecond
        ),
        max_watched_seconds: Math.max(
          Number(row.max_watched_seconds || 0),
          currentSecond,
          safeWatchSeconds
        ),
      };

      if (!row.started_at) {
        payload.started_at = now;
      }

      if (row.status === "assigned" || row.status === "not_started") {
        payload.status = "in_progress";
      }

      const { error } = await supabase
        .from("training_assignments")
        .update(payload)
        .eq("id", assignmentId);

      if (error) {
        return NextResponse.json(
          { error: "İzleme tamamlama kaydı güncellenemedi." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        watch_completed: true,
        watch_seconds: safeWatchSeconds,
      });
    }

    if (action === "complete") {
      const now = new Date().toISOString();

      const safeWatchSeconds = Math.max(
        Number(row.watch_seconds || 0),
        Number(row.max_watched_seconds || 0),
        currentSecond,
        duration
      );

      const payload: Record<string, unknown> = {
        status: "completed",
        completed_at: row.completed_at || now,
        watch_completed: true,
        watch_completed_at: row.watch_completed_at || now,
        watch_seconds: safeWatchSeconds,
        last_position_seconds: Math.max(
          Number(row.last_position_seconds || 0),
          currentSecond,
          safeWatchSeconds
        ),
        max_watched_seconds: Math.max(
          Number(row.max_watched_seconds || 0),
          currentSecond,
          safeWatchSeconds
        ),
        locked_duration_seconds:
          Number(row.locked_duration_seconds || 0) > 0
            ? Number(row.locked_duration_seconds || 0)
            : duration > 0
            ? duration
            : safeWatchSeconds,
      };

      if (!row.started_at) {
        payload.started_at = now;
      }

      const { error } = await supabase
        .from("training_assignments")
        .update(payload)
        .eq("id", assignmentId);

      if (error) {
        return NextResponse.json(
          { error: "Tamamlama kaydı güncellenemedi." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        status: "completed",
        watch_completed: true,
        watch_seconds: safeWatchSeconds,
      });
    }

    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  } catch (err) {
    console.error("Training update hata:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}