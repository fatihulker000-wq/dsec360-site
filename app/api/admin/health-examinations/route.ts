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

    if (
      adminAuth !== "ok" ||
      !["super_admin", "company_admin"].includes(String(adminRole))
    ) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    const supabase = getSupabase();

    let query = supabase
      .from("health_examinations")
      .select("*")
      .eq("is_active", true)
      .order("exam_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (adminRole === "company_admin") {
      query = query.eq("company_id", companyIdFromCookie);
    }

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      examinations: data || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Muayeneler alınamadı." },
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

    if (
      adminAuth !== "ok" ||
      !["super_admin", "company_admin"].includes(String(adminRole))
    ) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();

    const companyId = String(body.companyId || companyIdFromCookie).trim();
    const employeeId = String(body.employeeId || "").trim();

    if (!companyId || !employeeId) {
      return NextResponse.json(
        { error: "Firma ve çalışan bilgisi zorunludur." },
        { status: 400 }
      );
    }

    if (adminRole === "company_admin" && companyId !== companyIdFromCookie) {
      return NextResponse.json(
        { error: "Bu firma için işlem yetkiniz yok." },
        { status: 403 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("health_examinations")
      .insert({
        company_id: companyId,
        employee_id: employeeId,
        exam_type: body.examType || null,
        exam_date: body.examDate || null,
        next_exam_date: body.nextExamDate || null,
        height_cm: body.height ? Number(body.height) : null,
        weight_kg: body.weight ? Number(body.weight) : null,
        bmi: body.bmi ? Number(body.bmi) : null,
        systolic: body.systolic ? Number(body.systolic) : null,
        diastolic: body.diastolic ? Number(body.diastolic) : null,
        pulse: body.pulse ? Number(body.pulse) : null,
        temperature: body.temperature ? Number(body.temperature) : null,
        spo2: body.spo2 ? Number(body.spo2) : null,
        findings: body.findings || null,
        decision: body.decision || "Uygun",
        restriction_note: body.restrictionNote || null,
        doctor_note: body.doctorNote || null,
        created_by: body.createdBy || null,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      examination: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Muayene kaydedilemedi." },
      { status: 500 }
    );
  }
}