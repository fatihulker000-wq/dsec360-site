import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = await cookies();

    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;

    if (!adminAuth) {
      return NextResponse.json(
        {
          success: false,
          error: "Yetkisiz erişim",
        },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("accident_records")
      .select("id,title,employee_name,event_type,location,severity,event_date,created_at")
      .order("event_date", { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rows: data || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "Sunucu hatası",
      },
      { status: 500 }
    );
  }
}