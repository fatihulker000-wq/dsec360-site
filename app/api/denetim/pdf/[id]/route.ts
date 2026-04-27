import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(_: Request, { params }: any) {
  const supabase = getSupabase();
  const id = Number(params.id);

  const { data: run } = await supabase
    .from("denetim_runs")
    .select("*")
    .eq("app_run_id", id)
    .maybeSingle();

  if (!run) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdfUrl = run.pdf_url;

  if (!pdfUrl) {
    return NextResponse.json({ error: "PDF yok" }, { status: 404 });
  }

  return NextResponse.redirect(pdfUrl);
}