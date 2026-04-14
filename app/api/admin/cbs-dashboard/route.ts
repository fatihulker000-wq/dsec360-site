import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type AdminSession = {
  userId: string;
  role: "super_admin" | "company_admin";
  companyId: string;
};

async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();

  const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
  const adminRole = cookieStore.get("dsec_admin_role")?.value;
  const userId = String(cookieStore.get("dsec_user_id")?.value || "").trim();

  const isAllowedRole =
    adminRole === "super_admin" || adminRole === "company_admin";

  if (adminAuth !== "ok" || !isAllowedRole || !userId) {
    return null;
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("users")
    .select("id, role, company_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const role =
    String(data.role || "").trim() === "super_admin"
      ? "super_admin"
      : "company_admin";

  return {
    userId: String(data.id || "").trim(),
    role,
    companyId: String(data.company_id || "").trim(),
  };
}

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    let query = supabase
      .from("cbs_forms")
      .select("id, status, priority, sla_due_at, closed_at, firm_id, created_at");

    if (session.role === "company_admin") {
      query = query.eq("firm_id", session.companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("CBS dashboard GET hatası:", error);
      return NextResponse.json(
        { error: "Veri alınamadı." },
        { status: 500 }
      );
    }

    const records = data || [];

    const countAll = records.length;
    const countNew = records.filter((x) => x.status === "new").length;
    const countProcessing = records.filter((x) => x.status === "processing").length;
    const countRead = records.filter((x) => x.status === "read").length;
    const countClosed = records.filter((x) => x.status === "closed").length;

    const countSlaExceeded = records.filter((x) => {
      if (!x.sla_due_at || x.status === "closed") return false;
      return new Date(x.sla_due_at).getTime() < Date.now();
    }).length;

    const criticalCount = records.filter(
      (x) => String(x.priority || "").toLowerCase() === "critical"
    ).length;

    const highCount = records.filter(
      (x) => String(x.priority || "").toLowerCase() === "high"
    ).length;

    const closedRate =
      countAll > 0 ? Math.round((countClosed / countAll) * 100) : 0;

    return NextResponse.json({
      success: true,
      summary: {
        total: countAll,
        new: countNew,
        processing: countProcessing,
        read: countRead,
        closed: countClosed,
        slaExceeded: countSlaExceeded,
        critical: criticalCount,
        high: highCount,
        closedRate,
      },
    });
  } catch (err) {
    console.error("CBS dashboard genel hata:", err);
    return NextResponse.json(
      { error: "Sunucu hatası." },
      { status: 500 }
    );
  }
}