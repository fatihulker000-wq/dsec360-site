import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Mode = "CLASSIC" | "PHOTO" | "SCORING" | "ELMERI";

function clean(v: unknown) { return String(v ?? "").trim(); }
function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase ortam değişkenleri eksik.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
function normalizeMode(v: unknown): Mode {
  const m = clean(v).toUpperCase();
  return m === "PHOTO" || m === "SCORING" || m === "ELMERI" ? m : "CLASSIC";
}
function calculateDofStatus(result: string) {
  const r = clean(result).toUpperCase();
  if (r === "UYGUN" || r === "KAPSAMDISI" || r === "KAPSAM_DIŞI") return "NONE";
  if (r === "KISMEN" || r === "UYGUNSUZ") return "OPEN";
  if (r.startsWith("SCORE:")) {
    const n = Number(r.slice(6));
    return Number.isFinite(n) && n < 100 ? "OPEN" : "NONE";
  }
  if (r.startsWith("ELMERI:")) {
    const wrong = Number(r.split(":")[2] || 0);
    return wrong > 0 ? "OPEN" : "NONE";
  }
  return "NONE";
}
async function sessionScope(supabase: ReturnType<typeof db>, requestedFirmId: string) {
  const c = await cookies();
  const userId = clean(c.get("dsec_user_id")?.value);
  const cookieCompanyId = clean(c.get("dsec_company_id")?.value);
  const role = clean(c.get("dsec_user_role")?.value || c.get("dsec_admin_role")?.value).toLowerCase();
  if (!userId) return { ok: false as const, status: 401, error: "Oturum bulunamadı." };
  if (!requestedFirmId) return { ok: false as const, status: 400, error: "Firma seçilmelidir." };

  const [{ data: accessRows, error: accessError }, { data: userRow, error: userError }] = await Promise.all([
    supabase.from("user_firm_access").select("firm_id").eq("user_id", userId),
    supabase.from("users").select("company_id").eq("id", userId).maybeSingle(),
  ]);
  if (accessError) throw new Error(accessError.message);
  if (userError) throw new Error(userError.message);

  const allowed = new Set([
    ...(accessRows || []).map((x: any) => clean(x.firm_id)),
    clean(userRow?.company_id), cookieCompanyId,
  ].filter(Boolean));

  // super_admin erişimi firma portföyü ile sınırlandırılmamış olabilir.
  if (role !== "super_admin" && !allowed.has(requestedFirmId)) {
    return { ok: false as const, status: 403, error: "Bu firmaya erişim yetkiniz yok." };
  }

  const { data: company, error: companyError } = await supabase
    .from("companies").select("id,name,local_firm_id").eq("id", requestedFirmId).maybeSingle();
  if (companyError) throw new Error(companyError.message);
  if (!company) return { ok: false as const, status: 404, error: "Firma bulunamadı." };

  return { ok: true as const, userId, role, company };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const firmId = clean(url.searchParams.get("firmId"));
    const mode = normalizeMode(url.searchParams.get("mode"));
    const supabase = db();
    const scope = await sessionScope(supabase, firmId);
    if (!scope.ok) return NextResponse.json({ success: false, error: scope.error }, { status: scope.status });

    const { data, error } = await supabase
      .from("inspection_forms")
      .select(`id,firm_id,visibility,title,code,category,audit_modes,status,updated_at,
        items:inspection_form_items(id,order_no,title,question,expected_condition,required_action,legal_reference,risk_level,photo_required,explanation_required,action_required,score,weight,answer_options)`)
      .eq("deleted", false)
      .eq("status", "PUBLISHED")
      .or(`firm_id.eq.${firmId},visibility.eq.GLOBAL`)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);

    const forms = (data || [])
      .filter((form: any) => {
        const modes = Array.isArray(form.audit_modes)
          ? form.audit_modes.map((x: unknown) => clean(x).toUpperCase()).filter(Boolean)
          : [];
        return modes.length === 0 || modes.includes(mode);
      })
      .map((form: any) => ({
        ...form,
        items: (Array.isArray(form.items) ? form.items : []).sort(
          (a: any, b: any) => Number(a.order_no || 0) - Number(b.order_no || 0)
        ),
      }));

    return NextResponse.json({ success: true, firmId, mode, count: forms.length, readOnly: false, forms });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Denetim formları alınamadı.", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let insertedRunId: number | null = null;
  try {
    const body = await req.json();
    const firmId = clean(body.firmId);
    const formId = clean(body.formId);
    const mode = normalizeMode(body.mode);
    if (!firmId || !formId) return NextResponse.json({ success: false, error: "Firma ve denetim formu zorunludur." }, { status: 400 });

    const supabase = db();
    const scope = await sessionScope(supabase, firmId);
    if (!scope.ok) return NextResponse.json({ success: false, error: scope.error }, { status: scope.status });

    const { data: form, error: formError } = await supabase
      .from("inspection_forms")
      .select(`id,firm_id,visibility,title,code,category,audit_modes,status,
        items:inspection_form_items(id,order_no,title,question,legal_reference,required_action)`)
      .eq("id", formId).eq("deleted", false).eq("status", "PUBLISHED").maybeSingle();
    if (formError) throw new Error(formError.message);
    if (!form) return NextResponse.json({ success: false, error: "Yayınlanmış denetim formu bulunamadı." }, { status: 404 });
    if (clean(form.visibility).toUpperCase() !== "GLOBAL" && clean(form.firm_id) !== firmId) {
      return NextResponse.json({ success: false, error: "Seçilen form bu firmaya ait değil." }, { status: 403 });
    }
    const allowedModes = Array.isArray(form.audit_modes) ? form.audit_modes.map((x: unknown) => clean(x).toUpperCase()) : [];
    if (allowedModes.length && !allowedModes.includes(mode)) {
      return NextResponse.json({ success: false, error: "Seçilen form bu denetim tipini desteklemiyor." }, { status: 400 });
    }

    const localFirmId = Number((scope.company as any).local_firm_id || 0);
    if (!Number.isFinite(localFirmId) || localFirmId <= 0) {
      return NextResponse.json({ success: false, error: "Firmanın App yerel firma eşlemesi (local_firm_id) eksik." }, { status: 409 });
    }

    const auditDateText = clean(body.auditDate);
    const auditDate = auditDateText ? new Date(`${auditDateText}T12:00:00`) : new Date();
    if (Number.isNaN(auditDate.getTime())) return NextResponse.json({ success: false, error: "Denetim tarihi geçersiz." }, { status: 400 });

    const now = Date.now();
    const appRunId = now;
    const reportNo = `WEB-${new Date(now).toISOString().slice(0,10).replace(/-/g, "")}-${String(now).slice(-6)}`;
    const { data: run, error: runError } = await supabase.from("denetim_runs").insert({
      app_run_id: appRunId,
      firm_id: localFirmId,
      web_firm_id: firmId,
      firm_name: clean((scope.company as any).name),
      template_type: clean(form.title),
      eval_mode: mode,
      location: clean(body.location),
      responsible: clean(body.responsible),
      inspector_name: clean(body.inspectorName),
      audit_date_millis: auditDate.getTime(),
      report_no: reportNo,
      general_note: clean(form.code) ? `Form: ${clean(form.code)}` : "",
      status: "TAMAMLANDI",
      created_at_millis: now,
      source: "WEB",
    }).select("id").single();
    if (runError || !run) throw new Error(runError?.message || "Denetim kaydı oluşturulamadı.");
    insertedRunId = Number(run.id);

    const incoming = new Map<string, any>((Array.isArray(body.answers) ? body.answers : []).map((a: any) => [clean(a.itemId), a]));
    const rows = (Array.isArray(form.items) ? form.items : []).map((item: any) => {
      const a = incoming.get(clean(item.id)) || {};
      let result = clean(a.result);
      if (mode === "SCORING") {
        const rawScore = Number(a.score);
        const allowedScores = [0, 25, 50, 75, 100];
        const score = allowedScores.includes(rawScore) ? rawScore : 0;
        result = `SCORE:${score}`;
      } else if (mode === "ELMERI") {
        const correct = Math.max(0, Number(a.correct || 0));
        const wrong = Math.max(0, Number(a.wrong || 0));
        const out = Math.max(0, Number(a.outOfScope || 0));
        result = `ELMERI:${correct}:${wrong}:${out}`;
      }
      return {
        run_remote_id: run.id,
        app_run_id: appRunId,
        item_title: clean(item.title) || clean(item.question) || "Denetim Maddesi",
        legal_ref: clean(item.legal_reference),
        result,
        note: clean(a.note),
        photo_path: clean(a.photoPath) || null,
        photo_url: clean(a.photoUrl) || null,
        recommended_action: clean(a.recommendedAction) || clean(item.required_action),
        dof_status: calculateDofStatus(result),
        dof_closed_at: null,
        dof_note: "",
      };
    });

    if (rows.length) {
      const { error: answerError } = await supabase.from("denetim_answers").insert(rows);
      if (answerError) throw new Error(answerError.message);
    }

    return NextResponse.json({ success: true, firmId, remoteRunId: run.id, appRunId, reportNo, answerCount: rows.length });
  } catch (e) {
    if (insertedRunId) {
      try {
        const supabase = db();
        await supabase.from("denetim_answers").delete().eq("run_remote_id", insertedRunId);
        await supabase.from("denetim_runs").delete().eq("id", insertedRunId);
      } catch {}
    }
    return NextResponse.json({ success: false, error: "Denetim kaydedilemedi.", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
