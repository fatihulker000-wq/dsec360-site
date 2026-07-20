import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function nullableString(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function nullableDate(value: unknown): string | null {
  const text = nullableString(value);

  if (!text) return null;

  const millis = new Date(text).getTime();

  if (!Number.isFinite(millis)) {
    return null;
  }

  return new Date(millis).toISOString();
}

function normalizeTaskType(value: unknown): string {
  const allowed = new Set([
    "TASK",
    "MEETING",
    "INSPECTION",
    "TRAINING",
    "VISIT",
    "REMINDER",
  ]);

  const normalized = String(value ?? "TASK")
    .trim()
    .toUpperCase();

  return allowed.has(normalized) ? normalized : "TASK";
}

function normalizePriority(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return 1;

  return Math.min(2, Math.max(0, Math.trunc(parsed)));
}

export async function GET() {
  try {
    const { data, error } = await supabase
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
      .eq("is_deleted", false)
      .eq("is_archived", false)
      .order("status", {
        ascending: true,
      })
      .order("due_at", {
        ascending: true,
        nullsFirst: false,
      })
      .order("updated_at", {
        ascending: false,
      });

    if (error) {
      console.error("Admin agenda GET error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length ?? 0,
      records: data ?? [],
    });
  } catch (error) {
    console.error("Admin agenda GET exception:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Ajanda kayıtları alınamadı.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const firmId = Number(body?.firm_id);
    const title = String(body?.title ?? "").trim();

    if (!Number.isFinite(firmId) || firmId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Geçerli bir firma ID gereklidir.",
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Görev başlığı zorunludur.",
        },
        { status: 400 }
      );
    }

    const dueAt = nullableDate(body?.due_at);
    const endAt = nullableDate(body?.end_at);

    if (
      dueAt &&
      endAt &&
      new Date(endAt).getTime() < new Date(dueAt).getTime()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Bitiş zamanı başlangıç zamanından önce olamaz.",
        },
        { status: 400 }
      );
    }

    const now = Date.now();

    const payload = {
      sync_key: randomUUID(),

      firm_id: Math.trunc(firmId),
      web_firm_id: nullableString(body?.web_firm_id),

      title,
      note: nullableString(body?.note),

      status: 0,
      priority: normalizePriority(body?.priority),
      progress: 0,

      type: normalizeTaskType(body?.type),
      category: nullableString(body?.category),

      due_at: dueAt,
      end_at: endAt,
      completed_at: null,

      location: nullableString(body?.location),
      meeting_link: nullableString(body?.meeting_link),

      assigned_employee_local_id: null,
      assigned_employee_remote_id: nullableString(
        body?.assigned_employee_remote_id
      ),

      assigned_to: nullableString(body?.assigned_to),
      assigned_by: nullableString(body?.assigned_by),
      created_by_user_id: nullableString(
        body?.created_by_user_id
      ),

      participants_csv: nullableString(body?.participants_csv),
      is_all_day: body?.is_all_day === true,

      module_ref: nullableString(body?.module_ref),
      module_ref_id:
        Number.isFinite(Number(body?.module_ref_id)) &&
        Number(body?.module_ref_id) > 0
          ? Math.trunc(Number(body?.module_ref_id))
          : null,

      module_remote_id: nullableString(body?.module_remote_id),

      parent_task_id: null,
      parent_remote_id: nullableString(body?.parent_remote_id),

      remind_minutes_csv: nullableString(
        body?.remind_minutes_csv
      ),

      remind_at: nullableDate(body?.remind_at),

      repeat_type: nullableString(body?.repeat_type)
        ?.toUpperCase() ?? null,

      repeat_until: nullableDate(body?.repeat_until),

      source: "WEB",

      is_archived: false,
      is_deleted: false,
      deleted_at: null,

      app_created_at: now,
      app_updated_at: now,
    };

    const { data, error } = await supabase
      .from("ajanda_tasks")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("Admin agenda POST error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        record: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin agenda POST exception:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Ajanda kaydı oluşturulamadı.",
      },
      { status: 500 }
    );
  }
}