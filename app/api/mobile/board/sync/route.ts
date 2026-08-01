import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

type UnknownRecord = Record<string, unknown>;

type BoardSyncResponse = {
  success: boolean;
  cursor: string;
  server_time: number;
  insert_records: unknown[];
  update_records: unknown[];
  delete_records: string[];
  conflicts: unknown[];
  synced_remote_ids: string[];
  warnings: string[];
  message: string | null;
};

function asObject(value: unknown): UnknownRecord {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as UnknownRecord;
  }

  return {};
}

function readString(
  value: unknown
): string | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalized = String(value).trim();

  return normalized || null;
}

function readNumber(
  value: unknown,
  fallback = 0
): number {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  const normalized = Number(value);

  return Number.isFinite(normalized)
    ? normalized
    : fallback;
}

function readArray(
  value: unknown
): unknown[] {
  return Array.isArray(value)
    ? value
    : [];
}

function normalizeRecord(
  input: unknown
): UnknownRecord {
  const record = asObject(input);

  return {
    ...record,

    entity_type:
      record.entity_type ??
      record.entityType ??
      null,

    local_id:
      record.local_id ??
      record.localId ??
      null,

    remote_id:
      record.remote_id ??
      record.remoteId ??
      null,

    sync_key:
      record.sync_key ??
      record.syncKey ??
      null,

    firm_id:
      record.firm_id ??
      record.firmId ??
      null,

    web_firm_id:
      record.web_firm_id ??
      record.webFirmId ??
      null,

    meeting_id:
      record.meeting_id ??
      record.meetingId ??
      null,

    meeting_sync_key:
      record.meeting_sync_key ??
      record.meetingSyncKey ??
      null,

    meeting_local_id:
      record.meeting_local_id ??
      record.meetingLocalId ??
      null,

    meeting_no:
      record.meeting_no ??
      record.meetingNo ??
      null,

    meeting_title:
      record.meeting_title ??
      record.meetingTitle ??
      null,

    meeting_type:
      record.meeting_type ??
      record.meetingType ??
      null,

    meeting_date:
      record.meeting_date ??
      record.meetingDateMillis ??
      null,

    meeting_time:
      record.meeting_time ??
      record.meetingTime ??
      null,

    meeting_place:
      record.meeting_place ??
      record.meetingPlace ??
      null,

    meeting_method:
      record.meeting_method ??
      record.meetingMethod ??
      null,

    chairperson:
      record.chairperson ??
      null,

    secretary:
      record.secretary ??
      null,

    meeting_status:
      record.meeting_status ??
      record.meetingStatus ??
      null,

    minutes_status:
      record.minutes_status ??
      record.minutesStatus ??
      null,

    signature_status:
      record.signature_status ??
      record.signatureStatus ??
      record.participantSignatureStatus ??
      null,

    role_key:
      record.role_key ??
      record.roleKey ??
      null,

    role_title:
      record.role_title ??
      record.roleTitle ??
      null,

    full_name:
      record.full_name ??
      record.fullName ??
      null,

    duty:
      record.duty ??
      null,

    department:
      record.department ??
      null,

    phone:
      record.phone ??
      null,

    email:
      record.email ??
      null,

    is_required:
      record.is_required ??
      record.isRequired ??
      null,

    is_active:
      record.is_active ??
      record.isActive ??
      null,

    agenda_title:
      record.agenda_title ??
      record.agendaTitle ??
      null,

    agenda_note:
      record.agenda_note ??
      record.agendaNote ??
      null,

    sort_order:
      record.sort_order ??
      record.sortOrder ??
      null,

    agenda_status:
      record.agenda_status ??
      record.agendaStatus ??
      null,

    board_role:
      record.board_role ??
      record.boardRole ??
      null,

    participant_role:
      record.participant_role ??
      record.participantRole ??
      null,

    attended:
      record.attended ??
      null,

    attendance_status:
      record.attendance_status ??
      record.attendanceStatus ??
      null,

    signed:
      record.signed ??
      null,

    signed_at:
      record.signed_at ??
      record.signedAtMillis ??
      null,

    has_voting_right:
      record.has_voting_right ??
      record.hasVotingRight ??
      null,

    decision_no:
      record.decision_no ??
      record.decisionNo ??
      null,

    decision_title:
      record.decision_title ??
      record.decisionTitle ??
      null,

    decision_text:
      record.decision_text ??
      record.decisionText ??
      null,

    responsible:
      record.responsible ??
      null,

    responsible_department:
      record.responsible_department ??
      record.responsibleDepartment ??
      null,

    due_date:
      record.due_date ??
      record.dueDateMillis ??
      null,

    decision_status:
      record.decision_status ??
      record.decisionStatus ??
      null,

    decision_priority:
      record.decision_priority ??
      record.decisionPriority ??
      null,

    completion_rate:
      record.completion_rate ??
      record.completionRate ??
      null,

    closed_note:
      record.closed_note ??
      record.closedNote ??
      null,

    closed_at:
      record.closed_at ??
      record.closedAtMillis ??
      null,

    carried_forward:
      record.carried_forward ??
      record.carriedForward ??
      null,

    vote_result:
      record.vote_result ??
      record.voteResult ??
      null,

    yes_vote_count:
      record.yes_vote_count ??
      record.yesVoteCount ??
      null,

    no_vote_count:
      record.no_vote_count ??
      record.noVoteCount ??
      null,

    abstain_vote_count:
      record.abstain_vote_count ??
      record.abstainVoteCount ??
      null,

    note:
      record.note ??
      null,

    source:
      record.source ??
      "ANDROID",

    sync_status:
      record.sync_status ??
      record.syncStatus ??
      "PENDING",

    sync_error:
      record.sync_error ??
      record.syncError ??
      null,

    last_synced_at:
      record.last_synced_at ??
      record.lastSyncedAt ??
      null,

    version:
      record.version ??
      1,

    is_deleted:
      record.is_deleted ??
      record.isDeleted ??
      false,

    deleted_at:
      record.deleted_at ??
      record.deletedAtMillis ??
      null,

    created_at:
      record.created_at ??
      record.createdAt ??
      Date.now(),

    updated_at:
      record.updated_at ??
      record.updatedAt ??
      Date.now(),
  };
}

