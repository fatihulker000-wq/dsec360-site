import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil.");
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

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function normalizeSlashes(value: string) {
  return value.replace(/\\/g, "/").replace(/^\/+/, "");
}

function resolveTrainingContentUrl(
  supabase: ReturnType<typeof getSupabase>,
  rawValue?: string | null
) {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "") || "";
  const raw = String(rawValue || "").trim();

  if (!raw) return null;

  if (isHttpUrl(raw)) {
    return raw;
  }

  if (raw.startsWith("/storage/v1/object/public/")) {
    return `${baseUrl}${raw}`;
  }

  if (raw.startsWith("storage/v1/object/public/")) {
    return `${baseUrl}/${raw}`;
  }

  if (raw.startsWith("public://")) {
    const withoutPrefix = raw.replace("public://", "");
    const normalized = normalizeSlashes(withoutPrefix);
    const firstSlash = normalized.indexOf("/");

    if (firstSlash === -1) return raw;

    const bucket = normalized.slice(0, firstSlash);
    const filePath = normalized.slice(firstSlash + 1);

    if (!bucket || !filePath) return raw;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data?.publicUrl || raw;
  }

  const normalized = normalizeSlashes(raw);

  if (!normalized.includes("://") && normalized.includes("/")) {
    const firstSlash = normalized.indexOf("/");
    const bucket = normalized.slice(0, firstSlash);
    const filePath = normalized.slice(firstSlash + 1);

    if (bucket && filePath) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }
  }

  return raw;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userIdRaw = cookieStore.get("dsec_user_id")?.value;
    const userId = userIdRaw ? userIdRaw.trim() : null;

    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı oturumu bulunamadı." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    let user: UserRow | { id: string; full_name: string } | null = null;

    if (userId === "admin-1") {
      user = {
        id: "admin-1",
        full_name: "Admin Kullanıcı",
      };
    } else {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("id", userId)
        .maybeSingle<UserRow>();

      if (userError) {
        console.error("users fetch hatası:", userError);
        return NextResponse.json(
          { error: "Kullanıcı bilgileri alınamadı." },
          { status: 500 }
        );
      }

      if (!userData) {
        return NextResponse.json(
          { error: "Kullanıcı kaydı bulunamadı." },
          { status: 401 }
        );
      }

      user = userData;
    }

    let assignmentsQuery = supabase
      .from("training_assignments")
      .select(
        "id, user_id, training_id, status, started_at, completed_at, watch_completed, watch_seconds, click_count, pre_exam_completed, pre_exam_score, final_exam_score, final_exam_attempts, final_exam_passed, training_reset_required, training_repeat_count"
      )
      .order("started_at", { ascending: false })
      .order("id", { ascending: false });

    if (userId !== "admin-1") {
      assignmentsQuery = assignmentsQuery.eq("user_id", userId);
    }

    const { data: assignments, error: assignmentsError } =
      await assignmentsQuery.returns<TrainingAssignmentRow[]>();

    if (assignmentsError) {
      console.error("training_assignments fetch hatası:", assignmentsError);
      return NextResponse.json(
        { error: "Eğitim verileri alınamadı." },
        { status: 500 }
      );
    }

    const safeAssignments = assignments || [];

    const trainingIds = Array.from(
      new Set(
        safeAssignments
          .map((item) => item.training_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    let trainingsMap: Record<string, TrainingRow> = {};

    if (trainingIds.length > 0) {
      const { data: trainings, error: trainingsError } = await supabase
        .from("trainings")
        .select("id, title, description, content_url, type")
        .in("id", trainingIds)
        .returns<TrainingRow[]>();

      if (trainingsError) {
        console.error("trainings fetch hatası:", trainingsError);
        return NextResponse.json(
          { error: "Eğitim detayları alınamadı." },
          { status: 500 }
        );
      }

      trainingsMap = Object.fromEntries(
        (trainings || []).map((item) => [item.id, item])
      );
    }

    const result = safeAssignments.map((item) => {
      const training = item.training_id
        ? trainingsMap[item.training_id] || null
        : null;

      const rawContentUrl = training?.content_url || null;
      const resolvedContentUrl = resolveTrainingContentUrl(
        supabase,
        rawContentUrl
      );

      const isReset = item.training_reset_required === true;

      return {
        id: item.id,
        user_id: item.user_id,
        training_id: item.training_id,
        status: isReset ? "not_started" : item.status || "not_started",
        started_at: isReset ? null : item.started_at,
        completed_at: isReset ? null : item.completed_at,
        watch_completed: isReset ? false : Boolean(item.watch_completed),
        watch_seconds: isReset ? 0 : Number(item.watch_seconds || 0),
        click_count: isReset ? 0 : Number(item.click_count || 0),
        pre_exam_completed: isReset ? false : Boolean(item.pre_exam_completed),
        pre_exam_score: isReset ? 0 : Number(item.pre_exam_score || 0),
        final_exam_score:
          item.final_exam_score !== null && item.final_exam_score !== undefined
            ? Number(item.final_exam_score)
            : null,
        final_exam_attempts: isReset ? 0 : Number(item.final_exam_attempts || 0),
        final_exam_passed: Boolean(item.final_exam_passed),
        training_reset_required: Boolean(item.training_reset_required),
        training_repeat_count: Number(item.training_repeat_count || 0),
        training: training
          ? {
              ...training,
              raw_content_url: rawContentUrl,
              content_url: resolvedContentUrl,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      user,
      data: result,
    });
  } catch (err) {
    console.error("training/my genel hata:", err);

    const message = err instanceof Error ? err.message : "Sunucu hatası";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}