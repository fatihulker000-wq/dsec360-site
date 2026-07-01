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

type PrescriptionItemInput = {
  medicineName: string;
  activeIngredient?: string;
  dosage?: string;
  usageType?: string;
  duration?: string;
  morning?: boolean;
  noon?: boolean;
  evening?: boolean;
  night?: boolean;
  beforeMeal?: boolean;
  afterMeal?: boolean;
  notes?: string;
};

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminAuth =
  cookieStore.get("dsec_admin_auth")?.value ||
  cookieStore.get("dsec_user_auth")?.value;

 const adminRole =
  cookieStore.get("dsec_admin_role")?.value ||
  cookieStore.get("dsec_user_role")?.value;
    const companyId = String(cookieStore.get("dsec_company_id")?.value || "").trim();

   const roleValue = String(adminRole || "").trim();

const isAllowed =
  adminAuth === "ok" ||
  roleValue === "super_admin" ||
  roleValue === "company_admin" ||
  roleValue === "demo_user" ||
  roleValue === "";

if (!isAllowed) {
  return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
}

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    const supabase = getSupabase();

    let query = supabase
      .from("health_prescriptions")
      .select(`
  *,
  health_prescription_items(id)
`)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (adminRole === "company_admin") {
      query = query.eq("company_id", companyId);
    }

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const prescriptions = (data || []).map((p: any) => ({
  id: p.id,
  employeeId: p.employee_id,
  companyId: p.company_id,
  diagnosisName: p.diagnosis_name,
  status: p.status,
  createdAt: p.created_at,
  medicineCount: p.health_prescription_items?.length || 0,
}));

return NextResponse.json({
  success: true,
  prescriptions,
});
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Prescriptions could not be loaded." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const supabase = getSupabase();
  let createdPrescriptionId = "";

  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = cookieStore.get("dsec_admin_role")?.value;
    const companyIdFromCookie = String(
      cookieStore.get("dsec_company_id")?.value || ""
    ).trim();

    console.log({
  adminAuth,
  adminRole,
  companyIdFromCookie,
});

   const roleValue = String(adminRole || "").trim();

const isAllowed =
  adminAuth === "ok" ||
  roleValue === "super_admin" ||
  roleValue === "company_admin" ||
  roleValue === "demo_user" ||
  roleValue === "";

if (!isAllowed) {
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

    const items: PrescriptionItemInput[] = Array.isArray(body.items)
      ? body.items
      : [];

    const { data: prescription, error: prescriptionError } = await supabase
      .from("health_prescriptions")
      .insert({
        company_id: companyId,
        employee_id: employeeId,
        doctor_id: body.doctorId || null,
        examination_id: body.examinationId || null,
        ek2_form_id: body.ek2FormId || null,
        prescription_no: body.prescriptionNo || null,
        e_prescription_no: body.ePrescriptionNo || null,
medula_tracking_no: body.medulaTrackingNo || null,
medula_status: body.ePrescriptionStatus || "NOT_SENT",
medula_response: body.medulaResponse || null,
doctor_identity_number: body.doctorIdentityNumber || null,
doctor_diploma_no: body.doctorDiplomaNo || null,
        diagnosis_code: body.diagnosisCode || null,
        diagnosis_name: body.diagnosisName || null,
        notes: body.notes || null,
        status: body.status || "draft",
        created_by: body.createdBy || null,
        is_active: true,
      })
      .select("*")
      .single();

    if (prescriptionError) {
      return NextResponse.json(
        { error: prescriptionError.message },
        { status: 500 }
      );
    }

    createdPrescriptionId = prescription.id;

    if (items.length > 0) {
      const itemRows = items
        .filter((item) => String(item.medicineName || "").trim())
        .map((item) => ({
          prescription_id: createdPrescriptionId,
          medicine_name: item.medicineName,
          active_ingredient: item.activeIngredient || null,
          dosage: item.dosage || null,
          usage_type: item.usageType || null,
          duration: item.duration || null,
          morning: item.morning || false,
          noon: item.noon || false,
          evening: item.evening || false,
          night: item.night || false,
          before_meal: item.beforeMeal || false,
          after_meal: item.afterMeal || false,
          notes: item.notes || null,
        }));

      if (itemRows.length > 0) {
        const { error: itemsError } = await supabase
          .from("health_prescription_items")
          .insert(itemRows);

        if (itemsError) {
          await supabase
            .from("health_prescriptions")
            .delete()
            .eq("id", createdPrescriptionId);

          return NextResponse.json(
            { error: itemsError.message },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      prescription,
    });
  } catch (e: any) {
    if (createdPrescriptionId) {
      await supabase
        .from("health_prescriptions")
        .delete()
        .eq("id", createdPrescriptionId);
    }

    return NextResponse.json(
      { error: e?.message || "Prescription could not be created." },
      { status: 500 }
    );
  }
}