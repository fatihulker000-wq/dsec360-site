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

    const payload = {
      title: String(body.title || "").trim(),
      employee_name: String(body.employeeName || "").trim(),
      event_type: String(body.eventType || "").trim(),
      location: String(body.location || "").trim(),
      severity: Number(body.severity || 0),
      lost_work_days: Number(body.lostWorkDays || 0),
      department: String(body.department || "").trim(),
      shift: String(body.shift || "").trim(),
      injury_body_part: String(body.injuryBodyPart || "").trim(),
      injury_type: String(body.injuryType || "").trim(),
      root_cause_category: String(body.rootCauseCategory || "").trim(),
      description: String(body.description || "").trim(),
      updated_at: Date.now(),
    };

    const { error } = await supabase
      .from("accident_records")
      .update(payload)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Güncelleme hatası" },
      { status: 500 }
    );
  }
}