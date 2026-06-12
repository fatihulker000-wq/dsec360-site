import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const DEMO_COMPANY_NAME = "D-SEC Demo Lojistik ve Depolama A.Ş";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function checkSuperAdmin() {
  const cookieStore = await cookies();

  const auth = String(cookieStore.get("dsec_admin_auth")?.value || "").trim();
  const role = String(cookieStore.get("dsec_admin_role")?.value || "").trim();

  return auth === "ok" && role === "super_admin";
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

const demoEmployees = [
  {
    full_name: "Ahmet Yılmaz",
    job_title: "Depo Müdürü",
    phone: "0532 100 10 01",
    email: "ahmet.yilmaz@dsecdemo.com",
    registry_no: "DSEC-001",
    tc_no: "10000000001",
    start_date: "2021-03-15",
    gender: "Erkek",
    disability_status: "Yok",
    birth_date: "1985-05-12",
    education_level: "Lisans",
    blood_type: "A Rh+",
  },
  {
    full_name: "Mehmet Kaya",
    job_title: "Forklift Operatörü",
    phone: "0532 100 10 02",
    email: "mehmet.kaya@dsecdemo.com",
    registry_no: "DSEC-002",
    tc_no: "10000000002",
    start_date: "2022-01-10",
    gender: "Erkek",
    disability_status: "Yok",
    birth_date: "1990-09-18",
    education_level: "Lise",
    blood_type: "0 Rh+",
  },
  {
    full_name: "Ayşe Demir",
    job_title: "Lojistik Uzmanı",
    phone: "0532 100 10 03",
    email: "ayse.demir@dsecdemo.com",
    registry_no: "DSEC-003",
    tc_no: "10000000003",
    start_date: "2020-11-02",
    gender: "Kadın",
    disability_status: "Yok",
    birth_date: "1988-02-21",
    education_level: "Lisans",
    blood_type: "B Rh+",
  },
  {
    full_name: "Hasan Çelik",
    job_title: "Sevkiyat Personeli",
    phone: "0532 100 10 04",
    email: "hasan.celik@dsecdemo.com",
    registry_no: "DSEC-004",
    tc_no: "10000000004",
    start_date: "2023-04-05",
    gender: "Erkek",
    disability_status: "Yok",
    birth_date: "1995-07-30",
    education_level: "Lise",
    blood_type: "AB Rh+",
  },
  {
    full_name: "Emre Arslan",
    job_title: "Depo Personeli",
    phone: "0532 100 10 05",
    email: "emre.arslan@dsecdemo.com",
    registry_no: "DSEC-005",
    tc_no: "10000000005",
    start_date: "2022-08-17",
    gender: "Erkek",
    disability_status: "Yok",
    birth_date: "1993-12-09",
    education_level: "Lise",
    blood_type: "A Rh-",
  },
  {
    full_name: "Zeynep Koç",
    job_title: "Ofis Personeli",
    phone: "0532 100 10 06",
    email: "zeynep.koc@dsecdemo.com",
    registry_no: "DSEC-006",
    tc_no: "10000000006",
    start_date: "2019-06-24",
    gender: "Kadın",
    disability_status: "Yok",
    birth_date: "1991-04-14",
    education_level: "Ön Lisans",
    blood_type: "0 Rh-",
  },
  {
    full_name: "Murat Şahin",
    job_title: "Vardiya Amiri",
    phone: "0532 100 10 07",
    email: "murat.sahin@dsecdemo.com",
    registry_no: "DSEC-007",
    tc_no: "10000000007",
    start_date: "2018-10-01",
    gender: "Erkek",
    disability_status: "Yok",
    birth_date: "1982-11-03",
    education_level: "Lisans",
    blood_type: "B Rh-",
  },
  {
    full_name: "Fatma Aksoy",
    job_title: "Kalite Kontrol Uzmanı",
    phone: "0532 100 10 08",
    email: "fatma.aksoy@dsecdemo.com",
    registry_no: "DSEC-008",
    tc_no: "10000000008",
    start_date: "2021-09-13",
    gender: "Kadın",
    disability_status: "Yok",
    birth_date: "1989-08-27",
    education_level: "Lisans",
    blood_type: "AB Rh-",
  },
  {
    full_name: "Can Özdemir",
    job_title: "Paketleme Personeli",
    phone: "0532 100 10 09",
    email: "can.ozdemir@dsecdemo.com",
    registry_no: "DSEC-009",
    tc_no: "10000000009",
    start_date: "2023-02-20",
    gender: "Erkek",
    disability_status: "Yok",
    birth_date: "1997-01-25",
    education_level: "Lise",
    blood_type: "A Rh+",
  },
  {
    full_name: "Elif Yıldız",
    job_title: "İnsan Kaynakları Uzmanı",
    phone: "0532 100 10 10",
    email: "elif.yildiz@dsecdemo.com",
    registry_no: "DSEC-010",
    tc_no: "10000000010",
    start_date: "2020-03-09",
    gender: "Kadın",
    disability_status: "Yok",
    birth_date: "1992-06-19",
    education_level: "Lisans",
    blood_type: "0 Rh+",
  },
];

const demoTrainings = [
  {
    title: "Temel İş Sağlığı ve Güvenliği Eğitimi",
    description:
      "Çalışanların temel İSG kuralları, yasal sorumluluklar, güvenli çalışma davranışları ve işyerindeki tehlikeler hakkında bilgilendirilmesi.",
    type: "asenkron",
    duration_minutes: 240,
    content_url: "",
    topics_text:
      "İSG mevzuatı, çalışan sorumlulukları, iş kazalarının önlenmesi, KKD kullanımı, acil durum davranışları",
  },
  {
    title: "Yangın Güvenliği ve Acil Durum Eğitimi",
    description:
      "Yangın türleri, yangın söndürme yöntemleri, tahliye kuralları ve acil durum ekiplerinin görevlerini kapsayan demo eğitim.",
    type: "asenkron",
    duration_minutes: 90,
    content_url: "",
    topics_text:
      "Yangın sınıfları, söndürücü kullanımı, tahliye, toplanma alanı, acil durum planı",
  },
  {
    title: "Elle Taşıma ve Ergonomi Eğitimi",
    description:
      "Depo ve lojistik personeli için doğru kaldırma, taşıma, itme-çekme ve ergonomik çalışma prensipleri.",
    type: "asenkron",
    duration_minutes: 60,
    content_url: "",
    topics_text:
      "Elle taşıma, bel sağlığı, yük kaldırma teknikleri, ergonomi, kas iskelet sistemi riskleri",
  },
  {
    title: "Forklift ve Depo Trafik Güvenliği Eğitimi",
    description:
      "Forklift operatörleri ve depo çalışanları için saha içi trafik, görüş alanı, yaya yolları ve yük güvenliği eğitimi.",
    type: "asenkron",
    duration_minutes: 75,
    content_url: "",
    topics_text:
      "Forklift güvenliği, yaya yolu, hız sınırı, yükleme, raf güvenliği, kör nokta riskleri",
  },
  {
    title: "KKD Kullanımı Eğitimi",
    description:
      "Kişisel koruyucu donanımların doğru seçimi, kullanımı, bakımı ve çalışan sorumluluklarını anlatan eğitim.",
    type: "asenkron",
    duration_minutes: 45,
    content_url: "",
    topics_text:
      "Baret, iş ayakkabısı, reflektörlü yelek, eldiven, gözlük, KKD bakım ve kontrolü",
  },
  {
    title: "İş Kazası Sonrası İşe Dönüş Eğitimi",
    description:
      "İş kazası yaşayan çalışanların işe dönüş öncesi bilgilendirilmesi ve tekrar kazaların önlenmesi için hazırlanan eğitim.",
    type: "asenkron",
    duration_minutes: 45,
    content_url: "",
    topics_text:
      "Kaza nedeni, güvenli davranış, işe dönüş kontrolü, ramak kala bildirimi, tekrar kaza önleme",
  },
];

const demoAccidents = [
  {
    event_type: "İş Kazası",
    title: "Forklift manevrası sırasında ayak ezilmesi",
    description:
      "Depo alanında forklift manevrası sırasında yaya yolu ihlali nedeniyle çalışanın sağ ayağında ezilme meydana gelmiştir.",
    location: "Ana Depo - Sevkiyat Alanı",
    severity: 4,
    lost_work_days: 3,
    employee_name: "Mehmet Kaya",
    department: "Depo Operasyon",
    shift: "Gündüz",
    injury_body_part: "Sağ Ayak",
    injury_type: "Ezilme",
    root_cause_category: "Yaya-forklift trafik ayrımı yetersizliği",
  },
  {
    event_type: "İş Kazası",
    title: "Elle taşıma sırasında bel zorlanması",
    description:
      "Ağır kolinin manuel kaldırılması sırasında çalışanda bel zorlanması oluşmuştur.",
    location: "Paketleme Alanı",
    severity: 3,
    lost_work_days: 1,
    employee_name: "Can Özdemir",
    department: "Paketleme",
    shift: "Gündüz",
    injury_body_part: "Bel",
    injury_type: "Kas zorlanması",
    root_cause_category: "Ergonomi ve elle taşıma kurallarına uyulmaması",
  },
  {
    event_type: "Ramak Kala",
    title: "Raf üzerinden malzeme düşmesi",
    description:
      "Üst rafta dengesiz istiflenen koli zemine düşmüş, çalışan yaralanmadan olay atlatılmıştır.",
    location: "Raflı Depo Alanı",
    severity: 2,
    lost_work_days: 0,
    employee_name: "Ahmet Yılmaz",
    department: "Depo",
    shift: "Gündüz",
    injury_body_part: "",
    injury_type: "",
    root_cause_category: "İstifleme kurallarına uyulmaması",
  },
  {
    event_type: "Ramak Kala",
    title: "Elektrik panosu önünde uygunsuz malzeme birikimi",
    description:
      "Elektrik panosu önünde palet ve koli biriktiği tespit edilmiş, acil müdahale alanı kapatılmadan düzeltilmiştir.",
    location: "Bakım Alanı",
    severity: 2,
    lost_work_days: 0,
    employee_name: "Murat Şahin",
    department: "Bakım / Depo",
    shift: "Akşam",
    injury_body_part: "",
    injury_type: "",
    root_cause_category: "Elektrik güvenliği ve saha düzeni eksikliği",
  },
  {
    event_type: "Olay Bildirimi",
    title: "Acil çıkış kapısı önünde geçici engel",
    description:
      "Acil çıkış kapısı önünde geçici malzeme bırakıldığı görülmüş, alan boşaltılmıştır.",
    location: "Acil Çıkış Koridoru",
    severity: 1,
    lost_work_days: 0,
    employee_name: "Zeynep Koç",
    department: "İdari İşler",
    shift: "Gündüz",
    injury_body_part: "",
    injury_type: "",
    root_cause_category: "Acil durum yollarının kontrol eksikliği",
  },
];

async function ensureDemoCompany(supabase: ReturnType<typeof getSupabase>) {
  const { data: existingList, error: existingError } = await supabase
    .from("companies")
    .select("id, name")
    .ilike("name", "%D-SEC Demo Lojistik ve Depolama%")
    .order("created_at", { ascending: true });

  if (existingError) throw new Error(existingError.message);

  if (Array.isArray(existingList) && existingList.length > 0) {
    return existingList[0];
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: DEMO_COMPANY_NAME,
      yetkili: "Ali Çevik",
      phone: "0212 555 36 00",
      email: "demo@dsec360.com",
      address: "Merkez Mahallesi, Lojistik Caddesi No: 12, Gümüşhane / Türkiye",
      calisan_sayisi: 10,
      nace_kodu: "52.10.01",
      tehlike_sinifi: "Tehlikeli",
      sgk_sicil_no: "1234567.029.01.01",
      sektor: "Lojistik, depolama ve sevkiyat",
      isg_uzmani: "Fatih Ülker",
      isyeri_hekimi: "Dr. Ayşe Demir",
      dsp: "Selin Kara",
      is_active: true,
    })
    .select("id, name")
    .single();

  if (error) throw new Error(error.message);

  return data;
}

