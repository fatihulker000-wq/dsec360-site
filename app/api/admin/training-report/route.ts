import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type AssignmentRow = {
  id: string;
  user_id: string;
  training_id: string;
  status: "not_started" | "in_progress" | "completed" | null;
  final_exam_passed?: boolean | null;
};

type TrainingRow = {
  id: string;
  title: string | null;
};

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  company_id: string | null;
};

type CompanyRow = {
  id: string;
  name: string | null;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = cookieStore.get("dsec_admin_role")?.value;
    const companyIdFromCookie = String(
      cookieStore.get("dsec_company_id")?.value || ""
    ).trim();

    const isAllowedRole =
      adminRole === "super_admin" || adminRole === "company_admin";

    if (adminAuth !== "ok" || !isAllowedRole) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    if (adminRole === "company_admin" && !companyIdFromCookie) {
      return NextResponse.json(
        { error: "Firma yöneticisi için firma bilgisi bulunamadı." },
        { status: 403 }
      );
    }

    const supabase = getSupabase();

    const { data: assignments, error: assignmentsError } = await supabase
      .from("training_assignments")
      .select("id, user_id, training_id, status, final_exam_passed")
      .returns<AssignmentRow[]>();

    if (assignmentsError) {
      return NextResponse.json(
        { error: "Eğitim atamaları alınamadı." },
        { status: 500 }
      );
    }

    const assignmentRows = assignments || [];
    const userIds = Array.from(
      new Set(assignmentRows.map((x) => x.user_id).filter(Boolean))
    );
    const trainingIds = Array.from(
      new Set(assignmentRows.map((x) => x.training_id).filter(Boolean))
    );

    let usersMap: Record<string, UserRow> = {};
    let trainingsMap: Record<string, TrainingRow> = {};
    let companyMap: Record<string, string> = {};

    if (userIds.length > 0) {
      let userQuery = supabase
        .from("users")
        .select("id, full_name, email, company_id")
        .in("id", userIds);

      if (adminRole === "company_admin") {
        userQuery = userQuery.eq("company_id", companyIdFromCookie);
      }

      const { data: users, error: usersError } = await userQuery.returns<UserRow[]>();

      if (usersError) {
        return NextResponse.json(
          { error: "Kullanıcı detayları alınamadı." },
          { status: 500 }
        );
      }

      usersMap = Object.fromEntries((users || []).map((u) => [u.id, u]));

      const companyIds = Array.from(
        new Set(
          (users || [])
            .map((u) => String(u.company_id || "").trim())
            .filter(Boolean)
        )
      );

      if (companyIds.length > 0) {
        const { data: companies, error: companiesError } = await supabase
          .from("companies")
          .select("id, name")
          .in("id", companyIds)
          .returns<CompanyRow[]>();

        if (!companiesError) {
          companyMap = Object.fromEntries(
            (companies || []).map((c) => [
              c.id,
              String(c.name || "Firma Yok").trim() || "Firma Yok",
            ])
          );
        }
      }
    }

    if (trainingIds.length > 0) {
      const { data: trainings, error: trainingsError } = await supabase
        .from("trainings")
        .select("id, title")
        .in("id", trainingIds)
        .returns<TrainingRow[]>();

      if (trainingsError) {
        return NextResponse.json(
          { error: "Eğitim detayları alınamadı." },
          { status: 500 }
        );
      }

      trainingsMap = Object.fromEntries((trainings || []).map((t) => [t.id, t]));
    }

    const allowedUserIds = new Set(Object.keys(usersMap));

    const mapped = assignmentRows
      .filter((row) => allowedUserIds.has(row.user_id))
      .map((row) => {
        const user = usersMap[row.user_id];
        const rawCompanyId = String(user?.company_id || "").trim();
        const status =
          row.final_exam_passed === true || row.status === "completed"
            ? "completed"
            : row.status === "in_progress"
            ? "in_progress"
            : "not_started";

        return {
          user: user?.full_name || user?.email || "-",
          training: trainingsMap[row.training_id]?.title || "Eğitim",
          status,
          company: companyMap[rawCompanyId] || "Firma Yok",
        };
      });

    return NextResponse.json({ data: mapped });
  } catch (error) {
    console.error("admin training report error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
