import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

type Viewer = {
  userId: string;
  role: string;
  allowedFirmIds: string[];
};

type ExistingAgendaRow = {
  id: string;
  sync_key: string | null;
  web_firm_id: string | null;
  category: string | null;
  source: string | null;
  created_by_user_id: string | null;
};

type SavedAgendaRow = { id: string; sync_key: string | null };

const text = (v: unknown) => String(v ?? "").trim();
const nullableString = (v: unknown) => text(v) || null;
const nullableNumber = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const bool = (v: unknown) => v === true || Number(v) === 1;
const millisToIso = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? new Date(n).toISOString() : null;
};

function requireMobileKey(req: NextRequest) {
  const configured = text(process.env.DSEC_MOBILE_API_KEY || "dsec_mobile_123");
  if (text(req.headers.get("x-api-key")) !== configured) {
    throw Object.assign(new Error("Geçersiz mobil API anahtarı."), { status: 401 });
  }
}

async function resolveViewer(req: NextRequest): Promise<Viewer> {
  requireMobileKey(req);
  const email = text(req.headers.get("x-user-email")).toLowerCase();
  if (!email) throw Object.assign(new Error("x-user-email zorunludur."), { status: 401 });

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id,role,company_id")
    .ilike("email", email)
    .maybeSingle();

  if (userError) throw userError;
  if (!user?.id) throw Object.assign(new Error("Kullanıcı bulunamadı."), { status: 401 });

  let firmIds: string[] = [];
  const role = text(user.role).toLowerCase();

  if (role === "super_admin" || role === "admin") {
    const { data, error } = await supabase.from("companies").select("id").eq("is_active", true);
    if (error) throw error;
    firmIds = (data ?? []).map((x) => text(x.id)).filter(Boolean);
  } else {
    const { data: access, error } = await supabase
      .from("user_firm_access")
      .select("firm_id")
      .eq("user_id", user.id);
    if (error) throw error;

    firmIds = (access ?? []).map((x) => text(x.firm_id)).filter(Boolean);
    if (!firmIds.length && text(user.company_id)) firmIds = [text(user.company_id)];

    if (firmIds.length) {
      const { data: active, error: activeError } = await supabase
        .from("companies")
        .select("id")
        .in("id", [...new Set(firmIds)])
        .eq("is_active", true);
      if (activeError) throw activeError;
      firmIds = (active ?? []).map((x) => text(x.id)).filter(Boolean);
    }
  }

  return { userId: text(user.id), role, allowedFirmIds: [...new Set(firmIds)] };
}

