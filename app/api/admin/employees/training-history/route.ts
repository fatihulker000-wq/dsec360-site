import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function normalizeType(type?: string | null) {
  const t = String(type || "").toLowerCase();

  if (t.includes("senkron")) return "senkron";
  if (t.includes("asenkron") || t.includes("online")) return "asenkron";
  if (t.includes("orgun") || t.includes("örgün")) return "orgun";
  if (t.includes("ozel") || t.includes("özel")) return "ozel";

  return "egitim";
}

function isAppRecord(type?: string | null) {
  const t = normalizeType(type);
  return t === "orgun" || t === "ozel";
}

function normalizeStatus(
  status?: string | null,
  type?: string | null,
  watchCompleted?: boolean | null,
  finalExamPassed?: boolean | null
) {
  const s = String(status || "").toLowerCase();

  if (isAppRecord(type)) return "app_record";

  if (s === "completed" && watchCompleted === true && finalExamPassed === true) {
    return "completed";
  }

  if (s === "in_progress") return "in_progress";

  return "not_started";
}

function getSourceLabel(type?: string | null) {
  return isAppRecord(type) ? "App Kaydı" : "Portal Eğitimi";
}

function getTypeLabel(type?: string | null) {
  const t = normalizeType(type);

  if (t === "asenkron") return "Asenkron";
  if (t === "senkron") return "Senkron";
  if (t === "orgun") return "Örgün";
  if (t === "ozel") return "Özel";

  return "Eğitim";
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = cookieStore.get("dsec_admin_role")?.value;

    if (
      adminAuth !== "ok" ||
      (adminRole !== "super_admin" && adminRole !== "company_admin")
    ) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const employeeIds = String(searchParams.get("employeeIds") || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    if (employeeIds.length === 0) {
      return NextResponse.json({ data: {} });
    }

    const supabase = getSupabase();

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, employee_id")
      .in("employee_id", employeeIds);

    if (usersError) {
      return NextResponse.json(
        { error: "Eğitim kullanıcıları alınamadı.", detail: usersError.message },
        { status: 500 }
      );
    }

    const userRows = users || [];
    const userIds = userRows.map((u: any) => String(u.id)).filter(Boolean);

    if (userIds.length === 0) {
      return NextResponse.json({ data: {} });
    }

    const userToEmployee = new Map<string, string>();

    userRows.forEach((u: any) => {
      if (u.id && u.employee_id) {
        userToEmployee.set(String(u.id), String(u.employee_id));
      }
    });

    const { data: assignments, error: assignmentError } = await supabase
      .from("training_assignments")
      .select(
        "id, user_id, training_id, status, started_at, completed_at, created_at, watch_completed, final_exam_passed"
      )
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    if (assignmentError) {
      return NextResponse.json(
        { error: "Atamalar alınamadı.", detail: assignmentError.message },
        { status: 500 }
      );
    }

    const trainingIds = Array.from(
      new Set(
        (assignments || [])
          .map((a: any) => String(a.training_id || ""))
          .filter(Boolean)
      )
    );

    const trainingMap = new Map<string, any>();

    if (trainingIds.length > 0) {
      const { data: trainings, error: trainingsError } = await supabase
        .from("trainings")
        .select("id, title, type, duration_minutes, content_url")
        .in("id", trainingIds);

      if (trainingsError) {
        return NextResponse.json(
          { error: "Eğitim bilgileri alınamadı.", detail: trainingsError.message },
          { status: 500 }
        );
      }

      (trainings || []).forEach((t: any) => {
        trainingMap.set(String(t.id), t);
      });
    }

    const result: Record<string, any[]> = {};

    (assignments || []).forEach((a: any) => {
      const employeeId = userToEmployee.get(String(a.user_id));
      if (!employeeId) return;

      const training = trainingMap.get(String(a.training_id));
      const rawType = String(training?.type || "").toLowerCase();
      const normalizedType = normalizeType(rawType);
      const status = normalizeStatus(
        a.status,
        normalizedType,
        Boolean(a.watch_completed),
        Boolean(a.final_exam_passed)
      );

      if (!result[employeeId]) result[employeeId] = [];

      result[employeeId].push({
        assignment_id: String(a.id || ""),
        training_id: String(a.training_id || ""),
        title: training?.title || "Adsız Eğitim",

        type: normalizedType,
        type_label: getTypeLabel(normalizedType),

        source: getSourceLabel(normalizedType),
        source_key: isAppRecord(normalizedType) ? "app" : "portal",
        is_app_record: isAppRecord(normalizedType),

        status,
        duration_minutes: training?.duration_minutes || 0,
        content_url: training?.content_url || "",

        started_at: a.started_at || null,
        completed_at: a.completed_at || null,
        created_at: a.created_at || null,
        record_date: a.completed_at || a.started_at || a.created_at || null,

        watch_completed: Boolean(a.watch_completed),
        final_exam_passed: Boolean(a.final_exam_passed),
      });
    });

    return NextResponse.json({ data: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Sunucu hatası oluştu.", detail: error?.message || null },
      { status: 500 }
    );
  }
}