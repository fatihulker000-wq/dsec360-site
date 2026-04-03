import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      assignmentId,
      watchSeconds,
      clickCount,
      completed
    } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: "assignmentId gerekli" }, { status: 400 });
    }

    const { error } = await supabase
      .from("training_assignments")
      .update({
        watch_seconds: watchSeconds,
        click_count: clickCount,
        watch_completed: completed,
      })
      .eq("id", assignmentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "sunucu hatası" },
      { status: 500 }
    );
  }
}