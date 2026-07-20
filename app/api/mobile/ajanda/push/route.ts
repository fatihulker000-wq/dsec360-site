import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function millisToIso(value: unknown): string | null {
  const millis = Number(value);

  if (!Number.isFinite(millis) || millis <= 0) {
    return null;
  }

  return new Date(millis).toISOString();
}

function nullableString(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function booleanFromInt(value: unknown): boolean {
  return Number(value) === 1 || value === true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = body?.record ?? body;

    if (!record || typeof record !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "record missing",
        },
        { status: 400 }
      );
    }

    const localId = Number(record.local_id ?? 0);
    const firmId = Number(record.firm_id ?? 0);
    const title = String(record.title ?? "").trim();
    const operation = String(body?.operation ?? "UPSERT")
      .trim()
      .toUpperCase();

    const syncKey = nullableString(record.sync_key);
    const remoteId = nullableString(record.remote_id);

    if (!Number.isFinite(localId) || localId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "local_id missing",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(firmId) || firmId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "firm_id missing",
        },
        { status: 400 }
      );
    }

    if (!syncKey && !remoteId) {
      return NextResponse.json(
        {
          success: false,
          error: "sync_key or remote_id required",
        },
        { status: 400 }
      );
    }

    if (operation !== "DELETE" && title.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "title missing",
        },
        { status: 400 }
      );
    }

    const payload = {
      sync_key: syncKey,

      firm_id: firmId,
      web_firm_id: nullableString(record.web_firm_id),

      title: title || "Silinen Ajanda Kaydı",
      note: nullableString(record.note),

      status: Number(record.status ?? 0) === 1 ? 1 : 0,
      priority: Math.min(
        2,
        Math.max(0, Number(record.priority ?? 1))
      ),
      progress: Math.min(
        100,
        Math.max(0, Number(record.progress ?? 0))
      ),

      type:
        nullableString(record.type)?.toUpperCase() ?? "TASK",

      category: nullableString(record.category),

      due_at: millisToIso(record.due_at_millis),
      end_at: millisToIso(record.end_at_millis),
      completed_at: millisToIso(record.completed_at_millis),

      location: nullableString(record.location),
      meeting_link: nullableString(record.meeting_link),

      assigned_employee_local_id: nullableNumber(
        record.assigned_employee_local_id
      ),

      assigned_employee_remote_id: nullableString(
        record.assigned_employee_remote_id
      ),

      assigned_to: nullableString(record.assigned_to),
      assigned_by: nullableString(record.assigned_by),
      created_by_user_id: nullableString(
        record.created_by_user_id
      ),

      participants_csv: nullableString(record.participants_csv),
      is_all_day: booleanFromInt(record.is_all_day),

      module_ref: nullableString(record.module_ref),
      module_ref_id: nullableNumber(record.module_ref_id),
      module_remote_id: nullableString(record.module_remote_id),

      parent_task_id: nullableNumber(record.parent_task_id),
      parent_remote_id: nullableString(record.parent_remote_id),

      remind_minutes_csv: nullableString(
        record.remind_minutes_csv
      ),

      remind_at: millisToIso(record.remind_at_millis),

      repeat_type:
        nullableString(record.repeat_type)?.toUpperCase() ?? null,

      repeat_until: millisToIso(
        record.repeat_until_millis
      ),

      source: nullableString(record.source)?.toUpperCase() ?? "APP",

      is_archived:
        operation === "ARCHIVE"
          ? true
          : booleanFromInt(record.is_archived),

      is_deleted:
        operation === "DELETE"
          ? true
          : booleanFromInt(record.is_deleted),

      deleted_at:
        operation === "DELETE"
          ? millisToIso(record.deleted_at_millis) ??
            new Date().toISOString()
          : millisToIso(record.deleted_at_millis),

      app_created_at: nullableNumber(record.created_at_millis),
      app_updated_at: nullableNumber(record.updated_at_millis),
    };

    let query;

    if (remoteId) {
      query = supabase
        .from("ajanda_tasks")
        .update(payload)
        .eq("id", remoteId)
        .select("id, sync_key")
        .maybeSingle();
    } else {
      query = supabase
        .from("ajanda_tasks")
        .upsert(payload, {
          onConflict: "sync_key",
        })
        .select("id, sync_key")
        .single();
    }

    const { data, error } = await query;

    if (error) {
      console.error("Ajanda push error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    if (!data?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Ajanda kaydı oluşturulamadı.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      remote_id: data.id,
      sync_key: data.sync_key ?? syncKey,
      local_id: localId,
    });
  } catch (error) {
    console.error("Ajanda push route exception:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Beklenmeyen sunucu hatası",
      },
      { status: 500 }
    );
  }
}