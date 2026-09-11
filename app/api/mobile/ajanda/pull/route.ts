import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

type RawRow = Record<string, any>;
const text = (v: unknown) => String(v ?? "").trim();
const isoToMillis = (v: string | null | undefined) => {
  if (!v) return null;
  const n = new Date(v).getTime();
  return Number.isFinite(n) ? n : null;
};
const booleanToInt = (v: unknown) => v === true ? 1 : 0;
const parsePositiveLong = (v: string | null) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const syncMillis = (row: RawRow) => {
  const appMs = Number(row.app_updated_at ?? 0);
  const dbMs = isoToMillis(row.updated_at) ?? 0;
  const createdMs = Number(row.app_created_at ?? 0) || (isoToMillis(row.created_at) ?? 0);
  return Math.max(
    Number.isFinite(appMs) ? appMs : 0,
    dbMs,
    Number.isFinite(createdMs) ? createdMs : 0
  );
};

function requireMobileKey(req: NextRequest) {
  const configured = text(process.env.DSEC_MOBILE_API_KEY || "dsec_mobile_123");
  if (text(req.headers.get("x-api-key")) !== configured) {
    throw Object.assign(new Error("Geçersiz mobil API anahtarı."), { status: 401 });
  }
}

async function resolveViewer(req: NextRequest) {
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

  let ids: string[] = [];
  const role = text(user.role).toLowerCase();
  if (role === "super_admin" || role === "admin") {
    const { data, error } = await supabase.from("companies").select("id").eq("is_active", true);
    if (error) throw error;
    ids = (data ?? []).map((x) => text(x.id)).filter(Boolean);
  } else {
    const { data, error } = await supabase.from("user_firm_access").select("firm_id").eq("user_id", user.id);
    if (error) throw error;
    ids = (data ?? []).map((x) => text(x.firm_id)).filter(Boolean);
    if (!ids.length && text(user.company_id)) ids = [text(user.company_id)];
    if (ids.length) {
      const { data: active, error: e2 } = await supabase.from("companies").select("id").in("id", [...new Set(ids)]).eq("is_active", true);
      if (e2) throw e2;
      ids = (active ?? []).map((x) => text(x.id)).filter(Boolean);
    }
  }

  return { userId: text(user.id), allowedFirmIds: [...new Set(ids)] };
}

async function resolveFirm(firmId: number | null, webFirmId: string | null, allowed: string[]) {
  let webId = webFirmId;
  if (!webId && firmId) {
    const { data, error } = await supabase.from("companies").select("id,local_firm_id").eq("local_firm_id", firmId).eq("is_active", true).maybeSingle();
    if (error) throw error;
    webId = text(data?.id) || null;
  }
  if (!webId || !allowed.includes(webId)) throw Object.assign(new Error("Firma yetkisi bulunmuyor veya firma pasif."), { status: 403 });

  const { data, error } = await supabase.from("companies").select("id,local_firm_id").eq("id", webId).eq("is_active", true).maybeSingle();
  if (error) throw error;
  if (!data?.id) throw Object.assign(new Error("Aktif firma bulunamadı."), { status: 403 });
  const localId = Number(data.local_firm_id ?? firmId);
  if (!Number.isFinite(localId) || localId <= 0) throw Object.assign(new Error("Firma local_firm_id bilgisi eksik."), { status: 400 });
  return { webFirmId: webId, localFirmId: Math.trunc(localId) };
}

const SELECT = `id,sync_key,firm_id,web_firm_id,title,note,status,priority,progress,type,category,due_at,end_at,completed_at,location,meeting_link,assigned_employee_local_id,assigned_employee_remote_id,assigned_to,assigned_by,created_by_user_id,participants_csv,is_all_day,module_ref,module_ref_id,module_remote_id,parent_task_id,parent_remote_id,remind_minutes_csv,remind_at,repeat_type,repeat_until,source,is_archived,is_deleted,deleted_at,app_created_at,app_updated_at,created_at,updated_at`;

