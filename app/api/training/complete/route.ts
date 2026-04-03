import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();

  const { training_id } = body;

  const user_id = "demo-user";

  await supabase
    .from("training_assignments")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("training_id", training_id)
    .eq("user_id", user_id);

  return NextResponse.json({ success: true });
}