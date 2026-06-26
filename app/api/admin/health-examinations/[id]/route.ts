import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAdminContext() {
  const cookieStore = await cookies();

  const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
  const adminRole = cookieStore.get("dsec_admin_role")?.value;
  const companyIdFromCookie = String(
    cookieStore.get("dsec_company_id")?.value || ""
  ).trim();

  const isAllowedRole =
    adminRole === "super_admin" ||
    adminRole === "company_admin" ||
    !adminRole;

  if (adminAuth !== "ok" && adminRole) return null;
  if (!isAllowedRole) return null;

  return {
    adminRole: String(adminRole || "super_admin"),
    companyIdFromCookie,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminContext();

    if (!admin) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabase();

    let query = supabase
      .from("health_examinations")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false);

    if (admin.adminRole === "company_admin") {
      query = query.eq("company_id", admin.companyIdFromCookie);
    }

    const { data, error } = await query.single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      examination: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Muayene alınamadı." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminContext();

    if (!admin) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const supabase = getSupabase();

    let query = supabase
      .from("health_examinations")
      .update({
        exam_type: body.examType || "Periyodik Muayene",
        exam_date: body.examDate || null,
        next_exam_date: body.nextExamDate || null,

        height: body.height ? Number(body.height) : null,
        weight: body.weight ? Number(body.weight) : null,
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

        updated_by: body.updatedBy || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("is_deleted", false);

    if (admin.adminRole === "company_admin") {
      query = query.eq("company_id", admin.companyIdFromCookie);
    }

    const { data, error } = await query.select("*").single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      examination: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Muayene güncellenemedi." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminContext();

    if (!admin) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabase();

    let query = supabase
      .from("health_examinations")
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("is_deleted", false);

    if (admin.adminRole === "company_admin") {
      query = query.eq("company_id", admin.companyIdFromCookie);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Muayene silinemedi." },
      { status: 500 }
    );
  }
}