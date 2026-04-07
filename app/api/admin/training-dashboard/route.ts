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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = cookieStore.get("dsec_admin_role")?.value;

    const isAllowedRole =
      adminRole === "admin" || adminRole === "super_admin";

    if (adminAuth !== "ok" || !isAllowedRole) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
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

    const assignmentRows = assignments || [];

    const trainingIds = Array.from(
      new Set(assignmentRows.map((a) => a.training_id).filter(Boolean))
    );

    const userIds = Array.from(
      new Set(assignmentRows.map((a) => a.user_id).filter(Boolean))
    );

    let trainingsMap: Record<string, TrainingRow> = {};
    let usersMap: Record<string, UserRow> = {};

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
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, email, company_id")
        .in("id", userIds)
        .returns<UserRow[]>();

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
    }

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

      const isCompleted =
        row.final_exam_passed === true || row.status === "completed";

      if (isCompleted) {
        current.completed_count += 1;
      } else if (row.status === "in_progress") {
        current.in_progress_count += 1;
      } else {
        current.not_started_count += 1;
      }

      trainingStatsMap.set(trainingId, current);
    }

    const riskyUsers = assignmentRows
      .filter((row) => {
        const isCompleted =
          row.final_exam_passed === true || row.status === "completed";
        return !isCompleted && row.status !== "in_progress";
      })
      .map((row) => ({
        assignment_id: row.id,
        user_id: row.user_id,
        training_id: row.training_id,
        full_name: usersMap[row.user_id]?.full_name || "Kullanıcı",
        email: usersMap[row.user_id]?.email || "",
        company_id: usersMap[row.user_id]?.company_id || "",
        training_title: trainingsMap[row.training_id]?.title || "Eğitim",
        status: "not_started" as const,
      }));

    const inProgressUsers = assignmentRows
      .filter(
        (row) => row.status === "in_progress" && row.final_exam_passed !== true
      )
      .map((row) => ({
        assignment_id: row.id,
        user_id: row.user_id,
        training_id: row.training_id,
        full_name: usersMap[row.user_id]?.full_name || "Kullanıcı",
        email: usersMap[row.user_id]?.email || "",
        company_id: usersMap[row.user_id]?.company_id || "",
        training_title: trainingsMap[row.training_id]?.title || "Eğitim",
        status: "in_progress" as const,
      }));

    const completedUsers = assignmentRows
      .filter(
        (row) => row.final_exam_passed === true || row.status === "completed"
      )
      .map((row) => ({
        assignment_id: row.id,
        user_id: row.user_id,
        training_id: row.training_id,
        full_name: usersMap[row.user_id]?.full_name || "Kullanıcı",
        email: usersMap[row.user_id]?.email || "",
        company_id: usersMap[row.user_id]?.company_id || "",
        training_title: trainingsMap[row.training_id]?.title || "Eğitim",
        status: "completed" as const,
      }));

    const trainings = Array.from(trainingStatsMap.values()).sort(
      (a, b) => b.assigned_count - a.assigned_count
    );

    return NextResponse.json({
      success: true,
      trainings,
      risky_users: riskyUsers,
      in_progress_users: inProgressUsers,
      completed_users: completedUsers,
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