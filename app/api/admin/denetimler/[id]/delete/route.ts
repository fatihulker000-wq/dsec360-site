import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const remoteId = Number(id);

    if (!remoteId) {
      return NextResponse.json({ error: "Geçersiz denetim ID." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error: answersError } = await supabase
      .from("denetim_answers")
      .delete()
      .eq("run_remote_id", remoteId);

    if (answersError) {
      return NextResponse.json({ error: answersError.message }, { status: 500 });
    }

    const { error: runError } = await supabase
      .from("denetim_runs")
      .delete()
      .eq("id", remoteId);

    if (runError) {
      return NextResponse.json({ error: runError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Denetim silme hatası." },
      { status: 500 }
    );
  }
}