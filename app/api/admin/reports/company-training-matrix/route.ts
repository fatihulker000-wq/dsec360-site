import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type CompanyAnyRow = Record<string, unknown>;

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  company_id: string | null;
  role: string | null;
  is_active: boolean | null;
};

type TrainingRow = {
  id: string;
  title: string | null;
  type: string | null;
  duration_minutes?: number | null;
};

type AssignmentRow = {
  user_id: string;
  training_id: string;
  status: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  watch_completed?: boolean | null;
  final_exam_passed?: boolean | null;
};

function pickText(row: CompanyAnyRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "-";
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = cookieStore.get("dsec_admin_role")?.value;

    const userAuth = cookieStore.get("dsec_user_auth")?.value;
    const userRole = cookieStore.get("dsec_user_role")?.value;
    const userId = cookieStore.get("dsec_user_id")?.value; // 🔥 BU YOK ŞU AN

    const resolvedRole =
      adminAuth === "ok" && adminRole
        ? adminRole
        : userAuth === "ok" && userRole
        ? userRole
        : null;

    if (!resolvedRole) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    let requestedCompanyId = String(
      req.nextUrl.searchParams.get("companyId") || ""
    ).trim();

    if (resolvedRole === "company_admin") {
      if (!userId) {
        return NextResponse.json(
          { error: "Kullanıcı bilgisi bulunamadı." },
          { status: 401 }
        );
      }

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id, company_id")
        .eq("id", userId)
        .maybeSingle();

      if (userError || !userRow) {
        return NextResponse.json(
          { error: "Kullanıcı firma bilgisi alınamadı." },
          { status: 500 }
        );
      }

      const ownCompanyId = String(
        (userRow as { company_id?: string | null }).company_id || ""
      ).trim();

      if (!ownCompanyId) {
        return NextResponse.json(
          { error: "Bu kullanıcıya bağlı firma bulunamadı." },
          { status: 403 }
        );
      }

      requestedCompanyId = ownCompanyId;
    } else if (!(resolvedRole === "super_admin" || resolvedRole === "admin")) {
      return NextResponse.json(
        { error: "Bu rol raporlara erişemez." },
        { status: 403 }
      );
    }

    if (!requestedCompanyId) {
      return NextResponse.json(
        { error: "Firma seçilmedi." },
        { status: 400 }
      );
    }

    let companyRow: CompanyAnyRow;

if (requestedCompanyId === "ALL") {
  companyRow = {
    id: "ALL",
    name: "Tüm Firmalar",
  };
} else {
  const { data: companyData, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", requestedCompanyId)
    .maybeSingle();

  if (companyError || !companyData) {
    return NextResponse.json(
      { error: "Firma bilgisi alınamadı." },
      { status: 500 }
    );
  }

  companyRow = companyData as CompanyAnyRow;
}

    let usersQuery = supabase
  .from("users")
  .select("id, full_name, email, company_id, role, is_active")
  .eq("role", "training_user")
  .order("full_name", { ascending: true });

if (requestedCompanyId !== "ALL") {
  usersQuery = usersQuery.eq("company_id", requestedCompanyId);
}

const { data: usersData, error: usersError } = await usersQuery;

    if (usersError) {
      return NextResponse.json(
        { error: "Firma çalışanları alınamadı." },
        { status: 500 }
      );
    }

    const participants = ((usersData || []) as UserRow[]).map((u) => ({
      id: String(u.id),
      full_name: String(u.full_name || "Adsız Kullanıcı").trim(),
      email: String(u.email || "").trim(),
      is_active: Boolean(u.is_active),
    }));

    const participantIds = participants.map((p) => p.id);

    let assignedTrainingIds: string[] = [];

if (participantIds.length > 0) {
  const { data: assignedRows } = await supabase
    .from("training_assignments")
    .select("training_id")
    .in("user_id", participantIds);

  assignedTrainingIds = Array.from(
    new Set((assignedRows || []).map((r) => String(r.training_id)).filter(Boolean))
  );
}

let trainingsQuery = supabase
  .from("trainings")
  .select("id, title, type, duration_minutes")
  .order("title", { ascending: true });

if (requestedCompanyId !== "ALL" && assignedTrainingIds.length > 0) {
  trainingsQuery = trainingsQuery.in("id", assignedTrainingIds);
}

const { data: trainingsData, error: trainingsError } = await trainingsQuery;

    if (trainingsError) {
      return NextResponse.json(
        { error: "Eğitim listesi alınamadı." },
        { status: 500 }
      );
    }

    const trainings = ((trainingsData || []) as TrainingRow[]).map((t) => ({
  id: String(t.id),
  title: String(t.title || "Adsız Eğitim").trim(),
  type: String(t.type || "").trim().toLowerCase(),
  duration_minutes:
    typeof t.duration_minutes === "number" ? t.duration_minutes : 0,
}));

    let assignments: AssignmentRow[] = [];

    if (participantIds.length > 0) {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("training_assignments")
        .select("user_id, training_id, status, started_at, completed_at, created_at, watch_completed, final_exam_passed")
        .in("user_id", participantIds);

      if (assignmentsError) {
        return NextResponse.json(
          { error: "Eğitim atama verileri alınamadı." },
          { status: 500 }
        );
      }

      assignments = (assignmentsData || []) as AssignmentRow[];
    }


    const trainingTypeMap = new Map<string, string>();

trainings.forEach((t: any) => {
  trainingTypeMap.set(String(t.id), String(t.type || "").toLowerCase());
});

const trainingMetaMap = new Map<string, any>();

trainings.forEach((t: any) => {
  trainingMetaMap.set(String(t.id), t);
});

function resolveTrainingStatus(a: AssignmentRow) {
  const type = trainingTypeMap.get(String(a.training_id)) || "";

  const isAppRecord =
    type === "orgun" ||
    type === "örgün" ||
    type === "ozel" ||
    type === "özel";

  if (isAppRecord) return "App Kaydı";

  const isCompleted =
  a.status === "completed" &&
  (
    (a.watch_completed === true && a.final_exam_passed === true) ||
    (a.watch_completed !== false && a.final_exam_passed !== false)
  );

  if (isCompleted) return "Tamamlandı";
  if (a.status === "in_progress") return "Devam Ediyor";

  return "Başlamadı";
}

   const assignmentMap = new Map<string, any>();

assignments.forEach((a) => {
  const key = `${a.user_id}__${a.training_id}`;
  const trainingMeta = trainingMetaMap.get(String(a.training_id));

  assignmentMap.set(key, {
    status: resolveTrainingStatus(a),
    training_date: a.completed_at || a.started_at || a.created_at || null,
    duration_minutes: trainingMeta?.duration_minutes || 0,
    type: trainingMeta?.type || "",
  });
});

    const matrix = participants.map((participant) => {
      const statuses = trainings.map((training) => {
  const key = `${participant.id}__${training.id}`;
  const found = assignmentMap.get(key);

  return {
    training_id: training.id,
    status: found?.status || "Atanmadı",
    type: found?.type || training.type || "",
    duration_minutes: found?.duration_minutes || training.duration_minutes || 0,
    training_date: found?.training_date || null,
  };
});

      return {
        user_id: participant.id,
        full_name: participant.full_name,
        email: participant.email,
        is_active: participant.is_active,
        statuses,
      };
    });

    const completedCount = assignments.filter((a) => {
  const status = resolveTrainingStatus(a);
  return status === "Tamamlandı" || status === "App Kaydı";
}).length;

const inProgressCount = assignments.filter((a) => {
  return resolveTrainingStatus(a) === "Devam Ediyor";
}).length;

const appRecordCount = assignments.filter((a) => {
  return resolveTrainingStatus(a) === "App Kaydı";
}).length;

const notStartedCount = assignments.filter((a) => {
  return resolveTrainingStatus(a) === "Başlamadı";
}).length;

    return NextResponse.json({
      success: true,
      role: resolvedRole,
      company: {
        id: String(companyRow.id || requestedCompanyId),
        name: pickText(companyRow, ["name", "company_name", "firma_adi"]),
        company_title: pickText(companyRow, [
          "company_title",
          "title",
          "unvan",
          "company_official_title",
        ]),
        address: pickText(companyRow, ["address", "adres", "full_address"]),
        employer_representative: pickText(companyRow, [
          "employer_representative",
          "isveren_vekili",
          "authorized_person",
          "yetkili_kisi",
        ]),
        employee_count: participants.length,
      },
      summary: {
  total_employees: participants.length,
  total_trainings: trainings.length,
  total_assignments: assignments.length,
  completed_count: completedCount,
  app_record_count: appRecordCount,
  in_progress_count: inProgressCount,
  not_started_count: notStartedCount,
},
      trainings,
      matrix,
    });
  } catch (error) {
    console.error("company training matrix error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}