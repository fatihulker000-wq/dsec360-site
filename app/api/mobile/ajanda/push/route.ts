import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

type MobileViewer = {
  userId: string;
  email: string;
  role: string;
  allowedFirmIds: string[];
};

type ExistingAgendaRow = {
  id: string;
  web_firm_id: string | null;
  created_by_user_id: string | null;
};

type SavedAgendaRow = {
  id: string;
  sync_key: string | null;
};

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function millisToIso(value: unknown): string | null {
  const millis = Number(value);
  if (!Number.isFinite(millis) || millis <= 0) return null;
  return new Date(millis).toISOString();
}

function nullableString(value: unknown): string | null {
  const valueText = text(value);
  return valueText.length > 0 ? valueText : null;
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function booleanFromInt(value: unknown): boolean {
  return Number(value) === 1 || value === true;
}

function expectedMobileKey(): string {
  return text(process.env.DSEC_MOBILE_API_KEY || "dsec_mobile_123");
}

async function resolveViewer(req: NextRequest): Promise<MobileViewer> {
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
    email,
    role,
    allowedFirmIds: [...new Set(firmIds)],
  };
}

async function resolveFirm(
  record: Record<string, unknown>,
  viewer: MobileViewer
): Promise<{ webFirmId: string; localFirmId: number }> {
  let webFirmId = nullableString(record.web_firm_id);
  const requestedLocalFirmId = Number(record.firm_id ?? 0);

  if (!webFirmId && Number.isFinite(requestedLocalFirmId) && requestedLocalFirmId > 0) {
    const { data, error } = await supabase
      .from("companies")
      .select("id,local_firm_id")
      .eq("local_firm_id", Math.trunc(requestedLocalFirmId))
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    webFirmId = nullableString(data?.id);
  }

  if (!webFirmId || !viewer.allowedFirmIds.includes(webFirmId)) {
    throw Object.assign(
      new Error("Bu firma kullanıcının aktif firma yetkileri arasında değil."),
      { status: 403 }
    );
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id,local_firm_id,is_active")
    .eq("id", webFirmId)
    .eq("is_active", true)
    .maybeSingle();

  if (companyError) throw companyError;
  if (!company?.id) {
    throw Object.assign(new Error("Aktif firma bulunamadı."), { status: 403 });
  }

  const localFirmId = Number(company.local_firm_id ?? requestedLocalFirmId);
  if (!Number.isFinite(localFirmId) || localFirmId <= 0) {
    throw Object.assign(new Error("Firmanın local_firm_id bilgisi eksik."), { status: 400 });
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

    const title = text(record.title);
    const operation = text(body?.operation || "UPSERT").toUpperCase();
    const syncKey = nullableString(record.sync_key);
    const remoteId = nullableString(record.remote_id);

    if (!syncKey && !remoteId) {
      return NextResponse.json(
        { success: false, error: "sync_key or remote_id required" },
        { status: 400 }
      );
    }

    if (operation !== "DELETE" && title.length === 0) {
      return NextResponse.json({ success: false, error: "title missing" }, { status: 400 });
    }

    /*
     * App Ajandası kullanıcının şahsi ajandasıdır.
     * App'te kategori özellikle başka bir değerle set edilmişse korunur;
     * boş kategori APP kaynaklı kayıtta PERSONAL yapılır.
     */
    const requestedCategory = nullableString(record.category);
    const category =
      requestedCategory ??
      (text(record.source).toUpperCase() === "APP" || !text(record.source)
        ? "PERSONAL"
        : null);

    const payload = {
      sync_key: syncKey,
      firm_id: localFirmId,
      web_firm_id: webFirmId,

      title: title || "Silinen Ajanda Kaydı",
      note: nullableString(record.note),

      status: Number(record.status ?? 0) === 1 ? 1 : 0,
      priority: Math.min(2, Math.max(0, Number(record.priority ?? 1))),
      progress: Math.min(100, Math.max(0, Number(record.progress ?? 0))),

      type: nullableString(record.type)?.toUpperCase() ?? "TASK",
      category,

      due_at: millisToIso(record.due_at_millis),
      end_at: millisToIso(record.end_at_millis),
      completed_at: millisToIso(record.completed_at_millis),

      location: nullableString(record.location),
      meeting_link: nullableString(record.meeting_link),

      assigned_employee_local_id: nullableNumber(record.assigned_employee_local_id),
      assigned_employee_remote_id: nullableString(record.assigned_employee_remote_id),
      assigned_to: nullableString(record.assigned_to),
      assigned_by: nullableString(record.assigned_by),

      // Mobil istemcinin gönderdiği kullanıcı kimliğine güvenmiyoruz.
      created_by_user_id: viewer.userId,

      participants_csv: nullableString(record.participants_csv),
      is_all_day: booleanFromInt(record.is_all_day),

      module_ref: nullableString(record.module_ref),
      module_ref_id: nullableNumber(record.module_ref_id),
      module_remote_id: nullableString(record.module_remote_id),

      parent_task_id: nullableNumber(record.parent_task_id),
      parent_remote_id: nullableString(record.parent_remote_id),

      remind_minutes_csv: nullableString(record.remind_minutes_csv),
      remind_at: millisToIso(record.remind_at_millis),

      repeat_type: nullableString(record.repeat_type)?.toUpperCase() ?? null,
      repeat_until: millisToIso(record.repeat_until_millis),

      source: nullableString(record.source)?.toUpperCase() ?? "APP",

      is_archived:
        operation === "ARCHIVE" ? true : booleanFromInt(record.is_archived),

      is_deleted:
        operation === "DELETE" ? true : booleanFromInt(record.is_deleted),

      deleted_at:
        operation === "DELETE"
          ? millisToIso(record.deleted_at_millis) ?? new Date().toISOString()
          : millisToIso(record.deleted_at_millis),

      app_created_at: nullableNumber(record.created_at_millis),
      app_updated_at: nullableNumber(record.updated_at_millis),
    };

    let existing: ExistingAgendaRow | null = null;

    if (remoteId) {
      const { data, error } = await supabase
        .from("ajanda_tasks")
        .select("id,web_firm_id,created_by_user_id")
        .eq("id", remoteId)
        .maybeSingle();

      if (error) throw error;
      existing = (data ?? null) as ExistingAgendaRow | null;

      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Güncellenecek Ajanda kaydı bulunamadı." },
          { status: 404 }
        );
      }

      if (
        text(existing.web_firm_id) !== webFirmId ||
        text(existing.created_by_user_id) !== viewer.userId
      ) {
        return NextResponse.json(
          { success: false, error: "Bu Ajanda kaydını değiştirme yetkiniz yok." },
          { status: 403 }
        );
      }
    } else if (syncKey) {
      const { data, error } = await supabase
        .from("ajanda_tasks")
        .select("id,web_firm_id,created_by_user_id")
        .eq("sync_key", syncKey)
        .maybeSingle();

      if (error) throw error;
      existing = (data ?? null) as ExistingAgendaRow | null;

      if (
        existing &&
        (text(existing.web_firm_id) !== webFirmId ||
          text(existing.created_by_user_id) !== viewer.userId)
      ) {
        return NextResponse.json(
          { success: false, error: "sync_key başka bir kullanıcı/firma kaydıyla eşleşiyor." },
          { status: 409 }
        );
      }
    }

    let result: SavedAgendaRow | null = null;

    if (existing?.id) {
      const { data, error } = await supabase
        .from("ajanda_tasks")
        .update(payload)
        .eq("id", existing.id)
        .eq("web_firm_id", webFirmId)
        .eq("created_by_user_id", viewer.userId)
        .select("id,sync_key")
        .single();

      if (error) throw error;
      result = (data ?? null) as SavedAgendaRow | null;
    } else {
      const { data, error } = await supabase
        .from("ajanda_tasks")
        .insert(payload)
        .select("id,sync_key")
        .single();

      if (error) throw error;
      result = (data ?? null) as SavedAgendaRow | null;
    }

    return NextResponse.json({
      success: true,
      remote_id: result?.id,
      sync_key: result?.sync_key ?? syncKey,
      local_id: localId,
    });
  } catch (error: any) {
    console.error("Ajanda push route exception:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Beklenmeyen sunucu hatası",
      },
      { status: Number(error?.status) || 500 }
    );
  }
}
