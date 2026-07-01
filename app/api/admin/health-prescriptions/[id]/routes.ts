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
  !["super_admin", "company_admin", "demo_user"].includes(String(role))
) {
  return null;
}

  return {
    role: String(role),
    companyId: String(companyId || ""),
  };
}

/*-------------------------------------------------------
 GET
-------------------------------------------------------*/

export async function GET(
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

  const supabase = getSupabase();

  let query = supabase
  .from("health_prescriptions")
  .select(`
    *,
    health_prescription_items(*)
  `)
  .eq("id", id)
  .eq("is_active", true);

if (auth.role === "company_admin") {
  query = query.eq("company_id", auth.companyId);
}

const { data, error } = await query.single();


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

/*-------------------------------------------------------
 PUT
-------------------------------------------------------*/

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
    diagnosis_code: body.diagnosisCode ?? null,
    diagnosis_name: body.diagnosisName ?? null,
    notes: body.notes ?? null,
    status: body.status ?? "draft",
    updated_at: new Date().toISOString(),
  };

  let updateQuery = supabase
    .from("health_prescriptions")
    .update(updateData)
    .eq("id", id);

  if (auth.role === "company_admin") {
    updateQuery = updateQuery.eq("company_id", auth.companyId);
  }

  const { error } = await updateQuery;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  const { data: prescription } = await supabase
    .from("health_prescriptions")
    .select(`
      *,
      health_prescription_items(*)
    `)
    .eq("id", id)
    .single();

  return NextResponse.json({
    success: true,
    prescription,
  });
}

/*-------------------------------------------------------
 DELETE (Soft Delete)
-------------------------------------------------------*/

export async function DELETE(
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

  const supabase = getSupabase();

  let query = supabase
    .from("health_prescriptions")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (auth.role === "company_admin") {
    query = query.eq("company_id", auth.companyId);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}