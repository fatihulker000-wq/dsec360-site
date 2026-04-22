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

type UserFirmAccessRow = {
  user_id: string | null;
  firm_id: string | null;
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
    const userIds = userRows
      .map((u) => String(u.id || "").trim())
      .filter(Boolean);

    const permissionMap = new Map<string, string[]>();

    if (userIds.length > 0) {
      const { data: permData, error: permError } = await supabase
        .from("user_permissions")
        .select("user_id, permission_key")
        .in("user_id", userIds);

      if (permError) {
        console.error("user_permissions error:", permError);
      } else {
        ((permData || []) as UserPermissionRow[]).forEach((p) => {
          const uid = String(p.user_id || "").trim();
          const key = String(p.permission_key || "").trim();

          if (!uid || !key) return;

          if (!permissionMap.has(uid)) {
            permissionMap.set(uid, []);
          }

          permissionMap.get(uid)!.push(key);
        });
      }
    }

    const { data: userFirmAccessData, error: userFirmAccessError } = await supabase
      .from("user_firm_access")
      .select("user_id, firm_id, role, is_primary")
      .in("user_id", userIds);

    if (userFirmAccessError) {
      console.error("user_firm_access error:", userFirmAccessError);
      return NextResponse.json(
        { error: "Kullanıcı firma erişimleri alınamadı." },
        { status: 500 }
      );
    }

    const accessRows = (userFirmAccessData || []) as UserFirmAccessRow[];

    const userFirmMap = new Map<string, UserFirmAccessRow[]>();

    accessRows.forEach((row) => {
      const uid = String(row.user_id || "").trim();
      if (!uid) return;

      if (!userFirmMap.has(uid)) {
        userFirmMap.set(uid, []);
      }

      userFirmMap.get(uid)!.push(row);
    });

    const allFirmIds = Array.from(
      new Set(
        accessRows
          .map((row) => String(row.firm_id || "").trim())
          .filter(Boolean)
      )
    );

    const companyMap = new Map<string, string>();

    if (allFirmIds.length > 0) {
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", allFirmIds);

      if (companiesError) {
        console.error("companies error:", companiesError);
        return NextResponse.json(
          { error: "Firmalar alınamadı." },
          { status: 500 }
        );
      }

      ((companiesData || []) as CompanyRow[]).forEach((c) => {
        const id = String(c.id || "").trim();
        const name = String(c.name || "").trim();

        if (!id) return;
        companyMap.set(id, name || "Firma");
      });
    }

    const normalized = userRows
      .map((user) => {
        const userId = String(user.id || "").trim();
        const userFirmRows = userFirmMap.get(userId) || [];

        const firms = userFirmRows
          .map((row) => {
            const firmId = String(row.firm_id || "").trim();
            if (!firmId) return null;

            return {
              firm_id: firmId,
              firm_name: companyMap.get(firmId) || "Firma",
              role: String(row.role || "").trim() || "operator",
              is_primary: Boolean(row.is_primary),
            };
          })
          .filter(
            (
              item
            ): item is {
              firm_id: string;
              firm_name: string;
              role: string;
              is_primary: boolean;
            } => Boolean(item)
          )
          .sort((a, b) => {
            if (a.is_primary === b.is_primary) {
              return a.firm_name.localeCompare(b.firm_name, "tr");
            }
            return a.is_primary ? -1 : 1;
          });

        if (adminRole === "company_admin") {
          const hasAccess = firms.some(
            (firm) => firm.firm_id === companyIdFromCookie
          );

          if (!hasAccess) {
            return null;
          }
        }

        const primaryFirm =
          firms.find((firm) => firm.is_primary) || firms[0] || null;

        return {
          id: userId,
          full_name: String(user.full_name || "Adsız Kullanıcı").trim(),
          email: String(user.email || "").trim(),
          role: String(user.role || "").trim(),
          company_id: primaryFirm?.firm_id || "",
          company: primaryFirm?.firm_name || "",
          is_active: Boolean(user.is_active),
          created_at: user.created_at || null,
          permissions: Array.from(
            new Set(
              (permissionMap.get(userId) || [])
                .map((p) => String(p || "").trim())
                .filter(Boolean)
            )
          ).sort((a, b) => a.localeCompare(b, "tr")),
          firms,
        };
      })
      .filter(Boolean);

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