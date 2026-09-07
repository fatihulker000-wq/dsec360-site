import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { calculateHsePerformance } from "@/app/admin/dashboard/lib/hse-performance-engine";
import { buildPriorityActions } from "@/app/admin/dashboard/lib/priority-action-engine";
import type { ScoreInput } from "@/app/admin/dashboard/lib/executive-dashboard-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const clean = (v: unknown) => String(v ?? "").trim();
const lower = (v: unknown) => clean(v).toLowerCase();
const validUuid = (v: unknown) => {
  const x = clean(v);
  return UUID_RE.test(x) ? x : "";
};

function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase yapılandırması eksik.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function session() {
  const c = await cookies();
  const auth = clean(c.get("dsec_admin_auth")?.value || c.get("dsec_user_auth")?.value);
  const role = clean(c.get("dsec_admin_role")?.value || c.get("dsec_user_role")?.value);
  const firmId = validUuid(c.get("dsec_company_id")?.value);
  if (auth !== "ok") return null;
  if (!["super_admin", "company_admin", "demo_user"].includes(role)) return null;
  if (!firmId) return null;
  return { role, firmId };
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const isClosed = (v: unknown) =>
  ["closed","resolved","rejected","duplicate","cancelled","tamamlandi","tamamlandı","closed_ok"]
    .includes(lower(v));

const isCompletedTraining = (r: any) => {
  const s = lower(r?.status);
  return s === "completed" || s === "tamamlandi" || s === "tamamlandı" ||
    r?.final_exam_passed === true || r?.watch_completed === true && s === "completed";
};

async function safe<T>(promise: PromiseLike<{ data: T | null; error: any }>): Promise<T | null> {
  try {
    const r = await promise;
    if (r.error) {
      console.error("Executive dashboard source error:", r.error);
      return null;
    }
    return r.data;
  } catch (e) {
    console.error("Executive dashboard source exception:", e);
    return null;
  }
}

export async function GET() {
  try {
    const s = await session();
    if (!s) {
      return NextResponse.json(
        { success:false, error:"Aktif firma oturumu bulunamadı veya yetkisiz erişim." },
        { status:401, headers:{ "Cache-Control":"no-store" } }
      );
    }

    const supabase = db();
    const firmId = s.firmId;
    const now = Date.now();

    // Önce aktif firmaya ait çalışan/kullanıcı kimlikleri alınır.
    const [employees, users] = await Promise.all([
      safe<any[]>(supabase.from("employees").select("id").eq("firm_id", firmId)),
      safe<any[]>(supabase.from("users").select("id").eq("company_id", firmId)),
    ]);

    const employeeIds = (employees || []).map(x => clean(x.id)).filter(Boolean);
    const userIds = (users || []).map(x => clean(x.id)).filter(Boolean);

    const [
      matrixRisks,
      kinneyRisks,
      inspectionRuns,
      trainingAssignments,
      healthExams,
      accidents,
      periodic,
      environment,
      cbs,
    ] = await Promise.all([
      safe<any[]>(supabase.from("risk_items")
        .select("id,score,is_deleted,company_id")
        .eq("company_id", firmId)
        .eq("is_deleted", false)),
      safe<any[]>(supabase.from("fine_kinney_risks")
        .select("id,score,is_deleted,company_id")
        .eq("company_id", firmId)
        .eq("is_deleted", false)),
      safe<any[]>(supabase.from("denetim_runs")
        .select("id,firm_id,status")
        .eq("firm_id", firmId)),
      userIds.length
        ? safe<any[]>(supabase.from("training_assignments")
            .select("id,user_id,status,watch_completed,final_exam_passed")
            .in("user_id", userIds))
        : Promise.resolve([]),
      employeeIds.length
        ? safe<any[]>(supabase.from("health_examinations")
            .select("id,employee_id,next_exam_date,is_deleted")
            .eq("company_id", firmId)
            .eq("is_deleted", false))
        : Promise.resolve([]),
      safe<any[]>(supabase.from("accident_records")
        .select("id,firm_id,event_type,severity,lost_work_days,is_active,is_deleted")
        .eq("firm_id", firmId)
        .or("is_deleted.is.null,is_deleted.eq.false,is_deleted.eq.0")),
      safe<any[]>(supabase.from("periodic_control_equipments")
        .select("id,firm_id,next_due_millis,status,deleted")
        .eq("firm_id", firmId)
        .eq("deleted", false)),
      safe<any[]>(supabase.from("environment_measurements")
        .select("id,firm_id,next_due_millis,status,deleted")
        .eq("firm_id", firmId)
        .eq("deleted", false)),
      safe<any[]>(supabase.from("cbs_forms")
        .select("id,firm_id,status,priority,sla_due_at")
        .eq("firm_id", firmId)),
    ]);

    // Denetim cevapları yalnız bu firmaya ait run ID'leri üzerinden alınır.
    const runIds = (inspectionRuns || []).map(x => clean(x.id)).filter(Boolean);
    const inspectionAnswers = runIds.length
      ? await safe<any[]>(supabase.from("denetim_answers")
          .select("id,run_id,result,dof_status,dof_due_date")
          .in("run_id", runIds))
      : [];

    const matrixLevels = { critical:0, high:0 };
    for (const r of matrixRisks || []) {
      const score = num(r.score);
      if (score >= 20) matrixLevels.critical++;
      else if (score >= 15) matrixLevels.high++;
    }
    for (const r of kinneyRisks || []) {
      const score = num(r.score);
      if (score > 400) matrixLevels.critical++;
      else if (score >= 200) matrixLevels.high++;
    }
    const riskTotal = (matrixRisks?.length || 0) + (kinneyRisks?.length || 0);

    const answers = inspectionAnswers || [];
    const suitable = answers.filter(x =>
      ["uygun","suitable","compliant","yes","evet"].includes(lower(x.result))
    ).length;
    const partial = answers.filter(x =>
      ["kismen","kısmen","partial","partially"].includes(lower(x.result))
    ).length;

    const dofRows = answers.filter(x => clean(x.dof_status));
    const dofClosed = dofRows.filter(x => isClosed(x.dof_status)).length;
    const dofOverdue = dofRows.filter(x => {
      if (isClosed(x.dof_status) || !x.dof_due_date) return false;
      const t = new Date(x.dof_due_date).getTime();
      return Number.isFinite(t) && t < now;
    }).length;

    const trainingRows = trainingAssignments || [];
    const completedTraining = trainingRows.filter(isCompletedTraining).length;

    // Sağlık: yalnız en güncel muayene / çalışan bazında uygunluk sayılır.
    // Hassas sağlık alanları bu endpoint'e hiç seçilmez.
    const latestExam = new Map<string, any>();
    for (const x of healthExams || []) {
      const id = clean(x.employee_id);
      if (!id) continue;
      const old = latestExam.get(id);
      const nt = x.next_exam_date ? new Date(x.next_exam_date).getTime() : 0;
      const ot = old?.next_exam_date ? new Date(old.next_exam_date).getTime() : 0;
      if (!old || nt > ot) latestExam.set(id, x);
    }
    let healthValid = 0, healthOverdue = 0;
    for (const x of latestExam.values()) {
      const due = x.next_exam_date ? new Date(x.next_exam_date).getTime() : NaN;
      if (!Number.isFinite(due)) continue;
      if (due < now) healthOverdue++;
      else healthValid++;
    }

    const accidentRows = accidents || [];
    const lostTime = accidentRows.filter(x => num(x.lost_work_days) > 0).length;
    // Mevcut accident_records şemasında güvenilir "investigation_status" yoksa
    // sahte açık araştırma sayısı üretilmez.
    const openInvestigations = 0;

    const summarizeDue = (rows: any[] | null) => {
      const all = rows || [];
      let valid = 0, overdue = 0;
      for (const x of all) {
        const due = num(x.next_due_millis);
        if (due > 0) {
          if (due < now) overdue++; else valid++;
          continue;
        }
        const st = lower(x.status);
        if (["valid","uygun","ok","gecerli","geçerli"].includes(st)) valid++;
        else if (["overdue","expired","gecikmis","gecikmiş","suresi_gecmis","süresi geçmiş"].includes(st)) overdue++;
      }
      return { total:all.length, valid, overdue };
    };

    const periodicSummary = summarizeDue(periodic);
    const environmentSummary = summarizeDue(environment);

    const cbsRows = cbs || [];
    const cbsOpen = cbsRows.filter(x => !isClosed(x.status)).length;
    const cbsCritical = cbsRows.filter(x => !isClosed(x.status) && lower(x.priority) === "critical").length;
    const cbsSla = cbsRows.filter(x => {
      if (isClosed(x.status) || !x.sla_due_at) return false;
      const t = new Date(x.sla_due_at).getTime();
      return Number.isFinite(t) && t < now;
    }).length;

    const scoreInput: ScoreInput = {
      risk: riskTotal > 0
        ? { total:riskTotal, critical:matrixLevels.critical, high:matrixLevels.high }
        : undefined,
      inspection: answers.length > 0
        ? { total:answers.length, compliant:suitable, partial }
        : undefined,
      training: trainingRows.length > 0
        ? { assigned:trainingRows.length, completed:completedTraining }
        : undefined,
      dof: dofRows.length > 0
        ? { total:dofRows.length, closed:dofClosed, overdue:dofOverdue }
        : undefined,
      incident: accidentRows.length > 0
        ? { total:accidentRows.length, lostTime, openInvestigations }
        : undefined,
      health: employeeIds.length > 0 && latestExam.size > 0
        ? { totalEmployees:employeeIds.length, valid:healthValid, overdue:healthOverdue }
        : undefined,
      periodic: periodicSummary.total > 0 ? periodicSummary : undefined,
      environment: environmentSummary.total > 0 ? environmentSummary : undefined,
      cbs: cbsRows.length > 0
        ? { total:cbsRows.length, open:cbsOpen, critical:cbsCritical, slaExceeded:cbsSla }
        : undefined,
    };

    const performance = calculateHsePerformance(scoreInput);
    const priorityActions = buildPriorityActions(scoreInput);

    return NextResponse.json({
      success:true,
      firmId,
      generatedAt:new Date().toISOString(),
      performance,
      priorityActions,
      modules:{
        risk: scoreInput.risk ?? null,
        inspection: scoreInput.inspection ?? null,
        dof: scoreInput.dof ?? null,
        training: scoreInput.training ?? null,
        incident: scoreInput.incident ?? null,
        health: scoreInput.health ?? null,
        periodic: scoreInput.periodic ?? null,
        environment: scoreInput.environment ?? null,
        cbs: scoreInput.cbs ?? null,
      },
      integrity:{
        tenant:"ACTIVE_REMOTE_UUID",
        syntheticTrend:false,
        syntheticRiskMatrix:false,
        sensitiveHealthData:false,
        doraIncluded:false,
      },
    }, { headers:{ "Cache-Control":"no-store" } });
  } catch (e) {
    console.error("Executive dashboard error:", e);
    return NextResponse.json(
      { success:false, error:e instanceof Error ? e.message : "Executive Dashboard oluşturulamadı." },
      { status:500, headers:{ "Cache-Control":"no-store" } }
    );
  }
}
