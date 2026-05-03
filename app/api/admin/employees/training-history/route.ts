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
      .select("user_id, training_id, status")
      .in("user_id", userIds);

    if (assignmentError) {
      return NextResponse.json(
        { error: "Atamalar alınamadı.", detail: assignmentError.message },
        { status: 500 }
      );
    }

    const trainingIds = Array.from(
      new Set((assignments || []).map((a: any) => String(a.training_id)).filter(Boolean))
    );

    const trainingMap = new Map<string, any>();

    if (trainingIds.length > 0) {
      const { data: trainings, error: trainingsError } = await supabase
        .from("trainings")
        .select("id, title, type")
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

      if (!result[employeeId]) result[employeeId] = [];

      result[employeeId].push({
        training_id: String(a.training_id),
        title: training?.title || "Adsız Eğitim",
        type: training?.type || "online",
        status: a.status || "not_started",
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
