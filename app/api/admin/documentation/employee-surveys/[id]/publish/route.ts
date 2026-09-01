import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { deny, getAccess, getSupabase, resolveFirmId, text } from "../../_shared";

type Context = { params: Promise<{ id: string }> };
type Employee = { id: string; full_name: string | null; email: string | null; job_title: string | null; registry_no: string | null };

function sha256(value: string) { return createHash("sha256").update(value).digest("hex"); }
function validEmail(value: unknown) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value).toLowerCase()); }
function escapeHtml(value: unknown) { return text(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;"); }

async function sendInvite(employee: Employee, surveyTitle: string, token: string, endsAt: string | null) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://dsec360.com").replace(/\/$/, "");
  if (!apiKey || !from || !validEmail(employee.email)) return { ok: false, error: !validEmail(employee.email) ? "Geçerli e-posta yok." : "E-posta ortam değişkenleri eksik." };
  const link = `${appUrl}/survey/${encodeURIComponent(token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [text(employee.email).toLowerCase()], subject: `D-SEC Çalışan Anketi: ${surveyTitle}`,
      html: `<div style="font-family:Arial;background:#f3f4f6;padding:28px;color:#172033"><div style="max-width:680px;margin:auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #dbe4e8"><div style="background:linear-gradient(135deg,#064e3b,#0f766e);padding:25px;text-align:center;color:#fff"><b style="font-size:25px">D-SEC</b><div style="margin-top:6px">Çalışan Anket & Geri Bildirim Merkezi</div></div><div style="padding:28px"><p>Merhaba <b>${escapeHtml(employee.full_name || "Çalışan")}</b>,</p><p style="line-height:1.7;color:#475569">Görüşlerinizi almak amacıyla aşağıdaki ankete katılmanız beklenmektedir.</p><div style="padding:16px;border-radius:12px;background:#f0fdfa;border:1px solid #99f6e4"><b>${escapeHtml(surveyTitle)}</b>${endsAt ? `<div style="margin-top:8px;font-size:13px">Son katılım: ${escapeHtml(new Date(endsAt).toLocaleString("tr-TR"))}</div>` : ""}</div><a href="${escapeHtml(link)}" style="display:inline-block;margin-top:20px;background:#0f766e;color:#fff;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:800">Anketi Yanıtla</a><p style="font-size:12px;color:#64748b;margin-top:18px">Bağlantı size özeldir ve başka kişilerle paylaşılmamalıdır.</p></div></div></div>`,
    }),
  });
  const result = await response.json().catch(() => ({}));
  return response.ok ? { ok: true, id: result.id || null } : { ok: false, error: result.message || `HTTP ${response.status}` };
}

export async function POST(request: Request, context: Context) {
  try {
    const access = await getAccess();
    if (!access.allowed) return deny();
    if (access.readOnly) return deny(403, "Demo hesabı salt okunurdur.");
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const targetType = ["ALL", "JOB_TITLE", "PERSON", "MULTI_PERSON"].includes(text(body.targetType).toUpperCase()) ? text(body.targetType).toUpperCase() : "ALL";
    const employeeIds = Array.isArray(body.employeeIds) ? body.employeeIds.map(text).filter(Boolean) : [];
    const supabase = getSupabase();
    const { data: survey, error: surveyError } = await supabase.from("employee_surveys").select("id,firm_id,title,status,ends_at").eq("id", id).is("deleted_at", null).maybeSingle();
    if (surveyError || !survey) return deny(404, "Anket bulunamadı.");
    const firmId = resolveFirmId(survey.firm_id, access);
    if (!firmId) return deny(403, "Bu ankete erişiminiz yok.");

    const { count } = await supabase.from("employee_survey_questions").select("id", { count: "exact", head: true }).eq("survey_id", id);
    if (!count) return deny(409, "Anket yayınlanmadan önce soru eklenmelidir.");

    let query = supabase.from("employees").select("id,full_name,email,job_title,registry_no").eq("firm_id", firmId).eq("active", true);
    if (targetType === "JOB_TITLE") {
      const jobTitle = text(body.jobTitle);
      if (!jobTitle) return deny(400, "Görev/kadro seçimi zorunludur.");
      query = query.eq("job_title", jobTitle);
    } else if (targetType === "PERSON" || targetType === "MULTI_PERSON") {
      if (!employeeIds.length) return deny(400, "En az bir çalışan seçilmelidir.");
      query = query.in("id", employeeIds);
    }
    const { data: employees, error: employeeError } = await query.order("full_name", { ascending: true });
    if (employeeError) throw employeeError;
    if (!employees?.length) return deny(404, "Hedef kriterlere uygun aktif çalışan bulunamadı.");

    const expiresAt = survey.ends_at || new Date(Date.now() + 30 * 86400000).toISOString();
    const prepared = (employees as Employee[]).map((employee) => ({ employee, token: randomBytes(32).toString("hex") }));
    const rows = prepared.map(({ employee, token }) => ({
      survey_id: id, firm_id: firmId, employee_id: employee.id, channel: "EMAIL", token_hash: sha256(token), expires_at: expiresAt,
      target_snapshot: { fullName: employee.full_name, email: employee.email, jobTitle: employee.job_title, registryNo: employee.registry_no },
    }));
    const { data: dispatches, error: dispatchError } = await supabase.from("employee_survey_dispatches").insert(rows).select("id,employee_id");
    if (dispatchError) throw dispatchError;

    let sent = 0; const failures: Array<{ employeeId: string; reason: string }> = [];
    for (const item of prepared) {
      const result = await sendInvite(item.employee, survey.title, item.token, survey.ends_at);
      const dispatch = dispatches?.find((x) => String(x.employee_id) === String(item.employee.id));
      if (result.ok) {
        sent += 1;
        if (dispatch) await supabase.from("employee_survey_dispatches").update({ sent_at: new Date().toISOString() }).eq("id", dispatch.id);
      } else failures.push({ employeeId: String(item.employee.id), reason: result.error || "Gönderilemedi." });
    }
    await supabase.from("employee_surveys").update({ status: "ACTIVE", starts_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ success: true, targeted: prepared.length, sent, failed: failures.length, failures });
  } catch (cause) {
    return NextResponse.json({ success: false, error: cause instanceof Error ? cause.message : "Anket yayınlanamadı." }, { status: 500 });
  }
}
