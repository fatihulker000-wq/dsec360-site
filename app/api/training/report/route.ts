import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("training_exam_results")
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message });
  }

  return NextResponse.json({ data });
}