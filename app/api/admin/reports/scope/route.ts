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

    const auth = String(
      cookieStore.get("dsec_admin_auth")?.value ||
        cookieStore.get("dsec_user_auth")?.value ||
        ""
    ).trim();

    const role = String(
      cookieStore.get("dsec_admin_role")?.value ||
        cookieStore.get("dsec_user_role")?.value ||
        ""
    ).trim();

    const userId = String(
      cookieStore.get("dsec_user_id")?.value || ""
    ).trim();

    const companyIdFromCookie = String(
      cookieStore.get("dsec_company_id")?.value || ""
    ).trim();

    if (auth !== "ok" || !role) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const allowedRoles = [
      "admin",
      "super_admin",
      "company_admin",
      "demo_user",
    ];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Bu rol erişemez." },
        { status: 403 }
      );
    }

    /*
     * Admin ve süper admin bütün firmaları seçebilir.
     */
    if (
      role === "super_admin" ||
      role === "admin"
    ) {
      return NextResponse.json({
        success: true,
        role,
        can_select_company: true,
        allowed_company_id: null,
        allowed_company_name: null,
        read_only: false,
        is_demo: false,
      });
    }

    /*
     * Firma yöneticisi ve demo kullanıcı
     * yalnızca kendisine bağlı firmayı görebilir.
     */
    if (
      role !== "company_admin" &&
      role !== "demo_user"
    ) {
      return NextResponse.json(
        { error: "Bu rol erişemez." },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı bilgisi yok." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    const {
      data: userRow,
      error: userError,
    } = await supabase
      .from("users")
      .select(
        "id, role, company_id, is_active"
      )
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      console.error(
        "reports scope user error:",
        userError
      );

      return NextResponse.json(
        {
          error:
            "Kullanıcı bilgisi alınamadı.",
        },
        { status: 500 }
      );
    }

    if (!userRow) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    if (userRow.is_active === false) {
      return NextResponse.json(
        { error: "Kullanıcı pasif durumda." },
        { status: 403 }
      );
    }

    const databaseRole = String(
      userRow.role || ""
    ).trim();

    if (databaseRole !== role) {
      return NextResponse.json(
        {
          error:
            "Oturum rolü ile kullanıcı rolü uyuşmuyor.",
        },
        { status: 403 }
      );
    }

    /*
     * Öncelik:
     * 1. users.company_id
     * 2. user_firm_access içindeki primary firma
     * 3. Oturum cookie firma bilgisi
     */
    let companyId = String(
      userRow.company_id || ""
    ).trim();

    if (!companyId) {
      const {
        data: primaryAccess,
        error: primaryAccessError,
      } = await supabase
        .from("user_firm_access")
        .select("firm_id")
        .eq("user_id", userId)
        .eq("is_primary", true)
        .limit(1)
        .maybeSingle();

      if (primaryAccessError) {
        console.error(
          "reports scope primary access error:",
          primaryAccessError
        );
      }

      companyId = String(
        primaryAccess?.firm_id || ""
      ).trim();
    }

    if (!companyId) {
      const {
        data: firstAccess,
        error: firstAccessError,
      } = await supabase
        .from("user_firm_access")
        .select("firm_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (firstAccessError) {
        console.error(
          "reports scope first access error:",
          firstAccessError
        );
      }

      companyId = String(
        firstAccess?.firm_id || ""
      ).trim();
    }

    if (!companyId) {
      companyId = companyIdFromCookie;
    }

    if (!companyId || companyId === "ALL") {
      return NextResponse.json(
        { error: "Firma atanmamış." },
        { status: 403 }
      );
    }

    const {
      data: companyRow,
      error: companyError,
    } = await supabase
      .from("companies")
      .select("id, name, is_active")
      .eq("id", companyId)
      .maybeSingle();

    if (companyError) {
      console.error(
        "reports scope company error:",
        companyError
      );

      return NextResponse.json(
        {
          error:
            "Firma bilgisi alınamadı.",
        },
        { status: 500 }
      );
    }

    if (!companyRow) {
      return NextResponse.json(
        { error: "Firma bulunamadı." },
        { status: 404 }
      );
    }

    if (companyRow.is_active === false) {
      return NextResponse.json(
        { error: "Firma pasif durumda." },
        { status: 403 }
      );
    }

    const isDemo = role === "demo_user";

    return NextResponse.json({
      success: true,
      role,
      can_select_company: false,
      allowed_company_id: String(
        companyRow.id
      ),
      allowed_company_name:
        String(companyRow.name || "").trim() ||
        "Bağlı Firma",
      read_only: isDemo,
      is_demo: isDemo,
    });
  } catch (error) {
    console.error(
      "reports scope general error:",
      error
    );

    return NextResponse.json(
      { error: "Sunucu hatası." },
      { status: 500 }
    );
  }
}