function normalizeRequest(
  input: unknown
): UnknownRecord {
  const body = asObject(input);

  const records = readArray(
    body.records ??
    body.items
  ).map(normalizeRecord);

  const deletedRecords = readArray(
    body.deleted_records ??
    body.deletedRecords
  )
    .map(readString)
    .filter(
      (value): value is string =>
        Boolean(value)
    );

  return {
    device_id:
      readString(
        body.device_id ??
        body.deviceId
      ) ?? "UNKNOWN",

    user_id:
      readNumber(
        body.user_id ??
        body.userId,
        0
      ),

    company_id:
      readNumber(
        body.company_id ??
        body.companyId ??
        body.firm_id ??
        body.firmId,
        0
      ),

    web_company_id:
      readString(
        body.web_company_id ??
        body.webCompanyId
      ),

    cursor:
      readString(
        body.cursor ??
        body.last_sync ??
        body.lastSync
      ) ?? "0",

    records,

    deleted_records:
      deletedRecords,

    app_version:
      readString(
        body.app_version ??
        body.appVersion
      ) ?? "UNKNOWN",

    platform:
      readString(
        body.platform
      ) ?? "ANDROID",

    request_time:
      readNumber(
        body.request_time ??
        body.requestTime,
        Date.now()
      ),
  };
}

function emptyResponse(
  message: string,
  success = false
): BoardSyncResponse {
  const now = Date.now();

  return {
    success,
    cursor: String(now),
    server_time: now,
    insert_records: [],
    update_records: [],
    delete_records: [],
    conflicts: [],
    synced_remote_ids: [],
    warnings: [],
    message,
  };
}

function normalizeResponse(
  input: unknown
): BoardSyncResponse {
  const response = asObject(input);
  const now = Date.now();

  return {
    success:
      response.success === true,

    cursor:
      readString(
        response.cursor
      ) ?? String(now),

    server_time:
      readNumber(
        response.server_time ??
        response.serverTime,
        now
      ),

    insert_records:
      readArray(
        response.insert_records ??
        response.insertRecords
      ),

    update_records:
      readArray(
        response.update_records ??
        response.updateRecords
      ),

    delete_records:
      readArray(
        response.delete_records ??
        response.deleteRecords
      )
        .map(readString)
        .filter(
          (value): value is string =>
            Boolean(value)
        ),

    conflicts:
      readArray(
        response.conflicts
      ),

    synced_remote_ids:
      readArray(
        response.synced_remote_ids ??
        response.syncedRemoteIds
      )
        .map(readString)
        .filter(
          (value): value is string =>
            Boolean(value)
        ),

    warnings:
      readArray(
        response.warnings
      )
        .map(readString)
        .filter(
          (value): value is string =>
            Boolean(value)
        ),

    message:
      readString(
        response.message
      ),
  };
}

export async function POST(
  request: NextRequest
) {
  try {
    if (
      !supabaseUrl ||
      !supabaseServiceRoleKey
    ) {
      return NextResponse.json(
        emptyResponse(
          "Supabase sunucu ayarları eksik."
        ),
        {
          status: 500,
        }
      );
    }

    let rawBody: unknown;

    try {
      rawBody =
        await request.json();
    } catch {
      return NextResponse.json(
        emptyResponse(
          "Geçersiz JSON isteği."
        ),
        {
          status: 400,
        }
      );
    }

    const body =
      normalizeRequest(rawBody);

    const companyId =
      readNumber(
        body.company_id,
        0
      );

    const webCompanyId =
      readString(
        body.web_company_id
      );

    if (
      companyId <= 0 &&
      !webCompanyId
    ) {
      return NextResponse.json(
        emptyResponse(
          "Firma bilgisi bulunamadı."
        ),
        {
          status: 400,
        }
      );
    }

    const supabase =
      createClient(
        supabaseUrl,
        supabaseServiceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

    const {
      data,
      error,
    } = await supabase.rpc(
      "board_sync_batch",
      {
        p_request: body,
      }
    );

    if (error) {
      console.error(
        "Board sync RPC hatası:",
        error
      );

      return NextResponse.json(
        emptyResponse(
          error.message ||
          "Kurul senkronizasyon RPC çağrısı başarısız."
        ),
        {
          status: 500,
        }
      );
    }

    const response =
      normalizeResponse(data);

    if (!response.success) {
      return NextResponse.json(
        response,
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      response,
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Kurul senkronizasyonu sırasında bilinmeyen hata oluştu.";

    console.error(
      "Board sync route hatası:",
      error
    );

    return NextResponse.json(
      emptyResponse(message),
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    service: "D-SEC Board Sync",
    rpc: "board_sync_batch",
    status: "READY",
    server_time: Date.now(),
  });
}