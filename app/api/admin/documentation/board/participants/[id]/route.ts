import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const PARTICIPANTS_TABLE =
  "documentation_board_participants";

type UnknownRecord =
  Record<string, unknown>;

type AttendanceStatus =
  | "INVITED"
  | "ATTENDED"
  | "ABSENT"
  | "EXCUSED"
  | "ONLINE";

type ParticipantSource =
  | "BOARD_MEMBER"
  | "MANUAL";

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
        ? { details }
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

function normalizeText(
  value: unknown
): string {
  return String(
    value ?? ""
  ).trim();
}

function normalizeOptionalText(
  value: unknown
): string | null {
  const normalized =
    normalizeText(value);

  return normalized || null;
}

function normalizeBoolean(
  value: unknown,
  fallback = false
): boolean {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "number"
  ) {
    return value !== 0;
  }

  if (
    typeof value === "string"
  ) {
    const normalized =
      value
        .trim()
        .toLocaleLowerCase(
          "tr-TR"
        );

    if (
      [
        "true",
        "1",
        "yes",
        "evet",
        "var",
        "aktif",
      ].includes(normalized)
    ) {
      return true;
    }

    if (
      [
        "false",
        "0",
        "no",
        "hayır",
        "hayir",
        "yok",
        "pasif",
      ].includes(normalized)
    ) {
      return false;
    }
  }

  return fallback;
}

function normalizeAttendanceStatus(
  value: unknown
): AttendanceStatus {
  const normalized =
    normalizeText(value)
      .toUpperCase();

  if (
    normalized ===
    "NOT_ATTENDED"
  ) {
    return "ABSENT";
  }

  if (
    [
      "INVITED",
      "ATTENDED",
      "ABSENT",
      "EXCUSED",
      "ONLINE",
    ].includes(normalized)
  ) {
    return normalized as AttendanceStatus;
  }

  return "INVITED";
}

function mapAttendanceForClient(
  value: unknown
): string {
  const normalized =
    normalizeText(value)
      .toUpperCase();

  return normalized === "ABSENT"
    ? "NOT_ATTENDED"
    : normalized || "INVITED";
}

function normalizeParticipantSource(
  value: unknown
): ParticipantSource {
  return normalizeText(value)
    .toUpperCase() === "BOARD_MEMBER"
    ? "BOARD_MEMBER"
    : "MANUAL";
}

function hasProperty(
  record: UnknownRecord,
  ...keys: string[]
): boolean {
  return keys.some((key) =>
    Object.prototype.hasOwnProperty.call(
      record,
      key
    )
  );
}

function readProperty(
  record: UnknownRecord,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(
        record,
        key
      )
    ) {
      return record[key];
    }
  }

  return undefined;
}

function mapParticipant(
  row: UnknownRecord
) {
  return {
    id:
      normalizeText(
        row.id
      ),

    meetingId:
      normalizeText(
        row.meeting_id
      ),

    firmId:
      normalizeText(
        row.firm_id
      ),

    boardMemberId:
      normalizeOptionalText(
        row.board_member_id
      ),

    participantSource:
      normalizeParticipantSource(
        row.participant_source
      ),

    employeeId:
      normalizeOptionalText(
        row.employee_id
      ),

    fullName:
      normalizeText(
        row.full_name
      ),

    organizationName:
      normalizeOptionalText(
        row.organization_name
      ),

    title:
      normalizeOptionalText(
        row.title
      ),

    department:
      normalizeOptionalText(
        row.department
      ),

    participantRole:
      normalizeOptionalText(
        row.participant_role
      ),

    phone:
      normalizeOptionalText(
        row.phone
      ),

    email:
      normalizeOptionalText(
        row.email
      ),

    attendanceStatus:
      mapAttendanceForClient(
        row.attendance_status
      ),

    hasVotingRight:
      normalizeBoolean(
        row.has_voting_right,
        false
      ),

    signatureStatus:
      normalizeText(
        row.signature_status
      ) || "NOT_SIGNED",

    signedAtMillis:
      row.signed_at_millis == null
        ? null
        : Number(
            row.signed_at_millis
          ),

    notes:
      normalizeOptionalText(
        row.notes
      ),

    isDeleted:
      normalizeBoolean(
        row.is_deleted,
        false
      ),

    createdAtMillis:
      Number(
        row.created_at_millis ??
          0
      ),

    updatedAtMillis:
      Number(
        row.updated_at_millis ??
          0
      ),
  };
}

