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

  // 🔥 YENİ ALANLAR
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
    const assignmentId = body?.assignmentId as string;
    const action = body?.action as TrainingAction;
    const currentSecond = body?.currentSecond || 0;
    const duration = body?.duration || 0;

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

    // 🔥 OPEN
    if (action === "open") {
      const now = new Date().toISOString();

      const payload: any = {
        last_opened_at: now,
      };

      if (row.status === "assigned" || row.status === "not_started") {
        payload.status = "in_progress";
      }

      if (!row.started_at) {
        payload.started_at = now;
      }

      await supabase
        .from("training_assignments")
        .update(payload)
        .eq("id", assignmentId);

      return NextResponse.json({ success: true });
    }

    // 🔥 HEARTBEAT (EN KRİTİK)
    if (action === "heartbeat") {
      const maxWatched = Math.max(
        row.max_watched_seconds || 0,
        currentSecond
      );

      await supabase
        .from("training_assignments")
        .update({
          last_opened_at: new Date().toISOString(),
          last_position_seconds: currentSecond,
          max_watched_seconds: maxWatched,
        })
        .eq("id", assignmentId);

      return NextResponse.json({ success: true });
    }

    // 🔥 MARK WATCHED
    if (action === "mark_watched") {
      if (!row.started_at) {
        return NextResponse.json(
          { error: "Önce eğitimi açmalısın." },
          { status: 400 }
        );
      }

      await supabase
        .from("training_assignments")
        .update({
          watch_completed: true,
          watch_completed_at: new Date().toISOString(),
        })
        .eq("id", assignmentId);

      return NextResponse.json({ success: true });
    }

    // 🔥 COMPLETE (EN KRİTİK)
    if (action === "complete") {
      if (!row.started_at) {
        return NextResponse.json(
          { error: "Eğitimi açmadan tamamlayamazsın." },
          { status: 400 }
        );
      }

      if (!row.watch_completed) {
        return NextResponse.json(
          { error: "Video bitmeden tamamlanamaz." },
          { status: 400 }
        );
      }

      if (row.status !== "in_progress") {
        return NextResponse.json(
          { error: "Geçersiz durum." },
          { status: 400 }
        );
      }

      await supabase
        .from("training_assignments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),

          // 🔥 EN KRİTİK NOKTA
          locked_duration_seconds:
            row.locked_duration_seconds || duration,
        })
        .eq("id", assignmentId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  } catch (err) {
    console.error("Training update hata:", err);
    return NextResponse.json(
      { error: "Sunucu hatası." },
      { status: 500 }
    );
  }
}