async function seedEmployees(
  supabase: ReturnType<typeof getSupabase>,
  firmId: string
) {
  const { data: existingEmployees, error: existingError } = await supabase
    .from("employees")
    .select("id, email, registry_no")
    .eq("firm_id", firmId);

  if (existingError) throw new Error(existingError.message);

  const existingEmails = new Set(
    (existingEmployees || []).map((e) => String(e.email || "").toLowerCase())
  );

  const rowsToInsert = demoEmployees
    .filter((e) => !existingEmails.has(e.email.toLowerCase()))
    .map((e) => ({
      firm_id: firmId,
      full_name: e.full_name,
      job_title: e.job_title,
      phone: e.phone,
      email: e.email,
      registry_no: e.registry_no,
      tc_no: e.tc_no,
      start_date: e.start_date,
      exit_date: null,
      gender: e.gender,
      disability_status: e.disability_status,
      birth_date: e.birth_date,
      education_level: e.education_level,
      blood_type: e.blood_type,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

  if (rowsToInsert.length === 0) {
    return {
      inserted: 0,
      skipped: demoEmployees.length,
    };
  }

  const { error: insertError } = await supabase
    .from("employees")
    .insert(rowsToInsert);

  if (insertError) throw new Error(insertError.message);

  return {
    inserted: rowsToInsert.length,
    skipped: demoEmployees.length - rowsToInsert.length,
  };
}

async function seedDemoTrainingUsers(
  supabase: ReturnType<typeof getSupabase>,
  firmId: string
) {
  const { data: employees, error: employeesError } = await supabase
    .from("employees")
    .select("id, full_name, email, phone, active")
    .eq("firm_id", firmId)
    .eq("active", true);

  if (employeesError) throw new Error(employeesError.message);

  const rows = employees || [];

  if (rows.length === 0) {
    return {
      created: 0,
      updated: 0,
      skipped: 0,
    };
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const emp of rows) {
    const email = String(emp.email || "").trim().toLowerCase();
    const fullName = String(emp.full_name || "Demo Eğitim Kullanıcısı").trim();

    if (!email || !emp.id) {
      skipped += 1;
      continue;
    }

    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    if (existingUser?.id) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: fullName,
          employee_id: emp.id,
          company_id: firmId,
          role: "training_user",
          is_active: true,
        })
        .eq("id", existingUser.id);

      if (updateError) throw new Error(updateError.message);

      await supabase.from("user_firm_access").upsert(
        {
          user_id: existingUser.id,
          firm_id: firmId,
          role: "training_user",
          is_primary: true,
        },
        {
          onConflict: "user_id,firm_id",
        }
      );

      updated += 1;
      continue;
    }

    const { data: insertedUser, error: insertError } = await supabase
      .from("users")
      .insert({
        full_name: fullName,
        email,
        phone: emp.phone || null,
        password_hash: sha256("Demo12345"),
        role: "training_user",
        company_id: firmId,
        employee_id: emp.id,
        is_active: true,
      })
      .select("id")
      .single();

    if (insertError) throw new Error(insertError.message);

    if (insertedUser?.id) {
      await supabase.from("user_firm_access").insert({
        user_id: insertedUser.id,
        firm_id: firmId,
        role: "training_user",
        is_primary: true,
      });
    }

    created += 1;
  }

  return {
    created,
    updated,
    skipped,
  };
}

