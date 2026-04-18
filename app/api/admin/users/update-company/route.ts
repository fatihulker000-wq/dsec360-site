import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

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

async function getAdminSession(): Promise<AdminSession> {
  const cookieStore = await cookies();

  const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
  const adminRole = cookieStore.get("dsec_admin_role")?.value;
  const companyId = String(cookieStore.get("dsec_company_id")?.value || "").trim();

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

type TargetUserRow = {
  id: string;
  company_id: string | null;
  role: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();

    if (!session.isOk || !session.role) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();
    const userId = String(body?.userId || "").trim();
    const companyId = String(body?.companyId || "").trim();

    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı ID zorunlu." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("id, company_id, role")
      .eq("id", userId)
      .maybeSingle<TargetUserRow>();

    if (targetUserError) {
      console.error("Kullanıcı okuma hatası:", targetUserError);
      return NextResponse.json(
        { error: "Kullanıcı bilgisi alınamadı." },
        { status: 500 }
      );
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    const targetUserCompanyId = String(targetUser.company_id || "").trim();
    const newCompanyId = companyId || null;

    if (session.role === "company_admin") {
      if (!session.companyId) {
        return NextResponse.json(
          { error: "Firma yöneticisi firma bilgisi bulunamadı." },
          { status: 403 }
        );
      }

      if (targetUserCompanyId !== session.companyId) {
        return NextResponse.json(
          { error: "Sadece kendi firmanızdaki kullanıcıları güncelleyebilirsiniz." },
          { status: 403 }
        );
      }

      if (newCompanyId !== session.companyId) {
        return NextResponse.json(
          { error: "Firma yöneticisi kullanıcıyı başka firmaya aktaramaz." },
          { status: 403 }
        );
      }
    }

    const { error } = await supabase
      .from("users")
      .update({ company_id: newCompanyId })
      .eq("id", userId);

    if (error) {
      console.error("Firma güncelleme hatası:", error);
      return NextResponse.json(
        { error: "Güncellenemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("update-company genel hata:", e);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}