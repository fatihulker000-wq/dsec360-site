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
  created_at: string | null;
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
      .select("id, name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("companies GET error:", error);
      return NextResponse.json(
        { error: "Firmalar alınamadı." },
        { status: 500 }
      );
    }

    const normalized = ((data || []) as CompanyRow[]).map((item) => ({
      id: String(item.id),
      name: String(item.name || "").trim(),
      created_at: item.created_at || null,
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

    if (!name) {
      return NextResponse.json(
        { error: "Firma adı gerekli." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase.from("companies").insert({
      name,
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

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID ve firma adı gerekli." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("companies")
      .update({ name })
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