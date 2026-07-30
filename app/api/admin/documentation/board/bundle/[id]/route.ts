import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  mapBoardAgendaItems,
  mapBoardDecisions,
  mapBoardMeeting,
  mapBoardParticipants,
} from "@/lib/documentation/board/mapper";

import type {
  BoardMeetingBundle,
} from "@/lib/documentation/board/types";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

export const runtime =
  "nodejs";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const BOARD_MEETINGS_TABLE =
  "documentation_board_meetings";

const BOARD_AGENDA_TABLE =
  "documentation_board_agenda";

const BOARD_PARTICIPANTS_TABLE =
  "documentation_board_participants";

const BOARD_DECISIONS_TABLE =
  "documentation_board_decisions";

type UnknownRecord =
  Record<string, unknown>;

type RouteContext = {
  params:
    | Promise<{
        id: string;
      }>
    | {
        id: string;
      };
};

function createSupabaseAdmin() {
  if (!supabaseUrl) {
    throw new Error(
      "SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_URL tanımlı değil."
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

function normalizeText(
  value: unknown
): string {
  return String(
    value ?? ""
  ).trim();
}

async function getRouteId(
  context: RouteContext
): Promise<string> {
  const params =
    await Promise.resolve(
      context.params
    );

  return normalizeText(
    params.id
  );
}

function jsonSuccess(
  data: UnknownRecord,
  status = 200
) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    }
  );
}

function jsonError(
  message: string,
  status = 500,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: message,

      ...(details !== undefined
        ? {
            details,
          }
        : {}),
    },
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    }
  );
}

/**
 * GET
 *
 * Tek kurul toplantısının tüm detaylarını
 * tek istekte döndürür.
 *
 * GET:
 * /api/admin/documentation/board/bundle/{id}
 *
 * Dönen veriler:
 * - meeting
 * - agenda
 * - participants
 * - decisions
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const meetingId =
      await getRouteId(
        context
      );

    if (!meetingId) {
      return jsonError(
        "Toplantı ID bilgisi zorunludur.",
        400
      );
    }

    const supabase =
      createSupabaseAdmin();

    /*
     * Önce toplantı kaydı kontrol edilir.
     */
    const {
      data: meetingRow,
      error: meetingError,
    } =
      await supabase
        .from(
          BOARD_MEETINGS_TABLE
        )
        .select("*")
        .eq(
          "id",
          meetingId
        )
        .maybeSingle();

    if (meetingError) {
      console.error(
        "Kurul toplantısı bundle için alınamadı:",
        meetingError
      );

      return jsonError(
        "Kurul toplantısı alınamadı.",
        500,
        meetingError.message
      );
    }

    if (!meetingRow) {
      return jsonError(
        "Kurul toplantısı bulunamadı.",
        404
      );
    }

    const meeting =
      mapBoardMeeting(
        meetingRow
      );

    if (meeting.isDeleted) {
      return jsonError(
        "Silinmiş kurul toplantısının detayları görüntülenemez.",
        410
      );
    }

    /*
     * Toplantıya bağlı alt kayıtlar paralel alınır.
     */
    const [
      agendaResult,
      participantsResult,
      decisionsResult,
    ] =
      await Promise.all([
        supabase
          .from(
            BOARD_AGENDA_TABLE
          )
          .select("*")
          .eq(
            "meeting_id",
            meetingId
          )
          .eq(
            "is_deleted",
            false
          )
          .order(
            "item_no",
            {
              ascending: true,
            }
          )
          .order(
            "created_at_millis",
            {
              ascending: true,
            }
          ),

        supabase
          .from(
            BOARD_PARTICIPANTS_TABLE
          )
          .select("*")
          .eq(
            "meeting_id",
            meetingId
          )
          .eq(
            "is_deleted",
            false
          )
          .order(
            "full_name",
            {
              ascending: true,
            }
          )
          .order(
            "created_at_millis",
            {
              ascending: true,
            }
          ),

        supabase
          .from(
            BOARD_DECISIONS_TABLE
          )
          .select("*")
          .eq(
            "meeting_id",
            meetingId
          )
          .eq(
            "is_deleted",
            false
          )
          .order(
            "created_at_millis",
            {
              ascending: true,
            }
          ),
      ]);

    if (
      agendaResult.error
    ) {
      console.error(
        "Kurul gündem maddeleri alınamadı:",
        agendaResult.error
      );

      return jsonError(
        "Kurul gündem maddeleri alınamadı.",
        500,
        agendaResult.error
          .message
      );
    }

    if (
      participantsResult.error
    ) {
      console.error(
        "Kurul katılımcıları alınamadı:",
        participantsResult.error
      );

      return jsonError(
        "Kurul katılımcıları alınamadı.",
        500,
        participantsResult
          .error.message
      );
    }

    if (
      decisionsResult.error
    ) {
      console.error(
        "Kurul kararları alınamadı:",
        decisionsResult.error
      );

      return jsonError(
        "Kurul kararları alınamadı.",
        500,
        decisionsResult
          .error.message
      );
    }

    const agenda =
      mapBoardAgendaItems(
        agendaResult.data ?? []
      );

    const participants =
      mapBoardParticipants(
        participantsResult.data ?? []
      );

    const decisions =
      mapBoardDecisions(
        decisionsResult.data ?? []
      );

    const bundle:
      BoardMeetingBundle = {
        meeting,
        agenda,
        participants,
        decisions,
      };

    return jsonSuccess({
      bundle,

      data: bundle,

      meeting,

      agenda,

      participants,

      decisions,

      counts: {
        agenda:
          agenda.length,

        participants:
          participants.length,

        decisions:
          decisions.length,

        openDecisions:
          decisions.filter(
            (decision) =>
              decision.decisionStatus ===
                "OPEN" ||
              decision.decisionStatus ===
                "IN_PROGRESS"
          ).length,

        completedDecisions:
          decisions.filter(
            (decision) =>
              decision.decisionStatus ===
              "COMPLETED"
          ).length,

        unsignedParticipants:
          participants.filter(
            (participant) =>
              (
                participant.attendanceStatus ===
                  "ATTENDED" ||
                participant.attendanceStatus ===
                  "ONLINE"
              ) &&
              participant.signatureStatus ===
                "NOT_SIGNED"
          ).length,
      },

      generatedAtMillis:
        Date.now(),
    });
  } catch (error) {
    console.error(
      "Kurul toplantısı bundle GET hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul toplantısı detayları alınırken beklenmeyen bir hata oluştu.",
      500
    );
  }
}