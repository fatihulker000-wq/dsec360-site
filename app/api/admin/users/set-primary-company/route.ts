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

    if (!userId) {
      return NextResponse.json(
        { error: "userId zorunlu." },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId zorunlu." },
        { status: 400 }
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
          { error: "Firma yöneticisi sadece kendi firmasını primary yapabilir." },
          { status: 403 }
        );
      }
    }

    const supabase = getSupabase();

    const { data: targetAccess, error: targetAccessError } = await supabase
      .from("user_firm_access")
      .select("id, user_id, firm_id, role, is_primary")
      .eq("user_id", userId)
      .eq("firm_id", companyId)
      .maybeSingle<UserFirmAccessRow>();

    if (targetAccessError) {
      console.error("set-primary target access error:", targetAccessError);
      return NextResponse.json(
        { error: "Firma erişimi okunamadı." },
        { status: 500 }
      );
    }

    if (!targetAccess) {
      return NextResponse.json(
        { error: "Kullanıcıda bu firmaya ait erişim yok." },
        { status: 404 }
      );
    }

    const { error: resetPrimaryError } = await supabase
      .from("user_firm_access")
      .update({ is_primary: false })
      .eq("user_id", userId);

    if (resetPrimaryError) {
      console.error("set-primary reset primary error:", resetPrimaryError);
      return NextResponse.json(
        { error: "Eski primary kayıtlar temizlenemedi." },
        { status: 500 }
      );
    }

    const { error: setPrimaryError } = await supabase
      .from("user_firm_access")
      .update({ is_primary: true })
      .eq("user_id", userId)
      .eq("firm_id", companyId);

    if (setPrimaryError) {
      console.error("set-primary set primary error:", setPrimaryError);
      return NextResponse.json(
        { error: "Yeni primary firma ayarlanamadı." },
        { status: 500 }
      );
    }

    const { error: updateUserError } = await supabase
      .from("users")
      .update({ company_id: companyId })
      .eq("id", userId);

    if (updateUserError) {
      console.error("set-primary update users.company_id error:", updateUserError);
      return NextResponse.json(
        { error: "users.company_id güncellenemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("set-primary general error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}