async function seedTrainings(supabase: ReturnType<typeof getSupabase>) {
  const { data: existingTrainings, error: existingError } = await supabase
    .from("trainings")
    .select("id, title");

  if (existingError) throw new Error(existingError.message);

  const existingTitles = new Set(
    (existingTrainings || []).map((t) =>
      String(t.title || "").trim().toLowerCase()
    )
  );

  const rowsToInsert = demoTrainings
    .filter((t) => !existingTitles.has(t.title.trim().toLowerCase()))
    .map((t) => ({
      title: t.title,
      description: t.description,
      type: t.type,
      duration_minutes: t.duration_minutes,
      content_url: t.content_url,
      topics_text: t.topics_text,
      created_at: new Date().toISOString(),
    }));

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("trainings")
      .insert(rowsToInsert);

    if (insertError) throw new Error(insertError.message);
  }

  const { data: finalTrainings, error: finalError } = await supabase
    .from("trainings")
    .select("id, title")
    .in(
      "title",
      demoTrainings.map((t) => t.title)
    );

  if (finalError) throw new Error(finalError.message);

  return {
    inserted: rowsToInsert.length,
    skipped: demoTrainings.length - rowsToInsert.length,
    trainings: finalTrainings || [],
  };
}

async function seedTrainingAssignments(
  supabase: ReturnType<typeof getSupabase>,
  firmId: string,
  trainings: Array<{ id: string; title: string | null }>
) {
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, employee_id, company_id, role")
    .eq("company_id", firmId)
    .eq("role", "training_user");

  if (usersError) throw new Error(usersError.message);

  const linkedUsers = (users || [])
    .filter((u) => u.id)
    .map((u) => String(u.id));

  const trainingIds = trainings.map((t) => String(t.id)).filter(Boolean);

  if (linkedUsers.length === 0 || trainingIds.length === 0) {
    return {
      inserted: 0,
      skipped: 0,
      note: "Training user veya eğitim bulunamadı.",
    };
  }

  const { data: existingAssignments, error: existingError } = await supabase
    .from("training_assignments")
    .select("user_id, training_id")
    .in("user_id", linkedUsers)
    .in("training_id", trainingIds);

  if (existingError) throw new Error(existingError.message);

  const existingSet = new Set(
    (existingAssignments || []).map(
      (a) => `${String(a.user_id)}::${String(a.training_id)}`
    )
  );

  const statuses = ["completed", "completed", "in_progress", "not_started"];

  const rowsToInsert: Array<{
    user_id: string;
    training_id: string;
    status: string;
  }> = [];

  linkedUsers.forEach((userId, userIndex) => {
    trainingIds.forEach((trainingId, trainingIndex) => {
      const key = `${userId}::${trainingId}`;
      if (existingSet.has(key)) return;

      rowsToInsert.push({
        user_id: userId,
        training_id: trainingId,
        status: statuses[(userIndex + trainingIndex) % statuses.length],
      });
    });
  });

  if (rowsToInsert.length === 0) {
    return {
      inserted: 0,
      skipped: linkedUsers.length * trainingIds.length,
    };
  }

  const { error: insertError } = await supabase
    .from("training_assignments")
    .insert(rowsToInsert);

  if (insertError) throw new Error(insertError.message);

  return {
    inserted: rowsToInsert.length,
    skipped: linkedUsers.length * trainingIds.length - rowsToInsert.length,
  };
}

