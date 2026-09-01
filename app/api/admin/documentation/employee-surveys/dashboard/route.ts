import { NextResponse } from "next/server";
import { deny, getAccess, getSupabase, resolveFirmId } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const access = await getAccess();
    if (!access.allowed) return deny();
    const firmId = resolveFirmId(new URL(request.url).searchParams.get("firmId") || access.companyId, access);
    if (!firmId) return deny(403, "Firma erişimi doğrulanamadı.");
    const supabase = getSupabase();

    const [surveysResult, questionsResult, dispatchesResult, responsesResult, findingsResult, actionsResult] = await Promise.all([
      supabase.from("employee_surveys").select("id,title,category,status,is_anonymous,ends_at").eq("firm_id", firmId).is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("employee_survey_questions").select("id,survey_id,weight"),
      supabase.from("employee_survey_dispatches").select("id,survey_id,completed_at").eq("firm_id", firmId),
      supabase.from("employee_survey_responses").select("id,survey_id,risk_score,negative_answer_count,submitted_at").eq("firm_id", firmId).not("submitted_at", "is", null),
      supabase.from("employee_survey_findings").select("id,survey_id,question_id,severity,title,description,segment,negative_rate,response_count,status,employee_surveys(title)").eq("firm_id", firmId).neq("status", "CLOSED").order("negative_rate", { ascending: false }),
      supabase.from("employee_survey_actions").select("id,title,owner_user_id,due_date,priority,status").eq("firm_id", firmId).order("created_at", { ascending: false }),
    ]);

    const firstError = [surveysResult, questionsResult, dispatchesResult, responsesResult, findingsResult, actionsResult].find((x) => x.error)?.error;
    if (firstError) throw firstError;

    const questions = questionsResult.data || [];
    const dispatches = dispatchesResult.data || [];
    const responses = responsesResult.data || [];
    const surveys = (surveysResult.data || []).map((survey) => {
      const ownResponses = responses.filter((x) => String(x.survey_id) === String(survey.id));
      const ownDispatches = dispatches.filter((x) => String(x.survey_id) === String(survey.id));
      const questionCount = questions.filter((x) => String(x.survey_id) === String(survey.id)).length;
      const riskScore = ownResponses.length ? ownResponses.reduce((n, x) => n + Number(x.risk_score || 0), 0) / ownResponses.length : 0;
      const negativeRate = questionCount && ownResponses.length
        ? ownResponses.reduce((n, x) => n + Number(x.negative_answer_count || 0), 0) * 100 / (questionCount * ownResponses.length)
        : 0;
      return {
        id: String(survey.id), title: survey.title, category: survey.category, status: survey.status,
        anonymous: survey.is_anonymous, questionCount, targetCount: ownDispatches.length,
        responseCount: ownResponses.length, negativeRate, riskScore, endsAt: survey.ends_at,
      };
    });

    return NextResponse.json({
      success: true,
      surveys,
      findings: (findingsResult.data || []).map((x: any) => ({
        id: String(x.id), surveyTitle: x.employee_surveys?.title || "Anket", question: x.title,
        negativeRate: Number(x.negative_rate || 0), severity: x.severity,
        segment: x.segment && Object.keys(x.segment).length ? Object.values(x.segment).join(" / ") : "",
      })),
      actions: (actionsResult.data || []).map((x) => ({
        id: String(x.id), title: x.title, owner: x.owner_user_id || "", dueDate: x.due_date || "",
        priority: x.priority, status: x.status,
      })),
    });
  } catch (cause) {
    return NextResponse.json({ success: false, error: cause instanceof Error ? cause.message : "Anket merkezi yüklenemedi." }, { status: 500 });
  }
}
