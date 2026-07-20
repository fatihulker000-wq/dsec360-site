import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function nullableString(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function nullableDate(value: unknown): string | null {
  const text = nullableString(value);

  if (!text) {
    return null;
  }

  const millis = new Date(text).getTime();

  if (!Number.isFinite(millis)) {
    return null;
  }

  return new Date(millis).toISOString();
}

function normalizeStatus(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  return Number(value) === 1 ? 1 : 0;
}

function normalizePriority(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.min(2, Math.max(0, Math.trunc(parsed)));
}

function normalizeProgress(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.trunc(parsed)));
}

function normalizeTaskType(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const allowed = new Set([
    "TASK",
    "MEETING",
    "INSPECTION",
    "TRAINING",
    "VISIT",
    "REMINDER",
  ]);

  const normalized = String(value)
    .trim()
    .toUpperCase();

  return allowed.has(normalized) ? normalized : null;
}

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const recordId = String(id ?? "").trim();

    if (!recordId) {
      return NextResponse.json(
        {
          success: false,
          error: "Ajanda kayıt ID bilgisi eksik.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    const { data: current, error: currentError } = await supabase
      .from("ajanda_tasks")
      .select("*")
      .eq("id", recordId)
      .maybeSingle();

    if (currentError) {
      return NextResponse.json(
        {
          success: false,
          error: currentError.message,
        },
        { status: 500 }
      );
    }

    if (!current) {
      return NextResponse.json(
        {
          success: false,
          error: "Ajanda kaydı bulunamadı.",
        },
        { status: 404 }
      );
    }

    const payload: Record<string, unknown> = {
      app_updated_at: Date.now(),
    };

    const status = normalizeStatus(body?.status);
    const priority = normalizePriority(body?.priority);
    const progress = normalizeProgress(body?.progress);
    const taskType = normalizeTaskType(body?.type);

    if (body?.title !== undefined) {
      const title = String(body.title ?? "").trim();

      if (!title) {
        return NextResponse.json(
          {
            success: false,
            error: "Görev başlığı zorunludur.",
          },
          { status: 400 }
        );
      }

      payload.title = title;
    }

    if (body?.note !== undefined) {
      payload.note = nullableString(body.note);
    }

    if (status !== null) {
      payload.status = status;

      if (status === 1) {
        payload.progress = 100;
        payload.completed_at = new Date().toISOString();
      } else {
        payload.progress =
          progress !== null ? progress : 0;

        payload.completed_at = null;
      }
    } else if (progress !== null) {
      payload.progress = progress;
    }

    if (priority !== null) {
      payload.priority = priority;
    }

    if (taskType !== null) {
      payload.type = taskType;
    }

    if (body?.category !== undefined) {
      payload.category = nullableString(body.category);
    }

    if (body?.due_at !== undefined) {
      payload.due_at = nullableDate(body.due_at);
    }

    if (body?.end_at !== undefined) {
      payload.end_at = nullableDate(body.end_at);
    }

    if (body?.location !== undefined) {
      payload.location = nullableString(body.location);
    }

    if (body?.meeting_link !== undefined) {
      payload.meeting_link = nullableString(
        body.meeting_link
      );
    }

    if (body?.assigned_to !== undefined) {
      payload.assigned_to = nullableString(
        body.assigned_to
      );
    }

    if (body?.assigned_by !== undefined) {
      payload.assigned_by = nullableString(
        body.assigned_by
      );
    }

    if (body?.participants_csv !== undefined) {
      payload.participants_csv = nullableString(
        body.participants_csv
      );
    }

    if (body?.is_all_day !== undefined) {
      payload.is_all_day = body.is_all_day === true;
    }

    if (body?.module_ref !== undefined) {
      payload.module_ref = nullableString(
        body.module_ref
      );
    }

    if (body?.module_ref_id !== undefined) {
      const moduleRefId = Number(body.module_ref_id);

      payload.module_ref_id =
        Number.isFinite(moduleRefId) && moduleRefId > 0
          ? Math.trunc(moduleRefId)
          : null;
    }

    if (body?.remind_minutes_csv !== undefined) {
      payload.remind_minutes_csv = nullableString(
        body.remind_minutes_csv
      );
    }

    if (body?.remind_at !== undefined) {
      payload.remind_at = nullableDate(body.remind_at);
    }

    if (body?.repeat_type !== undefined) {
      const repeatType = nullableString(body.repeat_type)
        ?.toUpperCase();

      payload.repeat_type =
        repeatType &&
        ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(
          repeatType
        )
          ? repeatType
          : null;
    }

    if (body?.repeat_until !== undefined) {
      payload.repeat_until = nullableDate(
        body.repeat_until
      );
    }

    const dueAt =
      payload.due_at !== undefined
        ? payload.due_at
        : current.due_at;

    const endAt =
      payload.end_at !== undefined
        ? payload.end_at
        : current.end_at;

    if (
      dueAt &&
      endAt &&
      new Date(String(endAt)).getTime() <
        new Date(String(dueAt)).getTime()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bitiş zamanı başlangıç zamanından önce olamaz.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("ajanda_tasks")
      .update(payload)
      .eq("id", recordId)
      .eq("is_deleted", false)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Admin agenda PATCH error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Ajanda kaydı güncellenemedi.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      record: data,
    });
  } catch (error) {
    console.error("Admin agenda PATCH exception:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Ajanda kaydı güncellenemedi.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const recordId = String(id ?? "").trim();

    if (!recordId) {
      return NextResponse.json(
        {
          success: false,
          error: "Ajanda kayıt ID bilgisi eksik.",
        },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("ajanda_tasks")
      .update({
        is_deleted: true,
        deleted_at: nowIso,
        app_updated_at: Date.now(),
      })
      .eq("id", recordId)
      .eq("is_deleted", false)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Admin agenda DELETE error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ajanda kaydı bulunamadı veya daha önce silindi.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted_id: recordId,
    });
  } catch (error) {
    console.error("Admin agenda DELETE exception:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Ajanda kaydı silinemedi.",
      },
      { status: 500 }
    );
  }
}