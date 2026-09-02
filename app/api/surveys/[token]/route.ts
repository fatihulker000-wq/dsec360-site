import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Context = { params: Promise<{ token: string }> };
type AnswerInput = { questionId?: unknown; optionIds?: unknown; textValue?: unknown; commentValue?: unknown; numberValue?: unknown; dateValue?: unknown };

function text(value: unknown) { return String(value ?? "").trim(); }
function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
function db() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Sunucu yapılandırması eksik.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
async function resolve(token: string) {
  if (!/^[a-f0-9]{64}$/i.test(token)) return { error: "Geçersiz anket bağlantısı." } as const;
  const supabase = db();
  const { data: dispatch, error } = await supabase.from("employee_survey_dispatches")
    .select("id,survey_id,firm_id,employee_id,target_snapshot,expires_at,opened_at,completed_at,revoked_at")
    .eq("token_hash", hash(token)).maybeSingle();
  if (error || !dispatch) return { error: "Anket bağlantısı bulunamadı." } as const;
  if (dispatch.revoked_at) return { error: "Bu anket bağlantısı iptal edilmiştir." } as const;
  if (new Date(dispatch.expires_at).getTime() < Date.now()) return { error: "Anket bağlantısının süresi dolmuştur." } as const;
  const { data: survey, error: surveyError } = await supabase.from("employee_surveys")
    .select("id,firm_id,title,description,category,status,is_anonymous,starts_at,ends_at,allow_multiple")
    .eq("id", dispatch.survey_id).is("deleted_at", null).maybeSingle();
  if (surveyError || !survey || survey.status !== "ACTIVE") return { error: "Anket şu anda yanıt kabul etmiyor." } as const;
  if (survey.starts_at && new Date(survey.starts_at).getTime() > Date.now()) return { error: "Anket henüz başlamadı." } as const;
  if (survey.ends_at && new Date(survey.ends_at).getTime() < Date.now()) return { error: "Anketin katılım süresi sona erdi." } as const;
  if (dispatch.completed_at && !survey.allow_multiple) return { error: "Bu anket daha önce tamamlanmıştır.", completed: true } as const;
  return { supabase, dispatch, survey } as const;
}

