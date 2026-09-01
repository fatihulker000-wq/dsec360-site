import { NextResponse } from "next/server";
import { deny, getAccess, getSupabase, resolveFirmId, surveyStatus, text } from "./_shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const access = await getAccess();
    if (!access.allowed) return deny();
    const url = new URL(request.url);
    const firmId = resolveFirmId(url.searchParams.get("firmId") || access.companyId, access);
    if (!firmId) return deny(403, "Firma erişimi doğrulanamadı.");

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("employee_surveys")
      .select("*,employee_survey_questions(count),employee_survey_responses(count)")
      .eq("firm_id", firmId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, surveys: data || [] });
  } catch (cause) {
    return NextResponse.json({ success: false, error: cause instanceof Error ? cause.message : "Anketler alınamadı." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await getAccess();
    if (!access.allowed) return deny();
    if (access.readOnly) return deny(403, "Demo hesabı salt okunurdur.");
    const body = await request.json().catch(() => ({}));
    const firmId = resolveFirmId(body.firmId, access);
    const title = text(body.title);
    if (!firmId) return deny(403, "Firma erişimi doğrulanamadı.");
    if (title.length < 3) return deny(400, "Anket adı en az 3 karakter olmalıdır.");

    const startsAt = text(body.startDate) || null;
    const endsAt = text(body.endDate) || null;
    if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      return deny(400, "Bitiş tarihi başlangıç tarihinden sonra olmalıdır.");
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("employee_surveys")
      .insert({
        firm_id: firmId,
        title,
        description: text(body.description),
        category: text(body.category) || "Özel / Serbest Anket",
        status: surveyStatus(body.status),
        is_anonymous: body.anonymous !== false,
        starts_at: startsAt,
        ends_at: endsAt,
        minimum_anonymous_group_size: 5,
        created_by: null,
      })
      .select("*")
      .single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      survey: {
        id: String(data.id), title: data.title, category: data.category, status: data.status,
        anonymous: data.is_anonymous, questionCount: 0, targetCount: 0, responseCount: 0,
        negativeRate: 0, riskScore: 0, endsAt: data.ends_at,
      },
    }, { status: 201 });
  } catch (cause) {
    return NextResponse.json({ success: false, error: cause instanceof Error ? cause.message : "Anket oluşturulamadı." }, { status: 500 });
  }
}
