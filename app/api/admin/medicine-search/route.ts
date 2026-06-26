import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("q")?.trim() || "";

    if (search.length < 2) {
      return NextResponse.json({
        success: true,
        medicines: [],
      });
    }

    const { data, error } = await supabase
      .from("medicine_catalog")
      .select(`
        id,
        medicine_name,
        active_ingredient,
        strength,
        form,
        manufacturer
      `)
      .eq("is_active", true)
      .ilike("medicine_name", `%${search}%`)
      .order("medicine_name")
      .limit(15);

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
      medicines: data ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Bilinmeyen hata",
      },
      { status: 500 }
    );
  }
}