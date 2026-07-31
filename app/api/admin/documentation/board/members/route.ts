import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TABLE = "documentation_board_members";

function ok(data: any, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

function fail(error: any, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error ?? "Bilinmeyen hata"),
    },
    {
      status,
    }
  );
}

function normalize(row: any) {
  return {
    id: row.id,
    firmId: row.firm_id,
    employeeId: row.employee_id,

    memberType: row.member_type,

    fullName: row.full_name,

    organizationName: row.organization_name,

    title: row.title,

    department: row.department,

    boardRole: row.board_role,

    email: row.email,

    phone: row.phone,

    notes: row.notes,

    hasVotingRight:
      row.has_voting_right === true,

    isActive:
      row.is_active !== false,

    isDeleted:
      row.is_deleted === true,

    startDateMillis:
      row.start_date_millis,

    endDateMillis:
      row.end_date_millis,

    createdAtMillis:
      row.created_at_millis,

    updatedAtMillis:
      row.updated_at_millis,
  };
}

/* -------------------------------------------------- */
/* GET */
/* -------------------------------------------------- */

export async function GET(
  request: NextRequest
) {
  try {
    const firmId =
      request.nextUrl.searchParams.get(
        "firmId"
      );

    if (!firmId) {
      return fail(
        "firmId zorunludur.",
        400
      );
    }

    const { data, error } =
      await supabase
        .from(TABLE)
        .select("*")
        .eq("firm_id", firmId)
        .eq("is_deleted", false)
        .order("board_role", {
          ascending: true,
        })
        .order("full_name", {
          ascending: true,
        });

    if (error) {
      throw error;
    }

    return ok({
      members:
        (data ?? []).map(normalize),
    });
  } catch (e) {
    return fail(e);
  }
}

/* -------------------------------------------------- */
/* POST */
/* -------------------------------------------------- */

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    if (!body.firmId) {
      return fail(
        "Firma zorunludur.",
        400
      );
    }

    if (!body.fullName) {
      return fail(
        "Ad Soyad zorunludur.",
        400
      );
    }

    const now = Date.now();

    const payload = {
      firm_id: body.firmId,

      employee_id:
        body.memberType ===
        "EMPLOYEE"
          ? body.employeeId || null
          : null,

      member_type:
        body.memberType ||
        "EMPLOYEE",

      full_name:
        body.fullName,

      organization_name:
        body.organizationName ||
        null,

      title:
        body.title || null,

      department:
        body.department || null,

      board_role:
        body.boardRole ||
        "MEMBER",

      email:
        body.email || null,

      phone:
        body.phone || null,

      notes:
        body.notes || null,

      has_voting_right:
        body.hasVotingRight !== false,

      is_active:
        body.isActive !== false,

      is_deleted: false,

      start_date_millis:
        body.startDateMillis ||
        null,

      end_date_millis:
        body.endDateMillis ||
        null,

      created_at_millis:
        now,

      updated_at_millis:
        now,

      updated_at:
        new Date(
          now
        ).toISOString(),
    };
        const { data, error } =
      await supabase
        .from(TABLE)
        .insert(payload)
        .select()
        .single();

    if (error) {
      throw error;
    }

    return ok(
      {
        member: normalize(data),
      },
      201
    );
  } catch (e) {
    return fail(e);
  }
}