import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type TrainingStatus = "not_started" | "in_progress" | "completed";
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
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("dsec_user_id")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı yok." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const assignmentId = body?.assignmentId as string | undefined;
    const action = body?.action as TrainingAction | undefined;

    if (!assignmentId || !action) {
      return NextResponse.json(
        { error: "Eksik veri." },
        { status: 400 }
      );
    }

    if (
      action !== "open" &&
      action !== "mark_watched" &&
      action !== "complete" &&
      action !== "heartbeat"
    ) {
      return NextResponse.json(
        { error: "Geçersiz işlem." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: row, error: rowError } = await supabase
      .from("training_assignments")
      .select(
        "id, user_id, status, started_at, completed_at, last_opened_at, watch_completed, watch_completed_at"
      )
      .eq("id", assignmentId)
      .eq("user_id", userId)
      .single<TrainingAssignmentRow>();

    if (rowError || !row) {
      console.error("Training row fetch hatası:", rowError);
      return NextResponse.json(
        { error: "Kayıt bulunamadı." },
        { status: 404 }
      );
    }

    if (action === "open") {
      const now = new Date().toISOString();

      const updatePayload: Partial<TrainingAssignmentRow> = {
        last_opened_at: now,
      };

      if (row.status === "not_started") {
        updatePayload.status = "in_progress";
      }

      if (!row.started_at) {
        updatePayload.started_at = now;
      }

      const { error: openError } = await supabase
        .from("training_assignments")
        .update(updatePayload)
        .eq("id", assignmentId)
        .eq("user_id", userId);

      if (openError) {
        console.error("Training open update hatası:", openError);
        return NextResponse.json(
          { error: "Durum güncellenemedi." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === "heartbeat") {
      const { error: heartbeatError } = await supabase
        .from("training_assignments")
        .update({
          last_opened_at: new Date().toISOString(),
        })
        .eq("id", assignmentId)
        .eq("user_id", userId);

      if (heartbeatError) {
        console.error("Training heartbeat update hatası:", heartbeatError);
        return NextResponse.json(
          { error: "İzleme durumu güncellenemedi." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === "mark_watched") {
      if (!row.started_at) {
        return NextResponse.json(
          { error: "Önce eğitimi açmalısın." },
          { status: 400 }
        );
      }

      const { error: watchedError } = await supabase
        .from("training_assignments")
        .update({
          watch_completed: true,
          watch_completed_at: new Date().toISOString(),
        })
        .eq("id", assignmentId)
        .eq("user_id", userId);

      if (watchedError) {
        console.error("Training mark watched hatası:", watchedError);
        return NextResponse.json(
          { error: "İzleme durumu kaydedilemedi." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (!row.started_at) {
      return NextResponse.json(
        { error: "Eğitimi açmadan tamamlayamazsın." },
        { status: 400 }
      );
    }

    if (!row.watch_completed) {
      return NextResponse.json(
        { error: "Video %100 bitmeden eğitimi tamamlayamazsın." },
        { status: 400 }
      );
    }

    if (row.status !== "in_progress") {
      return NextResponse.json(
        { error: "Bu eğitim tamamlanabilir durumda değil." },
        { status: 400 }
      );
    }

    const { error: completeError } = await supabase
      .from("training_assignments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)
      .eq("user_id", userId);

    if (completeError) {
      console.error("Training complete update hatası:", completeError);
      return NextResponse.json(
        { error: "Güncelleme başarısız." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Training update genel hata:", err);
    return NextResponse.json(
      { error: "Sunucu hatası." },
      { status: 500 }
    );
  }
}