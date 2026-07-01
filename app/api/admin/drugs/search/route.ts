import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim();

    if (q.length < 2) {
      return NextResponse.json({
        success: true,
        items: [],
      });
    }

    const { data, error } = await supabase
      .from("drug_catalog")
      .select(`
        id,
        drug_name,
        active_ingredient,
        dosage_form,
        strength,
        atc_code
      `)
      .or(`drug_name.ilike.%${q}%,active_ingredient.ilike.%${q}%`)
      .order("drug_name")
      .limit(20);

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
      items: data || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e.message,
      },
      { status: 500 }
    );
  }
}