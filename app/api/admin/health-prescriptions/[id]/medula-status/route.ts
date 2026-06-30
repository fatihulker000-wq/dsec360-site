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

async function authorize() {
  const cookieStore = await cookies();

  const auth = cookieStore.get("dsec_admin_auth")?.value;
  const role = cookieStore.get("dsec_admin_role")?.value;
  const companyId = cookieStore.get("dsec_company_id")?.value;

  if (
    auth !== "ok" ||
    !["super_admin", "company_admin"].includes(String(role))
  ) {
    return null;
  }

  return {
    role: String(role),
    companyId: String(companyId || ""),
  };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorize();

  if (!auth) {
    return NextResponse.json(
      { error: "Yetkisiz erişim." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await req.json();

  const supabase = getSupabase();

  const updateData = {
    erecete_status: body.ereceteStatus ?? "ready",
    erecete_no: body.ereceteNo ?? null,
    medula_tracking_no: body.medulaTrackingNo ?? null,
    doctor_tc: body.doctorTc ?? null,
    doctor_diploma_no: body.doctorDiplomaNo ?? null,
    medula_note: body.medulaNote ?? null,
    updated_at: new Date().toISOString(),
  };

  let query = supabase
    .from("health_prescriptions")
    .update(updateData)
    .eq("id", id);

  if (auth.role === "company_admin") {
    query = query.eq("company_id", auth.companyId);
  }

  const { data, error } = await query
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
    prescription: data,
  });
}