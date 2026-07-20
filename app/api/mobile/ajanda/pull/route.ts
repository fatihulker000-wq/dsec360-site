import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const firmId = parsePositiveLong(searchParams.get("firm_id"));
    const webFirmId = searchParams.get("web_firm_id")?.trim() || null;
    const updatedAfterMillis = Number(
      searchParams.get("updated_after_millis") ?? 0
    );

    const limitValue = Number(searchParams.get("limit") ?? 250);
    const limit = Math.min(
      500,
      Math.max(
        1,
        Number.isFinite(limitValue) ? limitValue : 250
      )
    );

    if (!firmId && !webFirmId) {
      return NextResponse.json(
        {
          success: false,
          error: "firm_id or web_firm_id required",
        },
        { status: 400 }
      );
    }

    let query = supabase
      .from("ajanda_tasks")
      .select(
        `
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
        `
      )
      .order("updated_at", {
        ascending: true,
      })
      .limit(limit);

    if (webFirmId) {
      query = query.eq("web_firm_id", webFirmId);
    } else if (firmId) {
      query = query.eq("firm_id", firmId);
    }

    if (
      Number.isFinite(updatedAfterMillis) &&
      updatedAfterMillis > 0
    ) {
      query = query.gt(
        "updated_at",
        new Date(updatedAfterMillis).toISOString()
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Ajanda pull error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const records = (data ?? []).map((item) => ({
      remote_id: item.id,
      sync_key: item.sync_key,

      firm_id: item.firm_id,
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

      assigned_employee_local_id:
        item.assigned_employee_local_id,

      assigned_employee_remote_id:
        item.assigned_employee_remote_id,

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

      server_updated_at_millis:
        isoToMillis(item.updated_at),
    }));

    const nextCursor =
      records.length > 0
        ? records[records.length - 1]
            .server_updated_at_millis
        : updatedAfterMillis;

    return NextResponse.json({
      success: true,
      count: records.length,
      records,
      next_updated_after_millis: nextCursor,
      has_more: records.length >= limit,
    });
  } catch (error) {
    console.error("Ajanda pull route exception:", error);

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