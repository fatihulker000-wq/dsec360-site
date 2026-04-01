import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = getSupabase();

  const { data } = await supabase
    .from("training_assignments")
    .select(`
      status,
      users: user_id (full_name, email),
      trainings: training_id (title)
    `);

  const mapped = (data || []).map((x: any) => ({
    user: x.users?.full_name || x.users?.email,
    training: x.trainings?.title,
    status: x.status,
  }));

  return NextResponse.json({ data: mapped });
}