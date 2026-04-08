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
  return adminAuth === "ok";
}

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAdmin();
    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, companyId } = body;

    const supabase = getSupabase();

    const { error } = await supabase
      .from("users")
      .update({ company_id: companyId || null })
      .eq("id", userId);

    if (error) {
      return NextResponse.json(
        { error: "Güncellenemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}