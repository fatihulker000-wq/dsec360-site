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

function clean(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function sha256(input: string) {
  return crypto
    .createHash("sha256")
    .update(input)
    .digest("hex");
}

function generatePassword() {
  return Math.random().toString(36).slice(-8);
}

type AccessContext = {
  allowed: boolean;
  role: string;
  companyId: string;
  companyScoped: boolean;
  readOnly: boolean;
};

async function getAccessContext(): Promise<AccessContext> {
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

  const companyId = String(
    cookieStore.get("dsec_company_id")?.value || ""
  ).trim();

  const allowedRoles = [
    "admin",
    "super_admin",
    "company_admin",
    "demo_user",
  ];

  const companyScoped =
    role === "company_admin" || role === "demo_user";

  const allowed =
    auth === "ok" &&
    allowedRoles.includes(role) &&
    (!companyScoped || Boolean(companyId));

  return {
    allowed,
    role,
    companyId,
    companyScoped,
    readOnly: role === "demo_user",
  };
}

async function getScopedEmployee(params: {
  supabase: ReturnType<typeof getSupabase>;
  employeeId: string;
  access: AccessContext;
}) {
  const { supabase, employeeId, access } = params;

  let query = supabase
    .from("employees")
    .select("id, firm_id, full_name, email, active, exit_date")
    .eq("id", employeeId);

  if (access.companyScoped) {
    query = query.eq("firm_id", access.companyId);
  }

  const { data, error } = await query.maybeSingle();

  return {
    employee: data || null,
    error,
  };
}

async function ensureTrainingUserForEmployee(params: {
  supabase: ReturnType<typeof getSupabase>;
  employee: any;
}) {
  const { supabase, employee } = params;

  const email = clean(employee.email);
  const fullName = clean(employee.full_name);
  const firmId = clean(employee.firm_id);
  const employeeId = clean(employee.id);

  if (!email || !fullName || !firmId || !employeeId) {
    return;
  }

  const normalizedEmail = email.toLowerCase();

  const { data: existingUser, error: existingUserError } =
    await supabase
      .from("users")
      .select("id, employee_id, company_id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

  if (existingUserError) {
    console.error(
      "AUTO TRAINING USER CHECK ERROR:",
      existingUserError
    );
    return;
  }

  if (existingUser?.id) {
    const existingCompanyId = clean(existingUser.company_id);

    // Aynı e-posta başka firmaya bağlıysa bağlantısını değiştirmiyoruz.
    if (
      existingCompanyId &&
      existingCompanyId !== firmId
    ) {
      console.error(
        "AUTO TRAINING USER COMPANY CONFLICT:",
        normalizedEmail,
        existingCompanyId,
        firmId
      );
      return;
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        full_name: fullName,
        employee_id: employeeId,
        company_id: firmId,
        role: "training_user",
        is_active: employee.active !== false,
      })
      .eq("id", existingUser.id);

    if (updateError) {
      console.error(
        "AUTO TRAINING USER UPDATE ERROR:",
        updateError
      );
      return;
    }

    const { data: existingFirmAccess } = await supabase
      .from("user_firm_access")
      .select("user_id")
      .eq("user_id", existingUser.id)
      .eq("firm_id", firmId)
      .maybeSingle();

    if (!existingFirmAccess) {
      const { error: firmAccessError } = await supabase
        .from("user_firm_access")
        .insert({
          user_id: existingUser.id,
          firm_id: firmId,
          role: "training_user",
          is_primary: true,
        });

      if (firmAccessError) {
        console.error(
          "AUTO TRAINING USER FIRM ACCESS ERROR:",
          firmAccessError
        );
      }
    }

    return;
  }

  const temporaryPassword = generatePassword();

  const { data: insertedUser, error: userError } =
    await supabase
      .from("users")
      .insert({
        full_name: fullName,
        email: normalizedEmail,
        password_hash: sha256(temporaryPassword),
        role: "training_user",
        company_id: firmId,
        employee_id: employeeId,
        is_active: employee.active !== false,
      })
      .select("id")
      .single();

  if (userError) {
    console.error(
      "AUTO TRAINING USER CREATE ERROR:",
      userError
    );
    return;
  }

  if (insertedUser?.id) {
    const { error: firmAccessError } = await supabase
      .from("user_firm_access")
      .insert({
        user_id: insertedUser.id,
        firm_id: firmId,
        role: "training_user",
        is_primary: true,
      });

    if (firmAccessError) {
      console.error(
        "AUTO TRAINING USER FIRM ACCESS CREATE ERROR:",
        firmAccessError
      );
    }
  }
}

function buildEmployeePayload(body: any) {
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (body?.firm_id !== undefined) {
    payload.firm_id = clean(body.firm_id);
  }

  if (body?.full_name !== undefined) {
    payload.full_name = clean(body.full_name);
  }

  if (body?.job_title !== undefined) {
    payload.job_title = clean(body.job_title);
  }

  if (body?.phone !== undefined) {
    payload.phone = clean(body.phone);
  }

  if (body?.email !== undefined) {
    payload.email = clean(body.email);
  }

  if (body?.registry_no !== undefined) {
    payload.registry_no = clean(body.registry_no);
  }

  if (body?.tc_no !== undefined) {
    payload.tc_no = clean(body.tc_no);
  }

  if (body?.start_date !== undefined) {
    payload.start_date = clean(body.start_date);
  }

  if (body?.exit_date !== undefined) {
    payload.exit_date = clean(body.exit_date);
  }

  if (body?.gender !== undefined) {
    payload.gender = clean(body.gender);
  }

  if (body?.disability_status !== undefined) {
    payload.disability_status = clean(
      body.disability_status
    );
  }

  if (body?.birth_date !== undefined) {
    payload.birth_date = clean(body.birth_date);
  }

  if (body?.education_level !== undefined) {
    payload.education_level = clean(
      body.education_level
    );
  }

  if (body?.blood_type !== undefined) {
    payload.blood_type = clean(body.blood_type);
  }

  if (body?.active !== undefined) {
    payload.active = Boolean(body.active);
  }

  return payload;
}

// ======================================================
// GET — ÇALIŞAN LİSTESİ
// ======================================================

export async function GET(request: Request) {
  try {
    const access = await getAccessContext();

    if (!access.allowed) {
      return NextResponse.json(
        {
          error:
            "Yetkisiz erişim veya firma bilgisi eksik.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const requestedFirmId = String(
      searchParams.get("firmId") || ""
    ).trim();

    /*
     * Demo ve firma yöneticileri URL üzerinden
     * firmId=all veya başka firma gönderse bile
     * yalnızca kendi firmalarını okuyabilir.
     */
    const effectiveFirmId = access.companyScoped
      ? access.companyId
      : requestedFirmId;

    const supabase = getSupabase();

    const allEmployees: any[] = [];
    let from = 0;
    const step = 1000;

    while (true) {
      let pagedQuery = supabase
        .from("employees")
        .select("*")
        .order("full_name", { ascending: true })
        .range(from, from + step - 1);

      if (
        effectiveFirmId &&
        effectiveFirmId !== "all"
      ) {
        pagedQuery = pagedQuery.eq(
          "firm_id",
          effectiveFirmId
        );
      }

      const { data, error } = await pagedQuery;

      if (error) {
        console.error("employees GET error:", error);

        return NextResponse.json(
          {
            error: "Çalışanlar alınamadı.",
            detail: error.message,
          },
          { status: 500 }
        );
      }

      const rows = data || [];
      allEmployees.push(...rows);

      if (rows.length < step) {
        break;
      }

      from += step;
    }

    let companiesQuery = supabase
      .from("companies")
      .select("id, name")
      .order("name", { ascending: true });

    if (access.companyScoped) {
      companiesQuery = companiesQuery.eq(
        "id",
        access.companyId
      );
    }

    const {
      data: companies,
      error: companiesError,
    } = await companiesQuery;

    if (companiesError) {
      console.error(
        "employee companies GET error:",
        companiesError
      );

      return NextResponse.json(
        {
          error: "Firma bilgileri alınamadı.",
          detail: companiesError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: allEmployees,
      companies: companies || [],
      stats: {
        total_count: allEmployees.length,
        active_count: allEmployees.filter(
          (employee) => employee.active !== false
        ).length,
        passive_count: allEmployees.filter(
          (employee) => employee.active === false
        ).length,
      },
      scope: {
        role: access.role,
        company_id: access.companyScoped
          ? access.companyId
          : effectiveFirmId || null,
        read_only: access.readOnly,
      },
    });
  } catch (errorValue: any) {
    console.error(
      "employees GET genel hata:",
      errorValue
    );

    return NextResponse.json(
      {
        error:
          errorValue?.message || "Sunucu hatası.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// POST — ÇALIŞAN EKLEME
// ======================================================

export async function POST(req: Request) {
  try {
    const access = await getAccessContext();

    if (!access.allowed) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    if (access.readOnly) {
      return NextResponse.json(
        {
          error:
            "Demo kullanıcısı çalışan ekleyemez.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const supabase = getSupabase();

    /*
     * Firma yöneticisi body içinde başka bir firma
     * gönderse bile kendi firması kullanılır.
     */
    const firmId = access.companyScoped
      ? access.companyId
      : clean(body?.firm_id);

    const fullName = clean(body?.full_name);

    if (!firmId || !fullName) {
      return NextResponse.json(
        {
          error:
            "firm_id ve full_name zorunludur.",
        },
        { status: 400 }
      );
    }

    const payload = {
      ...buildEmployeePayload(body),
      firm_id: firmId,
      full_name: fullName,
      active:
        body?.active !== undefined
          ? Boolean(body.active)
          : true,
      exit_date:
        body?.exit_date !== undefined
          ? clean(body.exit_date)
          : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("employees")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      console.error("employee POST error:", error);

      return NextResponse.json(
        {
          error: "Çalışan eklenemedi.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    await ensureTrainingUserForEmployee({
      supabase,
      employee: data,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (errorValue: any) {
    console.error(
      "employees POST genel hata:",
      errorValue
    );

    return NextResponse.json(
      {
        error: "Sunucu hatası.",
        detail: errorValue?.message || null,
      },
      { status: 500 }
    );
  }
}

// ======================================================
// PUT — ÇALIŞAN GÜNCELLEME
// ======================================================

export async function PUT(req: Request) {
  try {
    const access = await getAccessContext();

    if (!access.allowed) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    if (access.readOnly) {
      return NextResponse.json(
        {
          error:
            "Demo kullanıcısı çalışan güncelleyemez.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const supabase = getSupabase();

    const id = clean(body?.id);

    if (!id) {
      return NextResponse.json(
        { error: "id zorunludur." },
        { status: 400 }
      );
    }

    const {
      employee: existingEmployee,
      error: existingEmployeeError,
    } = await getScopedEmployee({
      supabase,
      employeeId: id,
      access,
    });

    if (existingEmployeeError) {
      console.error(
        "employee scope check error:",
        existingEmployeeError
      );

      return NextResponse.json(
        {
          error:
            "Çalışan erişimi kontrol edilemedi.",
          detail: existingEmployeeError.message,
        },
        { status: 500 }
      );
    }

    if (!existingEmployee) {
      return NextResponse.json(
        {
          error:
            "Çalışan bulunamadı veya bu firmaya ait değil.",
        },
        { status: 404 }
      );
    }

    const payload = buildEmployeePayload(body);

    /*
     * Firma yöneticisi çalışanı başka firmaya taşıyamaz.
     */
    if (access.companyScoped) {
      payload.firm_id = access.companyId;
    }

    let updateQuery = supabase
      .from("employees")
      .update(payload)
      .eq("id", id);

    if (access.companyScoped) {
      updateQuery = updateQuery.eq(
        "firm_id",
        access.companyId
      );
    }

    const { data, error } = await updateQuery
      .select("*")
      .single();

    if (error) {
      console.error("employee PUT error:", error);

      return NextResponse.json(
        {
          error: "Çalışan güncellenemedi.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    await ensureTrainingUserForEmployee({
      supabase,
      employee: data,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (errorValue: any) {
    console.error(
      "employees PUT genel hata:",
      errorValue
    );

    return NextResponse.json(
      {
        error: "Sunucu hatası.",
        detail: errorValue?.message || null,
      },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE — PASİFE ALMA / KALICI SİLME
// ======================================================

export async function DELETE(req: Request) {
  try {
    const access = await getAccessContext();

    if (!access.allowed) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    if (access.readOnly) {
      return NextResponse.json(
        {
          error:
            "Demo kullanıcısı çalışan silemez veya pasife alamaz.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const id = clean(searchParams.get("id"));
    const mode = clean(searchParams.get("mode"));

    if (!id) {
      return NextResponse.json(
        { error: "id zorunludur." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const {
      employee: existingEmployee,
      error: existingEmployeeError,
    } = await getScopedEmployee({
      supabase,
      employeeId: id,
      access,
    });

    if (existingEmployeeError) {
      console.error(
        "employee delete scope check error:",
        existingEmployeeError
      );

      return NextResponse.json(
        {
          error:
            "Çalışan erişimi kontrol edilemedi.",
          detail: existingEmployeeError.message,
        },
        { status: 500 }
      );
    }

    if (!existingEmployee) {
      return NextResponse.json(
        {
          error:
            "Çalışan bulunamadı veya bu firmaya ait değil.",
        },
        { status: 404 }
      );
    }

    /*
     * Kalıcı silme yalnızca admin/super_admin için açıktır.
     * Firma yöneticisi sadece pasife alabilir.
     */
    const canHardDelete =
      access.role === "admin" ||
      access.role === "super_admin";

    if (mode === "hard") {
      if (!canHardDelete) {
        return NextResponse.json(
          {
            error:
              "Kalıcı silme işlemi için süper admin yetkisi gerekir.",
          },
          { status: 403 }
        );
      }

      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(
          "employee hard DELETE error:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Çalışan kalıcı olarak silinemedi.",
            detail: error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        deleted: true,
      });
    }

    let passiveQuery = supabase
      .from("employees")
      .update({
        active: false,
        exit_date:
          existingEmployee.exit_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (access.companyScoped) {
      passiveQuery = passiveQuery.eq(
        "firm_id",
        access.companyId
      );
    }

    const { data, error } = await passiveQuery
      .select("*")
      .single();

    if (error) {
      console.error(
        "employee passive DELETE error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Çalışan pasife alınamadı.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    /*
     * Çalışana bağlı eğitim kullanıcısını da pasifleştir.
     */
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({
        is_active: false,
      })
      .eq("employee_id", id);

    if (userUpdateError) {
      console.error(
        "employee user passive error:",
        userUpdateError
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (errorValue: any) {
    console.error(
      "employees DELETE genel hata:",
      errorValue
    );

    return NextResponse.json(
      {
        error: "Sunucu hatası.",
        detail: errorValue?.message || null,
      },
      { status: 500 }
    );
  }
}