async function seedAccidents(
  supabase: ReturnType<typeof getSupabase>,
  firmId: string
) {
  const { data: existing, error: existingError } = await supabase
    .from("accident_records")
    .select("id, title")
    .eq("web_firm_id", firmId);

  if (existingError) throw new Error(existingError.message);

  const existingTitles = new Set(
    (existing || []).map((x) => String(x.title || "").trim().toLowerCase())
  );

  const rowsToInsert = demoAccidents
    .filter((x) => !existingTitles.has(x.title.trim().toLowerCase()))
    .map((x) => ({
  web_firm_id: firmId,
  firm_id: null,
  employee_id: null,
  event_type: x.event_type,
  title: x.title,
  description: x.description,
  location: x.location,
  severity: x.severity,
  lost_work_days: x.lost_work_days,
  employee_name: x.employee_name,
  department: x.department,
  shift: x.shift,
  injury_body_part: x.injury_body_part,
  injury_type: x.injury_type,
  root_cause_category: x.root_cause_category,
  is_active: 1,
  is_deleted: 0,
  source: "DEMO",
}));

  if (rowsToInsert.length === 0) {
    return {
      inserted: 0,
      skipped: demoAccidents.length,
    };
  }

  const { error: insertError } = await supabase
    .from("accident_records")
    .insert(rowsToInsert);

  if (insertError) throw new Error(insertError.message);

  return {
    inserted: rowsToInsert.length,
    skipped: demoAccidents.length - rowsToInsert.length,
  };
}

export async function POST() {
  try {
    const allowed = await checkSuperAdmin();

    if (!allowed) {
      return NextResponse.json(
        { error: "Sadece süper admin demo veri oluşturabilir." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    const company = await ensureDemoCompany(supabase);
    const employeesResult = await seedEmployees(supabase, String(company.id));
    const trainingUsersResult = await seedDemoTrainingUsers(
  supabase,
  String(company.id)
);
    const trainingsResult = await seedTrainings(supabase);

    const assignmentsResult = await seedTrainingAssignments(
  supabase,
  String(company.id),
  trainingsResult.trainings
);

const accidentsResult = await seedAccidents(
  supabase,
  String(company.id)
);

    return NextResponse.json({
  success: true,
  message: "Demo firma, çalışan ve eğitim verileri oluşturuldu.",
  company,
  employees: employeesResult,
  trainingUsers: trainingUsersResult,
  trainings: trainingsResult,
  assignments: assignmentsResult,
  accidents: accidentsResult,
});
  } catch (error: any) {
    console.error("demo seed error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Demo verileri oluşturulamadı.",
      },
      { status: 500 }
    );
  }
}