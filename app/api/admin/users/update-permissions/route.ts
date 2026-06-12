import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const MOBILE_API_KEY = "dsec_mobile_123";

const COMPANY_ADMIN_ASSIGNABLE_PREFIXES = [
  "DASHBOARD.",
  "CALISANLAR.",
  "EGITIM.",
  "RISK_YONETIMI.",
  "DENETIM.",
  "KAZA_OLAY_YONETIMI.",
  "DOKUMANTASYON.",
  "ACIL_DURUM.",
  "TASERON.",
  "AJANDA.",
  "MEVZUAT.",
  "RAPORLAMA.",
  "CBS.",
  "AI_ISG.",
  "KULLANICI_AKTIVITE.",
];

const COMPANY_ADMIN_BLOCKED_KEYS = [
  "SAGLIK.SENSITIVE.VIEW",
  "SAGLIK.EK2.VIEW_DETAIL",
  "SAGLIK.EK2.CREATE",
  "SAGLIK.EK2.EDIT",
  "SAGLIK.EK2.DELETE",
  "SAGLIK.EK2.PDF",
  "SAGLIK.MUAYENE.VIEW",
  "SAGLIK.MUAYENE.CREATE",
  "SAGLIK.MUAYENE.EDIT",
  "SAGLIK.RECETE.VIEW",
  "SAGLIK.RECETE.CREATE",
  "SAGLIK.DECISION_SUPPORT.VIEW",
  "SAGLIK.REPORTS.PDF",

  "FIRMA_YONETIM.CREATE",
  "FIRMA_YONETIM.DELETE",
  "FIRMA_YONETIM.LICENSE.VIEW",
  "FIRMA_YONETIM.LICENSE.MANAGE",
  "FIRMA_YONETIM.PACKAGE.VIEW",
  "FIRMA_YONETIM.PACKAGE.MANAGE",
  "FIRMA_YONETIM.UNLIMITED_COMPANY",

  "KULLANICI_YONETIMI.DELETE",
  "KULLANICI_YONETIMI.ROLES.MANAGE",
  "KULLANICI_YONETIMI.GLOBAL_MANAGE",
  "KULLANICI_YONETIMI.UNLIMITED_USER",

  "SISTEM_AYARLARI.VIEW",
  "SISTEM_AYARLARI.GENERAL.EDIT",
  "SISTEM_AYARLARI.NOTIFICATIONS.EDIT",
  "SISTEM_AYARLARI.INTEGRATIONS.EDIT",
  "SISTEM_AYARLARI.BACKUP.MANAGE",
  "SISTEM_AYARLARI.SECURITY.MANAGE",
];

const COMPANY_ADMIN_ALLOWED_EXTRA_KEYS = [
  "SAGLIK.VIEW",
  "SAGLIK.DASHBOARD.VIEW",
  "SAGLIK.SUMMARY.VIEW",
  "SAGLIK.EK2.VIEW_SUMMARY",
  "SAGLIK.RISKY_EMPLOYEES.VIEW",
  "SAGLIK.REPORTS.VIEW",

  "FIRMA_YONETIM.VIEW",
  "FIRMA_YONETIM.EDIT",
  "FIRMA_YONETIM.BRANCHES.VIEW",
  "FIRMA_YONETIM.BRANCHES.EDIT",
  "FIRMA_YONETIM.DANGER_CLASS.EDIT",

  "KULLANICI_YONETIMI.VIEW",
  "KULLANICI_YONETIMI.CREATE",
  "KULLANICI_YONETIMI.EDIT",
  "KULLANICI_YONETIMI.PASSIVE",
  "KULLANICI_YONETIMI.RESET_PASSWORD",
  "KULLANICI_YONETIMI.ROLES.VIEW",
  "KULLANICI_YONETIMI.PERMISSIONS",
];

