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

    let query = supabase
      .from("users")
      .select(`
        id,
        full_name,
        email,
        role,
        company_id,
        is_active,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (adminRole === "company_admin") {
      query = query.eq("company_id", companyIdFromCookie);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Admin users fetch hatası:", error);
      return NextResponse.json(
        { error: "Kullanıcılar alınamadı." },
        { status: 500 }
      );
    }

    const userRows = (data || []) as UserRow[];

    const companyIds = Array.from(
      new Set(
        userRows
          .map((user) => (user.company_id ? String(user.company_id).trim() : ""))
          .filter(Boolean)
      )
    );

    let companyMap = new Map<string, string>();

    if (companyIds.length > 0) {
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", companyIds);

      if (companiesError) {
        console.error("Companies fetch hatası:", companiesError);
      } else {
        const companies = (companiesData || []) as CompanyRow[];
        companyMap = new Map(
          companies.map((company) => [
            String(company.id).trim(),
            String(company.name || "").trim(),
          ])
        );
      }
    }

    const normalized = userRows.map((user) => {
      const companyId = user.company_id ? String(user.company_id).trim() : null;
      const companyName =
        companyId && companyMap.get(companyId)
          ? String(companyMap.get(companyId)).trim()
          : null;

      return {
        id: String(user.id),
        full_name: (user.full_name || "Adsız Kullanıcı").trim(),
        email: (user.email || "").trim(),
        role: (user.role || "").trim(),
        company_id: companyId,
        company: companyName || null,
        is_active: Boolean(user.is_active),
        created_at: user.created_at || null,
      };
    });

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