export async function GET(_: Request, context: Context) {
  try {
    const { token } = await context.params;
    const result = await resolve(token);
    if ("error" in result) return NextResponse.json({ success: false, error: result.error, completed: "completed" in result ? result.completed : false }, { status: result.completed ? 409 : 404 });
    const { supabase, dispatch, survey } = result;
    const { data: questions, error } = await supabase.from("employee_survey_questions")
      .select("id,position,question_text,question_type,is_required,weight,help_text,employee_survey_options(id,label,value,position)")
      .eq("survey_id", survey.id).order("position", { ascending: true });
    if (error) throw error;
    if (!dispatch.opened_at) await supabase.from("employee_survey_dispatches").update({ opened_at: new Date().toISOString() }).eq("id", dispatch.id);
    return NextResponse.json({
      success: true,
      survey: { id: survey.id, title: survey.title, description: survey.description, category: survey.category, anonymous: survey.is_anonymous, endsAt: survey.ends_at },
      participant: { displayName: survey.is_anonymous ? null : dispatch.target_snapshot?.fullName || null },
      questions: (questions || []).map((q: any) => ({
        id: q.id, position: q.position, text: q.question_text, type: q.question_type, required: q.is_required, helpText: q.help_text,
        options: (q.employee_survey_options || []).sort((a: any, b: any) => a.position - b.position).map((o: any) => ({ id: o.id, label: o.label, value: o.value })),
      })),
    });
  } catch (cause) {
    return NextResponse.json({ success: false, error: cause instanceof Error ? cause.message : "Anket açılamadı." }, { status: 500 });
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const { token } = await context.params;
    const result = await resolve(token);
    if ("error" in result) return NextResponse.json({ success: false, error: result.error }, { status: "completed" in result && result.completed ? 409 : 404 });
    const { supabase, dispatch, survey } = result;
    const body = await request.json().catch(() => ({}));
    const submitted: AnswerInput[] = Array.isArray(body.answers) ? body.answers : [];

    const { data: questions, error: questionError } = await supabase.from("employee_survey_questions")
      .select("id,question_text,question_type,is_required,weight,employee_survey_options(id,risk_level,risk_points)")
      .eq("survey_id", survey.id);
    if (questionError) throw questionError;
    const byQuestion = new Map(submitted.map((x) => [text(x.questionId), x]));
    for (const q of questions || []) {
      const answer = byQuestion.get(String(q.id));
      const optionIds = Array.isArray(answer?.optionIds) ? answer?.optionIds.map(text).filter(Boolean) : [];
      const hasValue = optionIds.length || text(answer?.textValue) || answer?.numberValue !== null && answer?.numberValue !== undefined && answer?.numberValue !== "" || text(answer?.dateValue);
      if (q.is_required && !hasValue) return NextResponse.json({ success: false, error: `“${q.question_text}” sorusu zorunludur.` }, { status: 400 });
    }

    let weightedRisk = 0; let totalWeight = 0; let negativeCount = 0; let flagged = false;
    const calculated = (questions || []).map((q: any) => {
      const answer = byQuestion.get(String(q.id));
      const selected = Array.isArray(answer?.optionIds) ? answer!.optionIds as unknown[] : [];
      const chosen = (q.employee_survey_options || []).filter((o: any) => selected.map(text).includes(String(o.id)));
      const riskPoints = chosen.length ? Math.max(...chosen.map((o: any) => Number(o.risk_points || 0))) : 0;
      const levels = chosen.map((o: any) => String(o.risk_level));
      const riskLevel = levels.includes("CRITICAL") ? "CRITICAL" : levels.includes("HIGH") ? "HIGH" : levels.includes("MEDIUM") ? "MEDIUM" : levels.includes("LOW") ? "LOW" : "NONE";
      const weight = Number(q.weight || 1); weightedRisk += riskPoints * weight; totalWeight += 100 * weight;
      if (riskPoints > 0) negativeCount += 1;
      if (riskLevel === "CRITICAL" || riskLevel === "HIGH") flagged = true;
      return { q, answer, selected: selected.map(text), riskPoints, riskLevel };
    });
    const riskScore = totalWeight ? weightedRisk * 100 / totalWeight : 0;
    const { data: responseRow, error: responseError } = await supabase.from("employee_survey_responses").insert({
      survey_id: survey.id, firm_id: survey.firm_id, dispatch_id: dispatch.id,
      employee_id: survey.is_anonymous ? null : dispatch.employee_id,
      segment_snapshot: { jobTitle: dispatch.target_snapshot?.jobTitle || null },
      submitted_at: new Date().toISOString(), risk_score: riskScore, negative_answer_count: negativeCount, is_flagged: flagged,
    }).select("id").single();
    if (responseError) throw responseError;
    const rows = calculated.map(({ q, answer, selected, riskPoints, riskLevel }) => ({
      response_id: responseRow.id, question_id: q.id, option_ids: selected,
      text_value: text(answer?.textValue) || null,
      comment_value: text(answer?.commentValue).slice(0, 2000) || null,
      number_value: answer?.numberValue === "" || answer?.numberValue === undefined ? null : Number(answer?.numberValue),
      date_value: text(answer?.dateValue) || null, risk_level: riskLevel, risk_points: riskPoints,
    }));
    const { error: answerError } = await supabase.from("employee_survey_answers").insert(rows);
    if (answerError) { await supabase.from("employee_survey_responses").delete().eq("id", responseRow.id); throw answerError; }
    await supabase.from("employee_survey_dispatches").update({ completed_at: new Date().toISOString() }).eq("id", dispatch.id);

    for (const item of calculated.filter((x) => x.riskLevel === "CRITICAL")) {
      await supabase.from("employee_survey_findings").insert({
        firm_id: survey.firm_id, survey_id: survey.id, question_id: item.q.id, severity: "CRITICAL",
        title: item.q.question_text, description: "Kritik olarak tanımlanan bir çalışan yanıtı alınmıştır. İnceleme gerektirir.",
        segment: { jobTitle: dispatch.target_snapshot?.jobTitle || null }, negative_rate: 100, response_count: 1,
      });
    }
    return NextResponse.json({ success: true, message: "Yanıtlarınız güvenli şekilde kaydedildi." });
  } catch (cause) {
    return NextResponse.json({ success: false, error: cause instanceof Error ? cause.message : "Yanıtlar kaydedilemedi." }, { status: 500 });
  }
}
