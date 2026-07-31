import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const firmId = String(
      body.firmId ?? ""
    ).trim();

    const meetingId = String(
      body.meetingId ?? ""
    ).trim();

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error: "Firma seçilmelidir.",
        },
        { status: 400 }
      );
    }

    if (!meetingId) {
      return NextResponse.json(
        {
          success: false,
          error: "Toplantı bilgisi eksik.",
        },
        { status: 400 }
      );
    }

    const { data: members, error: memberError } =
      await supabase
        .from("documentation_board_members")
        .select("*")
        .eq("firm_id", firmId)
        .eq("is_active", true)
        .eq("is_deleted", false);

    if (memberError) {
      throw memberError;
    }

    const { data: existing, error: existingError } =
      await supabase
        .from("documentation_board_participants")
        .select("board_member_id")
        .eq("meeting_id", meetingId)
        .eq("is_deleted", false);

    if (existingError) {
      throw existingError;
    }

    const existingIds = new Set(
      (existing ?? [])
        .map((x) => x.board_member_id)
        .filter(Boolean)
    );

    const now = Date.now();

    const rows = (members ?? [])
      .filter(
        (member) =>
          !existingIds.has(member.id)
      )
      .map((member) => ({
        firm_id: firmId,

        meeting_id: meetingId,

        board_member_id: member.id,

        employee_id:
          member.employee_id,

        member_type:
          member.member_type,

        organization_name:
          member.organization_name,

        full_name:
          member.full_name,

        title:
          member.title,

        department:
          member.department,

        participant_role:
          member.board_role,

        attendance_status:
          "INVITED",

        has_voting_right:
          member.has_voting_right,

        signature_status:
          "NOT_SIGNED",

        signed_at_millis: null,

        is_deleted: false,

        created_at_millis: now,

        updated_at_millis: now,

        updated_at:
          new Date(now).toISOString(),
      }));
          if (rows.length > 0) {
      const { error: insertError } =
        await supabase
          .from(
            "documentation_board_participants"
          )
          .insert(rows);

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({
      success: true,

      insertedCount: rows.length,

      skippedCount:
        existingIds.size,

      message:
        `${rows.length} kurul üyesi toplantıya aktarıldı.`,
    });

  } catch (e: any) {

    return NextResponse.json(
      {
        success: false,

        error:
          e?.message ??
          "Kurul üyeleri toplantıya aktarılamadı.",
      },
      {
        status: 500,
      }
    );

  }
}