function toRecord(item: RawRow, localFirmId: number) {
  return {
    remote_id: item.id,
    sync_key: item.sync_key,
    firm_id: localFirmId,
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
    created_at_millis: item.app_created_at ?? isoToMillis(item.created_at) ?? Date.now(),
    updated_at_millis: item.app_updated_at ?? isoToMillis(item.updated_at) ?? Date.now(),
    server_updated_at_millis: syncMillis(item),
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const viewer = await resolveViewer(req);
    const { searchParams } = new URL(req.url);
    const firmId = parsePositiveLong(searchParams.get("firm_id"));
    const webFirmId = text(searchParams.get("web_firm_id")) || null;
    const scope = text(searchParams.get("scope") || "FIRM").toUpperCase();
    const cursor = Math.max(0, Number(searchParams.get("updated_after_millis") ?? 0) || 0);
    const requestedLimit = Number(searchParams.get("limit") ?? 250);
    const limit = Math.min(500, Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 250));
    const afterIso = cursor > 0 ? new Date(cursor).toISOString() : null;

    // PERSONAL_ALL: seçili firmadan bağımsız, oturum kullanıcısının
    // bütün AKTİF ve YETKİLİ firmalarındaki kişisel kayıtlarını tek akışta döndürür.
    if (scope === "PERSONAL_ALL") {
      if (!viewer.allowedFirmIds.length) {
        return NextResponse.json({
          success: true, count: 0, records: [],
          next_updated_after_millis: cursor, has_more: false
        });
      }

      let query = supabase
        .from("ajanda_tasks")
        .select(SELECT)
        .in("web_firm_id", viewer.allowedFirmIds)
        .eq("category", "PERSONAL")
        .eq("created_by_user_id", viewer.userId)
        .order("app_updated_at", { ascending: true, nullsFirst: false })
        .order("updated_at", { ascending: true, nullsFirst: false })
        .limit(limit);

      if (cursor > 0 && afterIso) {
        query = query.or(`app_updated_at.gt.${cursor},updated_at.gt.${afterIso}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as RawRow[];
      const records = rows.map((x) => {
        const localId = Number(x.firm_id ?? 0);
        return toRecord(x, Number.isFinite(localId) && localId > 0 ? Math.trunc(localId) : 0);
      });

      const nextCursor = rows.length
        ? Math.max(cursor, ...rows.map(syncMillis))
        : cursor;

      return NextResponse.json({
        success: true,
        count: records.length,
        records,
        next_updated_after_millis: nextCursor,
        has_more: rows.length >= limit,
        scope: "PERSONAL_ALL"
      });
    }

    // FIRM: yalnız seçili firmanın ortak ajandası; PERSONAL kayıtlar hariç.
    if (!firmId && !webFirmId) {
      return NextResponse.json(
        { success: false, error: "firm_id or web_firm_id required" },
        { status: 400 }
      );
    }

    const resolved = await resolveFirm(firmId, webFirmId, viewer.allowedFirmIds);

    let firmQuery = supabase
      .from("ajanda_tasks")
      .select(SELECT)
      .eq("web_firm_id", resolved.webFirmId)
      .in("source", ["APP", "WEB"])
      .or("category.is.null,category.neq.PERSONAL")
      .order("app_updated_at", { ascending: true, nullsFirst: false })
      .order("updated_at", { ascending: true, nullsFirst: false })
      .limit(limit);

    if (cursor > 0 && afterIso) {
      firmQuery = firmQuery.or(`app_updated_at.gt.${cursor},updated_at.gt.${afterIso}`);
    }

    const firmRes = await firmQuery;
    if (firmRes.error) throw firmRes.error;

    const rows = (firmRes.data ?? []) as RawRow[];
    const records = rows.map((x) => toRecord(x, resolved.localFirmId));
    const nextCursor = rows.length
      ? Math.max(cursor, ...rows.map(syncMillis))
      : cursor;

    return NextResponse.json({
      success: true,
      count: records.length,
      records,
      next_updated_after_millis: nextCursor,
      has_more: rows.length >= limit,
      scope: "FIRM"
    });
  } catch (error: any) {
    console.error("Ajanda mobile pull exception:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Beklenmeyen sunucu hatası" },
      { status: Number(error?.status) || 500 }
    );
  }
}
