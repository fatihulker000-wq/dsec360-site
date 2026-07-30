import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import type {
  BoardDashboard,
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

const BOARD_PARTICIPANTS_TABLE =
  "documentation_board_participants";

const BOARD_DECISIONS_TABLE =
  "documentation_board_decisions";

type UnknownRecord =
  Record<string, unknown>;

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

function getDateRanges() {
  const now =
    new Date();

  const currentYear =
    now.getFullYear();

  const currentMonth =
    now.getMonth();

  const yearStartMillis =
    new Date(
      currentYear,
      0,
      1,
      0,
      0,
      0,
      0
    ).getTime();

  const nextYearStartMillis =
    new Date(
      currentYear + 1,
      0,
      1,
      0,
      0,
      0,
      0
    ).getTime();

  const monthStartMillis =
    new Date(
      currentYear,
      currentMonth,
      1,
      0,
      0,
      0,
      0
    ).getTime();

  const nextMonthStartMillis =
    new Date(
      currentYear,
      currentMonth + 1,
      1,
      0,
      0,
      0,
      0
    ).getTime();

  return {
    nowMillis:
      now.getTime(),

    yearStartMillis,

    nextYearStartMillis,

    monthStartMillis,

    nextMonthStartMillis,
  };
}

type CountResult = {
  count: number | null;
  error: {
    message?: string;
  } | null;
};

function ensureCountResult(
  result: CountResult,
  errorMessage: string
): number {
  if (result.error) {
    throw new Error(
      result.error.message ||
        errorMessage
    );
  }

  return result.count ?? 0;
}

/**
 * GET
 *
 * Örnek:
 *
 * /api/admin/documentation/board/dashboard?firmId=11
 */
export async function GET(
  request: NextRequest
) {
  try {
    const firmId =
      normalizeText(
        request.nextUrl
          .searchParams
          .get("firmId")
      );

    if (!firmId) {
      return jsonError(
        "firmId parametresi zorunludur.",
        400
      );
    }

    const supabase =
      createSupabaseAdmin();

    const {
      nowMillis,
      yearStartMillis,
      nextYearStartMillis,
      monthStartMillis,
      nextMonthStartMillis,
    } =
      getDateRanges();

    /*
     * Bütün sorgular yalnızca aktif,
     * silinmemiş kayıtlarda çalışır.
     */
    const [
      totalMeetingsResult,
      meetingsThisYearResult,
      meetingsThisMonthResult,
      plannedMeetingsResult,
      completedMeetingsResult,
      openDecisionsResult,
      completedDecisionsResult,
      overdueDecisionsResult,
      unsignedParticipantsResult,
      totalParticipantsResult,
    ] =
      await Promise.all([
        /*
         * Toplam toplantı
         */
        supabase
          .from(
            BOARD_MEETINGS_TABLE
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "firm_id",
            firmId
          )
          .eq(
            "is_deleted",
            false
          ),

        /*
         * Bu yıl yapılan veya planlanan toplantılar
         */
        supabase
          .from(
            BOARD_MEETINGS_TABLE
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "firm_id",
            firmId
          )
          .eq(
            "is_deleted",
            false
          )
          .gte(
            "meeting_date_millis",
            yearStartMillis
          )
          .lt(
            "meeting_date_millis",
            nextYearStartMillis
          ),

        /*
         * Bu ay yapılan veya planlanan toplantılar
         */
        supabase
          .from(
            BOARD_MEETINGS_TABLE
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "firm_id",
            firmId
          )
          .eq(
            "is_deleted",
            false
          )
          .gte(
            "meeting_date_millis",
            monthStartMillis
          )
          .lt(
            "meeting_date_millis",
            nextMonthStartMillis
          ),

        /*
         * Planlanan toplantılar
         */
        supabase
          .from(
            BOARD_MEETINGS_TABLE
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "firm_id",
            firmId
          )
          .eq(
            "is_deleted",
            false
          )
          .eq(
            "status",
            "PLANNED"
          ),

        /*
         * Tamamlanan toplantılar
         */
        supabase
          .from(
            BOARD_MEETINGS_TABLE
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "firm_id",
            firmId
          )
          .eq(
            "is_deleted",
            false
          )
          .eq(
            "status",
            "COMPLETED"
          ),

        /*
         * Açık kararlar:
         *
         * OPEN veya IN_PROGRESS
         */
        supabase
          .from(
            BOARD_DECISIONS_TABLE
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "firm_id",
            firmId
          )
          .eq(
            "is_deleted",
            false
          )
          .in(
            "decision_status",
            [
              "OPEN",
              "IN_PROGRESS",
            ]
          ),

        /*
         * Tamamlanan kararlar
         */
        supabase
          .from(
            BOARD_DECISIONS_TABLE
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "firm_id",
            firmId
          )
          .eq(
            "is_deleted",
            false
          )
          .eq(
            "decision_status",
            "COMPLETED"
          ),

        /*
         * Geciken kararlar:
         *
         * - Termin tarihi geçmiş
         * - Açık veya devam ediyor
         * - Silinmemiş
         */
        supabase
          .from(
            BOARD_DECISIONS_TABLE
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "firm_id",
            firmId
          )
          .eq(
            "is_deleted",
            false
          )
          .in(
            "decision_status",
            [
              "OPEN",
              "IN_PROGRESS",
            ]
          )
          .not(
            "due_date_millis",
            "is",
            null
          )
          .lt(
            "due_date_millis",
            nowMillis
          ),

        /*
         * İmzası eksik katılımcılar
         *
         * Toplantıya katılan veya online katılan,
         * fakat henüz imzalamayan kişiler.
         */
        supabase
          .from(
            BOARD_PARTICIPANTS_TABLE
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "firm_id",
            firmId
          )
          .eq(
            "is_deleted",
            false
          )
          .in(
            "attendance_status",
            [
              "ATTENDED",
              "ONLINE",
            ]
          )
          .eq(
            "signature_status",
            "NOT_SIGNED"
          ),

        /*
         * Toplam katılımcı kaydı
         */
        supabase
          .from(
            BOARD_PARTICIPANTS_TABLE
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "firm_id",
            firmId
          )
          .eq(
            "is_deleted",
            false
          ),
      ]);

    const dashboard:
      BoardDashboard = {
        totalMeetings:
          ensureCountResult(
            totalMeetingsResult,
            "Toplam toplantı sayısı alınamadı."
          ),

        meetingsThisYear:
          ensureCountResult(
            meetingsThisYearResult,
            "Bu yılın toplantı sayısı alınamadı."
          ),

        meetingsThisMonth:
          ensureCountResult(
            meetingsThisMonthResult,
            "Bu ayın toplantı sayısı alınamadı."
          ),

        plannedMeetings:
          ensureCountResult(
            plannedMeetingsResult,
            "Planlanan toplantı sayısı alınamadı."
          ),

        completedMeetings:
          ensureCountResult(
            completedMeetingsResult,
            "Tamamlanan toplantı sayısı alınamadı."
          ),

        openDecisions:
          ensureCountResult(
            openDecisionsResult,
            "Açık karar sayısı alınamadı."
          ),

        completedDecisions:
          ensureCountResult(
            completedDecisionsResult,
            "Tamamlanan karar sayısı alınamadı."
          ),

        overdueDecisions:
          ensureCountResult(
            overdueDecisionsResult,
            "Geciken karar sayısı alınamadı."
          ),

        unsignedParticipants:
          ensureCountResult(
            unsignedParticipantsResult,
            "İmzası eksik katılımcı sayısı alınamadı."
          ),

        totalParticipants:
          ensureCountResult(
            totalParticipantsResult,
            "Toplam katılımcı sayısı alınamadı."
          ),
      };

    return jsonSuccess({
      dashboard,

      data:
        dashboard,

      firmId,

      generatedAtMillis:
        nowMillis,
    });
  } catch (error) {
    console.error(
      "Kurul Merkezi dashboard GET hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul dashboard verileri alınırken beklenmeyen bir hata oluştu.",
      500
    );
  }
}