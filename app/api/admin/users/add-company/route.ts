import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

const MOBILE_API_KEY = "dsec_mobile_123";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type AdminSession = {
  isOk: boolean;
  role: "super_admin" | "company_admin" | null;
  companyId: string;
};

type UserRow = {
  id: string;
  role: string | null;
  company_id: string | null;
};

type CompanyRow = {
  id: string;
};

type UserFirmAccessRow = {
  id: string;
  user_id: string;
  firm_id: string;
  role: string | null;
  is_primary: boolean | null;
};

async function getAdminSession(req: NextRequest): Promise<AdminSession> {
  const headerStore = await headers();
  const apiKey = headerStore.get("x-api-key");

  if (apiKey === MOBILE_API_KEY) {
    return {
      isOk: true,
      role: "super_admin",
      companyId: "",
    };
  }

  const cookieStore = await cookies();

  const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
  const adminRole = cookieStore.get("dsec_admin_role")?.value;
  const companyId = String(
    cookieStore.get("dsec_company_id")?.value || ""
  ).trim();

  if (
    adminAuth !== "ok" ||
    (adminRole !== "super_admin" && adminRole !== "company_admin")
  ) {
    return {
      isOk: false,
      role: null,
      companyId: "",
    };
  }

  return {
    isOk: true,
    role: adminRole,
    companyId,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession(req);

    if (!session.isOk || !session.role) {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const userId = String(body?.userId || "").trim();
    const companyId = String(body?.companyId || "").trim();
    const isGlobal = companyId === "ALL";

    if (!userId) {
      return NextResponse.json(
        { error: "userId zorunlu." },
        { status: 400 }
      );
    }

    if (!companyId && !isGlobal) {
      return NextResponse.json(
        { error: "companyId zorunlu." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("id, role, company_id")
      .eq("id", userId)
      .maybeSingle<UserRow>();

    if (targetUserError) {
      console.error("add-company user read error:", targetUserError);
      return NextResponse.json(
        { error: "Kullanıcı bilgisi okunamadı." },
        { status: 500 }
      );
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }


if (isGlobal) {
  await supabase
    .from("user_firm_access")
    .insert({
      user_id: userId,
      firm_id: "ALL",
      role: "super_admin",
      is_primary: true,
    });

  await supabase
    .from("users")
    .update({ company_id: null })
    .eq("id", userId);

  return NextResponse.json({ success: true });
}

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("id", companyId)
      .maybeSingle<CompanyRow>();

    if (companyError) {
      console.error("add-company company read error:", companyError);
      return NextResponse.json(
        { error: "Firma bilgisi okunamadı." },
        { status: 500 }
      );
    }

    if (!company) {
      return NextResponse.json(
        { error: "Firma bulunamadı." },
        { status: 404 }
      );
    }

    if (session.role === "company_admin") {
      if (!session.companyId) {
        return NextResponse.json(
          { error: "Firma yöneticisi firma bilgisi eksik." },
          { status: 403 }
        );
      }

      if (companyId !== session.companyId) {
        return NextResponse.json(
          { error: "Firma yöneticisi sadece kendi firmasını ekleyebilir." },
          { status: 403 }
        );
      }
    }

    const { data: existingAccess, error: existingAccessError } = await supabase
      .from("user_firm_access")
      .select("id, user_id, firm_id, role, is_primary")
      .eq("user_id", userId)
      .eq("firm_id", companyId)
      .maybeSingle<UserFirmAccessRow>();

    if (existingAccessError) {
      console.error("add-company existing access error:", existingAccessError);
      return NextResponse.json(
        { error: "Mevcut firma erişimi kontrol edilemedi." },
        { status: 500 }
      );
    }

    if (existingAccess) {
      return NextResponse.json(
        { error: "Bu firma zaten kullanıcıya bağlı." },
        { status: 400 }
      );
    }

    const { data: currentPrimary, error: currentPrimaryError } = await supabase
      .from("user_firm_access")
      .select("id, user_id, firm_id, role, is_primary")
      .eq("user_id", userId)
      .eq("is_primary", true);

    if (currentPrimaryError) {
      console.error("add-company current primary error:", currentPrimaryError);
      return NextResponse.json(
        { error: "Primary firma bilgisi kontrol edilemedi." },
        { status: 500 }
      );
    }

    const hasPrimary = Array.isArray(currentPrimary) && currentPrimary.length > 0;

    const roleToWrite =
      String(targetUser.role || "").trim() === "company_admin"
        ? "company_admin"
        : "operator";

    const { error: insertAccessError } = await supabase
      .from("user_firm_access")
      .insert({
        user_id: userId,
        firm_id: companyId,
        role: roleToWrite,
        is_primary: !hasPrimary,
      });

    if (insertAccessError) {
      console.error("add-company insert access error:", insertAccessError);
      return NextResponse.json(
        { error: "Firma erişimi eklenemedi." },
        { status: 500 }
      );
    }

    if (!hasPrimary) {
      const { error: updateUserError } = await supabase
        .from("users")
        .update({ company_id: companyId })
        .eq("id", userId);

      if (updateUserError) {
        console.error("add-company update users.company_id error:", updateUserError);
        return NextResponse.json(
          { error: "Kullanıcının primary firma alanı güncellenemedi." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("add-company general error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}