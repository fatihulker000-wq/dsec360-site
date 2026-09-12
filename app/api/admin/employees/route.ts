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


function normalizeHazardClass(
  value: unknown
) {
  return String(value ?? "")
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/\s+/g, " ");
}

function getLegalTrainingRule(
  hazardClass: unknown
) {
  const normalized =
    normalizeHazardClass(hazardClass);

  if (
    normalized.includes("ÇOK TEHLİKELİ") ||
    normalized.includes("COK TEHLIKELI")
  ) {
    return {
      requiredMinutes: 16 * 60,
      validityYears: 1,
      label: "Çok Tehlikeli",
    };
  }

  // "Az Tehlikeli" ifadesi "Tehlikeli" kelimesini de içerdiği için
  // önce özel sınıfı kontrol et. Aksi halde 8 saat yerine 12 saat hesaplanır.
  if (
    normalized.includes("AZ TEHLİKELİ") ||
    normalized.includes("AZ TEHLIKELI")
  ) {
    return {
      requiredMinutes: 8 * 60,
      validityYears: 3,
      label: "Az Tehlikeli",
    };
  }

  if (
    normalized.includes("TEHLİKELİ") ||
    normalized.includes("TEHLIKELI")
  ) {
    return {
      requiredMinutes: 12 * 60,
      validityYears: 2,
      label: "Tehlikeli",
    };
  }

  return {
    requiredMinutes: 0,
    validityYears: 0,
    label: "",
  };
}

function isTrainingCompleted(
  row: any
) {
  const status = String(
    row?.status ?? ""
  )
    .trim()
    .toLocaleUpperCase("tr-TR");

  if (
    [
      "COMPLETED",
      "TAMAMLANDI",
      "BAŞARILI",
      "BASARILI",
      "PASSED",
    ].includes(status)
  ) {
    return true;
  }

  if (row?.completed_at) {
    return true;
  }

  return (
    row?.watch_completed === true &&
    row?.final_exam_passed === true
  );
}

function getTrainingCompletionDate(
  row: any
) {
  const raw =
    row?.completed_at ||
    row?.date ||
    row?.started_at ||
    row?.created_at ||
    null;

  if (!raw) return null;

  const date = new Date(raw);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function isTrainingLegallyValid(
  row: any,
  validityYears: number,
  now = new Date()
) {
  if (!isTrainingCompleted(row)) {
    return false;
  }

  if (validityYears <= 0) {
    return false;
  }

  const completedAt =
    getTrainingCompletionDate(row);

  /*
   * Yasal uygunlukta tarih bilinmiyorsa güvenli tarafta kal:
   * süre hesabına dahil etme.
   */
  if (!completedAt) {
    return false;
  }

  const validUntil =
    new Date(completedAt);

  validUntil.setFullYear(
    validUntil.getFullYear() +
      validityYears
  );

  return validUntil >= now;
}

function calculateLegalTrainingSummary(
  rows: any[],
  hazardClass: unknown
) {
  const rule =
    getLegalTrainingRule(hazardClass);

  if (rule.requiredMinutes <= 0) {
    return {
      status: "UNKNOWN" as const,
      completionRate: 0,
      completedMinutes: 0,
      requiredMinutes: 0,
      missingMinutes: 0,
      validityYears: 0,
      hazardClass:
        normalizeHazardClass(hazardClass),
      validTrainingCount: 0,
    };
  }

  const validRows =
    (rows || []).filter((row) =>
      isTrainingLegallyValid(
        row,
        rule.validityYears
      )
    );

  const completedMinutes =
    validRows.reduce(
      (sum, row) =>
        sum +
        Math.max(
          0,
          Number(
            row?.duration_minutes ?? 0
          ) || 0
        ),
      0
    );

  const completionRate =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (completedMinutes /
            rule.requiredMinutes) *
            100
        )
      )
    );

  const missingMinutes =
    Math.max(
      0,
      rule.requiredMinutes -
        completedMinutes
    );

  return {
    status:
      completedMinutes >=
      rule.requiredMinutes
        ? ("COMPLETE" as const)
        : ("MISSING" as const),
    completionRate,
    completedMinutes,
    requiredMinutes:
      rule.requiredMinutes,
    missingMinutes,
    validityYears:
      rule.validityYears,
    hazardClass: rule.label,
    validTrainingCount:
      validRows.length,
  };
}


