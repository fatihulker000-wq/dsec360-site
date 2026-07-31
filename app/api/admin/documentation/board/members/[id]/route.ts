import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TABLE = "documentation_board_members";

function fail(error: unknown, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error ?? "Bilinmeyen hata"),
    },
    { status }
  );
}

type Context = {
  params: Promise<{
    id: string;
  }>;
};

/* ------------------------------------------------ */
/* PATCH */
/* ------------------------------------------------ */

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const now = Date.now();

    const payload: Record<string, unknown> = {
      updated_at: new Date(now).toISOString(),
      updated_at_millis: now,
    };

    if ("employeeId" in body) {
      payload.employee_id =
        body.employeeId || null;
    }

    if ("memberType" in body) {
      payload.member_type =
        body.memberType;
    }

    if ("fullName" in body) {
      payload.full_name =
        body.fullName;
    }

    if ("organizationName" in body) {
      payload.organization_name =
        body.organizationName || null;
    }

    if ("title" in body) {
      payload.title =
        body.title || null;
    }

    if ("department" in body) {
      payload.department =
        body.department || null;
    }

    if ("boardRole" in body) {
      payload.board_role =
        body.boardRole;
    }

    if ("email" in body) {
      payload.email =
        body.email || null;
    }

    if ("phone" in body) {
      payload.phone =
        body.phone || null;
    }

    if ("notes" in body) {
      payload.notes =
        body.notes || null;
    }

    if ("hasVotingRight" in body) {
      payload.has_voting_right =
        body.hasVotingRight;
    }

    if ("isActive" in body) {
      payload.is_active =
        body.isActive;
    }

    if ("startDateMillis" in body) {
      payload.start_date_millis =
        body.startDateMillis || null;
    }

    if ("endDateMillis" in body) {
      payload.end_date_millis =
        body.endDateMillis || null;
    }

    const { data, error } =
      await supabase
        .from(TABLE)
        .update(payload)
        .eq("id", id)
        .select()
        .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      member: data,
    });

  } catch (e) {
    return fail(e);
  }
}
/* ------------------------------------------------ */
/* DELETE (Soft Delete) */
/* ------------------------------------------------ */

export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;

    const now = Date.now();

    const { error } = await supabase
      .from(TABLE)
      .update({
        is_deleted: true,
        is_active: false,

        updated_at: new Date(
          now
        ).toISOString(),

        updated_at_millis: now,
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message:
        "Kurul üyesi silindi.",
    });

  } catch (e) {
    return fail(e);
  }
}