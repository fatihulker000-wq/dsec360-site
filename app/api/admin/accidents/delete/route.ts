import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;

    if (!adminAuth) {
      return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await req.json();
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json({ success: false, error: "Kayıt ID eksik." }, { status: 400 });
    }

    const { error } = await supabase
      .from("accident_records")
      .update({
        is_active: 0,
        updated_at: Date.now(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Silme hatası" },
      { status: 500 }
    );
  }
}