async function resolveFirm(record: Record<string, unknown>, viewer: Viewer) {
  let webFirmId = nullableString(record.web_firm_id);
  const localCandidate = Number(record.firm_id ?? 0);

  if (!webFirmId && Number.isFinite(localCandidate) && localCandidate > 0) {
    const { data, error } = await supabase
      .from("companies")
      .select("id,local_firm_id")
      .eq("local_firm_id", Math.trunc(localCandidate))
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    webFirmId = nullableString(data?.id);
  }

  if (!webFirmId || !viewer.allowedFirmIds.includes(webFirmId)) {
    throw Object.assign(new Error("Firma yetkisi bulunmuyor veya firma pasif."), { status: 403 });
  }

  const { data: company, error } = await supabase
    .from("companies")
    .select("id,local_firm_id")
    .eq("id", webFirmId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  if (!company?.id) throw Object.assign(new Error("Aktif firma bulunamadı."), { status: 403 });

  const localFirmId = Number(company.local_firm_id ?? localCandidate);
  if (!Number.isFinite(localFirmId) || localFirmId <= 0) {
    throw Object.assign(new Error("Firma local_firm_id bilgisi eksik."), { status: 400 });
  }

  return { webFirmId, localFirmId: Math.trunc(localFirmId) };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const viewer = await resolveViewer(req);
    const body = await req.json();
    const record = (body?.record ?? body) as Record<string, unknown>;
    if (!record || typeof record !== "object") {
      return NextResponse.json({ success: false, error: "record missing" }, { status: 400 });
    }

    const localId = Number(record.local_id ?? 0);
    if (!Number.isFinite(localId) || localId <= 0) {
      return NextResponse.json({ success: false, error: "local_id missing" }, { status: 400 });
    }

    const { webFirmId, localFirmId } = await resolveFirm(record, viewer);
    const operation = text(body?.operation || "UPSERT").toUpperCase();
    const remoteId = nullableString(record.remote_id);
    const syncKey = nullableString(record.sync_key);
    const title = text(record.title);
    const isPersonal = text(record.category).toUpperCase() === "PERSONAL" || text(record.module_ref).toUpperCase() === "PERSONAL";

    if (!remoteId && !syncKey) {
      return NextResponse.json({ success: false, error: "sync_key or remote_id required" }, { status: 400 });
    }
    if (operation !== "DELETE" && !title) {
      return NextResponse.json({ success: false, error: "title missing" }, { status: 400 });
    }

    let existing: ExistingAgendaRow | null = null;
    if (remoteId) {
      const { data, error } = await supabase
        .from("ajanda_tasks")
        .select("id,sync_key,web_firm_id,category,source,created_by_user_id")
        .eq("id", remoteId)
        .maybeSingle();
      if (error) throw error;
      existing = (data ?? null) as ExistingAgendaRow | null;
    } else if (syncKey) {
      const { data, error } = await supabase
        .from("ajanda_tasks")
        .select("id,sync_key,web_firm_id,category,source,created_by_user_id")
        .eq("sync_key", syncKey)
        .maybeSingle();
      if (error) throw error;
      existing = (data ?? null) as ExistingAgendaRow | null;
    }

    if (remoteId && !existing) {
      return NextResponse.json({ success: false, error: "Ajanda kaydı bulunamadı." }, { status: 404 });
    }

    if (existing) {
      if (text(existing.web_firm_id) !== webFirmId) {
        return NextResponse.json({ success: false, error: "Ajanda kaydı başka firmaya ait." }, { status: 403 });
      }
      const existingPersonal = text(existing.category).toUpperCase() === "PERSONAL";
      if (existingPersonal && text(existing.created_by_user_id) !== viewer.userId) {
        return NextResponse.json({ success: false, error: "Kişisel Ajanda kaydı başka kullanıcıya ait." }, { status: 403 });
      }
      const existingSource = text(existing.source).toUpperCase();
      if (existingSource && !["APP", "WEB"].includes(existingSource)) {
        return NextResponse.json({ success: false, error: "Sistem kaynaklı Ajanda kaydı App üzerinden değiştirilemez." }, { status: 403 });
      }
    }

    const payload = {
      sync_key: syncKey ?? existing?.sync_key ?? null,
      firm_id: localFirmId,
      web_firm_id: webFirmId,
      title: title || "Silinen Ajanda Kaydı",
      note: nullableString(record.note),
      status: Number(record.status ?? 0) === 1 ? 1 : 0,
      priority: Math.min(2, Math.max(0, Number(record.priority ?? 1))),
      progress: Math.min(100, Math.max(0, Number(record.progress ?? 0))),
      type: nullableString(record.type)?.toUpperCase() ?? "TASK",
      category: isPersonal ? "PERSONAL" : nullableString(record.category),
      due_at: millisToIso(record.due_at_millis),
      end_at: millisToIso(record.end_at_millis),
      completed_at: millisToIso(record.completed_at_millis),
      location: nullableString(record.location),
      meeting_link: nullableString(record.meeting_link),
      assigned_employee_local_id: nullableNumber(record.assigned_employee_local_id),
      assigned_employee_remote_id: nullableString(record.assigned_employee_remote_id),
      assigned_to: nullableString(record.assigned_to),
      assigned_by: nullableString(record.assigned_by),
      created_by_user_id: existing?.created_by_user_id ?? viewer.userId,
      participants_csv: nullableString(record.participants_csv),
      is_all_day: bool(record.is_all_day),
      module_ref: isPersonal ? "PERSONAL" : nullableString(record.module_ref),
      module_ref_id: nullableNumber(record.module_ref_id),
      module_remote_id: nullableString(record.module_remote_id),
      parent_task_id: nullableNumber(record.parent_task_id),
      parent_remote_id: nullableString(record.parent_remote_id),
      remind_minutes_csv: nullableString(record.remind_minutes_csv),
      remind_at: millisToIso(record.remind_at_millis),
      repeat_type: nullableString(record.repeat_type)?.toUpperCase() ?? null,
      repeat_until: millisToIso(record.repeat_until_millis),
      source: nullableString(record.source)?.toUpperCase() ?? "APP",
      is_archived: operation === "ARCHIVE" ? true : bool(record.is_archived),
      is_deleted: operation === "DELETE" ? true : bool(record.is_deleted),
      deleted_at: operation === "DELETE" ? millisToIso(record.deleted_at_millis) ?? new Date().toISOString() : millisToIso(record.deleted_at_millis),
      app_created_at: nullableNumber(record.created_at_millis),
      app_updated_at: nullableNumber(record.updated_at_millis),
    };

    let saved: SavedAgendaRow | null = null;
    if (existing?.id) {
      const { data, error } = await supabase
        .from("ajanda_tasks")
        .update(payload)
        .eq("id", existing.id)
        .eq("web_firm_id", webFirmId)
        .select("id,sync_key")
        .single();
      if (error) throw error;
      saved = (data ?? null) as SavedAgendaRow | null;
    } else {
      const { data, error } = await supabase
        .from("ajanda_tasks")
        .insert(payload)
        .select("id,sync_key")
        .single();
      if (error) throw error;
      saved = (data ?? null) as SavedAgendaRow | null;
    }

    if (!saved?.id) throw new Error("Ajanda kaydı yazılamadı.");

    return NextResponse.json({
      success: true,
      remote_id: saved.id,
      sync_key: saved.sync_key ?? syncKey,
      local_id: localId,
      scope: isPersonal ? "PERSONAL" : "FIRM",
    });
  } catch (error: any) {
    console.error("Ajanda mobile push exception:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Beklenmeyen sunucu hatası" },
      { status: Number(error?.status) || 500 }
    );
  }
}
