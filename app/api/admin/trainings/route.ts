import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
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
  catalog_visible: boolean | null;
  catalog_key: string | null;
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

type VideoAggRow = {
  training_id: string;
  duration_seconds: number | null;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeTrainingType(value: unknown) {
  const raw = text(value).toLocaleLowerCase("tr-TR");

  if (raw.includes("senkron") && !raw.includes("asenkron")) {
    return "senkron";
  }

  if (raw.includes("orgun") || raw.includes("örgün")) {
    return "orgun";
  }

  if (raw.includes("ozel") || raw.includes("özel")) {
    return "ozel";
  }

  return "asenkron";
}

async function getAdminContext() {
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

  return {
    adminAuth,
    adminRole,
    companyId,
    isCompanyScoped,
    isAllowedRole,
  };
}

export async function GET(request: Request) {
  try {
    const auth = await getAdminContext();

    if (auth.adminAuth !== "ok" || !auth.isAllowedRole) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    if (auth.isCompanyScoped && !auth.companyId) {
      return NextResponse.json(
        { error: "Kullanıcı için firma bilgisi bulunamadı." },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const includeArchived =
      url.searchParams.get("includeArchived") === "1";

    const supabase = getSupabase();

    let scopedUserIds: string[] | null = null;

    if (auth.isCompanyScoped) {
      const [
        { data: directUsers, error: directUsersError },
        accessResult,
      ] = await Promise.all([
        supabase
          .from("users")
          .select("id")
          .eq("company_id", auth.companyId),

        supabase
          .from("user_firm_access")
          .select("user_id")
          .eq("firm_id", auth.companyId),
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

    let trainingQuery = supabase
      .from("trainings")
      .select(`
        id,
        title,
        description,
        type,
        duration_minutes,
        content_url,
        topics_text,
        catalog_visible,
        catalog_key,
        created_at
      `)
      .order("created_at", { ascending: true });

    if (!includeArchived) {
      trainingQuery = trainingQuery.eq("catalog_visible", true);
    }

    const { data: trainings, error: trainingsError } =
      await trainingQuery;

    if (trainingsError) {
      console.error("Admin trainings fetch hatası:", trainingsError);

      return NextResponse.json(
        {
          error: "Eğitimler alınamadı.",
          detail: trainingsError.message,
        },
        { status: 500 }
      );
    }

    const trainingRows = (trainings || []) as TrainingRow[];
    const trainingIds = trainingRows
      .map((training) => String(training.id))
      .filter(Boolean);

    const assignmentMap = new Map<
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

      if (
        !auth.isCompanyScoped ||
        (scopedUserIds && scopedUserIds.length > 0)
      ) {
        let assignmentQuery = supabase
          .from("training_assignments")
          .select(
            "training_id, user_id, status, watch_completed, video_chain_completed, final_exam_passed"
          )
          .in("training_id", trainingIds);

        if (auth.isCompanyScoped && scopedUserIds) {
          assignmentQuery = assignmentQuery.in(
            "user_id",
            scopedUserIds
          );
        }

        const assignmentResult =
          await assignmentQuery.returns<AssignmentAggRow[]>();

        assignments = assignmentResult.data || [];
        assignmentsError = assignmentResult.error;
      }

      if (assignmentsError) {
        console.error(
          "Training assignment stats fetch hatası:",
          assignmentsError
        );

        return NextResponse.json(
          { error: "Eğitim istatistikleri alınamadı." },
          { status: 500 }
        );
      }

      const trainingTypeById = new Map(
        trainingRows.map((training) => [
          String(training.id),
          normalizeTrainingType(training.type),
        ])
      );

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
          trainingTypeById.get(trainingId) === "asenkron";

        const isCompleted = isOnlineType
          ? row.status === "completed" &&
            (row.video_chain_completed === true ||
              row.watch_completed === true) &&
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

    const videoCountMap = new Map<string, number>();
    const videoDurationSecondsMap = new Map<string, number>();
    const preExamCountMap = new Map<string, number>();
    const finalExamCountMap = new Map<string, number>();

    if (trainingIds.length > 0) {
      const { data: videos, error: videosError } =
        await supabase
          .from("training_videos")
          .select("training_id,duration_seconds")
          .in("training_id", trainingIds)
          .eq("is_active", true);

      if (videosError) {
        return NextResponse.json(
          {
            error: "Video istatistikleri alınamadı.",
            detail: videosError.message,
          },
          { status: 500 }
        );
      }

      for (const row of (videos || []) as VideoAggRow[]) {
        const trainingId = String(row.training_id || "").trim();
        if (!trainingId) continue;

        videoCountMap.set(
          trainingId,
          (videoCountMap.get(trainingId) || 0) + 1
        );

        videoDurationSecondsMap.set(
          trainingId,
          (videoDurationSecondsMap.get(trainingId) || 0) +
            Math.max(0, Number(row.duration_seconds || 0))
        );
      }

      const { data: examQuestions, error: examQuestionError } =
        await supabase
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

    // Sürenin tek kaynağı aktif videoların duration_seconds toplamıdır.
    // Mevcut sertifika motoru duration_minutes kullanıyorsa da güncel değeri alabilsin
    // diye trainings.duration_minutes alanını otomatik senkron tutuyoruz.
    for (const training of trainingRows) {
      const trainingId = String(training.id);
      const totalSeconds =
        videoDurationSecondsMap.get(trainingId) || 0;

      const computedMinutes =
        totalSeconds > 0
          ? Math.ceil(totalSeconds / 60)
          : null;

      const storedMinutes =
        typeof training.duration_minutes === "number"
          ? training.duration_minutes
          : null;

      if (storedMinutes !== computedMinutes) {
        const { error: durationSyncError } = await supabase
          .from("trainings")
          .update({
            duration_minutes: computedMinutes,
          })
          .eq("id", trainingId);

        if (durationSyncError) {
          console.error(
            "Eğitim video süresi duration_minutes alanına yazılamadı:",
            durationSyncError.message
          );
        }
      }
    }

    const normalized = trainingRows.map((training) => {
      const id = String(training.id);

      const stats = assignmentMap.get(id) || {
        assigned_count: 0,
        not_started_count: 0,
        in_progress_count: 0,
        completed_count: 0,
      };

      const durationSeconds =
        videoDurationSecondsMap.get(id) || 0;

      return {
        id,
        title: (training.title || "Adsız Eğitim").trim(),
        description: (
          training.description || "Açıklama bulunmuyor."
        ).trim(),
        type: (training.type || "asenkron").trim(),

        duration_seconds: durationSeconds,
        duration_minutes:
          durationSeconds > 0
            ? Math.ceil(durationSeconds / 60)
            : null,

        content_url: (training.content_url || "").trim(),
        topics_text: (training.topics_text || "").trim(),

        catalog_visible: training.catalog_visible !== false,
        catalog_key: training.catalog_key || null,

        video_count: videoCountMap.get(id) || 0,
        pre_exam_count: preExamCountMap.get(id) || 0,
        final_exam_count: finalExamCountMap.get(id) || 0,

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

export async function POST(request: Request) {
  try {
    const auth = await getAdminContext();

    if (
      auth.adminAuth !== "ok" ||
      !["super_admin", "company_admin"].includes(auth.adminRole)
    ) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const title = text(body.title);
    const description = text(body.description);
    const type = normalizeTrainingType(body.type);

    if (!title) {
      return NextResponse.json(
        { error: "Eğitim adı zorunludur." },
        { status: 400 }
      );
    }

    if (title.length > 180) {
      return NextResponse.json(
        {
          error: "Eğitim adı en fazla 180 karakter olabilir.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: existing, error: existingError } =
      await supabase
        .from("trainings")
        .select("id,title,catalog_visible")
        .ilike("title", title)
        .limit(1);

    if (existingError) {
      return NextResponse.json(
        {
          error: "Eğitim adı kontrol edilemedi.",
          detail: existingError.message,
        },
        { status: 500 }
      );
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          error: "Bu isimde bir eğitim zaten mevcut.",
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("trainings")
      .insert({
        title,
        description: description || null,
        type,
        duration_minutes: null,
        content_url: null,
        topics_text: null,
        catalog_visible: true,
        catalog_key: null,
      })
      .select(
        "id,title,description,type,duration_minutes,content_url,topics_text,catalog_visible,catalog_key,created_at"
      )
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: "Eğitim oluşturulamadı.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...data,
          duration_seconds: 0,
          duration_minutes: null,
          video_count: 0,
          pre_exam_count: 0,
          final_exam_count: 0,
          assigned_count: 0,
          not_started_count: 0,
          in_progress_count: 0,
          completed_count: 0,
        },
        message: "Eğitim kataloğa eklendi.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Training create error:", error);

    return NextResponse.json(
      {
        error: "Eğitim oluşturulurken sunucu hatası oluştu.",
      },
      { status: 500 }
    );
  }
}