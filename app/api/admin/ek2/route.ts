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

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const employeeId = String(searchParams.get("employeeId") || "").trim();

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "Çalışan bilgisi eksik." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    let query = supabase
      .from("health_ek2_forms")
      .select("*")
      .eq("employee_id", employeeId)
      .order("exam_date", { ascending: false })
      .limit(50);

    if (adminRole === "company_admin") {
      query = query.eq("company_id", companyIdFromCookie);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      forms: data || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "EK-2 kayıtları alınamadı.",
      },
      { status: 500 }
    );
  }
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

    const employeeId = String(body.employeeId || body.employee_id || "").trim();

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
  exam_date: body.examDate || body.exam_date || null,
  next_exam_date: body.nextExamDate || body.next_exam_date || null,
  decision: body.decision || null,
  exam_type:
  body.formType === "Periyodik"
    ? "EK2_PERIYODIK"
    : "EK2_ISE_GIRIS",
  is_deleted: false,
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

    let ek2Form: any = null;
    let ek2Warning: string | null = null;

    const ek2Payload = {
      employee_id: employeeId,
      company_id: companyId,
      examination_id: exam?.id || null,

      form_type: body.formType || body.form_type || "İşe Giriş",
      status: body.status || "Tamamlandı",
      file_no: body.fileNo || body.file_no || null,
      revision_no: body.revisionNo || body.revision_no || "0",

      exam_date: body.examDate || body.exam_date || null,
      next_exam_date: body.nextExamDate || body.next_exam_date || null,
      doctor_name: body.doctorName || body.doctor_name || null,

      employee_name: body.employeeName || body.employee_name || null,
      identity_number: body.identityNumber || body.identity_number || null,
      birth_date: body.birthDate || body.birth_date || null,
      gender: body.gender || null,
      blood_group: body.bloodGroup || body.blood_group || null,
      phone: body.phone || null,

      company_name: body.companyName || body.company_name || null,
      workplace_address: body.workplaceAddress || body.workplace_address || null,
      job_title: body.jobTitle || body.job_title || null,
      department: body.department || null,
      start_date: body.startDate || body.start_date || null,
      danger_class: body.dangerClass || body.danger_class || null,
      nace_code: body.naceCode || body.nace_code || null,

      decision: body.decision || null,
      doctor_opinion: body.doctorOpinion || body.doctor_opinion || null,
      signature_note: body.signatureNote || body.signature_note || null,

      raw_json: body,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const { data: insertedEk2, error: ek2Error } = await supabase
      .from("health_ek2_forms")
      .insert(ek2Payload)
      .select()
      .single();

    if (ek2Error) {
      ek2Warning = ek2Error.message;
    } else {
      ek2Form = insertedEk2;
    }

    return NextResponse.json({
      success: true,
      examination: exam,
      ek2: ek2Form,
      ek2Warning,
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