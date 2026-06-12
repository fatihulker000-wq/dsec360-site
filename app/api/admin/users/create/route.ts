import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function checkAdmin() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("dsec_admin_auth")?.value;
  const role = cookieStore.get("dsec_admin_role")?.value;

  return auth === "ok" && role === "super_admin";
}

const DEMO_USER_PERMISSIONS = [
  "DASHBOARD.VIEW",
  "DASHBOARD.KPI.VIEW",
  "DASHBOARD.CHARTS.VIEW",
  "DASHBOARD.EXECUTIVE.VIEW",

  "FIRMA_YONETIM.VIEW",

  "CALISANLAR.VIEW",
  "CALISANLAR.LIST.VIEW",
  "CALISANLAR.DETAIL.VIEW",
  "CALISANLAR.DOCUMENTS.VIEW",
  "CALISANLAR.TRAINING.VIEW",
  "CALISANLAR.HEALTH_SUMMARY.VIEW",
  "CALISANLAR.ACCIDENT_HISTORY.VIEW",
  "CALISANLAR.RISK_GROUP.VIEW",

  "EGITIM.VIEW",
  "EGITIM.DASHBOARD.VIEW",
  "EGITIM.LIST.VIEW",
  "EGITIM.PROGRESS.VIEW",
  "EGITIM.CERTIFICATE.VIEW",
  "EGITIM.ATTENDANCE.VIEW",
  "EGITIM.ASYNC.VIEW",
  "EGITIM.VIDEO.VIEW",
  "EGITIM.EXAM.VIEW",
  "EGITIM.EXAM.RESULTS.VIEW",

  "SAGLIK.VIEW",
  "SAGLIK.DASHBOARD.VIEW",
  "SAGLIK.SUMMARY.VIEW",
  "SAGLIK.EK2.VIEW_SUMMARY",
  "SAGLIK.RISKY_EMPLOYEES.VIEW",
  "SAGLIK.REPORTS.VIEW",

  "RISK_YONETIMI.VIEW",
  "RISK_YONETIMI.DASHBOARD.VIEW",
  "RISK_YONETIMI.PREMIUM_DASHBOARD.VIEW",
  "RISK_YONETIMI.FINE_KINNEY.VIEW",
  "RISK_YONETIMI.MATRIX5X5.VIEW",
  "RISK_YONETIMI.CHECKLIST.VIEW",
  "RISK_YONETIMI.WHATIF.VIEW",
  "RISK_YONETIMI.HAZOP.VIEW",
  "RISK_YONETIMI.FMEA.VIEW",
  "RISK_YONETIMI.EMERGENCY_PLAN.VIEW",
  "RISK_YONETIMI.SUPPORT_TEAM.VIEW",
  "RISK_YONETIMI.DRILL.VIEW",
  "RISK_YONETIMI.ACTION.VIEW",

  "DENETIM.VIEW",
  "DENETIM.DASHBOARD.VIEW",
  "DENETIM.CLASSIC.VIEW",
  "DENETIM.SCORING.VIEW",
  "DENETIM.PHOTO.VIEW",
  "DENETIM.ELMERI.VIEW",
  "DENETIM.DOF.VIEW",

  "KAZA_OLAY_YONETIMI.VIEW",
  "KAZA_OLAY_YONETIMI.DASHBOARD.VIEW",
  "KAZA_OLAY_YONETIMI.ACCIDENT.VIEW",
  "KAZA_OLAY_YONETIMI.NEAR_MISS.VIEW",
  "KAZA_OLAY_YONETIMI.OCCUPATIONAL_DISEASE.VIEW",
  "KAZA_OLAY_YONETIMI.PHOTOS.VIEW",
  "KAZA_OLAY_YONETIMI.ROOT_CAUSE.VIEW",
  "KAZA_OLAY_YONETIMI.RETURN_TRAINING.VIEW",
  "KAZA_OLAY_YONETIMI.STATS.VIEW",

  "DOKUMANTASYON.VIEW",
  "DOKUMANTASYON.FORMS.VIEW",
  "DOKUMANTASYON.INSTRUCTIONS.VIEW",
  "DOKUMANTASYON.TRAINING_DOCS.VIEW",
  "DOKUMANTASYON.BOARD_DOCS.VIEW",
  "DOKUMANTASYON.RISK_DOCS.VIEW",
  "DOKUMANTASYON.TEMPLATES.VIEW",

  "ACIL_DURUM.VIEW",
  "ACIL_DURUM.PLAN.VIEW",
  "ACIL_DURUM.SUPPORT_TEAMS.VIEW",
  "ACIL_DURUM.DRILLS.VIEW",
  "ACIL_DURUM.SCENARIOS.VIEW",
  "ACIL_DURUM.ASSEMBLY_AREAS.VIEW",
  "ACIL_DURUM.ESCAPE_ROUTES.VIEW",

  "TASERON.VIEW",
  "TASERON.COMPANY.VIEW",
  "TASERON.EMPLOYEE.VIEW",
  "TASERON.DOCUMENTS.VIEW",
  "TASERON.ENTRY_LOGS.VIEW",
  "TASERON.REPORTS.VIEW",

  "AJANDA.VIEW",
  "AJANDA.TASKS.VIEW",
  "AJANDA.CALENDAR.VIEW",
  "AJANDA.REMINDER.VIEW",

  "MEVZUAT.VIEW",
  "MEVZUAT.LIST.VIEW",
  "MEVZUAT.LINK_OPEN",
  "MEVZUAT.UPDATES.VIEW",

  "RAPORLAMA.VIEW",
  "RAPORLAMA.EXECUTIVE.VIEW",
  "RAPORLAMA.DETAIL.VIEW",
  "RAPORLAMA.AI_SUMMARY.VIEW",

  "CBS.VIEW",
  "CBS.RECORDS.VIEW_ASSIGNED",
  "CBS.RECORDS.VIEW_ALL",

  "AI_ISG.VIEW",
  "AI_ISG.CHAT.VIEW",

  "KULLANICI_AKTIVITE.VIEW",
  "KULLANICI_AKTIVITE.LAST_LOGIN.VIEW",
  "KULLANICI_AKTIVITE.MODULE_USAGE.VIEW",
];

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();

    const full_name = String(body?.full_name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();
    const role = String(body?.role || "").trim();
    const company_id = String(body?.company_id || "").trim();
    const is_active = Boolean(body?.is_active);

    if (!full_name) {
      return NextResponse.json({ error: "Ad soyad zorunlu." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email zorunlu." }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Şifre zorunlu." }, { status: 400 });
    }

    const allowedRoles = [
      "operator",
      "company_admin",
      "super_admin",
      "training_user",
      "demo_user",
    ];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
    }

    if ((role === "training_user" || role === "demo_user") && !company_id) {
      return NextResponse.json(
        { error: "Bu kullanıcı tipi için firma zorunludur." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existingError) {
      console.error("create user existing check error:", existingError);
      return NextResponse.json(
        { error: "Kullanıcı kontrolü yapılamadı." },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email ile kayıtlı kullanıcı zaten var." },
        { status: 400 }
      );
    }

    const password_hash = sha256(password);
    let employeeId: string | null = null;

    if (role === "training_user") {
      const { data: insertedEmployee, error: employeeError } = await supabase
        .from("employees")
        .insert({
          firm_id: company_id,
          full_name,
          email,
          active: is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (employeeError) {
        console.error("create employee error:", employeeError);
        return NextResponse.json(
          { error: "Çalışan kaydı oluşturulamadı." },
          { status: 500 }
        );
      }

      employeeId = insertedEmployee?.id || null;
    }

    const permissions = role === "demo_user" ? DEMO_USER_PERMISSIONS : [];

    const { data: insertedUser, error: insertError } = await supabase
      .from("users")
      .insert({
        full_name,
        email,
        password_hash,
        role,
        company_id: company_id || null,
        employee_id: employeeId,
        is_active,
        permissions,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("create user insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (insertedUser?.id && company_id) {
      const { error: firmAccessError } = await supabase
        .from("user_firm_access")
        .insert({
          user_id: insertedUser.id,
          firm_id: company_id,
          role: role,
          is_primary: true,
        });

      if (firmAccessError) {
        console.error("create user firm access error:", firmAccessError);
        return NextResponse.json(
          { error: "Kullanıcı oluşturuldu ancak firma erişimi eklenemedi." },
          { status: 500 }
        );
      }
    }

    if (role === "demo_user" && insertedUser?.id) {
      const insertData = DEMO_USER_PERMISSIONS.map((permissionKey) => ({
        user_id: insertedUser.id,
        permission_key: permissionKey,
      }));

      const { error: permissionError } = await supabase
        .from("user_permissions")
        .insert(insertData);

      if (permissionError) {
        console.error("demo user permission insert error:", permissionError);
        return NextResponse.json(
          { error: "Demo kullanıcı oluşturuldu ancak yetkileri eklenemedi." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      userId: insertedUser?.id || null,
      role,
      permissionsCount: permissions.length,
    });
  } catch (error) {
    console.error("create user general error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}