function healthSummaryForList(
  rows: any[]
) {
  if (!rows.length) {
    return {
      status: "UNKNOWN" as const,
      recordCount: 0,
      lastExamAt: null as string | null,
      nextDueAt: null as string | null,
    };
  }

  const toIso = (
    value: unknown
  ): string | null => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const numberValue =
      typeof value === "number"
        ? value
        : Number(value);

    const date =
      Number.isFinite(numberValue) &&
      numberValue > 10000000000
        ? new Date(numberValue)
        : new Date(String(value));

    return Number.isNaN(date.getTime())
      ? null
      : date.toISOString();
  };

  const latest = [...rows].sort(
    (a, b) => {
      const aDate = new Date(
        toIso(
          a.exam_date_millis ||
            a.exam_date ||
            a.examination_date
        ) || 0
      ).getTime();

      const bDate = new Date(
        toIso(
          b.exam_date_millis ||
            b.exam_date ||
            b.examination_date
        ) || 0
      ).getTime();

      return bDate - aDate;
    }
  )[0];

  const lastExamAt = toIso(
    latest?.exam_date_millis ||
      latest?.exam_date ||
      latest?.examination_date
  );

  const dueDates = rows
    .map((row) =>
      toIso(
        row.next_due_millis ||
          row.next_due_at ||
          row.next_exam_date
      )
    )
    .filter(Boolean) as string[];

  const nextDueAt =
    dueDates.length > 0
      ? dueDates.sort(
          (a, b) =>
            new Date(a).getTime() -
            new Date(b).getTime()
        )[0]
      : null;

  let status:
    | "COMPLETE"
    | "MISSING"
    | "EXPIRING"
    | "UNKNOWN" = "COMPLETE";

  if (nextDueAt) {
    const due =
      new Date(nextDueAt).getTime();
    const now = Date.now();

    if (due < now) {
      status = "MISSING";
    } else if (
      due <=
      now + 30 * 24 * 60 * 60 * 1000
    ) {
      status = "EXPIRING";
    }
  }

  return {
    status,
    recordCount: rows.length,
    lastExamAt,
    nextDueAt,
  };
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
    "workplace_physician",
    "workplace_doctor",
    "isyeri_hekimi",
    "işyeri_hekimi",
  ];

  const companyScoped =
    role === "company_admin" ||
    role === "demo_user" ||
    role === "workplace_physician" ||
    role === "workplace_doctor" ||
    role === "isyeri_hekimi" ||
    role === "işyeri_hekimi";

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

  if (body?.department !== undefined || body?.department_name !== undefined || body?.departmentName !== undefined) {
    payload.department = clean(
      body?.department ?? body?.department_name ?? body?.departmentName
    );
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

    /*
     * Çalışan listesi ile çalışan profilindeki iş kazası sayısını
     * aynı kanonik ilişki üzerinden üret:
     * accident_records.web_employee_id + accident_records.web_firm_id.
     *
     * Böylece listede Kaza=0, profilde İş Kazası=1 gibi tutarsızlık oluşmaz.
     */
    const employeeIds = allEmployees
      .map((employee) => String(employee.id || "").trim())
      .filter(Boolean);

    const accidentCountByEmployee = new Map<string, number>();

    if (employeeIds.length > 0) {
      const chunkSize = 500;

      for (let i = 0; i < employeeIds.length; i += chunkSize) {
        const idChunk = employeeIds.slice(i, i + chunkSize);

        let accidentQuery = supabase
          .from("accident_records")
          .select("id, web_employee_id, web_firm_id, is_deleted")
          .in("web_employee_id", idChunk)
          .or("is_deleted.is.null,is_deleted.eq.false");

        if (
          effectiveFirmId &&
          effectiveFirmId !== "all"
        ) {
          accidentQuery = accidentQuery.eq(
            "web_firm_id",
            effectiveFirmId
          );
        }

        const {
          data: accidentRows,
          error: accidentError,
        } = await accidentQuery;

        if (accidentError) {
          console.error(
            "employees accident count GET error:",
            accidentError
          );

          return NextResponse.json(
            {
              error:
                "Çalışan iş kazası bilgileri alınamadı.",
              detail: accidentError.message,
            },
            { status: 500 }
          );
        }

        for (const accident of accidentRows || []) {
          const employeeId = String(
            accident.web_employee_id || ""
          ).trim();

          if (!employeeId) continue;

          /*
           * Tüm Firmalar görünümünde dahi kazayı yalnızca
           * çalışanın kendi firmasıyla eşleşiyorsa say.
           */
          const employee = allEmployees.find(
            (item) =>
              String(item.id) === employeeId
          );

          if (
            !employee ||
            String(employee.firm_id || "") !==
              String(accident.web_firm_id || "")
          ) {
            continue;
          }

          accidentCountByEmployee.set(
            employeeId,
            (accidentCountByEmployee.get(employeeId) || 0) + 1
          );
        }
      }
    }

    const employeesWithAccidentCount =
      allEmployees.map((employee) => ({
        ...employee,
        accident_count:
          accidentCountByEmployee.get(
            String(employee.id)
          ) || 0,
      }));


    /*
     * ÇALIŞAN LİSTE MODÜL ÖZETLERİ
     * ------------------------------------------------------------
     * Amaç: ana çalışan tablosunda her satır için /profile çağrısı
     * yapmadan Eğitim / Sağlık / KKD / Evrak / Risk durumlarını
     * tek liste isteğinde üretmek.
     *
     * Tenant kilidi: çalışan ID'si + çalışanın firm_id'si.
     */
    const employeeById = new Map(
      allEmployees.map((employee) => [
        String(employee.id),
        employee,
      ])
    );

    type ModuleStatus =
      | "COMPLETE"
      | "MISSING"
      | "EXPIRING"
      | "UNKNOWN";

    const normalizeModuleStatus = (
      value: unknown
    ) =>
      String(value ?? "")
        .trim()
        .toUpperCase();

    const buildModuleStatus = (
      rows: any[]
    ): ModuleStatus => {
      if (!rows.length) return "UNKNOWN";

      const statuses = rows.map((row) =>
        normalizeModuleStatus(
          row.status ??
            row.state ??
            row.result_status
        )
      );

      if (
        statuses.some((status) =>
          [
            "MISSING",
            "EXPIRED",
            "OVERDUE",
            "FAILED",
            "REJECTED",
            "EKSİK",
            "EKSIK",
            "SÜRESİ_DOLDU",
            "SURESI_DOLDU",
          ].includes(status)
        )
      ) {
        return "MISSING";
      }

      if (
        statuses.some((status) =>
          [
            "EXPIRING",
            "DUE_SOON",
            "YAKLAŞIYOR",
            "YAKLASIYOR",
          ].includes(status)
        )
      ) {
        return "EXPIRING";
      }

      return "COMPLETE";
    };

    const groupByEmployee = (
      rows: any[],
      employeeField = "employee_id"
    ) => {
      const grouped = new Map<string, any[]>();

      for (const row of rows || []) {
        const employeeId = String(
          row?.[employeeField] || ""
        ).trim();

        if (!employeeId) continue;

        const employee = employeeById.get(employeeId);
        if (!employee) continue;

        const rowFirmId = String(
          row?.firm_id ||
            row?.company_id ||
            row?.web_firm_id ||
            ""
        ).trim();

        /*
         * Kayıtta firma alanı varsa mutlaka çalışanın firmasıyla
         * eşleşmesini isteriz. Firma alanı olmayan legacy tablolarda
         * employee_id zaten bu listede seçili çalışana kilitlidir.
         */
        if (
          rowFirmId &&
          rowFirmId !==
            String(employee.firm_id || "")
        ) {
          continue;
        }

        const bucket =
          grouped.get(employeeId) || [];
        bucket.push(row);
        grouped.set(employeeId, bucket);
      }

      return grouped;
    };

    const employeeIdsForModules =
      allEmployees
        .map((employee) =>
          String(employee.id || "").trim()
        )
        .filter(Boolean);

    const safeRows = async (
      label: string,
      query: PromiseLike<{
        data: any[] | null;
        error: any;
      }>
    ): Promise<any[]> => {
      try {
        const { data, error } = await query;

        if (error) {
          console.warn(
            `employees ${label} summary error:`,
            error
          );
          return [];
        }

        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn(
          `employees ${label} summary error:`,
          error
        );
        return [];
      }
    };

    let trainingRows: any[] = [];
    let healthRows: any[] = [];
    let healthExaminationRows: any[] = [];
    let healthEk2Rows: any[] = [];
    let ppeRows: any[] = [];
    let documentRows: any[] = [];
    let riskRows: any[] = [];

    if (employeeIdsForModules.length > 0) {
      /*
       * EĞİTİM:
       * employees.id -> users.employee_id -> training_assignments.user_id
       */
      const trainingUsers = await safeRows(
        "training users",
        supabase
          .from("users")
          .select("id,employee_id,company_id")
          .in(
            "employee_id",
            employeeIdsForModules
          )
      );

      const userToEmployee = new Map<
        string,
        string
      >();

      for (const user of trainingUsers) {
        const employeeId = String(
          user.employee_id || ""
        ).trim();

        const employee =
          employeeById.get(employeeId);

        if (!employee) continue;

        userToEmployee.set(
          String(user.id),
          employeeId
        );
      }

      const trainingUserIds = Array.from(
        userToEmployee.keys()
      );

      if (trainingUserIds.length > 0) {
        const assignments = await safeRows(
          "training",
          supabase
            .from("training_assignments")
            .select(
              "id,user_id,training_id,status,watch_completed,final_exam_passed,started_at,completed_at,created_at"
            )
            .in("user_id", trainingUserIds)
        );

        const trainingIds = Array.from(
          new Set(
            assignments
              .map((row) =>
                String(
                  row.training_id || ""
                ).trim()
              )
              .filter(Boolean)
          )
        );

        const trainingDefinitions =
          trainingIds.length > 0
            ? await safeRows(
                "training definitions",
                supabase
                  .from("trainings")
                  .select(
                    "id,title,duration_minutes,type,created_at"
                  )
                  .in("id", trainingIds)
              )
            : [];

        const trainingDefinitionMap =
          new Map(
            trainingDefinitions.map(
              (training) => [
                String(training.id),
                training,
              ]
            )
          );

        trainingRows = assignments
          .map((row) => {
            const employeeId =
              userToEmployee.get(
                String(row.user_id)
              );

            if (!employeeId) return null;

            const training =
              trainingDefinitionMap.get(
                String(row.training_id)
              );

            return {
              ...row,
              employee_id: employeeId,
              duration_minutes:
                Number(
                  training?.duration_minutes ??
                    0
                ) || 0,
              title:
                training?.title ||
                "Eğitim",
              type:
                training?.type ||
                "EĞİTİM",
              date:
                row.completed_at ||
                row.started_at ||
                row.created_at ||
                training?.created_at ||
                null,
            };
          })
          .filter(Boolean);
      }

      /*
       * SAĞLIK / KKD / EVRAK / RİSK:
       * güncel Web tablolarını doğrudan employee_id ile toplu oku.
       */
      [
        healthRows,
        healthExaminationRows,
        healthEk2Rows,
        ppeRows,
        documentRows,
        riskRows,
      ] = await Promise.all([
        safeRows(
          "health",
          supabase
            .from("health_records")
            .select(
              "id,employee_id,firm_id,status,exam_date_millis,next_due_millis"
            )
            .in(
              "employee_id",
              employeeIdsForModules
            )
        ),

        safeRows(
          "health examinations",
          supabase
            .from("health_examinations")
            .select(
              "id,employee_id,company_id,exam_date,next_exam_date,decision,exam_type,is_deleted"
            )
            .in(
              "employee_id",
              employeeIdsForModules
            )
            .eq("is_deleted", false)
        ),

        safeRows(
          "health ek2",
          supabase
            .from("health_ek2_forms")
            .select(
              "id,employee_id,company_id,examination_id,form_type,status,exam_date,next_exam_date,is_active,created_at"
            )
            .in(
              "employee_id",
              employeeIdsForModules
            )
            .or("is_active.is.null,is_active.eq.true")
        ),

        safeRows(
          "ppe",
          supabase
            .from(
              "employee_ppe_assignments"
            )
            .select(
              "id,employee_id,firm_id,status"
            )
            .in(
              "employee_id",
              employeeIdsForModules
            )
        ),

        safeRows(
          "documents",
          supabase
            .from(
              "employee_document_assignments"
            )
            .select(
              "id,employee_id,firm_id,status,is_cancelled"
            )
            .in(
              "employee_id",
              employeeIdsForModules
            )
            .or(
              "is_cancelled.is.null,is_cancelled.eq.false"
            )
        ),

        safeRows(
          "risks",
          supabase
            .from("employee_risks")
            .select(
              "id,employee_id,firm_id,status,score,risk_score,risk_level"
            )
            .in(
              "employee_id",
              employeeIdsForModules
            )
        ),
      ]);
    }

    const employeeFirmIds =
      Array.from(
        new Set(
          allEmployees
            .map((employee) =>
              String(
                employee.firm_id || ""
              ).trim()
            )
            .filter(Boolean)
        )
      );

    const companyHazardRows =
      employeeFirmIds.length > 0
        ? await safeRows(
            "company hazard",
            supabase
              .from("companies")
              .select(
                "id,tehlike_sinifi"
              )
              .in("id", employeeFirmIds)
          )
        : [];

    const hazardByFirm =
      new Map(
        companyHazardRows.map(
          (company) => [
            String(company.id),
            company.tehlike_sinifi,
          ]
        )
      );

    const trainingByEmployee =
      groupByEmployee(trainingRows);

    const normalizedHealthExaminations =
      healthExaminationRows.map(
        (row) => ({
          ...row,
          status:
            row.next_exam_date &&
            new Date(
              row.next_exam_date
            ).getTime() < Date.now()
              ? "EXPIRED"
              : "COMPLETE",
          exam_date:
            row.exam_date,
          next_due_at:
            row.next_exam_date,
        })
      );

    const normalizedEk2Rows =
      healthEk2Rows.map(
        (row) => ({
          ...row,
          status:
            row.status ||
            (row.next_exam_date &&
            new Date(
              row.next_exam_date
            ).getTime() < Date.now()
              ? "EXPIRED"
              : "COMPLETE"),
          exam_date:
            row.exam_date ||
            row.created_at,
          next_due_at:
            row.next_exam_date,
        })
      );

    const healthByEmployee =
      groupByEmployee([
        ...healthRows,
        ...normalizedHealthExaminations,
        ...normalizedEk2Rows,
      ]);

    const ppeByEmployee =
      groupByEmployee(ppeRows);

    const documentByEmployee =
      groupByEmployee(documentRows);

    const riskByEmployee =
      groupByEmployee(riskRows);

    const employeesWithModuleSummary =
      employeesWithAccidentCount.map(
        (employee) => {
          const employeeId =
            String(employee.id);

          const trainings =
            trainingByEmployee.get(employeeId) ||
            [];

          const health =
            healthByEmployee.get(employeeId) ||
            [];

          const employeeHealthExaminations =
            normalizedHealthExaminations.filter(
              (row) =>
                String(row.employee_id) ===
                  employeeId &&
                String(
                  row.company_id || ""
                ) ===
                  String(
                    employee.firm_id || ""
                  )
            );

          const isEk2Exam = (row: any) => {
            const raw = String(
              row.exam_type || ""
            ).trim();
            const upper =
              raw.toLocaleUpperCase(
                "tr-TR"
              );

            return (
              upper === "EK2_ISE_GIRIS" ||
              upper === "EK2_PERIYODIK" ||
              raw === "İşe Giriş" ||
              raw === "Periyodik"
            );
          };

          const employeeEk2Forms =
            normalizedEk2Rows.filter(
              (row) =>
                String(row.employee_id) ===
                  employeeId &&
                String(
                  row.company_id || ""
                ) ===
                  String(
                    employee.firm_id || ""
                  )
            );

          const employeeEk2Examinations =
            employeeHealthExaminations.filter(
              isEk2Exam
            );

          const employeeNonEk2Examinations =
            employeeHealthExaminations.filter(
              (row) =>
                !isEk2Exam(row)
            );

          const canonicalEmployeeEk2 =
            employeeEk2Forms.length > 0
              ? employeeEk2Forms
              : employeeEk2Examinations;

          const ppe =
            ppeByEmployee.get(employeeId) ||
            [];

          const documents =
            documentByEmployee.get(
              employeeId
            ) || [];

          const risks =
            riskByEmployee.get(employeeId) ||
            [];

          /*
           * Riskte kayıt var ama açık/yüksek risk yoksa "Veri Yok"
           * değil COMPLETE dönüyoruz. Böylece UI bunu "Risk Yok"
           * olarak gösterebilir.
           */
          const hasHighRisk = risks.some(
            (row) =>
              Number(
                row.score ??
                  row.risk_score ??
                  0
              ) >= 200 ||
              [
                "HIGH",
                "CRITICAL",
                "YÜKSEK",
                "YUKSEK",
                "ÇOK YÜKSEK",
                "COK YUKSEK",
              ].includes(
                normalizeModuleStatus(
                  row.risk_level
                )
              )
          );

          const legalTrainingSummary =
            calculateLegalTrainingSummary(
              trainings,
              hazardByFirm.get(
                String(
                  employee.firm_id || ""
                )
              )
            );

          return {
            ...employee,

            // Organizasyon alanlarında eski/yeni şema adlarını tek çıktıda normalize et.
            // Kaynakta gerçekten veri yoksa null kalır; sahte departman üretilmez.
            department:
              clean(
                employee.department ??
                employee.department_name ??
                employee.departmentName ??
                employee.birim ??
                employee.unit_name
              ),
            job_title:
              clean(
                employee.job_title ??
                employee.title ??
                employee.position ??
                employee.position_name
              ),

            training_status:
              legalTrainingSummary.status,

            training_completion_rate:
              legalTrainingSummary.completionRate,

            legal_training_completed_minutes:
              legalTrainingSummary.completedMinutes,

            legal_training_required_minutes:
              legalTrainingSummary.requiredMinutes,

            legal_training_missing_minutes:
              legalTrainingSummary.missingMinutes,

            legal_training_validity_years:
              legalTrainingSummary.validityYears,

            legal_training_hazard_class:
              legalTrainingSummary.hazardClass,

            health_status:
              healthSummaryForList(
                health
              ).status,

            health_record_count:
              healthSummaryForList(
                health
              ).recordCount,

            health_examination_count:
              employeeNonEk2Examinations.length,

            health_ek2_count:
              canonicalEmployeeEk2.length,

            health_last_exam_at:
              healthSummaryForList(
                health
              ).lastExamAt,

            health_last_ek2_at:
              canonicalEmployeeEk2
                .map((row) =>
                  row.exam_date ||
                  row.created_at ||
                  null
                )
                .filter(Boolean)
                .sort()
                .reverse()[0] || null,

            health_next_due_at:
              healthSummaryForList(
                health
              ).nextDueAt,

            ppe_status:
              buildModuleStatus(ppe),

            document_status:
              buildModuleStatus(documents),

            risk_status:
              hasHighRisk
                ? "HIGH"
                : risks.length > 0
                ? "COMPLETE"
                : "UNKNOWN",
          };
        }
      );

    let companiesQuery = supabase
      .from("companies")
      .select("id, name, tehlike_sinifi")
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
      data: employeesWithModuleSummary,
      companies: companies || [],
      stats: {
        total_count: employeesWithModuleSummary.length,
        active_count: employeesWithModuleSummary.filter(
          (employee) => employee.active !== false
        ).length,
        passive_count: employeesWithModuleSummary.filter(
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