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
  assigned_count: number;
  not_started_count: number;
  in_progress_count: number;
  completed_count: number;
};

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  company_id: string | null;
};

type AssignmentRow = {
  id: string;
  user_id: string;
  training_id: string;
  status: string | null;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;

    if (adminAuth !== "ok") {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    const { data: trainings, error: trainingsError } = await supabase
      .from("trainings")
      .select(
        "id, title, assigned_count, not_started_count, in_progress_count, completed_count"
      )
      .order("title", { ascending: true });

    if (trainingsError) {
      console.error("TRAINING DASHBOARD trainings error:", trainingsError);
      return NextResponse.json(
        { error: "Eğitim verileri alınamadı." },
        { status: 500 }
      );
    }

    const { data: assignments, error: assignmentsError } = await supabase
      .from("training_assignments")
      .select("id, user_id, training_id, status")
      .order("id", { ascending: false });

    if (assignmentsError) {
      console.error("TRAINING DASHBOARD assignments error:", assignmentsError);
      return NextResponse.json(
        { error: "Atama verileri alınamadı." },
        { status: 500 }
      );
    }

    const typedAssignments = (assignments || []) as AssignmentRow[];
    const userIds = Array.from(new Set(typedAssignments.map((x) => String(x.user_id))));
    const trainingIds = Array.from(
      new Set(typedAssignments.map((x) => String(x.training_id)))
    );

    let usersMap = new Map<string, UserRow>();
    let trainingTitleMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, email, company_id")
        .in("id", userIds);

      if (usersError) {
        console.error("TRAINING DASHBOARD users error:", usersError);
      } else {
        for (const u of (users || []) as UserRow[]) {
          usersMap.set(String(u.id), u);
        }
      }
    }

    if (trainingIds.length > 0) {
      const { data: trainingList, error: trainingListError } = await supabase
        .from("trainings")
        .select("id, title")
        .in("id", trainingIds);

      if (trainingListError) {
        console.error("TRAINING DASHBOARD training list error:", trainingListError);
      } else {
        for (const t of (trainingList || []) as Array<{ id: string; title: string | null }>) {
          trainingTitleMap.set(String(t.id), (t.title || "Adsız Eğitim").trim());
        }
      }
    }

    const riskyUsers = typedAssignments
      .filter((a) => (a.status || "not_started") === "not_started")
      .map((a) => {
        const user = usersMap.get(String(a.user_id));
        return {
          assignment_id: String(a.id),
          user_id: String(a.user_id),
          training_id: String(a.training_id),
          full_name: (user?.full_name || "Adsız Kullanıcı").trim(),
          email: (user?.email || "").trim(),
          company_id: user?.company_id ? String(user.company_id) : "",
          training_title:
            trainingTitleMap.get(String(a.training_id)) || "Adsız Eğitim",
          status: "not_started",
        };
      });

    const inProgressUsers = typedAssignments
      .filter((a) => (a.status || "") === "in_progress")
      .map((a) => {
        const user = usersMap.get(String(a.user_id));
        return {
          assignment_id: String(a.id),
          user_id: String(a.user_id),
          training_id: String(a.training_id),
          full_name: (user?.full_name || "Adsız Kullanıcı").trim(),
          email: (user?.email || "").trim(),
          company_id: user?.company_id ? String(user.company_id) : "",
          training_title:
            trainingTitleMap.get(String(a.training_id)) || "Adsız Eğitim",
          status: "in_progress",
        };
      });

    const completedUsers = typedAssignments
      .filter((a) => (a.status || "") === "completed")
      .map((a) => {
        const user = usersMap.get(String(a.user_id));
        return {
          assignment_id: String(a.id),
          user_id: String(a.user_id),
          training_id: String(a.training_id),
          full_name: (user?.full_name || "Adsız Kullanıcı").trim(),
          email: (user?.email || "").trim(),
          company_id: user?.company_id ? String(user.company_id) : "",
          training_title:
            trainingTitleMap.get(String(a.training_id)) || "Adsız Eğitim",
          status: "completed",
        };
      });

    return NextResponse.json({
      trainings: (trainings || []) as TrainingRow[],
      risky_users: riskyUsers,
      in_progress_users: inProgressUsers,
      completed_users: completedUsers,
      summary: {
        total_trainings: (trainings || []).length,
        total_risky_users: riskyUsers.length,
        total_in_progress_users: inProgressUsers.length,
        total_completed_users: completedUsers.length,
      },
    });
  } catch (error) {
    console.error("TRAINING DASHBOARD general error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}