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

async function ensureDemoCompany(supabase: ReturnType<typeof getSupabase>) {
  const { data: existingList, error: existingError } = await supabase
    .from("companies")
    .select("id, name")
    .ilike("name", "%D-SEC Demo Lojistik ve Depolama%")
    .order("created_at", { ascending: true });

  if (existingError) {
    throw new Error(existingError.message);
  }

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

  if (error) {
    throw new Error(error.message);
  }

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

  if (existingError) {
    throw new Error(existingError.message);
  }

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

  if (insertError) {
    throw new Error(insertError.message);
  }

  return {
    inserted: rowsToInsert.length,
    skipped: demoEmployees.length - rowsToInsert.length,
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

    return NextResponse.json({
      success: true,
      message: "Demo firma ve çalışan verileri oluşturuldu.",
      company,
      employees: employeesResult,
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