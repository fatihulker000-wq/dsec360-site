import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const assignmentId = searchParams.get("assignmentId");
  const type = searchParams.get("type"); // pre / final

  if (!assignmentId || !type) {
    return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
  }

  // 🔥 önce training_id bul
  const { data: assignment } = await supabase
    .from("training_assignments")
    .select("training_id")
    .eq("id", assignmentId)
    .single();

  if (!assignment) {
    return NextResponse.json({ error: "Assignment yok" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("training_exam_questions")
    .select("*")
    .eq("training_id", assignment.training_id)
    .eq("exam_type", type)
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: "Sorular alınamadı" }, { status: 500 });
  }

  return NextResponse.json({ data });
}