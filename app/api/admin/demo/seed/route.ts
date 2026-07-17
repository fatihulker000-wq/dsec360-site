import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const DEMO_COMPANY_NAME =
  "D-SEC Demo Lojistik ve Depolama A.Ş.";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function checkAdmin() {
  const cookieStore = await cookies();
  const adminAuth =
    cookieStore.get("dsec_admin_auth")?.value;
  const adminRole =
    cookieStore.get("dsec_admin_role")?.value;

  return (
    adminAuth === "ok" &&
    (adminRole === "admin" ||
      adminRole === "super_admin")
  );
}

export async function POST() {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    const { data: existing, error: findError } =
      await supabase
        .from("companies")
        .select("id, name")
        .ilike("name", "%D-SEC Demo Lojistik%")
        .maybeSingle();

    if (findError) {
      return NextResponse.json(
        { success: false, error: findError.message },
        { status: 500 }
      );
    }

    const payload = {
      name: DEMO_COMPANY_NAME,
      yetkili: "Ayşe Yıldırım",
      phone: "0212 555 36 00",
      email: "demo@dsec360.com",
      address:
        "Merkez Mahallesi, Lojistik Caddesi No: 12, İstanbul",
      calisan_sayisi: 24,
      nace_kodu: "52.10.01",
      tehlike_sinifi: "Tehlikeli",
      sgk_sicil_no: "2-1234-5678901-34-56-789",
      sektor: "Lojistik ve Depolama",
      isg_uzmani: "Fatih Ülker",
      isyeri_hekimi: "Dr. Selin Arslan",
      dsp: "Merve Kaya",
      is_active: true,
    };

    let company;

    if (existing) {
      const { data, error } = await supabase
        .from("companies")
        .update(payload)
        .eq("id", existing.id)
        .select("id, name")
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      company = data;
    } else {
      const { data, error } = await supabase
        .from("companies")
        .insert(payload)
        .select("id, name")
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      company = data;
    }

    return NextResponse.json({
      success: true,
      company,
      employees: {
        inserted: 0,
        skipped: 0,
      },
      modules: {
        status: "SCHEMA_REQUIRED",
        message:
          "Demo firma ana kaydı hazırlandı. Tüm modül örnek kayıtları gerçek tablo kolonlarına göre ikinci adımda oluşturulacaktır.",
      },
    });
  } catch (errorValue) {
    return NextResponse.json(
      {
        success: false,
        error:
          errorValue instanceof Error
            ? errorValue.message
            : "Demo firma hazırlanamadı.",
      },
      { status: 500 }
    );
  }
}