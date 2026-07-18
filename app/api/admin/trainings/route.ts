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
  user_id: string | null;
  status: "not_started" | "in_progress" | "completed" | null;
  watch_completed?: boolean | null;
  video_chain_completed?: boolean | null;
  final_exam_passed?: boolean | null;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminAuth = String(
  cookieStore.get("dsec_admin_auth")?.value ||
    cookieStore.get("dsec_user_auth")?.value ||
    ""
).trim();

const adminRole = String(
  cookieStore.get("dsec_admin_role")?.value ||
    cookieStore.get("dsec_user_role")?.value ||
    ""
).trim();

const companyId = String(
  cookieStore.get("dsec_company_id")?.value || ""
).trim();

const isCompanyScoped =
  adminRole === "company_admin" || adminRole === "demo_user";

const isAllowedRole =
  adminRole === "super_admin" ||
  adminRole === "company_admin" ||
  adminRole === "demo_user";

    if (adminAuth !== "ok" || !isAllowedRole) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

if (isCompanyScoped && !companyId) {
  return NextResponse.json(
    { error: "Kullanıcı için firma bilgisi bulunamadı." },
    { status: 403 }
  );
}

    const supabase = getSupabase();

let scopedUserIds: string[] | null = null;

if (isCompanyScoped) {
  const [{ data: directUsers, error: directUsersError }, accessResult] =
    await Promise.all([
      supabase
        .from("users")
        .select("id")
        .eq("company_id", companyId),

      supabase
        .from("user_firm_access")
        .select("user_id")
        .eq("firm_id", companyId),
    ]);

  if (directUsersError || accessResult.error) {
    console.error(
      "Firma eğitim kullanıcıları alınamadı:",
      directUsersError || accessResult.error
    );

    return NextResponse.json(
      { error: "Firma kullanıcıları alınamadı." },
      { status: 500 }
    );
  }

  scopedUserIds = Array.from(
    new Set([
      ...(directUsers || []).map((row: any) =>
        String(row.id || "").trim()
      ),
      ...(accessResult.data || []).map((row: any) =>
        String(row.user_id || "").trim()
      ),
    ])
  ).filter(Boolean);
}

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
      let assignments: AssignmentAggRow[] = [];
let assignmentsError: any = null;

if (!isCompanyScoped || (scopedUserIds && scopedUserIds.length > 0)) {
  let assignmentQuery = supabase
    .from("training_assignments")
    .select(
      "training_id, user_id, status, watch_completed, video_chain_completed, final_exam_passed"
    )
    .in("training_id", trainingIds);

  if (isCompanyScoped && scopedUserIds) {
    assignmentQuery = assignmentQuery.in("user_id", scopedUserIds);
  }

  const assignmentResult =
    await assignmentQuery.returns<AssignmentAggRow[]>();

  assignments = assignmentResult.data || [];
  assignmentsError = assignmentResult.error;
}

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

        const isOnlineType =
  String(
    trainingRows.find(t => String(t.id) === trainingId)?.type || ""
  )
    .toLowerCase()
    .includes("online") ||
  String(
    trainingRows.find(t => String(t.id) === trainingId)?.type || ""
  )
    .toLowerCase()
    .includes("asenkron");

const isCompleted = isOnlineType
  ? row.status === "completed" &&
    (row.video_chain_completed === true || row.watch_completed === true) &&
    row.final_exam_passed === true
  : row.status === "completed";

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

    let videoCountMap = new Map<string, number>();
let preExamCountMap = new Map<string, number>();
let finalExamCountMap = new Map<string, number>();

if (trainingIds.length > 0) {
  const { data: videos, error: videosError } = await supabase
    .from("training_videos")
    .select("training_id")
    .in("training_id", trainingIds)
    .eq("is_active", true);

  if (videosError) {
    return NextResponse.json(
      { error: "Video istatistikleri alınamadı." },
      { status: 500 }
    );
  }

  for (const row of videos || []) {
    const trainingId = String(row.training_id || "").trim();
    videoCountMap.set(trainingId, (videoCountMap.get(trainingId) || 0) + 1);
  }

  const { data: examQuestions, error: examQuestionError } = await supabase
    .from("training_exam_questions")
    .select("training_id, exam_type")
    .in("training_id", trainingIds)
    .eq("is_active", true);

  if (examQuestionError) {
    return NextResponse.json(
      { error: "Sınav istatistikleri alınamadı." },
      { status: 500 }
    );
  }

  for (const row of examQuestions || []) {
    const trainingId = String(row.training_id || "").trim();
    const examType = String(row.exam_type || "").trim();

    if (examType === "pre") {
      preExamCountMap.set(
        trainingId,
        (preExamCountMap.get(trainingId) || 0) + 1
      );
    }

    if (examType === "final") {
      finalExamCountMap.set(
        trainingId,
        (finalExamCountMap.get(trainingId) || 0) + 1
      );
    }
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
        video_count: videoCountMap.get(String(training.id)) || 0,
        pre_exam_count: preExamCountMap.get(String(training.id)) || 0,
        final_exam_count: finalExamCountMap.get(String(training.id)) || 0,
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