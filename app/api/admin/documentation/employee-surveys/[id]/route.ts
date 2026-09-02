import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { deny, getAccess, getSupabase, resolveFirmId, text } from "../_shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };
type Dispatch = {
  id: string;
  employee_id: string | null;
  target_snapshot: Record<string, unknown> | null;
};

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const validEmail = (value: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value));
const escapeHtml = (value: unknown) => text(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");

async function surveyAccess(id: string) {
  const access = await getAccess();
  if (!access.allowed) return { response: deny() } as const;
  const supabase = getSupabase();
  const { data: survey, error } = await supabase.from("employee_surveys").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (error) throw error;
  if (!survey) return { response: deny(404, "Anket bulunamadı.") } as const;
  const firmId = resolveFirmId(survey.firm_id, access);
  if (!firmId) return { response: deny(403, "Bu ankete erişiminiz yok.") } as const;
  return { access, supabase, survey, firmId } as const;
}

async function counts(supabase: ReturnType<typeof getSupabase>, id: string) {
  const [questions, responses, dispatches] = await Promise.all([
    supabase.from("employee_survey_questions").select("id", { count: "exact", head: true }).eq("survey_id", id),
    supabase.from("employee_survey_responses").select("id", { count: "exact", head: true }).eq("survey_id", id).not("submitted_at", "is", null),
    supabase.from("employee_survey_dispatches").select("id", { count: "exact", head: true }).eq("survey_id", id),
  ]);
  const error = questions.error || responses.error || dispatches.error;
  if (error) throw error;
  return { questionCount: questions.count || 0, responseCount: responses.count || 0, dispatchCount: dispatches.count || 0 };
}

async function audit(supabase: ReturnType<typeof getSupabase>, survey: any, role: string, action: string, detail: Record<string, unknown> = {}) {
  await supabase.from("employee_survey_audit_logs").insert({ survey_id: survey.id, action, detail, actor_role: role });
}

async function sendReminder(snapshot: Record<string, unknown>, title: string, token: string, endsAt: string | null) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const email = text(snapshot.email).toLowerCase();
  if (!apiKey || !from || !validEmail(email)) return false;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://dsec360.com").replace(/\/$/, "");
  const link = `${appUrl}/survey/${encodeURIComponent(token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `Hatırlatma — D-SEC Çalışan Anketi: ${title}`,
      html: `<div style="font-family:Arial;background:#f3f4f6;padding:28px;color:#172033"><div style="max-width:680px;margin:auto;background:#fff;border-radius:18px;padding:28px"><h2 style="color:#0f766e">Anket hatırlatması</h2><p>Merhaba <b>${escapeHtml(snapshot.fullName || "Çalışan")}</b>,</p><p><b>${escapeHtml(title)}</b> anketi için yanıtınız henüz alınmadı.</p>${endsAt ? `<p>Son katılım: ${escapeHtml(new Date(endsAt).toLocaleString("tr-TR"))}</p>` : ""}<a href="${escapeHtml(link)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:800">Anketi Yanıtla</a><p style="font-size:12px;color:#64748b">Yeni bağlantı size özeldir; önceki bağlantı artık geçerli değildir.</p></div></div>`,
    }),
  });
  return response.ok;
}

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const result = await surveyAccess(id);
    if ("response" in result) return result.response;
    const summary = await counts(result.supabase, id);
    const { data: history } = await result.supabase.from("employee_survey_audit_logs").select("id,action,detail,actor_role,created_at").eq("survey_id", id).order("created_at", { ascending: false }).limit(50);
    return NextResponse.json({ success: true, survey: result.survey, ...summary, history: history || [] });
  } catch (cause) {
    return NextResponse.json({ success: false, error: cause instanceof Error ? cause.message : "Anket alınamadı." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const result = await surveyAccess(id);
    if ("response" in result) return result.response;
    if (result.access.readOnly) return deny(403, "Demo hesabı salt okunurdur.");
    const body = await request.json().catch(() => ({}));
    const action = text(body.action).toUpperCase();
    const summary = await counts(result.supabase, id);
    const now = new Date().toISOString();
    let patch: Record<string, unknown> = { updated_at: now };

    if (action === "UPDATE") {
      const title = text(body.title);
      if (title.length < 3) return deny(400, "Anket adı en az 3 karakter olmalıdır.");
      patch = { ...patch, title, description: text(body.description), category: text(body.category) || result.survey.category };
      if (body.endsAt !== undefined) patch.ends_at = text(body.endsAt) || null;
      if (summary.responseCount === 0 && body.anonymous !== undefined) patch.is_anonymous = Boolean(body.anonymous);
    } else if (action === "EXTEND" || action === "REOPEN") {
      const endsAt = text(body.endsAt);
      if (!endsAt || new Date(endsAt).getTime() <= Date.now()) return deny(400, "Yeni bitiş tarihi gelecekte olmalıdır.");
      patch = { ...patch, ends_at: new Date(endsAt).toISOString(), status: "ACTIVE", closed_at: null, archived_at: null };
    } else if (action === "CLOSE") {
      patch = { ...patch, status: "CLOSED", closed_at: now };
      await result.supabase.from("employee_survey_dispatches").update({ revoked_at: now }).eq("survey_id", id).is("completed_at", null).is("revoked_at", null);
    } else if (action === "ARCHIVE") {
      patch = { ...patch, status: "ARCHIVED", archived_at: now };
    } else if (action === "RESTORE") {
      patch = { ...patch, status: summary.responseCount ? "CLOSED" : "DRAFT", archived_at: null };
    } else {
      return deny(400, "Geçersiz anket işlemi.");
    }

    const { data, error } = await result.supabase.from("employee_surveys").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    await audit(result.supabase, result.survey, result.access.role, action, patch);
    return NextResponse.json({ success: true, survey: data });
  } catch (cause) {
    return NextResponse.json({ success: false, error: cause instanceof Error ? cause.message : "Anket güncellenemedi." }, { status: 500 });
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const result = await surveyAccess(id);
    if ("response" in result) return result.response;
    if (result.access.readOnly) return deny(403, "Demo hesabı salt okunurdur.");
    const body = await request.json().catch(() => ({}));
    const action = text(body.action).toUpperCase();

    if (action === "DUPLICATE") {
      const { data: copy, error } = await result.supabase.from("employee_surveys").insert({
        firm_id: result.survey.firm_id, title: `${result.survey.title} - Kopya`, description: result.survey.description,
        category: result.survey.category, status: "DRAFT", is_anonymous: result.survey.is_anonymous,
        allow_multiple: result.survey.allow_multiple, minimum_anonymous_group_size: result.survey.minimum_anonymous_group_size,
        starts_at: null, ends_at: null, created_by: result.survey.created_by,
      }).select("id").single();
      if (error) throw error;
      const { data: questions, error: questionError } = await result.supabase.from("employee_survey_questions").select("*,employee_survey_options(*)").eq("survey_id", id).order("position");
      if (questionError) throw questionError;
      for (const question of questions || []) {
        const { data: newQuestion, error: insertError } = await result.supabase.from("employee_survey_questions").insert({
          survey_id: copy.id, position: question.position, question_text: question.question_text, question_type: question.question_type,
          is_required: question.is_required, weight: question.weight, help_text: question.help_text, config: question.config,
        }).select("id").single();
        if (insertError) throw insertError;
        const options = (question.employee_survey_options || []).map((option: any) => ({ question_id: newQuestion.id, label: option.label, value: option.value, position: option.position, risk_level: option.risk_level, risk_points: option.risk_points }));
        if (options.length) { const { error: optionError } = await result.supabase.from("employee_survey_options").insert(options); if (optionError) throw optionError; }
      }
      await audit(result.supabase, result.survey, result.access.role, "DUPLICATE", { newSurveyId: copy.id });
      return NextResponse.json({ success: true, surveyId: copy.id });
    }

    if (action === "REMIND_NON_RESPONDERS") {
      if (result.survey.status !== "ACTIVE") return deny(409, "Hatırlatma yalnızca aktif anketlerde gönderilebilir.");
      if (result.survey.ends_at && new Date(result.survey.ends_at).getTime() <= Date.now()) return deny(409, "Anketin süresi dolmuş. Önce süreyi uzatın.");
      const { data, error } = await result.supabase.from("employee_survey_dispatches").select("id,employee_id,target_snapshot,created_at").eq("survey_id", id).is("completed_at", null).order("created_at", { ascending: false });
      if (error) throw error;
      const unique = new Map<string, Dispatch>();
      for (const row of (data || []) as Dispatch[]) {
        const snapshot = row.target_snapshot || {};
        const key = text(row.employee_id) || text(snapshot.email).toLowerCase() || row.id;
        if (!unique.has(key)) unique.set(key, row);
      }
      const pending = Array.from(unique.values());
      if (!pending.length) return deny(409, "Hatırlatma gönderilecek yanıtlamayan çalışan yok.");
      const now = new Date().toISOString();
      const prepared = pending.map((dispatch) => ({ dispatch, token: randomBytes(32).toString("hex") }));
      const expiresAt = result.survey.ends_at || new Date(Date.now() + 30 * 86400000).toISOString();
      let sent = 0;
      for (let index = 0; index < prepared.length; index += 1) {
        const item = prepared[index];
        const { error: updateError } = await result.supabase.from("employee_survey_dispatches").update({
          token_hash: sha256(item.token), expires_at: expiresAt, revoked_at: null, opened_at: null, sent_at: null,
        }).eq("id", item.dispatch.id);
        if (updateError) throw updateError;
        if (await sendReminder(item.dispatch.target_snapshot || {}, result.survey.title, item.token, result.survey.ends_at)) {
          sent += 1;
          await result.supabase.from("employee_survey_dispatches").update({ sent_at: new Date().toISOString() }).eq("id", item.dispatch.id);
        }
      }
      await audit(result.supabase, result.survey, result.access.role, action, { targeted: pending.length, sent });
      return NextResponse.json({ success: true, targeted: pending.length, sent, failed: pending.length - sent });
    }
    return deny(400, "Geçersiz anket işlemi.");
  } catch (cause) {
    return NextResponse.json({ success: false, error: cause instanceof Error ? cause.message : "Anket işlemi tamamlanamadı." }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const result = await surveyAccess(id);
    if ("response" in result) return result.response;
    if (result.access.readOnly) return deny(403, "Demo hesabı salt okunurdur.");
    const summary = await counts(result.supabase, id);
    if (summary.responseCount) return deny(409, "Yanıt alınmış anket silinemez. Sonuçları korumak için arşivleyin.");
    const now = new Date().toISOString();
    await result.supabase.from("employee_survey_dispatches").update({ revoked_at: now }).eq("survey_id", id).is("revoked_at", null);
    const { error } = await result.supabase.from("employee_surveys").update({ deleted_at: now, status: "ARCHIVED", updated_at: now }).eq("id", id);
    if (error) throw error;
    await audit(result.supabase, result.survey, result.access.role, "DELETE", { softDelete: true });
    return NextResponse.json({ success: true });
  } catch (cause) {
    return NextResponse.json({ success: false, error: cause instanceof Error ? cause.message : "Anket silinemedi." }, { status: 500 });
  }
}
