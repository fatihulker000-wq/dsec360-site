import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

    const supabase = getSupabase();

    let assignmentQuery = supabase
      .from("training_assignments")
      .select("id, user_id, training_id, status, created_at")
      .neq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(8);

    const { data: assignments, error: assignmentError } = await assignmentQuery;

    if (assignmentError) {
      return NextResponse.json(
        { error: assignmentError.message },
        { status: 500 }
      );
    }

    const rows = assignments || [];

    const userIds = Array.from(new Set(rows.map((x: any) => x.user_id).filter(Boolean)));
    const trainingIds = Array.from(new Set(rows.map((x: any) => x.training_id).filter(Boolean)));

    let usersMap: Record<string, any> = {};
    let trainingsMap: Record<string, any> = {};
    let companyMap: Record<string, string> = {};

    if (userIds.length) {
      let userQuery = supabase
        .from("users")
        .select("id, full_name, email, company_id")
        .in("id", userIds);

      if (adminRole === "company_admin" && companyIdFromCookie) {
        userQuery = userQuery.eq("company_id", companyIdFromCookie);
      }

      const { data: users } = await userQuery;

      usersMap = Object.fromEntries((users || []).map((u: any) => [u.id, u]));

      const companyIds = Array.from(
        new Set((users || []).map((u: any) => u.company_id).filter(Boolean))
      );

      if (companyIds.length) {
        const { data: companies } = await supabase
          .from("companies")
          .select("id, name")
          .in("id", companyIds);

        companyMap = Object.fromEntries(
          (companies || []).map((c: any) => [
            String(c.id || "").trim(),
            String(c.name || "Firma Yok").trim() || "Firma Yok",
          ])
        );
      }
    }

    if (trainingIds.length) {
      const { data: trainings } = await supabase
        .from("trainings")
        .select("id, title")
        .in("id", trainingIds);

      trainingsMap = Object.fromEntries(
        (trainings || []).map((t: any) => [t.id, t])
      );
    }

    const items = rows
      .filter((row: any) => usersMap[row.user_id])
      .map((row: any) => {
        const user = usersMap[row.user_id];
        const companyId = String(user?.company_id || "").trim();

        return {
          id: row.id,
          title: trainingsMap[row.training_id]?.title || "Eğitim",
          company: companyMap[companyId] || "Firma Yok",
          date: row.created_at || new Date().toISOString(),
        };
      })
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      upcoming_trainings: items,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Yaklaşan eğitimler alınamadı." },
      { status: 500 }
    );
  }
}