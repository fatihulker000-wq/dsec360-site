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

async function fetchInChunks<T>(
  table: string,
  select: string,
  column: string,
  values: string[],
  chunkSize = 300
): Promise<{ data: T[]; error: any }> {
  const supabase = getSupabase();
  const all: T[] = [];

  for (let i = 0; i < values.length; i += chunkSize) {
    const chunk = values.slice(i, i + chunkSize);
    if (chunk.length === 0) continue;

    const { data, error } = await supabase
      .from(table)
      .select(select)
      .in(column, chunk);

    if (error) return { data: [], error };

    all.push(...((data || []) as T[]));
  }

  return { data: all, error: null };
}

export async function GET(req: Request) {
  try {
    const headerStore = await headers();
    const apiKey = headerStore.get("x-api-key");

    let adminRole = "";
    let companyIdFromCookie = "";

    if (apiKey !== MOBILE_API_KEY) {
      const cookieStore = await cookies();
      const adminAuth = cookieStore.get("dsec_admin_auth")?.value;

      adminRole = String(cookieStore.get("dsec_admin_role")?.value || "").trim();
      companyIdFromCookie = String(cookieStore.get("dsec_company_id")?.value || "").trim();

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
    } else {
      adminRole = "super_admin";
    }

    const supabase = getSupabase();
    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    const { data: usersData, error: userError } = await supabase
      .from("users")
      .select(
"id, full_name, email, role, is_active, created_at, app_user_type, password_hash, employee_id, company_id"      )
      .order("full_name", { ascending: true, nullsFirst: false });

    if (userError) {
      console.error("users error:", userError);
      return NextResponse.json({ error: "Kullanıcılar alınamadı." }, { status: 500 });
    }

    const userRows = usersData || [];

    const userIds = userRows
      .map((u: any) => String(u.id || "").trim())
      .filter(Boolean);

    const permissionMap = new Map<string, string[]>();
    const userFirmMap = new Map<string, any[]>();

    if (userIds.length > 0) {
      const permResult = await fetchInChunks<any>(
        "user_permissions",
        "user_id, permission_key",
        "user_id",
        userIds
      );

      if (!permResult.error) {
        permResult.data.forEach((p: any) => {
          const uid = String(p.user_id || "").trim();
          const key = String(p.permission_key || "").trim();
          if (!uid || !key) return;

          if (!permissionMap.has(uid)) permissionMap.set(uid, []);
          permissionMap.get(uid)!.push(key);
        });
      }

      const firmResult = await fetchInChunks<any>(
        "user_firm_access",
        "user_id, firm_id, role, is_primary",
        "user_id",
        userIds
      );

      if (firmResult.error) {
        console.error("user_firm_access error:", firmResult.error);
        return NextResponse.json(
          { error: "Kullanıcı firma erişimleri alınamadı." },
          { status: 500 }
        );
      }

      firmResult.data.forEach((row: any) => {
        const uid = String(row.user_id || "").trim();
        if (!uid) return;

        if (!userFirmMap.has(uid)) userFirmMap.set(uid, []);
        userFirmMap.get(uid)!.push(row);
      });
    }

    const allFirmIds = Array.from(
      new Set(
        Array.from(userFirmMap.values())
          .flat()
          .map((row: any) => String(row.firm_id || "").trim())
          .filter((id) => id && id !== "ALL")
      )
    );

    const companyMap = new Map<string, string>();

    if (allFirmIds.length > 0) {
      const companyResult = await fetchInChunks<any>(
        "companies",
        "id, name",
        "id",
        allFirmIds
      );

      if (companyResult.error) {
        console.error("companies error:", companyResult.error);
        return NextResponse.json({ error: "Firmalar alınamadı." }, { status: 500 });
      }

      companyResult.data.forEach((c: any) => {
        const id = String(c.id || "").trim();
        const name = String(c.name || "").trim();
        if (id) companyMap.set(id, name || "Firma");
      });
    }

    const normalized = userRows
      .filter((u: any) => {
        const role = String(u.role || "").trim();

        if (type === "training") {
          return role === "training_user" && String(u.employee_id || "").trim();
        }

        if (type === "system") {
          return role !== "training_user";
        }

        return role !== "training_user";
      })
      .map((user: any) => {
        const userId = String(user.id || "").trim();
        const accessRows = userFirmMap.get(userId) || [];

        const firms = accessRows
          .map((row: any) => {
            const firmId = String(row.firm_id || "").trim();

            if (firmId === "ALL") {
              return {
                firm_id: "ALL",
                firm_name: "Tüm Firmalar",
                role: "super_admin",
                is_primary: true,
              };
            }

            return {
              firm_id: firmId,
              firm_name: companyMap.get(firmId) || "Firma",
              role: String(row.role || "").trim() || "operator",
              is_primary: Boolean(row.is_primary),
            };
          })
          .filter((f: any) => f.firm_id)
          .sort((a: any, b: any) => {
            if (a.is_primary === b.is_primary) {
              return a.firm_name.localeCompare(b.firm_name, "tr");
            }
            return a.is_primary ? -1 : 1;
          });

        if (adminRole === "company_admin") {
          const hasAccess = firms.some((f: any) => f.firm_id === companyIdFromCookie);
          if (!hasAccess) return null;
        }

        
const primaryFirm = firms.find((f: any) => f.is_primary) || firms[0] || null;

const finalPermissions = Array.from(
  new Set(
    (permissionMap.get(userId) || [])
      .map((p) => String(p || "").trim())
      .filter(Boolean)
  )
).sort((a, b) => a.localeCompare(b, "tr"));

const permissionModules = Array.from(
  new Set(
    finalPermissions
      .map((p) => String(p || "").split(".")[0])
      .filter(Boolean)
  )
).sort((a, b) => a.localeCompare(b, "tr"));


        return {
          id: userId,
          
          full_name: String(user.full_name || "Adsız Kullanıcı").trim(),
          email: String(user.email || "").trim(),
          role: String(user.role || "").trim(),
          app_user_type: String(user.app_user_type || "").trim(),
          password_hash: String(user.password_hash || "").trim(),
          employee_id: String(user.employee_id || "").trim(),
          company_id: primaryFirm?.firm_id || String(user.company_id || "").trim(),
          company: primaryFirm?.firm_name || "",
          is_active: Boolean(user.is_active),
          created_at: user.created_at || null,
          permissions: finalPermissions,
permission_modules: permissionModules,
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