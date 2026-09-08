import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { assertInspectionRunScope } from "@/lib/inspection/routeScope";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const remoteId = Number(id);
    if (!remoteId) return NextResponse.json({ error: "Geçersiz denetim ID." }, { status: 400 });

    const supabase = getSupabase();
    const scope = await assertInspectionRunScope(supabase, remoteId);
    if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const { error: answersError } = await supabase
      .from("denetim_answers")
      .delete()
      .eq("run_remote_id", remoteId);
    if (answersError) return NextResponse.json({ error: answersError.message }, { status: 500 });

    const { error: runError } = await supabase
      .from("denetim_runs")
      .delete()
      .eq("id", remoteId)
      .eq("firm_id", scope.run.firm_id);
    if (runError) return NextResponse.json({ error: runError.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Denetim silme hatası." }, { status: 500 });
  }
}
