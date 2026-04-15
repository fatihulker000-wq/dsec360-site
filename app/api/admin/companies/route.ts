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
  created_at: string | null;
  is_active: boolean | null;
};

export async function GET() {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("companies")
      .select("id, name, yetkili, phone, email, address, created_at, is_active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("companies GET error:", error);
      return NextResponse.json(
        { error: "Firmalar alınamadı." },
        { status: 500 }
      );
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
  yetkili: item.yetkili ? String(item.yetkili).trim() : null,
  phone: item.phone ? String(item.phone).trim() : null,
  email: item.email ? String(item.email).trim() : null,
  address: item.address ? String(item.address).trim() : null,
  created_at: item.created_at || null,
  is_active: item.is_active ?? true,
  user_count: counts[String(item.id)] || 0,
}));

    return NextResponse.json({ data: normalized });
  } catch (error) {
    console.error("companies GET genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const name = String(body?.name || "").trim();
    const yetkili = String(body?.yetkili || "").trim();
    const phone = String(body?.phone || "").trim();
    const email = String(body?.email || "").trim();
    const address = String(body?.address || "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Firma adı gerekli." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase.from("companies").insert({
  name,
  yetkili: yetkili || null,
  phone: phone || null,
  email: email || null,
  address: address || null,
  is_active: true,
});

    if (error) {
      console.error("companies POST error:", error);
      return NextResponse.json(
        { error: error.message || "Firma eklenemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("companies POST genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const id = String(body?.id || "").trim();
const name = String(body?.name || "").trim();
const yetkili = String(body?.yetkili || "").trim();
const phone = String(body?.phone || "").trim();
const email = String(body?.email || "").trim();
const address = String(body?.address || "").trim();
const is_active =
  typeof body?.is_active === "boolean" ? body.is_active : undefined;

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID ve firma adı gerekli." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const updatePayload: Record<string, unknown> = {
  name,
  yetkili: yetkili || null,
  phone: phone || null,
  email: email || null,
  address: address || null,
};

if (typeof is_active === "boolean") {
  updatePayload.is_active = is_active;
}

const { error } = await supabase
  .from("companies")
  .update(updatePayload)
  .eq("id", id);

    if (error) {
      console.error("companies PUT error:", error);
      return NextResponse.json(
        { error: error.message || "Firma güncellenemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("companies PUT genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Firma ID gerekli." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("companies DELETE error:", error);
      return NextResponse.json(
        { error: error.message || "Firma silinemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("companies DELETE genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
