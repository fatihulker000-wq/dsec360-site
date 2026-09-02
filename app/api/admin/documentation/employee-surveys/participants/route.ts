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
    const [{ data, error }, { data: responseRows, error: responseError }] = await Promise.all([supabase.from("employee_survey_dispatches")
      .select("id,survey_id,employee_id,target_snapshot,sent_at,opened_at,completed_at,revoked_at,expires_at,created_at,employee_surveys(title,is_anonymous)")
      .eq("firm_id", firmId)
      .order("created_at", { ascending: false }), supabase.from("employee_survey_responses").select("id").eq("firm_id", firmId)]);
    if (error || responseError) throw error || responseError;
    const responseIds = (responseRows || []).map((row: any) => row.id);
    const { data: commentRows, error: commentError } = responseIds.length
      ? await supabase.from("employee_survey_answers").select("id,comment_value").in("response_id", responseIds).not("comment_value", "is", null)
      : { data: [], error: null };
    if (commentError) throw commentError;

    const unique = new Map<string, any>();
    for (const row of data || []) {
      const snapshot = row.target_snapshot || {};
      const personKey = String(row.employee_id || snapshot.email || row.id).toLowerCase();
      const key = `${row.survey_id}:${personKey}`;
      if (!unique.has(key)) unique.set(key, row);
    }

    return NextResponse.json({
      success: true,
      participants: Array.from(unique.values()).map((row: any) => {
        const snapshot = row.target_snapshot || {};
        const survey = Array.isArray(row.employee_surveys) ? row.employee_surveys[0] : row.employee_surveys;
        const expired = Boolean(row.expires_at) && new Date(row.expires_at).getTime() < Date.now();
        const status = row.completed_at ? "COMPLETED" : row.revoked_at ? "REVOKED" : expired ? "EXPIRED" : row.opened_at ? "OPENED" : row.sent_at ? "SENT" : "NOT_SENT";
        return {
          id: String(row.id), surveyId: String(row.survey_id), surveyTitle: survey?.title || "Anket",
          anonymous: Boolean(survey?.is_anonymous), employeeId: row.employee_id ? String(row.employee_id) : "",
          fullName: String(snapshot.fullName || "Çalışan"), email: String(snapshot.email || ""),
          jobTitle: String(snapshot.jobTitle || ""), registryNo: String(snapshot.registryNo || ""),
          status, sentAt: row.sent_at, openedAt: row.opened_at, completedAt: row.completed_at, expiresAt: row.expires_at,
        };
      }),
      comments: (commentRows || []).map((row: any) => ({ answerId: String(row.id), comment: String(row.comment_value || "") })),
    });
  } catch (cause) {
    return NextResponse.json({ success: false, error: cause instanceof Error ? cause.message : "Katılımcı listesi alınamadı." }, { status: 500 });
  }
}