async function loadParticipantById(
  id: string
) {
  const supabase =
    createSupabaseAdmin();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        PARTICIPANTS_TABLE
      )
      .select("*")
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      error.message
    );
  }

  return data as
    | UnknownRecord
    | null;
}

/**
 * GET
 *
 * Tek katılımcıyı getirir.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const id =
      await getRouteId(
        context
      );

    if (!id) {
      return jsonError(
        "Katılımcı ID bilgisi zorunludur.",
        400
      );
    }

    const row =
      await loadParticipantById(
        id
      );

    if (!row) {
      return jsonError(
        "Katılımcı bulunamadı.",
        404
      );
    }

    if (
      normalizeBoolean(
        row.is_deleted,
        false
      )
    ) {
      return jsonError(
        "Katılımcı daha önce silinmiş.",
        410
      );
    }

    const participant =
      mapParticipant(
        row
      );

    return jsonSuccess({
      participant,
      record:
        participant,
      data:
        participant,
    });
  } catch (error) {
    console.error(
      "Kurul katılımcısı GET hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Katılımcı alınırken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

/**
 * PATCH
 *
 * Katılımcı bilgilerini günceller.
 *
 * Özellikle desteklenen alanlar:
 * - fullName
 * - organizationName
 * - title
 * - department
 * - participantRole
 * - phone
 * - email
 * - attendanceStatus
 * - hasVotingRight
 * - notes
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const id =
      await getRouteId(
        context
      );

    if (!id) {
      return jsonError(
        "Katılımcı ID bilgisi zorunludur.",
        400
      );
    }

    let body:
      UnknownRecord;

    try {
      body =
        (await request.json()) as UnknownRecord;
    } catch {
      return jsonError(
        "Geçerli bir JSON gövdesi gönderilmelidir.",
        400
      );
    }

    const current =
      await loadParticipantById(
        id
      );

    if (!current) {
      return jsonError(
        "Güncellenecek katılımcı bulunamadı.",
        404
      );
    }

    if (
      normalizeBoolean(
        current.is_deleted,
        false
      )
    ) {
      return jsonError(
        "Silinmiş katılımcı güncellenemez.",
        409
      );
    }

    const updateRecord:
      UnknownRecord = {};

    if (
      hasProperty(
        body,
        "fullName",
        "full_name"
      )
    ) {
      const fullName =
        normalizeText(
          readProperty(
            body,
            "fullName",
            "full_name"
          )
        );

      if (!fullName) {
        return jsonError(
          "Ad soyad zorunludur.",
          400
        );
      }

      updateRecord.full_name =
        fullName;
    }

    if (
      hasProperty(
        body,
        "organizationName",
        "organization_name"
      )
    ) {
      updateRecord.organization_name =
        normalizeOptionalText(
          readProperty(
            body,
            "organizationName",
            "organization_name"
          )
        );
    }

    if (
      hasProperty(
        body,
        "title"
      )
    ) {
      updateRecord.title =
        normalizeOptionalText(
          readProperty(
            body,
            "title"
          )
        );
    }

    if (
      hasProperty(
        body,
        "department"
      )
    ) {
      updateRecord.department =
        normalizeOptionalText(
          readProperty(
            body,
            "department"
          )
        );
    }

    if (
      hasProperty(
        body,
        "participantRole",
        "participant_role"
      )
    ) {
      updateRecord.participant_role =
        normalizeOptionalText(
          readProperty(
            body,
            "participantRole",
            "participant_role"
          )
        );
    }

    if (
      hasProperty(
        body,
        "phone"
      )
    ) {
      updateRecord.phone =
        normalizeOptionalText(
          readProperty(
            body,
            "phone"
          )
        );
    }

    if (
      hasProperty(
        body,
        "email"
      )
    ) {
      updateRecord.email =
        normalizeOptionalText(
          readProperty(
            body,
            "email"
          )
        );
    }

    if (
      hasProperty(
        body,
        "notes"
      )
    ) {
      updateRecord.notes =
        normalizeOptionalText(
          readProperty(
            body,
            "notes"
          )
        );
    }

    if (
      hasProperty(
        body,
        "hasVotingRight",
        "has_voting_right"
      )
    ) {
      updateRecord.has_voting_right =
        normalizeBoolean(
          readProperty(
            body,
            "hasVotingRight",
            "has_voting_right"
          ),
          false
        );
    }

    if (
      hasProperty(
        body,
        "attendanceStatus",
        "attendance_status"
      )
    ) {
      const attendanceStatus =
        normalizeAttendanceStatus(
          readProperty(
            body,
            "attendanceStatus",
            "attendance_status"
          )
        );

      updateRecord.attendance_status =
        attendanceStatus;

      updateRecord.signature_status =
        attendanceStatus ===
          "ABSENT" ||
        attendanceStatus ===
          "EXCUSED"
          ? "NOT_REQUIRED"
          : normalizeText(
              current.signature_status
            ) ===
            "SIGNED"
          ? "SIGNED"
          : "NOT_SIGNED";

      if (
        attendanceStatus ===
          "ABSENT" ||
        attendanceStatus ===
          "EXCUSED"
      ) {
        updateRecord.signed_at_millis =
          null;
      }
    }

    const now =
      Date.now();

    updateRecord.updated_at_millis =
      now;

    updateRecord.sync_status =
      "SYNCED";

    updateRecord.sync_error =
      null;

    updateRecord.last_synced_at_millis =
      now;

    updateRecord.version =
      Math.max(
        1,
        Number(
          current.version ??
            1
        ) + 1
      );

    const supabase =
      createSupabaseAdmin();

    const {
      data,
      error,
    } =
      await supabase
        .from(
          PARTICIPANTS_TABLE
        )
        .update(
          updateRecord
        )
        .eq(
          "id",
          id
        )
        .eq(
          "is_deleted",
          false
        )
        .select("*")
        .single();

    if (error) {
      console.error(
        "Kurul katılımcısı güncellenemedi:",
        error
      );

      if (
        error.code ===
        "23505"
      ) {
        return jsonError(
          "Bu katılımcı toplantıda zaten kayıtlı.",
          409,
          error.message
        );
      }

      if (
        error.code ===
        "23514"
      ) {
        return jsonError(
          "Katılım durumu veya katılımcı rolü geçersiz.",
          400,
          error.message
        );
      }

      return jsonError(
        "Katılımcı güncellenemedi.",
        500,
        error.message
      );
    }

    if (!data) {
      return jsonError(
        "Katılımcı güncellendi ancak kayıt bilgisi alınamadı.",
        500
      );
    }

    const participant =
      mapParticipant(
        data as UnknownRecord
      );

    return jsonSuccess({
      message:
        "Katılımcı başarıyla güncellendi.",

      participant,

      record:
        participant,

      data:
        participant,
    });
  } catch (error) {
    console.error(
      "Kurul katılımcısı PATCH hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Katılımcı güncellenirken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

/**
 * DELETE
 *
 * Katılımcıyı fiziksel olarak silmez.
 * is_deleted=true yaparak pasife çeker.
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const id =
      await getRouteId(
        context
      );

    if (!id) {
      return jsonError(
        "Katılımcı ID bilgisi zorunludur.",
        400
      );
    }

    const current =
      await loadParticipantById(
        id
      );

    if (!current) {
      return jsonError(
        "Silinecek katılımcı bulunamadı.",
        404
      );
    }

    if (
      normalizeBoolean(
        current.is_deleted,
        false
      )
    ) {
      return jsonSuccess({
        message:
          "Katılımcı daha önce silinmiş.",

        id,

        deleted:
          true,
      });
    }

    const now =
      Date.now();

    const supabase =
      createSupabaseAdmin();

    const {
      data,
      error,
    } =
      await supabase
        .from(
          PARTICIPANTS_TABLE
        )
        .update({
          is_deleted:
            true,

          deleted_at_millis:
            now,

          updated_at_millis:
            now,

          sync_status:
            "SYNCED",

          sync_error:
            null,

          last_synced_at_millis:
            now,

          version:
            Math.max(
              1,
              Number(
                current.version ??
                  1
              ) + 1
            ),
        })
        .eq(
          "id",
          id
        )
        .select("*")
        .single();

    if (error) {
      console.error(
        "Kurul katılımcısı silinemedi:",
        error
      );

      return jsonError(
        "Katılımcı silinemedi.",
        500,
        error.message
      );
    }

    if (!data) {
      return jsonError(
        "Katılımcı silindi ancak kayıt bilgisi alınamadı.",
        500
      );
    }

    const participant =
      mapParticipant(
        data as UnknownRecord
      );

    return jsonSuccess({
      message:
        "Katılımcı başarıyla silindi.",

      id,

      deleted:
        true,

      participant,

      record:
        participant,

      data:
        participant,
    });
  } catch (error) {
    console.error(
      "Kurul katılımcısı DELETE hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Katılımcı silinirken beklenmeyen bir hata oluştu.",
      500
    );
  }
}