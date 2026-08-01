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

const MEETINGS_TABLE =
  "documentation_board_meetings";

const BOARD_MEMBERS_TABLE =
  "documentation_board_members";

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

function generateSyncKey(
  prefix: string
): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function mapParticipant(
  row: UnknownRecord
) {
  return {
    id: normalizeText(
      row.id ??
        row.remote_id
    ),

    remoteId:
      normalizeText(
        row.remote_id ??
          row.id
      ),

    meetingId:
      normalizeText(
        row.meeting_id
      ),

    meetingSyncKey:
      normalizeOptionalText(
        row.meeting_sync_key
      ),

    firmId:
      normalizeText(
        row.firm_id
      ),

    webFirmId:
      normalizeOptionalText(
        row.web_firm_id
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

    syncKey:
      normalizeText(
        row.sync_key
      ),

    syncStatus:
      normalizeText(
        row.sync_status
      ) || "SYNCED",

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

async function loadMeeting(
  meetingId: string,
  firmId: string
) {
  const supabase =
    createSupabaseAdmin();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        MEETINGS_TABLE
      )
      .select(
        "id, remote_id, sync_key, firm_id, web_firm_id, is_deleted"
      )
      .eq(
        "id",
        meetingId
      )
      .eq(
        "firm_id",
        firmId
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      error.message
    );
  }

  if (!data) {
    return null;
  }

  return {
    id:
      normalizeText(
        data.id
      ),

    remoteId:
      normalizeText(
        data.remote_id ??
          data.id
      ),

    syncKey:
      normalizeText(
        data.sync_key
      ),

    firmId:
      normalizeText(
        data.firm_id
      ),

    webFirmId:
      normalizeOptionalText(
        data.web_firm_id
      ),

    isDeleted:
      normalizeBoolean(
        data.is_deleted,
        false
      ),
  };
}

export async function GET(
  request: NextRequest
) {
  try {
    const meetingId =
      normalizeText(
        request.nextUrl
          .searchParams
          .get("meetingId")
      );

    const firmId =
      normalizeText(
        request.nextUrl
          .searchParams
          .get("firmId")
      );

    if (!meetingId) {
      return jsonError(
        "meetingId parametresi zorunludur.",
        400
      );
    }

    if (!firmId) {
      return jsonError(
        "firmId parametresi zorunludur.",
        400
      );
    }

    const meeting =
      await loadMeeting(
        meetingId,
        firmId
      );

    if (!meeting) {
      return jsonError(
        "Kurul toplantısı bulunamadı.",
        404
      );
    }

    if (meeting.isDeleted) {
      return jsonError(
        "Silinmiş kurul toplantısının katılımcıları görüntülenemez.",
        410
      );
    }

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
          "meeting_id",
          meetingId
        )
        .eq(
          "firm_id",
          firmId
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
        );

    if (error) {
      console.error(
        "Kurul katılımcıları alınamadı:",
        error
      );

      return jsonError(
        "Kurul katılımcıları alınamadı.",
        500,
        error.message
      );
    }

    const participants =
      (data ?? []).map(
        (row) =>
          mapParticipant(
            row as UnknownRecord
          )
      );

    return jsonSuccess({
      participants,
      data: participants,
      records: participants,
      meetingId,
      firmId,
      count:
        participants.length,
    });
  } catch (error) {
    console.error(
      "Kurul katılımcıları GET hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul katılımcıları alınırken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
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

    const action =
      normalizeText(
        body.action
      ).toUpperCase();

    const meetingId =
      normalizeText(
        body.meetingId ??
          body.meeting_id
      );

    const firmId =
      normalizeText(
        body.firmId ??
          body.firm_id
      );

    if (!meetingId) {
      return jsonError(
        "Toplantı bilgisi zorunludur.",
        400
      );
    }

    if (!firmId) {
      return jsonError(
        "Firma bilgisi zorunludur.",
        400
      );
    }

    const meeting =
      await loadMeeting(
        meetingId,
        firmId
      );

    if (!meeting) {
      return jsonError(
        "Kurul toplantısı bulunamadı.",
        404
      );
    }

    if (meeting.isDeleted) {
      return jsonError(
        "Silinmiş kurul toplantısına katılımcı eklenemez.",
        409
      );
    }

    const supabase =
      createSupabaseAdmin();

    const now =
      Date.now();

    if (
      action ===
      "ADD_BOARD_MEMBERS"
    ) {
      const boardMemberIds =
        Array.isArray(
          body.boardMemberIds
        )
          ? body.boardMemberIds
              .map(
                (value) =>
                  normalizeText(
                    value
                  )
              )
              .filter(Boolean)
          : [];

      const uniqueIds =
        Array.from(
          new Set(
            boardMemberIds
          )
        );

      if (
        uniqueIds.length === 0
      ) {
        return jsonError(
          "En az bir kurul üyesi seçilmelidir.",
          400
        );
      }

      const {
        data:
          boardMembers,
        error:
          boardMemberError,
      } =
        await supabase
          .from(
            BOARD_MEMBERS_TABLE
          )
          .select("*")
          .eq(
            "firm_id",
            firmId
          )
          .eq(
            "is_active",
            true
          )
          .in(
            "id",
            uniqueIds
          );

      if (
        boardMemberError
      ) {
        console.error(
          "Kurul üyeleri alınamadı:",
          boardMemberError
        );

        return jsonError(
          "Seçilen kurul üyeleri alınamadı.",
          500,
          boardMemberError.message
        );
      }

      if (
        !boardMembers ||
        boardMembers.length === 0
      ) {
        return jsonError(
          "Seçilen kurul üyeleri bulunamadı veya aktif değil.",
          404
        );
      }

      const {
        data:
          existingRows,
        error:
          existingError,
      } =
        await supabase
          .from(
            PARTICIPANTS_TABLE
          )
          .select(
            "board_member_id"
          )
          .eq(
            "meeting_id",
            meetingId
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
            "board_member_id",
            uniqueIds
          );

      if (existingError) {
        return jsonError(
          "Mevcut katılımcılar kontrol edilemedi.",
          500,
          existingError.message
        );
      }

      const existingIds =
        new Set(
          (existingRows ?? [])
            .map(
              (row) =>
                normalizeText(
                  row.board_member_id
                )
            )
            .filter(Boolean)
        );

      const attendanceStatus =
        normalizeAttendanceStatus(
          body.attendanceStatus ??
            body.attendance_status
        );

      const rows =
        boardMembers
          .filter(
            (member) =>
              !existingIds.has(
                normalizeText(
                  member.id
                )
              )
          )
          .map(
            (member) => {
              const recordId =
                crypto.randomUUID();

              return {
                id:
                  recordId,

                remote_id:
                  recordId,

                meeting_id:
                  meetingId,

                meeting_sync_key:
                  meeting.syncKey,

                firm_id:
                  firmId,

                web_firm_id:
                  meeting.webFirmId ??
                  firmId,

                board_member_id:
                  member.id,

                participant_source:
                  "BOARD_MEMBER",

                employee_id:
                  member.employee_id ??
                  null,

                full_name:
                  normalizeText(
                    member.full_name
                  ),

                organization_name:
                  member.organization_name ??
                  null,

                title:
                  member.title ??
                  null,

                department:
                  member.department ??
                  null,

                participant_role:
                  normalizeText(
                    member.board_role
                  ) || "MEMBER",

                attendance_status:
                  attendanceStatus,

                signature_status:
                  attendanceStatus ===
                    "ABSENT" ||
                  attendanceStatus ===
                    "EXCUSED"
                    ? "NOT_REQUIRED"
                    : "NOT_SIGNED",

                signed_at_millis:
                  null,

                email:
                  member.email ??
                  null,

                phone:
                  member.phone ??
                  null,

                notes:
                  member.notes ??
                  null,

                has_voting_right:
                  normalizeBoolean(
                    member.has_voting_right,
                    true
                  ),

                source:
                  "WEB",

                sync_key:
                  generateSyncKey(
                    "board-participant"
                  ),

                version:
                  1,

                is_deleted:
                  false,

                deleted_at_millis:
                  null,

                created_at_millis:
                  now,

                updated_at_millis:
                  now,

                sync_status:
                  "SYNCED",

                sync_error:
                  null,

                last_synced_at_millis:
                  now,
              };
            }
          );

      if (
        rows.length === 0
      ) {
        return jsonSuccess({
          message:
            "Seçilen kurul üyelerinin tamamı toplantıda zaten kayıtlı.",

          insertedCount:
            0,

          skippedCount:
            uniqueIds.length,

          participants:
            [],
        });
      }

      const {
        data:
          insertedRows,
        error:
          insertError,
      } =
        await supabase
          .from(
            PARTICIPANTS_TABLE
          )
          .insert(rows)
          .select("*");

      if (insertError) {
        console.error(
          "Kurul üyeleri toplantıya eklenemedi:",
          insertError
        );

        if (
          insertError.code ===
          "23505"
        ) {
          return jsonError(
            "Seçilen kurul üyelerinden biri toplantıya daha önce eklenmiş.",
            409,
            insertError.message
          );
        }

        if (
          insertError.code ===
          "23514"
        ) {
          return jsonError(
            "Katılım durumu, imza durumu veya katılımcı rolü geçersiz.",
            400,
            insertError.message
          );
        }

        return jsonError(
          "Kurul üyeleri toplantıya eklenemedi.",
          500,
          insertError.message
        );
      }

      const participants =
        (insertedRows ?? []).map(
          (row) =>
            mapParticipant(
              row as UnknownRecord
            )
        );

      return jsonSuccess(
        {
          message:
            "Kurul üyeleri toplantıya başarıyla eklendi.",

          insertedCount:
            participants.length,

          skippedCount:
            uniqueIds.length -
            participants.length,

          participants,

          data:
            participants,
        },
        201
      );
    }

    if (
      action === "ADD_MANUAL" ||
      !action
    ) {
      const fullName =
        normalizeText(
          body.fullName ??
            body.full_name
        );

      if (!fullName) {
        return jsonError(
          "Katılımcının adı ve soyadı zorunludur.",
          400
        );
      }

      const email =
        normalizeOptionalText(
          body.email
        );

      let duplicateQuery =
        supabase
          .from(
            PARTICIPANTS_TABLE
          )
          .select(
            "id, full_name, email"
          )
          .eq(
            "meeting_id",
            meetingId
          )
          .eq(
            "firm_id",
            firmId
          )
          .eq(
            "is_deleted",
            false
          )
          .ilike(
            "full_name",
            fullName
          );

      if (email) {
        duplicateQuery =
          duplicateQuery.ilike(
            "email",
            email
          );
      }

      const {
        data:
          duplicateRows,
        error:
          duplicateError,
      } =
        await duplicateQuery
          .limit(1);

      if (duplicateError) {
        return jsonError(
          "Katılımcı mükerrerlik kontrolü yapılamadı.",
          500,
          duplicateError.message
        );
      }

      if (
        duplicateRows &&
        duplicateRows.length > 0
      ) {
        return jsonError(
          "Bu katılımcı toplantıya daha önce eklenmiş.",
          409
        );
      }

      const attendanceStatus =
        normalizeAttendanceStatus(
          body.attendanceStatus ??
            body.attendance_status
        );

      const recordId =
        crypto.randomUUID();

      const row = {
        id:
          recordId,

        remote_id:
          recordId,

        meeting_id:
          meetingId,

        meeting_sync_key:
          meeting.syncKey,

        firm_id:
          firmId,

        web_firm_id:
          meeting.webFirmId ??
          firmId,

        board_member_id:
          null,

        participant_source:
          "MANUAL",

        employee_id:
          null,

        full_name:
          fullName,

        organization_name:
          normalizeOptionalText(
            body.organizationName ??
              body.organization_name
          ),

        title:
          normalizeOptionalText(
            body.title
          ),

        department:
          normalizeOptionalText(
            body.department
          ),

        participant_role:
          normalizeOptionalText(
            body.participantRole ??
              body.participant_role
          ) || "GUEST",

        attendance_status:
          attendanceStatus,

        signature_status:
          attendanceStatus ===
            "ABSENT" ||
          attendanceStatus ===
            "EXCUSED"
            ? "NOT_REQUIRED"
            : "NOT_SIGNED",

        signed_at_millis:
          null,

        email,

        phone:
          normalizeOptionalText(
            body.phone
          ),

        notes:
          normalizeOptionalText(
            body.notes
          ),

        has_voting_right:
          normalizeBoolean(
            body.hasVotingRight ??
              body.has_voting_right,
            false
          ),

        source:
          "WEB",

        sync_key:
          generateSyncKey(
            "manual-participant"
          ),

        version:
          1,

        is_deleted:
          false,

        deleted_at_millis:
          null,

        created_at_millis:
          now,

        updated_at_millis:
          now,

        sync_status:
          "SYNCED",

        sync_error:
          null,

        last_synced_at_millis:
          now,
      };

      const {
        data,
        error,
      } =
        await supabase
          .from(
            PARTICIPANTS_TABLE
          )
          .insert(row)
          .select("*")
          .single();

      if (error) {
        console.error(
          "Manuel katılımcı eklenemedi:",
          error
        );

        if (
          error.code ===
          "23505"
        ) {
          return jsonError(
            "Bu katılımcı toplantıya daha önce eklenmiş.",
            409,
            error.message
          );
        }

        if (
          error.code ===
          "23514"
        ) {
          return jsonError(
            "Katılım durumu, imza durumu veya katılımcı rolü geçersiz.",
            400,
            error.message
          );
        }

        return jsonError(
          "Manuel katılımcı eklenemedi.",
          500,
          error.message
        );
      }

      const participant =
        mapParticipant(
          data as UnknownRecord
        );

      return jsonSuccess(
        {
          message:
            "Manuel katılımcı başarıyla eklendi.",

          participant,

          record:
            participant,

          data:
            participant,
        },
        201
      );
    }

    return jsonError(
      "Geçersiz katılımcı işlemi.",
      400
    );
  } catch (error) {
    console.error(
      "Kurul katılımcısı POST hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul katılımcısı kaydedilirken beklenmeyen bir hata oluştu.",
      500
    );
  }
}