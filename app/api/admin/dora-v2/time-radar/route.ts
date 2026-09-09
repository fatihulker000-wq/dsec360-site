import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { resolveReportScope } from "../../reports/_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;
type RadarItem = {
  id: string;
  module: string;
  label: string;
  days: number;
  date?: string;
  sourceUrl: string;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase ortam değişkenleri eksik.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function text(v: unknown) { return String(v ?? "").trim(); }

function safeDateMillis(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    if (v > 1e12) return v;
    if (v > 1e9) return v * 1000;
  }
  const n = Number(v);
  if (Number.isFinite(n) && String(v).trim() !== "") {
    if (n > 1e12) return n;
    if (n > 1e9) return n * 1000;
  }
  const d = new Date(String(v));
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : null;
}

function daysUntil(v: unknown): number | null {
  const ms = safeDateMillis(v);
  if (ms === null) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  const target = new Date(ms);
  target.setHours(0,0,0,0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function firstText(row: AnyRow, keys: string[]) {
  for (const k of keys) {
    const v = text(row?.[k]);
    if (v) return v;
  }
  return "";
}

async function safeRows(label:string, promise:any) {
  try {
    const { data, error } = await promise;
    if (error) return { rows: [] as AnyRow[], warning: `${label}: ${error.message}` };
    return { rows: (data || []) as AnyRow[], warning: "" };
  } catch (e:any) {
    return { rows: [] as AnyRow[], warning: `${label}: ${e?.message || "okunamadı"}` };
  }
}

function normalize(v:unknown){
  return text(v).toLocaleUpperCase("tr-TR")
    .replaceAll("İ","I").replaceAll("Ş","S").replaceAll("Ğ","G")
    .replaceAll("Ü","U").replaceAll("Ö","O").replaceAll("Ç","C");
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const requested = text(req.nextUrl.searchParams.get("companyId"));
    const resolved = await resolveReportScope(supabase, requested || null);
    if (!resolved.ok) {
      return NextResponse.json({ ok:false, error:resolved.error }, { status:resolved.status });
    }

    const companyId = resolved.scope.selectedCompanyId;
    if (!companyId || companyId === "ALL") {
      return NextResponse.json({ ok:false, error:"DORA Zaman Radarı için tek firma seçilmelidir." }, { status:400 });
    }

    const { data: company, error: companyError } = await supabase
      .from("companies").select("id,name,local_firm_id").eq("id",companyId).maybeSingle();
    if (companyError || !company) {
      return NextResponse.json({ ok:false, error:companyError?.message || "Firma bulunamadı." }, { status:404 });
    }
    const localFirmId = text(company.local_firm_id);

    const employeesResult = await safeRows("Çalışanlar",
      supabase.from("employees").select("id,firm_id,active").eq("firm_id",companyId).limit(10000)
    );
    const employeeIds = employeesResult.rows.filter(x=>x.active!==false).map(x=>text(x.id)).filter(Boolean);

    const trainingUsersResult = employeeIds.length
      ? await safeRows("Eğitim kullanıcıları",
          supabase.from("users").select("id,employee_id").eq("role","training_user").in("employee_id",employeeIds))
      : { rows:[] as AnyRow[], warning:"" };
    const trainingUserIds = trainingUsersResult.rows.map(x=>text(x.id)).filter(Boolean);

    const [health, periodic, measurement, matrixRisk, fineRisk, assignments, auditRunsAll] = await Promise.all([
      safeRows("Sağlık", supabase.from("health_examinations").select("*").eq("company_id",companyId).or("is_deleted.is.null,is_deleted.eq.false")),
      safeRows("Periyodik Kontrol", supabase.from("periodic_control_equipments").select("*").eq("firm_id",companyId).eq("deleted",false)),
      safeRows("Ortam Ölçümü", supabase.from("environment_measurements").select("*").eq("firm_id",companyId).eq("deleted",false)),
      safeRows("5x5 Risk", supabase.from("risk_items").select("*").eq("company_id",companyId).or("is_deleted.is.null,is_deleted.eq.false")),
      safeRows("Fine Kinney", supabase.from("fine_kinney_risks").select("*").eq("company_id",companyId).or("is_deleted.is.null,is_deleted.eq.false")),
      trainingUserIds.length
        ? safeRows("Eğitim", supabase.from("training_assignments").select("*").in("user_id",trainingUserIds))
        : Promise.resolve({ rows:[] as AnyRow[], warning:"" }),
      safeRows("Denetim", supabase.from("denetim_runs").select("*").order("created_at_millis",{ascending:false}).limit(5000)),
    ]);

    const auditRuns = auditRunsAll.rows.filter(run=>{
      const fid=text(run.firm_id);
      const fname=normalize(run.firm_name);
      return fid===companyId || (!!localFirmId && fid===localFirmId) || (!!fname && fname===normalize(company.name));
    });
    const runIds=auditRuns.map(x=>x.id).filter(x=>x!==null&&x!==undefined);
    const auditAnswers = runIds.length
      ? await safeRows("DÖF", supabase.from("denetim_answers").select("*").in("run_remote_id",runIds))
      : { rows:[] as AnyRow[], warning:"" };

    const items: RadarItem[] = [];
    const push = (rows:AnyRow[], module:string, sourceUrl:string, dateKeys:string[], labelKeys:string[]) => {
      rows.forEach((row,index)=>{
        const raw=dateKeys.map(k=>row?.[k]).find(v=>v!==null&&v!==undefined&&v!=="");
        const days=daysUntil(raw);
        if(days===null || days < -365 || days > 90) return;
        const ms=safeDateMillis(raw);
        items.push({
          id:`${module}:${text(row.id)||index}:${days}`,
          module,
          label:firstText(row,labelKeys)||`${module} kaydı`,
          days,
          date:ms?new Date(ms).toISOString():undefined,
          sourceUrl,
        });
      });
    };

    push(health.rows,"Sağlık","/admin/health",
      ["next_exam_date","next_examination_date","next_due_date","expiry_date"],
      ["employee_name","full_name","exam_type"]);
    push(periodic.rows,"Periyodik Kontrol","/admin/documentation/periodic-controls",
      ["next_due_millis","next_due_date"],
      ["equipment_name","equipmentName","equipment_type","equipmentType"]);
    push(measurement.rows,"Ortam Ölçümü","/admin/documentation/periodic-controls",
      ["next_due_millis","next_due_date"],
      ["measurement_type","measurementType","area_name","areaName"]);
    push(matrixRisk.rows,"Risk / Aksiyon","/admin/risk",
      ["due_date","target_date","deadline","action_due_date","termin_date","due_at","target_date_millis"],
      ["title","hazard","risk_title","activity","action"]);
    push(fineRisk.rows,"Fine Kinney / Aksiyon","/admin/risk",
      ["due_date","target_date","deadline","action_due_date","termin_date","due_at","target_date_millis"],
      ["title","hazard","risk_title","activity","action"]);
    push(auditRuns,"Denetim & DÖF","/admin/audits",
      ["due_date","deadline","target_date","dof_due_date","termin_date","planned_end_date","end_date_millis"],
      ["title","audit_name","form_name","location","firm_name"]);
    push(auditAnswers.rows,"DÖF","/admin/audits",
      ["dof_due_date","due_date","deadline","target_date","termin_date","dof_deadline"],
      ["question_text","item_text","finding","note","dof_action"]);
    push(assignments.rows,"Eğitim","/admin/trainings",
      ["due_date","deadline","expires_at","expiry_date","end_date","ends_at","valid_until"],
      ["training_title","title","training_name","status"]);

    items.sort((a,b)=>a.days-b.days);

    const warnings=[
      employeesResult.warning, trainingUsersResult.warning, health.warning, periodic.warning,
      measurement.warning, matrixRisk.warning, fineRisk.warning, assignments.warning,
      auditRunsAll.warning, auditAnswers.warning
    ].filter(Boolean);

    return NextResponse.json({
      ok:true,
      horizon:{
        overdue:items.filter(x=>x.days<0).length,
        due7:items.filter(x=>x.days>=0&&x.days<=7).length,
        due15:items.filter(x=>x.days>=0&&x.days<=15).length,
        due30:items.filter(x=>x.days>=0&&x.days<=30).length,
        due60:items.filter(x=>x.days>=0&&x.days<=60).length,
        due90:items.filter(x=>x.days>=0&&x.days<=90).length,
        items:items.slice(0,60),
      },
      modules:[...new Set(items.map(x=>x.module))],
      warnings,
    });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message || "DORA Zaman Radarı oluşturulamadı." }, { status:500 });
  }
}
