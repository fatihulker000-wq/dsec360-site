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
};

type AssignmentRow = {
  user_id: string;
  training_id: string;
  status: string | null;
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
    const userId = cookieStore.get("dsec_user_id")?.value;

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

    const companyRow = companyData as CompanyAnyRow;

    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email, company_id, role, is_active")
      .eq("company_id", requestedCompanyId)
      .eq("role", "training_user")
      .order("full_name", { ascending: true });

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

    const { data: trainingsData, error: trainingsError } = await supabase
      .from("trainings")
      .select("id, title")
      .order("title", { ascending: true });

    if (trainingsError) {
      return NextResponse.json(
        { error: "Eğitim listesi alınamadı." },
        { status: 500 }
      );
    }

    const trainings = ((trainingsData || []) as TrainingRow[]).map((t) => ({
      id: String(t.id),
      title: String(t.title || "Adsız Eğitim").trim(),
    }));

    let assignments: AssignmentRow[] = [];

    if (participantIds.length > 0) {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("training_assignments")
        .select("user_id, training_id, status, final_exam_passed")
        .in("user_id", participantIds);

      if (assignmentsError) {
        return NextResponse.json(
          { error: "Eğitim atama verileri alınamadı." },
          { status: 500 }
        );
      }

      assignments = (assignmentsData || []) as AssignmentRow[];
    }

    const assignmentMap = new Map<string, string>();

    assignments.forEach((a) => {
      const key = `${a.user_id}__${a.training_id}`;
      const status =
        a.final_exam_passed === true || a.status === "completed"
          ? "Tamamlandı"
          : a.status === "in_progress"
          ? "Devam Ediyor"
          : "Başlamadı";

      assignmentMap.set(key, status);
    });

    const matrix = participants.map((participant) => {
      const statuses = trainings.map((training) => {
        const key = `${participant.id}__${training.id}`;
        return {
          training_id: training.id,
          status: assignmentMap.get(key) || "Atanmadı",
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

    const completedCount = assignments.filter(
      (a) => a.final_exam_passed === true || a.status === "completed"
    ).length;

    const inProgressCount = assignments.filter(
      (a) => a.status === "in_progress" && a.final_exam_passed !== true
    ).length;

    const notStartedCount = assignments.filter(
      (a) =>
        a.final_exam_passed !== true &&
        a.status !== "completed" &&
        a.status !== "in_progress"
    ).length;

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