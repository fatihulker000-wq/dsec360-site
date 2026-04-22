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
  created_at?: string | null;
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

    const supabase = getSupabase();

    if (session.role === "company_admin") {
      if (!session.companyId) {
        return NextResponse.json(
          { error: "Firma yöneticisi firma bilgisi eksik." },
          { status: 403 }
        );
      }

      if (companyId !== session.companyId) {
        return NextResponse.json(
          { error: "Firma yöneticisi sadece kendi firmasını kaldırabilir." },
          { status: 403 }
        );
      }
    }

    const { data: existingAccess, error: existingAccessError } = await supabase
      .from("user_firm_access")
      .select("id, user_id, firm_id, role, is_primary, created_at")
      .eq("user_id", userId)
      .eq("firm_id", companyId)
      .maybeSingle<UserFirmAccessRow>();

    if (existingAccessError) {
      console.error("remove-company existing access error:", existingAccessError);
      return NextResponse.json(
        { error: "Firma erişimi okunamadı." },
        { status: 500 }
      );
    }

    if (!existingAccess) {
      return NextResponse.json(
        { error: "Bu firma kaydı kullanıcıda yok." },
        { status: 404 }
      );
    }

    const { data: allAccessRows, error: allAccessRowsError } = await supabase
      .from("user_firm_access")
      .select("id, user_id, firm_id, role, is_primary, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (allAccessRowsError) {
      console.error("remove-company all access rows error:", allAccessRowsError);
      return NextResponse.json(
        { error: "Kullanıcının firma erişimleri okunamadı." },
        { status: 500 }
      );
    }

    const rows = (allAccessRows || []) as UserFirmAccessRow[];

    // 🔥 SON FİRMA BLOĞU
    // super_admin için son firma da silinebilir → kullanıcı firma-yok moduna döner
    // company_admin için son firma silinemez
    if (rows.length <= 1) {
      if (session.role === "super_admin") {
        const { error: deleteLastError } = await supabase
          .from("user_firm_access")
          .delete()
          .eq("user_id", userId)
          .eq("firm_id", companyId);

        if (deleteLastError) {
          console.error("remove-company delete last error:", deleteLastError);
          return NextResponse.json(
            { error: "Son firma erişimi kaldırılamadı." },
            { status: 500 }
          );
        }

        const { error: clearUserCompanyError } = await supabase
          .from("users")
          .update({ company_id: null })
          .eq("id", userId);

        if (clearUserCompanyError) {
          console.error(
            "remove-company clear users.company_id error:",
            clearUserCompanyError
          );
          return NextResponse.json(
            { error: "Kullanıcının firma alanı temizlenemedi." },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true });
      }

      return NextResponse.json(
        { error: "Kullanıcının son firması kaldırılamaz." },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("user_firm_access")
      .delete()
      .eq("user_id", userId)
      .eq("firm_id", companyId);

    if (deleteError) {
      console.error("remove-company delete error:", deleteError);
      return NextResponse.json(
        { error: "Firma erişimi kaldırılamadı." },
        { status: 500 }
      );
    }

    if (existingAccess.is_primary) {
      const remainingRows = rows.filter((r) => r.firm_id !== companyId);
      const nextPrimary = remainingRows[0];

      if (nextPrimary) {
        const { error: clearPrimaryError } = await supabase
          .from("user_firm_access")
          .update({ is_primary: false })
          .eq("user_id", userId);

        if (clearPrimaryError) {
          console.error("remove-company clear primary error:", clearPrimaryError);
          return NextResponse.json(
            { error: "Eski primary durumu temizlenemedi." },
            { status: 500 }
          );
        }

        const { error: makePrimaryError } = await supabase
          .from("user_firm_access")
          .update({ is_primary: true })
          .eq("id", nextPrimary.id);

        if (makePrimaryError) {
          console.error("remove-company make primary error:", makePrimaryError);
          return NextResponse.json(
            { error: "Yeni primary firma atanamadı." },
            { status: 500 }
          );
        }

        const { error: updateUserError } = await supabase
          .from("users")
          .update({ company_id: nextPrimary.firm_id })
          .eq("id", userId);

        if (updateUserError) {
          console.error(
            "remove-company update users.company_id error:",
            updateUserError
          );
          return NextResponse.json(
            { error: "Kullanıcının primary firması güncellenemedi." },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("remove-company general error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}