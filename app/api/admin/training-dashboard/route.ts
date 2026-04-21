import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
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
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
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
        {
          error: "Eğitim atamaları alınamadı.",
          detail: assignmentsError.message,
        },
        { status: 500 }
      );
    }

    const allAssignmentRows = assignments || [];

    const trainingIds = Array.from(
      new Set(allAssignmentRows.map((a) => a.training_id).filter(Boolean))
    );

    const userIds = Array.from(
      new Set(allAssignmentRows.map((a) => a.user_id).filter(Boolean))
    );

    let trainingsMap: Record<string, TrainingRow> = {};
    let usersMap: Record<string, UserRow> = {};
    let companyMap: Record<string, string> = {};

    if (trainingIds.length > 0) {
      const { data: trainings, error: trainingsError } = await supabase
        .from("trainings")
        .select("id, title")
        .in("id", trainingIds)
        .returns<TrainingRow[]>();

      if (trainingsError) {
        return NextResponse.json(
          {
            error: "Eğitim detayları alınamadı.",
            detail: trainingsError.message,
          },
          { status: 500 }
        );
      }

      trainingsMap = Object.fromEntries((trainings || []).map((t) => [t.id, t]));
    }

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
          {
            error: "Kullanıcı detayları alınamadı.",
            detail: usersError.message,
          },
          { status: 500 }
        );
      }

      usersMap = Object.fromEntries((users || []).map((u) => [u.id, u]));

     let companiesQuery = supabase
  .from("companies")
  .select("id, name");

if (adminRole === "company_admin") {
  companiesQuery = companiesQuery.eq("id", companyIdFromCookie);
}

const { data: companies, error: companiesError } = await companiesQuery.returns<CompanyRow[]>();

if (companiesError) {
  return NextResponse.json(
    {
      error: "Firma detayları alınamadı.",
      detail: companiesError.message,
    },
    { status: 500 }
  );
}

companyMap = Object.fromEntries(
  (companies || []).map((c) => [
    String(c.id || "").trim(),
    String(c.name || "Firma Yok").trim() || "Firma Yok",
  ])
);
    }

    const allowedUserIds = new Set(Object.keys(usersMap));
    const assignmentRows = allAssignmentRows.filter((row) =>
      allowedUserIds.has(row.user_id)
    );

    const trainingStatsMap = new Map<
      string,
      {
        id: string;
        title: string;
        assigned_count: number;
        not_started_count: number;
        in_progress_count: number;
        completed_count: number;
      }
    >();

    let totalAssigned = 0;
    let totalCompleted = 0;
    let totalInProgress = 0;
    let totalNotStarted = 0;

    for (const row of assignmentRows) {
      const trainingId = row.training_id;
      if (!trainingId) continue;

      const current = trainingStatsMap.get(trainingId) || {
        id: trainingId,
        title: trainingsMap[trainingId]?.title || "Eğitim",
        assigned_count: 0,
        not_started_count: 0,
        in_progress_count: 0,
        completed_count: 0,
      };

      current.assigned_count += 1;
      totalAssigned += 1;

      const isCompleted =
        row.final_exam_passed === true || row.status === "completed";

      if (isCompleted) {
        current.completed_count += 1;
        totalCompleted += 1;
      } else if (row.status === "in_progress") {
        current.in_progress_count += 1;
        totalInProgress += 1;
      } else {
        current.not_started_count += 1;
        totalNotStarted += 1;
      }

      trainingStatsMap.set(trainingId, current);
    }

    const riskyUsers = assignmentRows
      .filter((row) => {
        const isCompleted =
          row.final_exam_passed === true || row.status === "completed";
        return !isCompleted && row.status !== "in_progress";
      })
      .map((row) => {
        const rawCompanyId = String(usersMap[row.user_id]?.company_id || "").trim();

        return {
          assignment_id: row.id,
          user_id: row.user_id,
          training_id: row.training_id,
          full_name: usersMap[row.user_id]?.full_name || "Kullanıcı",
          email: usersMap[row.user_id]?.email || "",
          company_id: companyMap[rawCompanyId] || "Firma Yok",
          training_title: trainingsMap[row.training_id]?.title || "Eğitim",
          status: "not_started" as const,
        };
      });

    const inProgressUsers = assignmentRows
      .filter(
        (row) => row.status === "in_progress" && row.final_exam_passed !== true
      )
      .map((row) => {
        const rawCompanyId = String(usersMap[row.user_id]?.company_id || "").trim();

        return {
          assignment_id: row.id,
          user_id: row.user_id,
          training_id: row.training_id,
          full_name: usersMap[row.user_id]?.full_name || "Kullanıcı",
          email: usersMap[row.user_id]?.email || "",
          company_id: companyMap[rawCompanyId] || "Firma Yok",
          training_title: trainingsMap[row.training_id]?.title || "Eğitim",
          status: "in_progress" as const,
        };
      });

    const completedUsers = assignmentRows
      .filter(
        (row) => row.final_exam_passed === true || row.status === "completed"
      )
      .map((row) => {
        const rawCompanyId = String(usersMap[row.user_id]?.company_id || "").trim();

        return {
          assignment_id: row.id,
          user_id: row.user_id,
          training_id: row.training_id,
          full_name: usersMap[row.user_id]?.full_name || "Kullanıcı",
          email: usersMap[row.user_id]?.email || "",
          company_id: companyMap[rawCompanyId] || "Firma Yok",
          training_title: trainingsMap[row.training_id]?.title || "Eğitim",
          status: "completed" as const,
        };
      });

    const trainings = Array.from(trainingStatsMap.values()).sort(
      (a, b) => b.assigned_count - a.assigned_count
    );

    const completionRate = totalAssigned
      ? Number(((totalCompleted / totalAssigned) * 100).toFixed(2))
      : 0;

    const inProgressRate = totalAssigned
      ? Number(((totalInProgress / totalAssigned) * 100).toFixed(2))
      : 0;

    const riskRate = totalAssigned
      ? Number(((totalNotStarted / totalAssigned) * 100).toFixed(2))
      : 0;

    const riskStatus =
      totalNotStarted > 20
        ? "KRITIK"
        : totalNotStarted > 10
        ? "ORTA"
        : "IYI";

    const companyRiskMap = new Map<string, number>();
    riskyUsers.forEach((u) => {
      const key = u.company_id || "Firma Yok";
      companyRiskMap.set(key, (companyRiskMap.get(key) || 0) + 1);
    });

    const companyDistribution = Array.from(companyRiskMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const monthlyTrend = [
      { label: "Tamamlandı", value: totalCompleted },
      { label: "Devam", value: totalInProgress },
      { label: "Başlamadı", value: totalNotStarted },
    ];

  return NextResponse.json({
  success: true,
  trainings,
  risky_users: riskyUsers,
  in_progress_users: inProgressUsers,
  completed_users: completedUsers,
  company_distribution: companyDistribution,
  company_list: Object.values(companyMap).sort((a, b) =>
    a.localeCompare(b, "tr")
  ),
  trend: monthlyTrend,
  summary: {
        total_assignments: totalAssigned,
        completed_count: totalCompleted,
        in_progress_count: totalInProgress,
        not_started_count: totalNotStarted,
        completion_rate: completionRate,
        in_progress_rate: inProgressRate,
        risk_rate: riskRate,
        risk_status: riskStatus,
      },
    });
  } catch (err) {
    console.error("admin training dashboard route error:", err);
    return NextResponse.json(
      {
        error: "Sunucu hatası.",
        detail: String(err),
      },
      { status: 500 }
    );
  }
}
