import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

const MOBILE_API_KEY = "dsec_mobile_123";

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
  is_active: boolean | null;
  created_at: string | null;
};

type CompanyRow = {
  id: string;
  name: string | null;
};

type UserPermissionRow = {
  user_id: string | null;
  permission_key: string | null;
};

type UserCompanyRow = {
  user_id: string;
  company_id: string;
  role: string | null;
  is_primary: boolean | null;
};

export async function GET() {
  try {
    const headerStore = await headers();
    const apiKey = headerStore.get("x-api-key");

    let adminRole = "";
    let companyIdFromCookie = "";

    if (apiKey !== MOBILE_API_KEY) {
      const cookieStore = await cookies();

      const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
      adminRole = String(cookieStore.get("dsec_admin_role")?.value || "").trim();
      companyIdFromCookie = String(
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
    } else {
      adminRole = "super_admin";
      companyIdFromCookie = "";
    }

    const supabase = getSupabase();

    // 🔹 USERS
    const { data: usersData, error: userError } = await supabase
      .from("users")
      .select("id, full_name, email, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (userError) {
      console.error("users error:", userError);
      return NextResponse.json(
        { error: "Kullanıcılar alınamadı." },
        { status: 500 }
      );
    }

    const userRows = (usersData || []) as UserRow[];
    const userIds = userRows.map((u) => u.id);

    // 🔹 USER PERMISSIONS
    const permissionMap = new Map<string, string[]>();

    if (userIds.length > 0) {
      const { data: permData } = await supabase
        .from("user_permissions")
        .select("user_id, permission_key")
        .in("user_id", userIds);

      (permData || []).forEach((p: UserPermissionRow) => {
        if (!p.user_id || !p.permission_key) return;

        if (!permissionMap.has(p.user_id)) {
          permissionMap.set(p.user_id, []);
        }

        permissionMap.get(p.user_id)!.push(p.permission_key);
      });
    }

    // 🔥 YENİ: USER_COMPANIES
    const { data: userCompaniesData } = await supabase
      .from("user_companies")
      .select("user_id, company_id, role, is_primary")
      .in("user_id", userIds);

    const userCompanyMap = new Map<string, UserCompanyRow[]>();

    (userCompaniesData || []).forEach((uc: UserCompanyRow) => {
      if (!userCompanyMap.has(uc.user_id)) {
        userCompanyMap.set(uc.user_id, []);
      }
      userCompanyMap.get(uc.user_id)!.push(uc);
    });

    // 🔹 COMPANY IDS
    const allCompanyIds = Array.from(
      new Set(
        (userCompaniesData || []).map((x: UserCompanyRow) => x.company_id)
      )
    );

    const companyMap = new Map<string, string>();

    if (allCompanyIds.length > 0) {
      const { data: companiesData } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", allCompanyIds);

      (companiesData || []).forEach((c: CompanyRow) => {
        if (c.id) {
          companyMap.set(c.id, c.name || "");
        }
      });
    }

    // 🔥 FINAL NORMALIZE
    const normalized = userRows.map((user) => {
      const userId = user.id;

      const firms =
        userCompanyMap.get(userId)?.map((uc) => ({
          firm_id: uc.company_id,
          firm_name: companyMap.get(uc.company_id) || "Firma",
          role: uc.role || "user",
          is_primary: Boolean(uc.is_primary),
        })) || [];

      // 🔐 company_admin filtre
      if (adminRole === "company_admin") {
        const hasAccess = firms.some(
          (f) => f.firm_id === companyIdFromCookie
        );

        if (!hasAccess) return null;
      }

      return {
        id: userId,
        full_name: user.full_name || "Adsız Kullanıcı",
        email: user.email || "",
        role: user.role || "",
        is_active: Boolean(user.is_active),
        created_at: user.created_at || null,
        permissions: Array.from(
          new Set(permissionMap.get(userId) || [])
        ).sort((a, b) => a.localeCompare(b, "tr")),
        firms,
      };
    }).filter(Boolean);

    return NextResponse.json({
      data: normalized,
      stats: {
        total_count: normalized.length,
        active_count: normalized.filter((u: any) => u.is_active).length,
        passive_count: normalized.filter((u: any) => !u.is_active).length,
      },
    });
  } catch (error) {
    console.error("GENEL HATA:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}