import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function generatePassword() {
  return Math.random().toString(36).slice(-8);
}

async function checkAdmin() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
  const adminRole = cookieStore.get("dsec_admin_role")?.value;

  return (
    adminAuth === "ok" &&
    (adminRole === "super_admin" || adminRole === "company_admin")
  );
}

export async function POST(req: Request) {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();

    const employeeIds = Array.isArray(body?.employeeIds)
      ? body.employeeIds.map((x: unknown) => String(x).trim()).filter(Boolean)
      : [];

    const companyId = String(body?.companyId || "").trim();

    if (!employeeIds.length) {
      return NextResponse.json(
        { error: "Çalışan seçimi bulunamadı." },
        { status: 400 }
      );
    }

    if (!companyId || companyId === "all") {
      return NextResponse.json(
        { error: "Firma seçimi zorunlu." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, firm_id, full_name, email, active")
      .in("id", employeeIds);

    if (empError) {
      return NextResponse.json(
        { error: "Çalışanlar alınamadı.", detail: empError.message },
        { status: 500 }
      );
    }

    const employeeRows = employees || [];

    if (employeeRows.length === 0) {
      return NextResponse.json(
        { error: "Seçilen çalışan bulunamadı." },
        { status: 400 }
      );
    }

    const invalidFirm = employeeRows.find(
      (emp: any) => String(emp.firm_id || "").trim() !== companyId
    );

    if (invalidFirm) {
      return NextResponse.json(
        { error: "Seçilen çalışanlardan bazıları seçili firmaya bağlı değil." },
        { status: 400 }
      );
    }

    const missingEmail = employeeRows.find(
      (emp: any) => !String(emp.email || "").trim()
    );

    if (missingEmail) {
      return NextResponse.json(
        { error: "Seçilen çalışanlardan bazılarında e-posta yok." },
        { status: 400 }
      );
    }

    let linkedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let accessCreatedCount = 0;

    for (const emp of employeeRows as any[]) {
      const employeeId = String(emp.id || "").trim();
      const fullName = String(emp.full_name || "Eğitim Kullanıcısı").trim();
      const email = String(emp.email || "").trim().toLowerCase();

      if (!employeeId || !email) continue;

      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id, company_id, employee_id, role")
        .ilike("email", email)
        .maybeSingle();

      if (existingUserError) {
        return NextResponse.json(
          {
            error: "Kullanıcı kontrolü yapılamadı.",
            detail: existingUserError.message,
          },
          { status: 500 }
        );
      }

      let userId = "";

      if (existingUser?.id) {
        userId = String(existingUser.id);

        const { error: updateError } = await supabase
          .from("users")
          .update({
            full_name: fullName,
            company_id: companyId,
            employee_id: employeeId,
            role: "training_user",
            is_active: emp.active !== false,
          })
          .eq("id", userId);

        if (updateError) {
          return NextResponse.json(
            {
              error: "Eğitim kullanıcısı güncellenemedi.",
              detail: updateError.message,
            },
            { status: 500 }
          );
        }

        updatedCount += 1;
      } else {
        const tempPassword = generatePassword();

        const { data: insertedUser, error: insertUserError } = await supabase
          .from("users")
          .insert({
            full_name: fullName,
            email,
            password_hash: sha256(tempPassword),
            role: "training_user",
            company_id: companyId,
            employee_id: employeeId,
            is_active: emp.active !== false,
          })
          .select("id")
          .single();

        if (insertUserError) {
          return NextResponse.json(
            {
              error: "Eğitim kullanıcısı oluşturulamadı.",
              detail: insertUserError.message,
            },
            { status: 500 }
          );
        }

        userId = String(insertedUser?.id || "");
        createdCount += 1;
      }

      if (!userId) continue;

      const { data: existingAccess, error: accessCheckError } = await supabase
        .from("user_firm_access")
        .select("user_id, firm_id")
        .eq("user_id", userId)
        .eq("firm_id", companyId)
        .maybeSingle();

      if (accessCheckError) {
        return NextResponse.json(
          {
            error: "Firma erişimi kontrol edilemedi.",
            detail: accessCheckError.message,
          },
          { status: 500 }
        );
      }

      if (!existingAccess) {
        const { error: accessError } = await supabase
          .from("user_firm_access")
          .insert({
            user_id: userId,
            firm_id: companyId,
            role: "training_user",
            is_primary: true,
          });

        if (accessError) {
          return NextResponse.json(
            {
              error: "Firma erişimi oluşturulamadı.",
              detail: accessError.message,
            },
            { status: 500 }
          );
        }

        accessCreatedCount += 1;
      }

      linkedCount += 1;
    }

    return NextResponse.json({
      success: true,
      linkedCount,
      createdCount,
      updatedCount,
      accessCreatedCount,
      message: "Çalışanlar eğitim kullanıcısına bağlandı.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Sunucu hatası.",
        detail: error?.message || null,
      },
      { status: 500 }
    );
  }
}