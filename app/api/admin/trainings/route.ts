import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type TrainingRow = {
  id: string;
  title: string | null;
  description: string | null;
  type: string | null;
  duration_minutes: number | null;
  content_url: string | null;
  topics_text: string | null;
};

type AssignmentStatRow = {
  training_id: string;
  status: string | null;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;

    if (adminAuth !== "ok") {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    const { data: trainings, error: trainingsError } = await supabase
      .from("trainings")
      .select(
        "id, title, description, type, duration_minutes, content_url, topics_text"
      )
      .order("title", { ascending: true });

    if (trainingsError) {
      console.error("Admin trainings fetch hatası:", trainingsError);
      return NextResponse.json(
        { error: "Eğitimler alınamadı." },
        { status: 500 }
      );
    }

    const trainingRows = (trainings || []) as TrainingRow[];

    const trainingIds = trainingRows.map((t) => t.id).filter(Boolean);

    let statsMap = new Map<
      string,
      {
        assigned_count: number;
        not_started_count: number;
        in_progress_count: number;
        completed_count: number;
      }
    >();

    if (trainingIds.length > 0) {
      const { data: assignmentStats, error: assignmentStatsError } = await supabase
        .from("training_assignments")
        .select("training_id, status")
        .in("training_id", trainingIds);

      if (assignmentStatsError) {
        console.error("Training assignment stats fetch hatası:", assignmentStatsError);
      } else {
        for (const row of (assignmentStats || []) as AssignmentStatRow[]) {
          const trainingId = String(row.training_id);
          const status = String(row.status || "not_started");

          const current = statsMap.get(trainingId) || {
            assigned_count: 0,
            not_started_count: 0,
            in_progress_count: 0,
            completed_count: 0,
          };

          current.assigned_count += 1;

          if (status === "completed") {
            current.completed_count += 1;
          } else if (status === "in_progress") {
            current.in_progress_count += 1;
          } else {
            current.not_started_count += 1;
          }

          statsMap.set(trainingId, current);
        }
      }
    }

    const normalized = trainingRows.map((t) => {
      const stat = statsMap.get(String(t.id)) || {
        assigned_count: 0,
        not_started_count: 0,
        in_progress_count: 0,
        completed_count: 0,
      };

      return {
        id: String(t.id),
        title: (t.title || "Adsız Eğitim").trim(),
        description: (t.description || "Açıklama bulunmuyor.").trim(),
        type: (t.type || "online").trim(),
        duration_minutes:
          typeof t.duration_minutes === "number" ? t.duration_minutes : null,
        content_url: (t.content_url || "").trim(),
        topics_text: (t.topics_text || "").trim(),
        assigned_count: stat.assigned_count,
        not_started_count: stat.not_started_count,
        in_progress_count: stat.in_progress_count,
        completed_count: stat.completed_count,
      };
    });

    return NextResponse.json({
      data: normalized,
    });
  } catch (error) {
    console.error("Admin trainings genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}