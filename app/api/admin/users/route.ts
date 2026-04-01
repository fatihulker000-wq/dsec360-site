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
  is_active: boolean | null;
  created_at: string | null;
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

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, company_id, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin users fetch hatası:", error);
      return NextResponse.json(
        { error: "Kullanıcılar alınamadı." },
        { status: 500 }
      );
    }

    const normalized = ((data || []) as UserRow[]).map((user) => ({
      id: String(user.id),
      full_name: (user.full_name || "Adsız Kullanıcı").trim(),
      email: (user.email || "").trim(),
      role: (user.role || "").trim(),
      company_id: user.company_id ? String(user.company_id).trim() : null,
      is_active: Boolean(user.is_active),
      created_at: user.created_at || null,
    }));

    return NextResponse.json({
      data: normalized,
      stats: {
        total_count: normalized.length,
        active_count: normalized.filter((u) => u.is_active).length,
        passive_count: normalized.filter((u) => !u.is_active).length,
      },
    });
  } catch (error) {
    console.error("Admin users genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}