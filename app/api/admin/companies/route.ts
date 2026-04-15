import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function checkAdmin() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
  const adminRole = cookieStore.get("dsec_admin_role")?.value;

  return (
    adminAuth === "ok" &&
    (adminRole === "admin" || adminRole === "super_admin")
  );
}

type CompanyRow = {
  id: string;
  name: string | null;
  yetkili: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;

  // 🔥 YENİ ALANLAR
  calisan_sayisi: number | null;
  nace_kodu: string | null;
  tehlike_sinifi: string | null;
  sgk_sicil_no: string | null;
  sektor: string | null;
  isg_uzmani: string | null;
  isyeri_hekimi: string | null;
  dsp: string | null;

  created_at: string | null;
  is_active: boolean | null;
};

export async function GET() {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("companies")
      .select(`
        id,
        name,
        yetkili,
        phone,
        email,
        address,
        calisan_sayisi,
        nace_kodu,
        tehlike_sinifi,
        sgk_sicil_no,
        sektor,
        isg_uzmani,
        isyeri_hekimi,
        dsp,
        created_at,
        is_active
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("companies GET error:", error);
      return NextResponse.json({ error: "Firmalar alınamadı." }, { status: 500 });
    }

    const { data: users } = await supabase
      .from("users")
      .select("id, company_id");

    const counts: Record<string, number> = {};

    (users || []).forEach((u: { id: string; company_id: string | null }) => {
      if (!u.company_id) return;
      counts[u.company_id] = (counts[u.company_id] || 0) + 1;
    });

    const normalized = ((data || []) as CompanyRow[]).map((item) => ({
      id: String(item.id),
      name: String(item.name || "").trim(),
      yetkili: item.yetkili?.trim() || null,
      phone: item.phone?.trim() || null,
      email: item.email?.trim() || null,
      address: item.address?.trim() || null,

      // 🔥 YENİ ALANLAR
      calisan_sayisi: item.calisan_sayisi ?? 0,
      nace_kodu: item.nace_kodu ?? "",
      tehlike_sinifi: item.tehlike_sinifi ?? "",
      sgk_sicil_no: item.sgk_sicil_no ?? "",
      sektor: item.sektor ?? "",
      isg_uzmani: item.isg_uzmani ?? "",
      isyeri_hekimi: item.isyeri_hekimi ?? "",
      dsp: item.dsp ?? "",

      created_at: item.created_at || null,
      is_active: item.is_active ?? true,
      user_count: counts[String(item.id)] || 0,
    }));

    return NextResponse.json({ data: normalized });

  } catch (error) {
    console.error("companies GET genel hata:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}

// ======================
// POST
// ======================
export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAdmin();
    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();

    const supabase = getSupabase();

    const { error } = await supabase.from("companies").insert({
      name: body.name,
      yetkili: body.yetkili || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,

      // 🔥 YENİ ALANLAR
      calisan_sayisi: body.calisan_sayisi ?? 0,
      nace_kodu: body.nace_kodu || null,
      tehlike_sinifi: body.tehlike_sinifi || null,
      sgk_sicil_no: body.sgk_sicil_no || null,
      sektor: body.sektor || null,
      isg_uzmani: body.isg_uzmani || null,
      isyeri_hekimi: body.isyeri_hekimi || null,
      dsp: body.dsp || null,

      is_active: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// ======================
// PUT
// ======================
export async function PUT(req: NextRequest) {
  try {
    const allowed = await checkAdmin();
    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();

    const supabase = getSupabase();

    const { error } = await supabase
      .from("companies")
      .update({
        name: body.name,
        yetkili: body.yetkili || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,

        // 🔥 YENİ ALANLAR
        calisan_sayisi: body.calisan_sayisi ?? 0,
        nace_kodu: body.nace_kodu || null,
        tehlike_sinifi: body.tehlike_sinifi || null,
        sgk_sicil_no: body.sgk_sicil_no || null,
        sektor: body.sektor || null,
        isg_uzmani: body.isg_uzmani || null,
        isyeri_hekimi: body.isyeri_hekimi || null,
        dsp: body.dsp || null,

        is_active: body.is_active,
      })
      .eq("id", body.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// ======================
// DELETE
// ======================
export async function DELETE(req: NextRequest) {
  try {
    const allowed = await checkAdmin();
    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");

    const supabase = getSupabase();

    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}