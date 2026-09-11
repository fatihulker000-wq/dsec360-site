import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function isoToMillis(value: string | null): number | null {
  if (!value) return null;
  const millis = new Date(value).getTime();
  return Number.isFinite(millis) ? millis : null;
}

function booleanToInt(value: boolean | null | undefined): number {
  return value === true ? 1 : 0;
}

function parsePositiveLong(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function expectedMobileKey(): string {
  return text(process.env.DSEC_MOBILE_API_KEY || "dsec_mobile_123");
}

async function resolveViewer(req: NextRequest) {
  const sentKey = text(req.headers.get("x-api-key"));
  if (!sentKey || sentKey !== expectedMobileKey()) {
    throw Object.assign(new Error("Geçersiz mobil API anahtarı."), { status: 401 });
  }

  const email = text(req.headers.get("x-user-email")).toLowerCase();
  if (!email) {
    throw Object.assign(new Error("x-user-email zorunludur."), { status: 401 });
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id,email,role,company_id")
    .ilike("email", email)
    .maybeSingle();

  if (userError) throw userError;
  if (!user?.id) {
    throw Object.assign(new Error("Mobil kullanıcı Web kullanıcıları içinde bulunamadı."), { status: 401 });
  }

  const role = text(user.role).toLowerCase();
  let firmIds: string[] = [];

  if (role === "super_admin") {
    const { data, error } = await supabase
      .from("companies")
      .select("id")
      .eq("is_active", true);

    if (error) throw error;
    firmIds = (data ?? []).map((x) => text(x.id)).filter(Boolean);
  } else {
    const { data: access, error: accessError } = await supabase
      .from("user_firm_access")
      .select("firm_id")
      .eq("user_id", user.id);

    if (accessError) throw accessError;

    firmIds = (access ?? []).map((x) => text(x.firm_id)).filter(Boolean);

    if (!firmIds.length && text(user.company_id)) {
      firmIds = [text(user.company_id)];
    }

    if (firmIds.length) {
      const { data: activeCompanies, error: companiesError } = await supabase
        .from("companies")
        .select("id")
        .in("id", [...new Set(firmIds)])
        .eq("is_active", true);

      if (companiesError) throw companiesError;
      firmIds = (activeCompanies ?? []).map((x) => text(x.id)).filter(Boolean);
    }
  }

  return {
    userId: text(user.id),
    allowedFirmIds: [...new Set(firmIds)],
  };
}

async function resolveRequestedFirm(
  firmId: number | null,
  webFirmId: string | null,
  allowedFirmIds: string[]
): Promise<{ webFirmId: string; localFirmId: number }> {
  let resolvedWebFirmId = webFirmId;

  if (!resolvedWebFirmId && firmId) {
    const { data, error } = await supabase
      .from("companies")
      .select("id,local_firm_id")
      .eq("local_firm_id", firmId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    resolvedWebFirmId = text(data?.id) || null;
  }

  if (!resolvedWebFirmId || !allowedFirmIds.includes(resolvedWebFirmId)) {
    throw Object.assign(
      new Error("Bu firma kullanıcının aktif firma yetkileri arasında değil."),
      { status: 403 }
    );
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id,local_firm_id")
    .eq("id", resolvedWebFirmId)
    .eq("is_active", true)
    .maybeSingle();

  if (companyError) throw companyError;
  if (!company?.id) {
    throw Object.assign(new Error("Aktif firma bulunamadı."), { status: 403 });
  }

  const localFirmId = Number(company.local_firm_id ?? firmId);
  if (!Number.isFinite(localFirmId) || localFirmId <= 0) {
    throw Object.assign(new Error("Firmanın local_firm_id bilgisi eksik."), { status: 400 });
  }

  return {
    webFirmId: resolvedWebFirmId,
    localFirmId: Math.trunc(localFirmId),
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const viewer = await resolveViewer(req);
    const { searchParams } = new URL(req.url);

    const firmId = parsePositiveLong(searchParams.get("firm_id"));
    const webFirmId = searchParams.get("web_firm_id")?.trim() || null;
    const updatedAfterMillis = Number(searchParams.get("updated_after_millis") ?? 0);
    const limitValue = Number(searchParams.get("limit") ?? 250);
    const limit = Math.min(500, Math.max(1, Number.isFinite(limitValue) ? limitValue : 250));

    if (!firmId && !webFirmId) {
      return NextResponse.json(
        { success: false, error: "firm_id or web_firm_id required" },
        { status: 400 }
      );
    }

    const resolvedFirm = await resolveRequestedFirm(
      firmId,
      webFirmId,
      viewer.allowedFirmIds
    );

    let query = supabase
      .from("ajanda_tasks")
      .select(`
        id,
        sync_key,
        firm_id,
        web_firm_id,
        title,
        note,
        status,
        priority,
        progress,
        type,
        category,
        due_at,
        end_at,
        completed_at,
        location,
        meeting_link,
        assigned_employee_local_id,
        assigned_employee_remote_id,
        assigned_to,
        assigned_by,
        created_by_user_id,
        participants_csv,
        is_all_day,
        module_ref,
        module_ref_id,
        module_remote_id,
        parent_task_id,
        parent_remote_id,
        remind_minutes_csv,
        remind_at,
        repeat_type,
        repeat_until,
        source,
        is_archived,
        is_deleted,
        deleted_at,
        app_created_at,
        app_updated_at,
        created_at,
        updated_at
      `)
      .eq("web_firm_id", resolvedFirm.webFirmId)
      // App kullanıcısının şahsi Ajandası: yalnız o kullanıcının kişisel kayıtları.
      .eq("created_by_user_id", viewer.userId)
      .eq("category", "PERSONAL")
      .order("updated_at", { ascending: true })
      .limit(limit);

    if (Number.isFinite(updatedAfterMillis) && updatedAfterMillis > 0) {
      query = query.gt("updated_at", new Date(updatedAfterMillis).toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Ajanda pull error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const records = (data ?? []).map((item) => ({
      remote_id: item.id,
      sync_key: item.sync_key,

      firm_id: resolvedFirm.localFirmId,
      web_firm_id: item.web_firm_id,

      title: item.title,
      note: item.note,

      status: item.status,
      priority: item.priority,
      progress: item.progress,

      type: item.type,
      category: item.category,

      due_at_millis: isoToMillis(item.due_at),
      end_at_millis: isoToMillis(item.end_at),
      completed_at_millis: isoToMillis(item.completed_at),

      location: item.location,
      meeting_link: item.meeting_link,

      assigned_employee_local_id: item.assigned_employee_local_id,
      assigned_employee_remote_id: item.assigned_employee_remote_id,

      assigned_to: item.assigned_to,
      assigned_by: item.assigned_by,
      created_by_user_id: item.created_by_user_id,

      participants_csv: item.participants_csv,
      is_all_day: booleanToInt(item.is_all_day),

      module_ref: item.module_ref,
      module_ref_id: item.module_ref_id,
      module_remote_id: item.module_remote_id,

      parent_task_id: item.parent_task_id,
      parent_remote_id: item.parent_remote_id,

      remind_minutes_csv: item.remind_minutes_csv,
      remind_at_millis: isoToMillis(item.remind_at),

      repeat_type: item.repeat_type,
      repeat_until_millis: isoToMillis(item.repeat_until),

      source: item.source,

      is_archived: booleanToInt(item.is_archived),
      is_deleted: booleanToInt(item.is_deleted),
      deleted_at_millis: isoToMillis(item.deleted_at),

      created_at_millis:
        item.app_created_at ??
        isoToMillis(item.created_at) ??
        Date.now(),

      updated_at_millis:
        item.app_updated_at ??
        isoToMillis(item.updated_at) ??
        Date.now(),

      server_updated_at_millis: isoToMillis(item.updated_at),
    }));

    const nextCursor =
      records.length > 0
        ? records[records.length - 1].server_updated_at_millis
        : updatedAfterMillis;

    return NextResponse.json({
      success: true,
      count: records.length,
      records,
      next_updated_after_millis: nextCursor,
      has_more: records.length >= limit,
    });
  } catch (error: any) {
    console.error("Ajanda pull route exception:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Beklenmeyen sunucu hatası",
      },
      { status: Number(error?.status) || 500 }
    );
  }
}
