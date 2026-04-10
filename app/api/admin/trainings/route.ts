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
  created_at?: string | null;
};

type AssignmentAggRow = {
  training_id: string;
  status: "not_started" | "in_progress" | "completed" | null;
  final_exam_passed?: boolean | null;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = cookieStore.get("dsec_admin_role")?.value;

    const isAllowedRole =
      adminRole === "super_admin" || adminRole === "company_admin";

    if (adminAuth !== "ok" || !isAllowedRole) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    const { data: trainings, error: trainingsError } = await supabase
      .from("trainings")
      .select(`
        id,
        title,
        description,
        type,
        duration_minutes,
        content_url,
        topics_text,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (trainingsError) {
      console.error("Admin trainings fetch hatası:", trainingsError);
      return NextResponse.json(
        { error: "Eğitimler alınamadı." },
        { status: 500 }
      );
    }

    const trainingRows = (trainings || []) as TrainingRow[];

    const trainingIds = trainingRows.map((t) => String(t.id)).filter(Boolean);

    let assignmentMap = new Map<
      string,
      {
        assigned_count: number;
        not_started_count: number;
        in_progress_count: number;
        completed_count: number;
      }
    >();

    if (trainingIds.length > 0) {
      const { data: assignments, error: assignmentsError } = await supabase
        .from("training_assignments")
        .select("training_id, status, final_exam_passed")
        .in("training_id", trainingIds)
        .returns<AssignmentAggRow[]>();

      if (assignmentsError) {
        console.error("Training assignment stats fetch hatası:", assignmentsError);
        return NextResponse.json(
          { error: "Eğitim istatistikleri alınamadı." },
          { status: 500 }
        );
      }

      for (const row of assignments || []) {
        const trainingId = String(row.training_id || "").trim();
        if (!trainingId) continue;

        const current = assignmentMap.get(trainingId) || {
          assigned_count: 0,
          not_started_count: 0,
          in_progress_count: 0,
          completed_count: 0,
        };

        current.assigned_count += 1;

        const isCompleted =
          row.final_exam_passed === true || row.status === "completed";

        if (isCompleted) {
          current.completed_count += 1;
        } else if (row.status === "in_progress") {
          current.in_progress_count += 1;
        } else {
          current.not_started_count += 1;
        }

        assignmentMap.set(trainingId, current);
      }
    }

    const normalized = trainingRows.map((training) => {
      const stats = assignmentMap.get(String(training.id)) || {
        assigned_count: 0,
        not_started_count: 0,
        in_progress_count: 0,
        completed_count: 0,
      };

      return {
        id: String(training.id),
        title: (training.title || "Adsız Eğitim").trim(),
        description: (training.description || "Açıklama bulunmuyor.").trim(),
        type: (training.type || "asenkron").trim(),
        duration_minutes:
          typeof training.duration_minutes === "number"
            ? training.duration_minutes
            : null,
        content_url: (training.content_url || "").trim(),
        topics_text: (training.topics_text || "").trim(),
        assigned_count: stats.assigned_count,
        not_started_count: stats.not_started_count,
        in_progress_count: stats.in_progress_count,
        completed_count: stats.completed_count,
        created_at: training.created_at || null,
      };
    });

    return NextResponse.json({
      data: normalized,
      stats: {
        total_count: normalized.length,
        total_assigned_count: normalized.reduce(
          (sum, item) => sum + item.assigned_count,
          0
        ),
        total_completed_count: normalized.reduce(
          (sum, item) => sum + item.completed_count,
          0
        ),
        total_in_progress_count: normalized.reduce(
          (sum, item) => sum + item.in_progress_count,
          0
        ),
        total_not_started_count: normalized.reduce(
          (sum, item) => sum + item.not_started_count,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Admin trainings genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}