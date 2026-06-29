import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();

    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = cookieStore.get("dsec_admin_role")?.value;
    const companyId = String(
      cookieStore.get("dsec_company_id")?.value || ""
    ).trim();

    if (adminAuth !== "ok" && adminRole) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const supabase = getSupabase();

    let query = supabase
  .from("health_ek2_forms")
  .select("*")
  .eq("id", id);

if (adminRole === "company_admin") {
  query = query.eq("company_id", companyId);
}

const { data, error } = await query.single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      form: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "Kayıt bulunamadı.",
      },
      { status: 500 }
    );
  }
}