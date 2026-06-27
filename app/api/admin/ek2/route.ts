import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = cookieStore.get("dsec_admin_role")?.value;
    const companyIdFromCookie = String(
      cookieStore.get("dsec_company_id")?.value || ""
    ).trim();

    if (adminAuth !== "ok" && adminRole) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const supabase = getSupabase();

    const employeeId = String(body.employeeId || "").trim();
    const companyId = String(
      adminRole === "company_admin"
        ? companyIdFromCookie
        : body.companyId || body.company_id || ""
    ).trim();

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "Çalışan bilgisi eksik." },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Firma bilgisi eksik." },
        { status: 400 }
      );
    }

    const examPayload = {
      employee_id: employeeId,
      company_id: companyId,
      exam_date: body.examDate || null,
      next_exam_date: body.nextExamDate || null,
      decision: body.decision || null,
      exam_type: body.formType || "İşe Giriş",
      status: body.status || "Tamamlandı",
      doctor_name: body.doctorName || null,
      notes: body.doctorOpinion || null,
      is_deleted: false,
      created_at: new Date().toISOString(),
    };

    const { data: exam, error: examError } = await supabase
      .from("health_examinations")
      .insert(examPayload)
      .select()
      .single();

    if (examError) {
      return NextResponse.json(
        { success: false, error: examError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      examination: exam,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "EK-2 kaydedilemedi.",
      },
      { status: 500 }
    );
  }
}