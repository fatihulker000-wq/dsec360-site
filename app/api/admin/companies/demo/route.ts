import crypto from "crypto";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function sha256(value: string) {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function dateOnly(
  offsetDays = 0
) {
  const date = new Date();

  date.setDate(
    date.getDate() + offsetDays
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function isoDate(
  offsetDays = 0
) {
  const date = new Date();

  date.setDate(
    date.getDate() + offsetDays
  );

  return date.toISOString();
}

const DEMO_COMPANY = {
  name:
    "D-SEC Demo Lojistik ve Depolama A.Ş.",
  yetkili: "Ayşe Yıldırım",
  phone: "0212 555 36 00",
  email: "demo@dsec360.com",
  address:
    "Gebze Organize Sanayi Bölgesi / Kocaeli",
  sgk_sicil_no:
    "1234567890123456789012",
  nace_kodu: "52.10.01",
  tehlike_sinifi: "Tehlikeli",
  calisan_sayisi: 10,
  sektor:
    "Lojistik ve Depolama",
  isg_uzmani: "Fatih Ülker",
  isyeri_hekimi:
    "Dr. Mehmet Kaya",
  dsp: "Ayşe Kara",
};

const DEMO_LOCAL_FIRM_ID =
  999001;

const DEMO_EMPLOYEE_PASSWORD =
  "Demo1234";

const DEMO_EMPLOYEES = [
  {
    full_name: "Ahmet Demir",
    department: "Depo",
    job_title:
      "Forklift Operatörü",
    email:
      "ahmet.demir.demo@dsec360.com",
    phone: "0500 100 00 01",
    registry_no: "DEMO-001",
    tc_no: "10000000001",
    gender: "Erkek",
    birth_date: "1988-03-12",
    start_date: "2020-01-15",
    education_level: "Lise",
    blood_type: "A Rh+",
  },
  {
    full_name: "Mehmet Kaya",
    department: "Depo",
    job_title:
      "Sevkiyat Personeli",
    email:
      "mehmet.kaya.demo@dsec360.com",
    phone: "0500 100 00 02",
    registry_no: "DEMO-002",
    tc_no: "10000000002",
    gender: "Erkek",
    birth_date: "1990-06-18",
    start_date: "2021-02-01",
    education_level: "Lise",
    blood_type: "0 Rh+",
  },
  {
    full_name: "Mustafa Can",
    department: "Depo",
    job_title:
      "Depo Personeli",
    email:
      "mustafa.can.demo@dsec360.com",
    phone: "0500 100 00 03",
    registry_no: "DEMO-003",
    tc_no: "10000000003",
    gender: "Erkek",
    birth_date: "1995-09-04",
    start_date: "2022-05-10",
    education_level:
      "Ortaöğretim",
    blood_type: "B Rh+",
  },
  {
    full_name: "Ali Şahin",
    department: "Yükleme",
    job_title:
      "Yükleme Operatörü",
    email:
      "ali.sahin.demo@dsec360.com",
    phone: "0500 100 00 04",
    registry_no: "DEMO-004",
    tc_no: "10000000004",
    gender: "Erkek",
    birth_date: "1987-12-21",
    start_date: "2019-08-12",
    education_level: "Lise",
    blood_type: "A Rh-",
  },
  {
    full_name: "Hasan Çetin",
    department: "Yükleme",
    job_title:
      "Yükleme Operatörü",
    email:
      "hasan.cetin.demo@dsec360.com",
    phone: "0500 100 00 05",
    registry_no: "DEMO-005",
    tc_no: "10000000005",
    gender: "Erkek",
    birth_date: "1992-01-30",
    start_date: "2023-01-16",
    education_level: "Lise",
    blood_type: "0 Rh-",
  },
  {
    full_name: "Zeynep Arslan",
    department: "Ofis",
    job_title:
      "Muhasebe Uzmanı",
    email:
      "zeynep.arslan.demo@dsec360.com",
    phone: "0500 100 00 06",
    registry_no: "DEMO-006",
    tc_no: "10000000006",
    gender: "Kadın",
    birth_date: "1991-05-14",
    start_date: "2020-11-02",
    education_level: "Lisans",
    blood_type: "AB Rh+",
  },
  {
    full_name: "Elif Kaya",
    department:
      "İnsan Kaynakları",
    job_title:
      "İnsan Kaynakları Uzmanı",
    email:
      "elif.kaya.demo@dsec360.com",
    phone: "0500 100 00 07",
    registry_no: "DEMO-007",
    tc_no: "10000000007",
    gender: "Kadın",
    birth_date: "1994-08-09",
    start_date: "2022-03-07",
    education_level: "Lisans",
    blood_type: "A Rh+",
  },
  {
    full_name: "Emre Çelik",
    department: "Bakım",
    job_title:
      "Bakım Teknisyeni",
    email:
      "emre.celik.demo@dsec360.com",
    phone: "0500 100 00 08",
    registry_no: "DEMO-008",
    tc_no: "10000000008",
    gender: "Erkek",
    birth_date: "1989-10-11",
    start_date: "2018-06-18",
    education_level:
      "Meslek Lisesi",
    blood_type: "B Rh-",
  },
  {
    full_name: "Burak Yılmaz",
    department: "Bakım",
    job_title:
      "Elektrik Teknisyeni",
    email:
      "burak.yilmaz.demo@dsec360.com",
    phone: "0500 100 00 09",
    registry_no: "DEMO-009",
    tc_no: "10000000009",
    gender: "Erkek",
    birth_date: "1993-02-25",
    start_date: "2021-09-13",
    education_level:
      "Meslek Lisesi",
    blood_type: "0 Rh+",
  },
  {
    full_name: "Ayşe Aksoy",
    department: "Kalite",
    job_title:
      "Kalite Uzmanı",
    email:
      "ayse.aksoy.demo@dsec360.com",
    phone: "0500 100 00 10",
    registry_no: "DEMO-010",
    tc_no: "10000000010",
    gender: "Kadın",
    birth_date: "1996-07-17",
    start_date: "2023-04-03",
    education_level: "Lisans",
    blood_type: "A Rh+",
  },
];

const DEMO_TRAININGS = [
  {
    title: "Temel İSG Eğitimi",
    description:
      "Temel iş sağlığı ve güvenliği kuralları, çalışan sorumlulukları ve güvenli çalışma yöntemleri.",
    type: "asenkron",
    duration_minutes: 120,
  },
  {
    title: "Yangın Güvenliği Eğitimi",
    description:
      "Yangın önleme, söndürme ekipmanları, tahliye ve acil durum uygulamaları.",
    type: "asenkron",
    duration_minutes: 60,
  },
  {
    title: "Forklift Güvenliği",
    description:
      "Forklift kullanımı, günlük kontrol, yükleme ve saha trafik güvenliği.",
    type: "asenkron",
    duration_minutes: 75,
  },
  {
    title:
      "Yüksekte Çalışma Eğitimi",
    description:
      "Yüksekte güvenli çalışma, düşmeye karşı korunma ve kişisel koruyucu donanımlar.",
    type: "asenkron",
    duration_minutes: 90,
  },
];

async function getSession() {
  const cookieStore = await cookies();

  const auth = clean(
    cookieStore.get(
      "dsec_admin_auth"
    )?.value ||
      cookieStore.get(
        "dsec_user_auth"
      )?.value
  );

  const role = clean(
    cookieStore.get(
      "dsec_admin_role"
    )?.value ||
      cookieStore.get(
        "dsec_user_role"
      )?.value
  );

  const userId = clean(
    cookieStore.get(
      "dsec_user_id"
    )?.value
  );

  const companyId = clean(
    cookieStore.get(
      "dsec_company_id"
    )?.value
  );

  return {
    auth,
    role,
    userId,
    companyId,
  };
}

async function ensureDemoCompany() {
  const supabase = getSupabase();

  const {
    data: existingCompany,
    error: existingError,
  } = await supabase
    .from("companies")
    .select("id, local_firm_id")
    .eq(
      "name",
      DEMO_COMPANY.name
    )
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Demo firma sorgulanamadı: ${existingError.message}`
    );
  }

  if (existingCompany?.id) {
    const localFirmId =
      Number(
        existingCompany.local_firm_id
      ) > 0
        ? Number(
            existingCompany.local_firm_id
          )
        : DEMO_LOCAL_FIRM_ID;

    const { error } = await supabase
      .from("companies")
      .update({
        ...DEMO_COMPANY,
        local_firm_id:
          localFirmId,
        is_active: true,
      })
      .eq(
        "id",
        existingCompany.id
      );

    if (error) {
      throw new Error(
        `Demo firma güncellenemedi: ${error.message}`
      );
    }

    return {
      id: String(
        existingCompany.id
      ),
      localFirmId,
    };
  }

  const {
    data: createdCompany,
    error: createdError,
  } = await supabase
    .from("companies")
    .insert({
      ...DEMO_COMPANY,
      local_firm_id:
        DEMO_LOCAL_FIRM_ID,
      is_active: true,
    })
    .select(
      "id, local_firm_id"
    )
    .single();

  if (
    createdError ||
    !createdCompany?.id
  ) {
    throw new Error(
      `Demo firma oluşturulamadı: ${
        createdError?.message ||
        "Firma kimliği dönmedi."
      }`
    );
  }

  return {
    id: String(createdCompany.id),
    localFirmId:
      Number(
        createdCompany.local_firm_id
      ) || DEMO_LOCAL_FIRM_ID,
  };
}

async function ensureEmployees(
  companyId: string
) {
  const supabase = getSupabase();

  const result: Array<{
    id: string;
    full_name: string;
    email: string;
    department: string;
    job_title: string;
  }> = [];

  for (
    const employee of
    DEMO_EMPLOYEES
  ) {
    const {
      data: existingEmployee,
      error: existingError,
    } = await supabase
      .from("employees")
      .select("id")
      .eq("firm_id", companyId)
      .eq(
        "registry_no",
        employee.registry_no
      )
      .maybeSingle();

    if (existingError) {
      throw new Error(
        `Çalışan kontrol edilemedi (${employee.full_name}): ${existingError.message}`
      );
    }

    const payload = {
      firm_id: companyId,
      full_name:
        employee.full_name,
      job_title:
        employee.job_title,
      email: employee.email,
      phone: employee.phone,
      registry_no:
        employee.registry_no,
      tc_no: employee.tc_no,
      gender: employee.gender,
      birth_date:
        employee.birth_date,
      start_date:
        employee.start_date,
      education_level:
        employee.education_level,
      blood_type:
        employee.blood_type,
      disability_status: "Yok",
      active: true,
      exit_date: null,
      updated_at:
        new Date().toISOString(),
    };

    let savedEmployee:
      | { id: string }
      | null = null;

    if (existingEmployee?.id) {
      const {
        data,
        error,
      } = await supabase
        .from("employees")
        .update(payload)
        .eq(
          "id",
          existingEmployee.id
        )
        .select("id")
        .single();

      if (error) {
        throw new Error(
          `Çalışan güncellenemedi (${employee.full_name}): ${error.message}`
        );
      }

      savedEmployee = data;
    } else {
      const {
        data,
        error,
      } = await supabase
        .from("employees")
        .insert({
          ...payload,
          created_at:
            new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(
          `Çalışan oluşturulamadı (${employee.full_name}): ${error.message}`
        );
      }

      savedEmployee = data;
    }

    if (!savedEmployee?.id) {
      throw new Error(
        `${employee.full_name} çalışan kimliği alınamadı.`
      );
    }

    result.push({
      id: String(
        savedEmployee.id
      ),
      full_name:
        employee.full_name,
      email: employee.email,
      department:
        employee.department,
      job_title:
        employee.job_title,
    });
  }

  return result;
}

async function ensureTrainingUsers(
  companyId: string,
  employees: Awaited<
    ReturnType<
      typeof ensureEmployees
    >
  >
) {
  const supabase = getSupabase();

  const users: Array<{
    id: string;
    employeeId: string;
    fullName: string;
  }> = [];

  for (const employee of employees) {
    const {
      data: existingUser,
      error: existingError,
    } = await supabase
      .from("users")
      .select("id")
      .ilike(
        "email",
        employee.email
      )
      .maybeSingle();

    if (existingError) {
      throw new Error(
        `Eğitim kullanıcısı kontrol edilemedi (${employee.full_name}): ${existingError.message}`
      );
    }

    const userPayload = {
      full_name:
        employee.full_name,
      email:
        employee.email.toLowerCase(),
      password_hash: sha256(
        DEMO_EMPLOYEE_PASSWORD
      ),
      role: "training_user",
      app_user_type:
        "training_user",
      company_id: companyId,
      employee_id:
        employee.id,
      is_active: true,
    };

    let userId = "";

    if (existingUser?.id) {
      const {
        data,
        error,
      } = await supabase
        .from("users")
        .update(userPayload)
        .eq("id", existingUser.id)
        .select("id")
        .single();

      if (error) {
        throw new Error(
          `Eğitim kullanıcısı güncellenemedi (${employee.full_name}): ${error.message}`
        );
      }

      userId = clean(data?.id);
    } else {
      const {
        data,
        error,
      } = await supabase
        .from("users")
        .insert(userPayload)
        .select("id")
        .single();

      if (error) {
        throw new Error(
          `Eğitim kullanıcısı oluşturulamadı (${employee.full_name}): ${error.message}`
        );
      }

      userId = clean(data?.id);
    }

    if (!userId) {
      throw new Error(
        `${employee.full_name} eğitim kullanıcısı kimliği alınamadı.`
      );
    }

    const {
      data: existingAccess,
      error: accessCheckError,
    } = await supabase
      .from("user_firm_access")
      .select("user_id")
      .eq("user_id", userId)
      .eq("firm_id", companyId)
      .maybeSingle();

    if (accessCheckError) {
      throw new Error(
        `Firma erişimi kontrol edilemedi: ${accessCheckError.message}`
      );
    }

    if (!existingAccess) {
      const {
        error: accessInsertError,
      } = await supabase
        .from("user_firm_access")
        .insert({
          user_id: userId,
          firm_id: companyId,
          role: "training_user",
          is_primary: true,
        });

      if (accessInsertError) {
        throw new Error(
          `Firma erişimi oluşturulamadı: ${accessInsertError.message}`
        );
      }
    }

    users.push({
      id: userId,
      employeeId: employee.id,
      fullName:
        employee.full_name,
    });
  }

  return users;
}

async function ensureTrainings() {
  const supabase = getSupabase();

  const result: Array<{
    id: string;
    title: string;
  }> = [];

  for (
    const training of
    DEMO_TRAININGS
  ) {
    const {
      data: existingTraining,
      error: existingError,
    } = await supabase
      .from("trainings")
      .select("id")
      .eq(
        "title",
        training.title
      )
      .maybeSingle();

    if (existingError) {
      throw new Error(
        `Eğitim kontrol edilemedi (${training.title}): ${existingError.message}`
      );
    }

    let trainingId = "";

    if (existingTraining?.id) {
      const {
        data,
        error,
      } = await supabase
        .from("trainings")
        .update({
          ...training,
        })
        .eq(
          "id",
          existingTraining.id
        )
        .select("id")
        .single();

      if (error) {
        throw new Error(
          `Eğitim güncellenemedi (${training.title}): ${error.message}`
        );
      }

      trainingId = clean(data?.id);
    } else {
      const {
        data,
        error,
      } = await supabase
        .from("trainings")
        .insert({
          ...training,
          created_at:
            new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(
          `Eğitim oluşturulamadı (${training.title}): ${error.message}`
        );
      }

      trainingId = clean(data?.id);
    }

    result.push({
      id: trainingId,
      title: training.title,
    });
  }

  return result;
}

async function refreshAssignments(
  users: Awaited<
    ReturnType<
      typeof ensureTrainingUsers
    >
  >,
  trainings: Awaited<
    ReturnType<
      typeof ensureTrainings
    >
  >
) {
  const supabase = getSupabase();

  const userIds = users.map(
    (user) => user.id
  );

  if (userIds.length > 0) {
    const { error } = await supabase
      .from(
        "training_assignments"
      )
      .delete()
      .in("user_id", userIds);

    if (error) {
      throw new Error(
        `Eski eğitim atamaları temizlenemedi: ${error.message}`
      );
    }
  }

  /*
   * İlk üç eğitim 10 çalışana atanır:
   * 3 x 10 = 30 atama.
   */
  const assignedTrainings =
    trainings.slice(0, 3);

  const inserts: Array<
    Record<string, unknown>
  > = [];

  users.forEach(
    (user, userIndex) => {
      assignedTrainings.forEach(
        (training, trainingIndex) => {
          const sequence =
            userIndex * 3 +
            trainingIndex;

          const completed =
            sequence < 18;

          const inProgress =
            sequence >= 18 &&
            sequence < 25;

          inserts.push({
            user_id: user.id,
            training_id:
              training.id,
            status: completed
              ? "completed"
              : inProgress
              ? "in_progress"
              : "not_started",
            watch_completed:
              completed,
            video_chain_completed:
              completed,
            final_exam_passed:
              completed,
            started_at:
              completed ||
              inProgress
                ? isoDate(
                    -30 + sequence
                  )
                : null,
            completed_at:
              completed
                ? isoDate(
                    -20 + sequence
                  )
                : null,
          });
        }
      );
    }
  );

  const { error } = await supabase
    .from("training_assignments")
    .insert(inserts);

  if (error) {
    throw new Error(
      `Demo eğitim atamaları oluşturulamadı: ${error.message}`
    );
  }

  return {
    total: inserts.length,
    completed: inserts.filter(
      (row) =>
        row.status ===
        "completed"
    ).length,
  };
}

async function refreshInspections(
  companyId: string,
  localFirmId: number
) {
  const supabase = getSupabase();

  const {
    data: oldRuns,
    error: oldRunsError,
  } = await supabase
    .from("denetim_runs")
    .select("id")
    .eq(
      "firm_name",
      DEMO_COMPANY.name
    );

  if (oldRunsError) {
    throw new Error(
      `Eski denetimler alınamadı: ${oldRunsError.message}`
    );
  }

  const oldRunIds = (
    oldRuns || []
  )
    .map((run) => run.id)
    .filter(Boolean);

  if (oldRunIds.length > 0) {
    const {
      error: answersDeleteError,
    } = await supabase
      .from("denetim_answers")
      .delete()
      .in(
        "run_remote_id",
        oldRunIds
      );

    if (answersDeleteError) {
      throw new Error(
        `Eski denetim cevapları temizlenemedi: ${answersDeleteError.message}`
      );
    }

    const {
      error: runsDeleteError,
    } = await supabase
      .from("denetim_runs")
      .delete()
      .in("id", oldRunIds);

    if (runsDeleteError) {
      throw new Error(
        `Eski denetimler temizlenemedi: ${runsDeleteError.message}`
      );
    }
  }

  const inspections = [
    {
      template_type:
        "Genel İSG Denetimi",
      score: 92,
      location: "Ana Depo",
      responsible:
        "Ahmet Demir",
    },
    {
      template_type:
        "Forklift Denetimi",
      score: 84,
      location: "A Blok",
      responsible:
        "Emre Çelik",
    },
    {
      template_type:
        "Yangın Güvenliği",
      score: 95,
      location: "Tüm Tesis",
      responsible:
        "Ayşe Aksoy",
    },
  ];

  const answers = [
    {
      item_title:
        "Acil çıkış kapıları açık mı?",
      result: "UYGUN",
    },
    {
      item_title:
        "Yangın söndürücüler kontrol edilmiş mi?",
      result: "UYGUN",
    },
    {
      item_title:
        "Forklift günlük kontrolü yapılmış mı?",
      result: "KISMEN",
    },
    {
      item_title:
        "Yaya yolları işaretlenmiş mi?",
      result: "UYGUNSUZ",
    },
  ];

  const baseTime = Date.now();

  for (
    let index = 0;
    index <
    inspections.length;
    index += 1
  ) {
    const inspection =
      inspections[index];

    const {
      data: insertedRun,
      error: runError,
    } = await supabase
      .from("denetim_runs")
      .insert({
        firm_id: localFirmId,
        firm_name:
          DEMO_COMPANY.name,
        template_type:
          inspection.template_type,
        score:
          inspection.score,
        status: "TAMAMLANDI",
        location:
          inspection.location,
        responsible:
          inspection.responsible,
        inspector_name:
          "Fatih Ülker",
        report_no:
          `DEMO-DNT-${String(
            index + 1
          ).padStart(3, "0")}`,
        app_run_id:
          baseTime + index,
        audit_date_millis:
          baseTime -
          index *
            7 *
            24 *
            60 *
            60 *
            1000,
        created_at_millis:
          baseTime + index,
      })
      .select("id")
      .single();

    if (
      runError ||
      !insertedRun?.id
    ) {
      throw new Error(
        `Denetim oluşturulamadı (${inspection.template_type}): ${
          runError?.message ||
          "Kimlik dönmedi."
        }`
      );
    }

    const answerRows =
      answers.map((answer) => ({
        run_remote_id:
          insertedRun.id,
        item_title:
          answer.item_title,
        result: answer.result,
        note: "",
        recommended_action:
          answer.result ===
          "UYGUN"
            ? ""
            : "Sorumlu atanarak düzeltici faaliyet tamamlanmalıdır.",
        dof_status:
          answer.result ===
          "UYGUN"
            ? "NONE"
            : "OPEN",
      }));

    const { error: answerError } =
      await supabase
        .from(
          "denetim_answers"
        )
        .insert(answerRows);

    if (answerError) {
      throw new Error(
        `Denetim cevapları oluşturulamadı: ${answerError.message}`
      );
    }
  }

  return inspections.length;
}

async function refreshAccidents(
  companyId: string,
  localFirmId: number,
  employees: Awaited<
    ReturnType<
      typeof ensureEmployees
    >
  >
) {
  const supabase = getSupabase();

  // Önce UUID ile yazılmış güncel demo kayıtlarını temizle.
  const { error: deleteByWebFirmError } =
    await supabase
      .from("accident_records")
      .delete()
      .eq("web_firm_id", companyId);

  if (deleteByWebFirmError) {
    throw new Error(
      `Eski kaza kayıtları temizlenemedi: ${deleteByWebFirmError.message}`
    );
  }

  // Önceki sürümlerde yalnızca yerel firma ID'si ile yazılan demo
  // kayıtlarını da temizle. Böylece her yenilemede kayıt sayısı artmaz.
  const { error: deleteByLocalFirmError } =
    await supabase
      .from("accident_records")
      .delete()
      .eq("firm_id", localFirmId);

  if (deleteByLocalFirmError) {
    throw new Error(
      `Eski yerel kaza kayıtları temizlenemedi: ${deleteByLocalFirmError.message}`
    );
  }

  const ahmet = employees.find(
    (employee) =>
      employee.full_name ===
      "Ahmet Demir"
  );

  const ali = employees.find(
    (employee) =>
      employee.full_name ===
      "Ali Şahin"
  );

  const now = Date.now();

  const rows = [
    {
      web_firm_id: companyId,
      firm_id: localFirmId,
      employee_id:
        ahmet?.id || null,
      event_type: "İş Kazası",
      title:
        "Forklift ile raf teması",
      description:
        "Forklift manevrası sırasında raf koruyucu bariyerine temas edildi. Çalışan hafif şekilde etkilendi.",
      severity: 2,
      lost_work_days: 0,
      employee_name:
        ahmet?.full_name ||
        "Ahmet Demir",
      department: "Depo",
      location: "A Blok",
      shift: "Gündüz",
      injury_body_part: "Kol",
      injury_type:
        "Hafif Yaralanma",
      root_cause_category:
        "Operatör Hatası",
      event_hour: 10,
      event_week_day:
        "Pazartesi",
      event_date:
        now -
        35 *
          24 *
          60 *
          60 *
          1000,
      is_active: true,
      is_deleted: false,
      source: "WEB",
      created_at:
        isoDate(-35),
      updated_at:
        new Date().toISOString(),
    },
    {
      web_firm_id: companyId,
      firm_id: localFirmId,
      employee_id:
        ali?.id || null,
      event_type:
        "Ramak Kala",
      title:
        "Yük paletinin kayması",
      description:
        "Yükleme rampasında palet kaydı; çalışan güvenli mesafede olduğu için yaralanma oluşmadı.",
      severity: 1,
      lost_work_days: 0,
      employee_name:
        ali?.full_name ||
        "Ali Şahin",
      department: "Yükleme",
      location:
        "Sevkiyat Rampası",
      shift: "Gündüz",
      injury_body_part: "",
      injury_type: "",
      root_cause_category:
        "İstifleme Hatası",
      event_hour: 14,
      event_week_day: "Çarşamba",
      event_date:
        now -
        18 *
          24 *
          60 *
          60 *
          1000,
      is_active: true,
      is_deleted: false,
      source: "WEB",
      created_at:
        isoDate(-18),
      updated_at:
        new Date().toISOString(),
    },
  ];

  const { error } = await supabase
    .from("accident_records")
    .insert(rows);

  if (error) {
    throw new Error(
      `Kaza kayıtları oluşturulamadı: ${error.message}`
    );
  }

  return rows.length;
}

async function refreshCbs(
  companyId: string
) {
  const supabase = getSupabase();

  const { error: deleteByFirmError } =
    await supabase
      .from("cbs_forms")
      .delete()
      .eq("firm_id", companyId);

  if (deleteByFirmError) {
    throw new Error(
      `Eski ÇBS kayıtları temizlenemedi: ${deleteByFirmError.message}`
    );
  }

  // Eski demo üreticileri firma kimliği yerine yalnızca firma adını
  // yazabiliyordu. Bu kayıtları da yalnızca korumalı demo firma adıyla sil.
  const { error: deleteByNameError } =
    await supabase
      .from("cbs_forms")
      .delete()
      .eq("firma_adi", DEMO_COMPANY.name);

  if (deleteByNameError) {
    throw new Error(
      `Eski ÇBS demo kayıtları temizlenemedi: ${deleteByNameError.message}`
    );
  }

  const rows = [
    {
      firm_id: companyId,
      firma_adi:
        DEMO_COMPANY.name,
      full_name:
        "Ahmet Demir",
      email:
        "ahmet.demir.demo@dsec360.com",
      message:
        "Forklift ile yaya yolu kesişiminde tehlikeli durum gözlemlendi.",
      category: "Ramak Kala",
      priority: "high",
      status: "new",
      source_type: "WEB",
      created_at: isoDate(-4),
      updated_at:
        new Date().toISOString(),
    },
    {
      firm_id: companyId,
      firma_adi:
        DEMO_COMPANY.name,
      full_name:
        "Ayşe Aksoy",
      email:
        "ayse.aksoy.demo@dsec360.com",
      message:
        "Yangın dolabı önünün malzemelerle kapatıldığı tespit edildi.",
      category: "Uygunsuzluk",
      priority: "normal",
      status: "processing",
      assigned_to:
        "Emre Çelik",
      resolution_note:
        "Malzemelerin kaldırılması için depo sorumlusuna görev verildi.",
      source_type: "WEB",
      created_at: isoDate(-2),
      updated_at:
        new Date().toISOString(),
    },
  ];

  const { error } = await supabase
    .from("cbs_forms")
    .insert(rows);

  if (error) {
    throw new Error(
      `ÇBS kayıtları oluşturulamadı: ${error.message}`
    );
  }

  return rows.length;
}

async function refreshHealth(
  companyId: string,
  employees: Awaited<
    ReturnType<
      typeof ensureEmployees
    >
  >
) {
  const supabase = getSupabase();

  const { error: deleteError } =
    await supabase
      .from(
        "health_examinations"
      )
      .delete()
      .eq(
        "company_id",
        companyId
      );

  if (deleteError) {
    throw new Error(
      `Eski sağlık kayıtları temizlenemedi: ${deleteError.message}`
    );
  }

  const decisions = [
    "Uygun",
    "Uygun",
    "Kısıtlı Uygun",
    "Uygun",
    "Uygun",
    "Uygun",
    "Uygun",
    "Uygun",
    "Uygun",
    "Uygun",
  ];

  const rows = employees.map(
    (employee, index) => ({
      employee_id: employee.id,
      company_id: companyId,
      exam_type:
        index < 2
          ? "İşe Giriş Muayenesi"
          : "Periyodik Muayene",
      exam_date: dateOnly(
        -120 + index * 8
      ),
      next_exam_date:
        index === 2
          ? dateOnly(-5)
          : index === 3
          ? dateOnly(15)
          : dateOnly(
              80 + index * 20
            ),
      decision:
        decisions[index],
      bmi:
        index === 2
          ? 31.2
          : 22 + index * 0.4,
      systolic:
        index === 2
          ? 145
          : 118 + index,
      diastolic:
        index === 2
          ? 92
          : 75 + index,
      spo2:
        index === 2
          ? 94
          : 97,
      is_deleted: false,
      created_at:
        isoDate(
          -120 + index * 8
        ),
    })
  );

  const { error } = await supabase
    .from(
      "health_examinations"
    )
    .insert(rows);

  if (error) {
    throw new Error(
      `Sağlık kayıtları oluşturulamadı: ${error.message}`
    );
  }

  return rows.length;
}

async function loadMetrics(
  companyId: string
) {
  const supabase = getSupabase();

  const {
    data: employees,
    error: employeeError,
  } = await supabase
    .from("employees")
    .select("id")
    .eq("firm_id", companyId);

  if (employeeError) {
    throw new Error(
      employeeError.message
    );
  }

  const employeeIds = (
    employees || []
  ).map((employee) =>
    String(employee.id)
  );

  let userIds: string[] = [];

  if (employeeIds.length > 0) {
    const {
      data: users,
      error: userError,
    } = await supabase
      .from("users")
      .select("id")
      .in(
        "employee_id",
        employeeIds
      );

    if (userError) {
      throw new Error(
        userError.message
      );
    }

    userIds = (
      users || []
    ).map((user) =>
      String(user.id)
    );
  }

  let assignments: Array<{
    status: string | null;
  }> = [];

  if (userIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "training_assignments"
      )
      .select("status")
      .in("user_id", userIds);

    if (error) {
      throw new Error(
        error.message
      );
    }

    assignments = data || [];
  }

  const {
    data: company,
    error: companyError,
  } = await supabase
    .from("companies")
    .select(
      "id, name, local_firm_id"
    )
    .eq("id", companyId)
    .single();

  if (companyError) {
    throw new Error(
      companyError.message
    );
  }

  const localFirmId =
    Number(
      company.local_firm_id
    ) || DEMO_LOCAL_FIRM_ID;

  const [
    inspectionsResult,
    accidentsResult,
    healthResult,
  ] = await Promise.all([
    supabase
      .from("denetim_runs")
      .select("id, status")
      .or(
        `firm_id.eq.${localFirmId},firm_name.eq.${DEMO_COMPANY.name}`
      ),
    supabase
      .from("accident_records")
      .select("id, event_type")
      .eq(
        "web_firm_id",
        companyId
      )
      .or(
        "is_deleted.is.null,is_deleted.eq.false,is_deleted.eq.0"
      ),
    supabase
      .from(
        "health_examinations"
      )
      .select(
        "id, next_exam_date"
      )
      .eq(
        "company_id",
        companyId
      )
      .or(
        "is_deleted.eq.false,is_deleted.is.null"
      ),
  ]);

  if (inspectionsResult.error) {
    throw new Error(
      inspectionsResult.error.message
    );
  }

  if (accidentsResult.error) {
    throw new Error(
      accidentsResult.error.message
    );
  }

  if (healthResult.error) {
    throw new Error(
      healthResult.error.message
    );
  }

  const inspections =
    inspectionsResult.data || [];

  const accidents =
    accidentsResult.data || [];

  const health =
    healthResult.data || [];

  const runIds = inspections
    .map((run) => run.id)
    .filter(Boolean);

  let openDof = 0;

  if (runIds.length > 0) {
    const {
      data: answers,
      error,
    } = await supabase
      .from("denetim_answers")
      .select("dof_status")
      .in(
        "run_remote_id",
        runIds
      );

    if (error) {
      throw new Error(
        error.message
      );
    }

    openDof = (
      answers || []
    ).filter((answer) =>
      [
        "OPEN",
        "AÇIK",
        "IN_PROGRESS",
      ].includes(
        clean(
          answer.dof_status
        ).toUpperCase()
      )
    ).length;
  }

  const trainingCompleted =
    assignments.filter(
      (assignment) =>
        assignment.status ===
        "completed"
    ).length;

  const inspectionCompleted =
    inspections.filter((run) =>
      [
        "COMPLETED",
        "CLOSED",
        "TAMAMLANDI",
        "KAPANDI",
      ].includes(
        clean(
          run.status
        ).toUpperCase()
      )
    ).length;

  const today = dateOnly();

  const healthCurrent =
    health.filter(
      (record) =>
        !record.next_exam_date ||
        record.next_exam_date >=
          today
    ).length;

  const accidentCount =
    accidents.filter(
      (record) =>
        clean(
          record.event_type
        ).toLocaleLowerCase(
          "tr-TR"
        ) === "iş kazası"
    ).length;

  const nearMissCount =
    accidents.filter((record) =>
      clean(
        record.event_type
      )
        .toLocaleLowerCase(
          "tr-TR"
        )
        .includes("ramak")
    ).length;

  const trainingRate =
    assignments.length > 0
      ? Math.round(
          (trainingCompleted /
            assignments.length) *
            100
        )
      : 0;

  const inspectionRate =
    inspections.length > 0
      ? Math.round(
          (inspectionCompleted /
            inspections.length) *
            100
        )
      : 0;

  const healthRate =
    health.length > 0
      ? Math.round(
          (healthCurrent /
            health.length) *
            100
        )
      : 0;

  const overallScore =
    Math.round(
      trainingRate * 0.4 +
        inspectionRate * 0.35 +
        healthRate * 0.25
    );

  return {
    company: {
      id: String(company.id),
      name:
        clean(company.name) ||
        DEMO_COMPANY.name,
      local_firm_id:
        localFirmId,
    },
    metrics: {
      employee_count:
        employeeIds.length,
      training_total:
        assignments.length,
      training_completed:
        trainingCompleted,
      inspection_total:
        inspections.length,
      inspection_completed:
        inspectionCompleted,
      open_dof: openDof,
      accident_count:
        accidentCount,
      near_miss_count:
        nearMissCount,
      health_total:
        health.length,
      health_current:
        healthCurrent,
      document_total: 0,
      document_current: 0,
      overall_score:
        overallScore,
      risk_score: Math.max(
        0,
        100 - openDof * 8 -
          accidents.length * 10
      ),
    },
    activities: [
      {
        id: 1,
        activity_type:
          "inspection",
        title:
          "Genel İSG denetimi tamamlandı",
        description:
          "Ana depo denetimi %92 skorla tamamlandı.",
        status: "completed",
        occurred_at:
          isoDate(-2),
      },
      {
        id: 2,
        activity_type:
          "training",
        title:
          "Eğitim ilerlemeleri güncellendi",
        description:
          `${trainingCompleted}/${assignments.length} eğitim ataması tamamlandı.`,
        status: "active",
        occurred_at:
          isoDate(-1),
      },
      {
        id: 3,
        activity_type: "health",
        title:
          "Periyodik muayene takibi",
        description:
          `${healthCurrent}/${health.length} sağlık kaydı güncel.`,
        status: "active",
        occurred_at:
          new Date().toISOString(),
      },
      {
        id: 4,
        activity_type: "dof",
        title:
          "DÖF takip durumu",
        description:
          `${openDof} açık düzeltici faaliyet izleniyor.`,
        status:
          openDof > 0
            ? "warning"
            : "completed",
        occurred_at:
          new Date().toISOString(),
      },
    ],
  };
}

export async function GET(
  req: NextRequest
) {
  try {
    const session =
      await getSession();

    if (session.auth !== "ok") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Yetkisiz erişim.",
        },
        { status: 401 }
      );
    }

    const requestedCompanyId =
      clean(
        req.nextUrl.searchParams.get(
          "companyId"
        )
      );

    let companyId =
      requestedCompanyId;

    if (
      session.role ===
        "demo_user" ||
      session.role ===
        "company_admin"
    ) {
      companyId =
        session.companyId;
    }

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Firma bilgisi bulunamadı.",
        },
        { status: 400 }
      );
    }

    const result =
      await loadMetrics(companyId);

    return NextResponse.json({
      success: true,
      ...result,
      moduleRecords: {
        accidents:
          result.metrics
            .accident_count +
          result.metrics
            .near_miss_count,
        inspections:
          result.metrics
            .inspection_total,
        cbs: 0,
        errors: [],
      },
    });
  } catch (errorValue: unknown) {
    console.error(
      "demo GET error:",
      errorValue
    );

    return NextResponse.json(
      {
        success: false,
        error:
          errorValue instanceof Error
            ? errorValue.message
            : "Demo verileri alınamadı.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  _req: NextRequest
) {
  try {
    const session =
      await getSession();

    if (
      session.auth !== "ok" ||
      ![
        "admin",
        "super_admin",
      ].includes(session.role)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Demo verisini yalnızca süper admin yenileyebilir.",
        },
        { status: 403 }
      );
    }

    const {
      id: companyId,
      localFirmId,
    } =
      await ensureDemoCompany();

    const employees =
      await ensureEmployees(
        companyId
      );

    const users =
      await ensureTrainingUsers(
        companyId,
        employees
      );

    const trainings =
      await ensureTrainings();

    const assignmentStats =
      await refreshAssignments(
        users,
        trainings
      );

    const inspectionCount =
      await refreshInspections(
        companyId,
        localFirmId
      );

    const accidentCount =
      await refreshAccidents(
        companyId,
        localFirmId,
        employees
      );

    const cbsCount =
      await refreshCbs(
        companyId
      );

    const healthCount =
      await refreshHealth(
        companyId,
        employees
      );

    const result =
      await loadMetrics(
        companyId
      );

    return NextResponse.json({
      success: true,
      ...result,
      moduleRecords: {
        accidents:
          accidentCount,
        inspections:
          inspectionCount,
        cbs: cbsCount,
        errors: [],
      },
      statistics: {
        employees:
          employees.length,
        trainingUsers:
          users.length,
        trainingAssignments:
          assignmentStats.total,
        completedTrainings:
          assignmentStats.completed,
        accidents:
          accidentCount,
        inspections:
          inspectionCount,
        cbs: cbsCount,
        health:
          healthCount,
      },
      message:
        "Demo firma verileri başarıyla yenilendi.",
    });
  } catch (errorValue: unknown) {
    console.error(
      "demo POST error:",
      errorValue
    );

    return NextResponse.json(
      {
        success: false,
        error:
          errorValue instanceof Error
            ? errorValue.message
            : "Demo verileri oluşturulamadı.",
      },
      { status: 500 }
    );
  }
  
}
