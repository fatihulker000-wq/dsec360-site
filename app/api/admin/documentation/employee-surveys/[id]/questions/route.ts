import { NextResponse } from "next/server";
import { deny, getAccess, getSupabase, resolveFirmId, text } from "../../_shared";

type Context = { params: Promise<{ id: string }> };
type OptionInput = { label?: unknown; value?: unknown; riskLevel?: unknown; riskPoints?: unknown };
type QuestionInput = { text?: unknown; type?: unknown; required?: unknown; weight?: unknown; helpText?: unknown; options?: OptionInput[] };

export async function GET(_: Request, context: Context) {
  try {
    const access = await getAccess();
    if (!access.allowed) return deny();
    const { id } = await context.params;
    const supabase = getSupabase();
    const { data: survey, error: surveyError } = await supabase.from("employee_surveys").select("id,firm_id,title,status").eq("id", id).is("deleted_at", null).maybeSingle();
    if (surveyError || !survey) return deny(404, "Anket bulunamadı.");
    if (!resolveFirmId(survey.firm_id, access)) return deny(403, "Bu ankete erişiminiz yok.");
    const { data, error } = await supabase.from("employee_survey_questions")
      .select("id,position,question_text,question_type,is_required,weight,help_text,employee_survey_options(id,label,value,position,risk_level,risk_points)")
      .eq("survey_id", id).order("position", { ascending: true });
    if (error) throw error;
    return NextResponse.json({
      success: true,
      survey: { id: survey.id, title: survey.title, status: survey.status },
      questions: (data || []).map((q: any) => ({
        text: q.question_text, type: q.question_type, required: q.is_required, weight: q.weight, helpText: q.help_text || "",
        options: (q.employee_survey_options || []).sort((a: any, b: any) => a.position - b.position).map((o: any) => ({ label: o.label, value: o.value, riskLevel: o.risk_level, riskPoints: Number(o.risk_points || 0) })),
      })),
    });
  } catch (cause) {
    return NextResponse.json({ success: false, error: cause instanceof Error ? cause.message : "Sorular alınamadı." }, { status: 500 });
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const access = await getAccess();
    if (!access.allowed) return deny();
    if (access.readOnly) return deny(403, "Demo hesabı salt okunurdur.");
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const items: QuestionInput[] = Array.isArray(body.questions) ? body.questions : [];
    if (!items.length) return deny(400, "En az bir soru eklenmelidir.");
    if (items.length > 100) return deny(400, "Bir ankete en fazla 100 soru eklenebilir.");

    const supabase = getSupabase();
    const { data: survey, error: surveyError } = await supabase.from("employee_surveys").select("id,firm_id,status").eq("id", id).is("deleted_at", null).maybeSingle();
    if (surveyError || !survey) return deny(404, "Anket bulunamadı.");
    if (!resolveFirmId(survey.firm_id, access)) return deny(403, "Bu ankete erişiminiz yok.");
    if (survey.status !== "DRAFT") return deny(409, "Yalnızca taslak anketin soruları değiştirilebilir.");

    const { error: deleteError } = await supabase.from("employee_survey_questions").delete().eq("survey_id", id);
    if (deleteError) throw deleteError;

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const questionText = text(item.text);
      if (!questionText) throw new Error(`${index + 1}. sorunun metni boş olamaz.`);
      const allowedTypes = ["YES_NO", "SINGLE", "MULTIPLE", "LIKERT_5", "SCALE_10", "TEXT", "NUMBER", "DATE", "FILE"];
      const questionType = allowedTypes.includes(text(item.type).toUpperCase()) ? text(item.type).toUpperCase() : "SINGLE";
      const { data: question, error } = await supabase.from("employee_survey_questions").insert({
        survey_id: id, position: index + 1, question_text: questionText, question_type: questionType,
        is_required: item.required !== false, weight: Math.min(5, Math.max(1, Number(item.weight || 3))), help_text: text(item.helpText) || null,
      }).select("id").single();
      if (error) throw error;

      const options = Array.isArray(item.options) ? item.options : [];
      if (["YES_NO", "SINGLE", "MULTIPLE", "LIKERT_5", "SCALE_10"].includes(questionType) && !options.length) {
        throw new Error(`${index + 1}. soru için cevap seçenekleri zorunludur.`);
      }
      if (options.length) {
        const rows = options.map((option, optionIndex) => ({
          question_id: question.id, label: text(option.label), value: text(option.value) || String(optionIndex + 1), position: optionIndex + 1,
          risk_level: ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(text(option.riskLevel).toUpperCase()) ? text(option.riskLevel).toUpperCase() : "NONE",
          risk_points: Math.min(100, Math.max(0, Number(option.riskPoints || 0))),
        }));
        const { error: optionError } = await supabase.from("employee_survey_options").insert(rows);
        if (optionError) throw optionError;
      }
    }
    return NextResponse.json({ success: true, questionCount: items.length });
  } catch (cause) {
    return NextResponse.json({ success: false, error: cause instanceof Error ? cause.message : "Sorular kaydedilemedi." }, { status: 500 });
  }
}
