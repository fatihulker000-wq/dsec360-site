import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveReportScope } from "../../reports/_auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DraftAction = {
  id: string;
  company_id: string;
  source_gap_id: string;
  source_domain: string;
  title: string;
  description: string;
  recommendation: string;
  source_url?: string | null;
  severity: string;
  status: "WAITING_APPROVAL" | "APPROVED" | "STARTED" | "SKIPPED";
  created_at?: string;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function ensureTable(supabase:any) {
  // Intentionally no automatic DDL here. The route fails safely if migration is not applied.
  const { error } = await supabase.from("dora_action_queue").select("id").limit(1);
  if (error) throw new Error("DORA Faz 2 tablosu hazır değil. Önce dora_action_queue migration'ını uygulayın.");
}

export async function GET(req: NextRequest) {
  try {
    const supabase = adminClient();
    const companyId = req.nextUrl.searchParams.get("companyId") || "";
    const resolved = await resolveReportScope(supabase, companyId || null);
    if (!resolved.ok) return NextResponse.json({ ok:false, error:resolved.error }, { status:resolved.status || 403 });
    const scope = resolved.scope;
    if (!scope.selectedCompanyId || scope.selectedCompanyId === "ALL") {
      return NextResponse.json({ ok:false, error:"DORA Faz 2 işlemleri için tek bir firma seçilmelidir." }, { status:400 });
    }

    await ensureTable(supabase);
    const { data, error } = await supabase
      .from("dora_action_queue")
      .select("*")
      .eq("company_id", scope.selectedCompanyId)
      .order("created_at", { ascending:false });
    if (error) throw error;
    return NextResponse.json({ ok:true, items:data || [] });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message || "DORA işlem kuyruğu okunamadı." }, { status:500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = adminClient();
    const resolved = await resolveReportScope(supabase, body?.companyId || null);
    if (!resolved.ok) return NextResponse.json({ ok:false, error:resolved.error }, { status:resolved.status || 403 });
    const scope = resolved.scope;
    if (!scope.selectedCompanyId || scope.selectedCompanyId === "ALL") {
      return NextResponse.json({ ok:false, error:"DORA Faz 2 işlemleri için tek bir firma seçilmelidir." }, { status:400 });
    }

    await ensureTable(supabase);

    const command = String(body?.command || "").toUpperCase();

    // Phase 2 safety invariant:
    // PREPARE only creates DORA's own approval queue.
    // APPROVE only marks an item approved.
    // START only starts DORA's own queue item.
    // NO target module is mutated by this starter.
    if (command === "PREPARE") {
      const gaps = Array.isArray(body?.gaps) ? body.gaps : [];
      if (!gaps.length) return NextResponse.json({ ok:false, error:"İşleme hazırlanacak eksiklik bulunamadı." }, { status:400 });

      const rows = gaps.slice(0,100).map((g:any)=>({
        company_id: scope.selectedCompanyId,
        source_gap_id: String(g.id || crypto.randomUUID()),
        source_domain: String(g.domain || "DORA"),
        title: String(g.title || "DORA bulgusu"),
        description: String(g.summary || ""),
        recommendation: String(g.recommendation || ""),
        source_url: g.sourceUrl || null,
        severity: String(g.severity || "MEDIUM"),
        status: "WAITING_APPROVAL",
        requested_payload: g,
      }));

      const { data, error } = await supabase
        .from("dora_action_queue")
        .upsert(rows, { onConflict:"company_id,source_gap_id", ignoreDuplicates:false })
        .select("*");
      if (error) throw error;
      return NextResponse.json({ ok:true, command, items:data || [] });
    }

    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ ok:false, error:"İşlem kimliği eksik." }, { status:400 });

    const { data: current, error: readError } = await supabase
      .from("dora_action_queue")
      .select("*")
      .eq("id", id)
      .eq("company_id", scope.selectedCompanyId)
      .maybeSingle();
    if (readError) throw readError;
    if (!current) return NextResponse.json({ ok:false, error:"DORA işlemi bulunamadı." }, { status:404 });

    if (command === "APPROVE") {
      if (current.status !== "WAITING_APPROVAL")
        return NextResponse.json({ ok:false, error:"Yalnızca onay bekleyen işlem onaylanabilir." }, { status:409 });
      const { data, error } = await supabase.from("dora_action_queue")
        .update({ status:"APPROVED", approved_at:new Date().toISOString() })
        .eq("id",id).eq("company_id",scope.selectedCompanyId).select("*").single();
      if (error) throw error;
      return NextResponse.json({ ok:true, command, item:data });
    }

    if (command === "START") {
      if (current.status !== "APPROVED")
        return NextResponse.json({ ok:false, error:"Kullanıcı onayı olmadan DORA işlemi başlatamaz." }, { status:409 });

      // Starter version: START records explicit user intent only.
      // Module-specific executors will be attached one-by-one after validation.
      const { data, error } = await supabase.from("dora_action_queue")
        .update({
          status:"STARTED",
          started_at:new Date().toISOString(),
          execution_note:"Kullanıcı Başla komutunu verdi. Hedef modül yürütücüsü henüz bağlı değil; hiçbir modül kaydı değiştirilmedi."
        })
        .eq("id",id).eq("company_id",scope.selectedCompanyId).select("*").single();
      if (error) throw error;
      return NextResponse.json({ ok:true, command, item:data, moduleWritePerformed:false });
    }

    if (command === "SKIP") {
      const { data, error } = await supabase.from("dora_action_queue")
        .update({ status:"SKIPPED", skipped_at:new Date().toISOString() })
        .eq("id",id).eq("company_id",scope.selectedCompanyId).select("*").single();
      if (error) throw error;
      return NextResponse.json({ ok:true, command, item:data });
    }

    return NextResponse.json({ ok:false, error:"Geçersiz DORA komutu." }, { status:400 });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message || "DORA Faz 2 işlemi başarısız." }, { status:500 });
  }
}
