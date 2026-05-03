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
    const employeeIds = searchParams
      .get("employeeIds")
      ?.split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    if (!employeeIds || employeeIds.length === 0) {
      return NextResponse.json({ data: {} });
    }

    const supabase = getSupabase();

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, employee_id")
      .in("employee_id", employeeIds);

    if (usersError) {
      return NextResponse.json(
        { error: "Eğitim kullanıcıları alınamadı." },
        { status: 500 }
      );
    }

    const userIds = (users || []).map((u: any) => u.id).filter(Boolean);

    if (userIds.length === 0) {
      return NextResponse.json({ data: {} });
    }

    const { data: assignments, error: assignmentsError } = await supabase
      .from("training_assignments")
      .select(`
        user_id,
        training_id,
        status,
        trainings (
          id,
          title,
          type
        )
      `)
      .in("user_id", userIds);

    if (assignmentsError) {
      return NextResponse.json(
        { error: "Atanmış eğitimler alınamadı." },
        { status: 500 }
      );
    }

    const userToEmployee = new Map<string, string>();

    (users || []).forEach((u: any) => {
      if (u.id && u.employee_id) {
        userToEmployee.set(String(u.id), String(u.employee_id));
      }
    });

    const result: Record<string, any[]> = {};

    (assignments || []).forEach((row: any) => {
      const employeeId = userToEmployee.get(String(row.user_id));
      if (!employeeId) return;

      if (!result[employeeId]) result[employeeId] = [];

      result[employeeId].push({
        training_id: row.training_id,
        title: row.trainings?.title || "Adsız Eğitim",
        type: row.trainings?.type || "online",
        status: row.status || "not_started",
      });
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("training-history error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}