import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const remoteId = Number(id);

    if (!remoteId) {
      return NextResponse.json({ error: "Geçersiz denetim ID." }, { status: 400 });
    }

    const body = await req.json();

    const supabase = getSupabase();

    const { error } = await supabase
      .from("denetim_runs")
      .update({
        firm_name: body.firm_name,
        template_type: body.template_type,
        eval_mode: body.eval_mode,
        location: body.location,
        responsible: body.responsible,
        inspector_name: body.inspector_name,
        report_no: body.report_no,
        general_note: body.general_note,
      })
      .eq("id", remoteId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Denetim güncelleme hatası." },
      { status: 500 }
    );
  }
}