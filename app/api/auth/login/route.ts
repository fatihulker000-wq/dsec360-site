import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type LoginUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  password: string | null;
  password_hash: string | null;
  permissions: string[] | null;
  role: string | null;
  company_id: string | null;
  is_active?: boolean | null;
};

type CompanyRow = {
  id: string;
  name: string | null;
  is_active: boolean | null;
};

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function isPasswordMatched(rawPassword: string, user: LoginUserRow) {
  const plainPassword = String(user.password || "").trim();
  const hashedPassword = String(user.password_hash || "").trim();

  // Yeni sistem: SHA-256 hash
  if (hashedPassword && sha256(rawPassword) === hashedPassword) {
    return true;
  }

  // Eski sistem: düz şifre
  if (plainPassword && rawPassword === plainPassword) {
    return true;
  }

  return false;
}
 

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const rawEmail = String(body?.email ?? "").trim().toLowerCase();
    const rawPassword = String(body?.password ?? "").trim();

    if (!rawEmail || !rawPassword) {
      return NextResponse.json(
        { error: "Email / TC / Sicil ve şifre zorunludur." },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Supabase bağlantı bilgileri tanımlı değil." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    let user: LoginUserRow | null = null;
    let error = null;

    // 🔥 ORTAK SELECT (ÇOK ÖNEMLİ)
    const selectFields =
  "id, full_name, email, password, password_hash, role, company_id, is_active, permissions";

    // 1️⃣ EMAIL
    let res = await supabase
      .from("users")
      .select(selectFields)
      .ilike("email", rawEmail)
      .maybeSingle<LoginUserRow>();

    if (res.data) user = res.data;
    error = res.error;

    // 2️⃣ TC
    if (!user) {
      res = await supabase
        .from("users")
        .select(selectFields)
        .eq("tc", rawEmail)
        .maybeSingle<LoginUserRow>();

      if (res.data) user = res.data;
      error = res.error;
    }

    // 3️⃣ SİCİL
    if (!user) {
      res = await supabase
        .from("users")
        .select(selectFields)
        .eq("sicil_no", rawEmail)
        .maybeSingle<LoginUserRow>();

      if (res.data) user = res.data;
      error = res.error;
    }

    if (error) {
      console.error("Auth login kullanıcı sorgu hatası:", error);
      return NextResponse.json(
        { error: "Kullanıcı bilgileri okunamadı." },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    if (user.is_active === false) {
      return NextResponse.json(
        { error: "Kullanıcı pasif durumda." },
        { status: 403 }
      );
    }

    const userId = String(user.id ?? "").trim();
    const userEmail = String(user.email ?? "").trim().toLowerCase();
    const userRole = String(user.role ?? "").trim();
    const companyId = String(user.company_id ?? "").trim();

    const { data: firmAccessRows, error: firmAccessError } = await supabase
  .from("user_firm_access")
  .select("firm_id, role, is_primary")
  .eq("user_id", userId);

if (firmAccessError) {
  console.error("Auth login firma erişim sorgu hatası:", firmAccessError);
  return NextResponse.json(
    { error: "Kullanıcı firma yetkileri okunamadı." },
    { status: 500 }
  );
}

const normalizedUserRole = String(userRole || "").trim().toLowerCase();

const hasAllFirmRow = Array.isArray(firmAccessRows)
  ? firmAccessRows.some((f: any) => String(f?.firm_id || "").trim().toUpperCase() === "ALL")
  : false;

// ✅ KURAL:
// ALL firma erişimi sadece super_admin için tüm firmaları açar.
// Normal kullanıcı / demo / operator / training_user / company_admin ALL satırı alsa bile
// app'e tüm firmalar gönderilmez.
const hasGlobalFirmAccess = normalizedUserRole === "super_admin" && hasAllFirmRow;

let appFirms: any[] = [];

if (hasGlobalFirmAccess) {
  const { data: allCompanies, error: allCompaniesError } = await supabase
    .from("companies")
    .select("id, name, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (allCompaniesError) {
    console.error("Auth login tüm firmalar sorgu hatası:", allCompaniesError);
    return NextResponse.json(
      { error: "Tüm firmalar okunamadı." },
      { status: 500 }
    );
  }

  appFirms = (allCompanies || []).map((c: any, index: number) => ({
    id: String(c.id || ""),
    name: String(c.name || "Firma"),
    is_primary: index === 0,
    role: "super_admin",
  }));
} else if (Array.isArray(firmAccessRows) && firmAccessRows.length > 0) {
  const firmIds = firmAccessRows
    .map((f: any) => String(f?.firm_id || "").trim())
    .filter(Boolean);

  const { data: selectedCompanies, error: selectedCompaniesError } = await supabase
    .from("companies")
    .select("id, name, is_active")
    .in("id", firmIds)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (selectedCompaniesError) {
    console.error("Auth login bağlı firmalar sorgu hatası:", selectedCompaniesError);
    return NextResponse.json(
      { error: "Bağlı firmalar okunamadı." },
      { status: 500 }
    );
  }

  appFirms = (selectedCompanies || []).map((c: any) => {
    const access = firmAccessRows.find(
      (f: any) => String(f?.firm_id || "") === String(c.id || "")
    );

    return {
      id: String(c.id || ""),
      name: String(c.name || "Firma"),
      is_primary: Boolean(access?.is_primary),
      role: String(access?.role || "operator"),
    };
  });
}

    // 🔥 ŞİFRE KONTROL
    if (!isPasswordMatched(rawPassword, user)) {
      return NextResponse.json(
        { error: "Hatalı şifre." },
        { status: 401 }
      );
    }

    // 🏢 FİRMA KONTROL
    const companyBoundRoles = ["company_admin", "operator", "training_user"];
const mustCheckCompany =
  companyBoundRoles.includes(userRole) && !hasGlobalFirmAccess;

if (mustCheckCompany) {
  if (!companyId) {
        return NextResponse.json(
          { error: "Bu kullanıcıya bağlı firma bulunamadı." },
          { status: 403 }
        );
      }

      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, name, is_active")
        .eq("id", companyId)
        .maybeSingle<CompanyRow>();

      if (companyError) {
        console.error("Auth login firma sorgu hatası:", companyError);
        return NextResponse.json(
          { error: "Firma bilgileri okunamadı." },
          { status: 500 }
        );
      }

      if (!company) {
        return NextResponse.json(
          { error: "Bağlı firma bulunamadı." },
          { status: 403 }
        );
      }

      if (company.is_active === false) {
        return NextResponse.json(
          { error: "Bağlı firma pasif durumda." },
          { status: 403 }
        );
      }
    }

// 🎯 BAŞARILI LOGIN
const response = NextResponse.json({
  success: true,
  role: userRole,
  user: {
    id: userId,
    full_name: String(user.full_name ?? ""),
    email: userEmail,
    role: userRole,
    company_id: companyId || appFirms[0]?.id || null,
    firms: appFirms,
    has_global_firm_access: hasGlobalFirmAccess,
    permissions:
      userRole === "super_admin"
        ? [
            "ADMIN",
            "AJANDA",
            "CALISANLAR",
            "DENETIM",
            "DOKUMANTASYON",
            "EGITIM",
            "MEVZUAT",
            "RAPORLAMA",
            "SAGLIK",
            "CBS",
            "RISK_YONETIMI",
            "KAZA_OLAY_YONETIMI",
            "FIRMA_YONETIM",
            "KULLANICI_YONETIMI",
          ]
        : Array.isArray(user.permissions)
        ? user.permissions
        : [],
  },
});

    const secure = process.env.NODE_ENV === "production";

    const activeCookieBase = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure,
      path: "/",
      maxAge: 60 * 60 * 12,
    };

    const clearCookieBase = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure,
      path: "/",
      expires: new Date(0),
    };

    response.cookies.set("dsec_user_auth", "ok", activeCookieBase);
    response.cookies.set("dsec_user_role", userRole, activeCookieBase);
    response.cookies.set("dsec_user_id", userId, activeCookieBase);
    response.cookies.set("dsec_user_email", userEmail, activeCookieBase);
   response.cookies.set(
  "dsec_company_id",
  companyId || appFirms[0]?.id || "",
  activeCookieBase
);

    if (userRole === "super_admin" || userRole === "company_admin") {
      response.cookies.set("dsec_admin_auth", "ok", activeCookieBase);
      response.cookies.set("dsec_admin_role", userRole, activeCookieBase);
    } else {
      response.cookies.set("dsec_admin_auth", "", clearCookieBase);
      response.cookies.set("dsec_admin_role", "", clearCookieBase);
    }

    return response;
  } catch (error) {
    console.error("Auth login genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}