type AdminSession = {
  allowed: boolean;
  role: "super_admin" | "company_admin" | "mobile" | null;
  userId: string;
  companyId: string;
};

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function normalizePermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  return Array.from(
    new Set(raw.map((p) => String(p || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "tr"));
}

function canCompanyAdminAssign(permissionKey: string) {
  if (COMPANY_ADMIN_BLOCKED_KEYS.includes(permissionKey)) return false;
  if (COMPANY_ADMIN_ALLOWED_EXTRA_KEYS.includes(permissionKey)) return true;

  return COMPANY_ADMIN_ASSIGNABLE_PREFIXES.some((prefix) =>
    permissionKey.startsWith(prefix)
  );
}

function filterCompanyAdminPermissions(permissions: string[]) {
  return permissions.filter(canCompanyAdminAssign);
}

async function getAdminSession(req: NextRequest): Promise<AdminSession> {
  const apiKey = req.headers.get("x-api-key");

  if (apiKey === MOBILE_API_KEY) {
    return {
      allowed: true,
      role: "mobile",
      userId: "",
      companyId: "",
    };
  }

  const cookieStore = await cookies();

  const auth = String(cookieStore.get("dsec_admin_auth")?.value || "").trim();
  const role = String(cookieStore.get("dsec_admin_role")?.value || "").trim();
  const userId = String(cookieStore.get("dsec_user_id")?.value || "").trim();
  const companyId = String(cookieStore.get("dsec_company_id")?.value || "").trim();

  const allowed =
    auth === "ok" && (role === "super_admin" || role === "company_admin");

  return {
    allowed,
    role: allowed ? (role as "super_admin" | "company_admin") : null,
    userId,
    companyId,
  };
}

async function ensureCompanyAdminCanEditTarget(
  targetUserId: string,
  adminCompanyId: string
) {
  if (!adminCompanyId) {
    return {
      ok: false,
      error: "Firma admini için firma bilgisi bulunamadı.",
      status: 403,
    };
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("user_firm_access")
    .select("user_id, firm_id")
    .eq("user_id", targetUserId)
    .eq("firm_id", adminCompanyId)
    .maybeSingle();

  if (error) {
    console.error("company admin target firm check error:", error);
    return {
      ok: false,
      error: "Kullanıcının firma erişimi kontrol edilemedi.",
      status: 500,
    };
  }

  if (!data) {
    return {
      ok: false,
      error: "Firma admini sadece kendi firmasındaki kullanıcıların yetkisini değiştirebilir.",
      status: 403,
    };
  }

  return {
    ok: true,
    error: "",
    status: 200,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession(req);

    if (!session.allowed || !session.role) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const userId = String(body?.userId || "").trim();
    const rawPermissions = normalizePermissions(body?.permissions);

    if (!userId) {
      return NextResponse.json({ error: "userId gerekli" }, { status: 400 });
    }

    let permissions = rawPermissions;

    if (session.role === "company_admin") {
      const accessCheck = await ensureCompanyAdminCanEditTarget(
        userId,
        session.companyId
      );

      if (!accessCheck.ok) {
        return NextResponse.json(
          { error: accessCheck.error },
          { status: accessCheck.status }
        );
      }

      permissions = filterCompanyAdminPermissions(rawPermissions);
    }

    const supabase = getSupabase();

    const { error: deleteError } = await supabase
      .from("user_permissions")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("permission delete error:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Eski yetkiler silinemedi." },
        { status: 500 }
      );
    }

    if (permissions.length > 0) {
      const insertData = permissions.map((permissionKey) => ({
        user_id: userId,
        permission_key: permissionKey,
      }));

      const { error: insertError } = await supabase
        .from("user_permissions")
        .insert(insertData);

      if (insertError) {
        console.error("permission insert error:", insertError);
        return NextResponse.json(
          { error: insertError.message || "Yeni yetkiler kaydedilemedi." },
          { status: 500 }
        );
      }
    }

    const { error: userPermissionsSyncError } = await supabase
      .from("users")
      .update({
        permissions,
      })
      .eq("id", userId);

    if (userPermissionsSyncError) {
      console.error("users permissions sync error:", userPermissionsSyncError);

      return NextResponse.json(
        {
          error:
            String(userPermissionsSyncError?.message || "") ||
            "Kullanıcı yetki özeti güncellenemedi.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      permissions,
      permissionCount: permissions.length,
      filteredByCompanyAdmin: session.role === "company_admin",
    });
  } catch (err) {
    console.error("update-permissions general error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}