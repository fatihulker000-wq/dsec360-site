import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  company_id: string | null;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = cookieStore.get("dsec_admin_role")?.value;
    const userId = String(cookieStore.get("dsec_user_id")?.value || "").trim();

    const isAllowedRole =
      adminRole === "super_admin" || adminRole === "company_admin";

    if (adminAuth !== "ok" || !isAllowedRole || !userId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, company_id")
      .eq("id", userId)
      .maybeSingle<UserRow>();

    if (error || !data) {
      return NextResponse.json(
        { error: "Kullanıcı bilgisi alınamadı." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: String(data.id),
        full_name: String(data.full_name || "Kullanıcı"),
        email: String(data.email || ""),
        role: String(data.role || ""),
        company_id: String(data.company_id || ""),
      },
    });
  } catch (error) {
    console.error("admin me error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}