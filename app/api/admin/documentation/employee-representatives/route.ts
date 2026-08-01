import {
  createClient,
} from "@supabase/supabase-js";

import {
  cookies,
} from "next/headers";

import {
  NextRequest,
  NextResponse,
} from "next/server";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

export const runtime =
  "nodejs";

const REPRESENTATIVES_TABLE =
  "employee_representatives";

const EMPLOYEES_TABLE =
  "employees";

const COMPANIES_TABLE =
  "companies";

type UnknownRecord =
  Record<string, unknown>;

type AccessContext = {
  allowed: boolean;
  role: string;
  companyId: string;
  companyScoped: boolean;
  readOnly: boolean;
};

type RepresentativeType =
  | "PRIMARY"
  | "SUBSTITUTE";

type DeterminationMethod =
  | "ELECTION"
  | "APPOINTMENT"
  | "AUTHORIZED_UNION";

type RepresentativeStatus =
  | "ACTIVE"
  | "PASSIVE"
  | "EXPIRED"
  | "CANCELLED";

function getSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_URL tanımlı değil."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

function clean(
  value: unknown
): string | null {
  const normalized =
    String(value ?? "")
      .trim();

  return normalized || null;
}

function requiredRepresentativeCount(
  employeeCount: number
): number {
  const count =
    Math.max(
      0,
      Math.trunc(
        Number(employeeCount) || 0
      )
    );

  if (count < 2) {
    return 0;
  }

  if (count <= 50) {
    return 1;
  }

  if (count <= 100) {
    return 2;
  }

  if (count <= 500) {
    return 3;
  }

  if (count <= 1000) {
    return 4;
  }

  if (count <= 2000) {
    return 5;
  }

  return 6;
}

function normalizeRepresentativeType(
  value: unknown
): RepresentativeType {
  const normalized =
    String(value ?? "")
      .trim()
      .toUpperCase();

  if (
    [
      "SUBSTITUTE",
      "YEDEK",
    ].includes(normalized)
  ) {
    return "SUBSTITUTE";
  }

  return "PRIMARY";
}

function normalizeDeterminationMethod(
  value: unknown
): DeterminationMethod {
  const normalized =
    String(value ?? "")
      .trim()
      .toUpperCase();

  if (
    [
      "APPOINTMENT",
      "ATAMA",
    ].includes(normalized)
  ) {
    return "APPOINTMENT";
  }

  if (
    [
      "AUTHORIZED_UNION",
      "SENDIKA",
      "SENDİKA",
      "YETKILI_SENDIKA",
      "YETKİLİ_SENDİKA",
    ].includes(normalized)
  ) {
    return "AUTHORIZED_UNION";
  }

  return "ELECTION";
}

function normalizeStatus(
  value: unknown
): RepresentativeStatus {
  const normalized =
    String(value ?? "")
      .trim()
      .toUpperCase();

  if (
    normalized === "PASSIVE" ||
    normalized === "PASIF" ||
    normalized === "PASİF"
  ) {
    return "PASSIVE";
  }

  if (
    normalized === "EXPIRED" ||
    normalized === "SURESI_DOLDU" ||
    normalized === "SÜRESİ_DOLDU"
  ) {
    return "EXPIRED";
  }

  if (
    normalized === "CANCELLED" ||
    normalized === "CANCELED" ||
    normalized === "IPTAL" ||
    normalized === "İPTAL"
  ) {
    return "CANCELLED";
  }

  return "ACTIVE";
}

function parseBoolean(
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

  const normalized =
    String(value ?? "")
      .trim()
      .toLocaleLowerCase("tr-TR");

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

  return fallback;
}

function toDateValue(
  value: unknown
): string | null {
  const normalized =
    clean(value);

  if (!normalized) {
    return null;
  }

  const date =
    new Date(normalized);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function nowMillis() {
  return Date.now();
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

async function getAccessContext():
  Promise<AccessContext> {
  const cookieStore =
    await cookies();

  const auth =
    String(
      cookieStore.get(
        "dsec_admin_auth"
      )?.value ||
        cookieStore.get(
          "dsec_user_auth"
        )?.value ||
        ""
    ).trim();

  const role =
    String(
      cookieStore.get(
        "dsec_admin_role"
      )?.value ||
        cookieStore.get(
          "dsec_user_role"
        )?.value ||
        ""
    ).trim();

  const companyId =
    String(
      cookieStore.get(
        "dsec_company_id"
      )?.value || ""
    ).trim();

  const allowedRoles = [
    "admin",
    "super_admin",
    "company_admin",
    "demo_user",
  ];

  const companyScoped =
    role === "company_admin" ||
    role === "demo_user";

  const allowed =
    auth === "ok" &&
    allowedRoles.includes(role) &&
    (
      !companyScoped ||
      Boolean(companyId)
    );

  return {
    allowed,
    role,
    companyId,
    companyScoped,
    readOnly:
      role === "demo_user",
  };
}

function resolveFirmId(
  access: AccessContext,
  requestedFirmId: unknown
): string | null {
  if (
    access.companyScoped
  ) {
    return (
      clean(access.companyId)
    );
  }

  const requested =
    clean(requestedFirmId);

  if (
    requested === "all"
  ) {
    return null;
  }

  return requested;
}

async function getScopedEmployee(
  employeeId: string,
  firmId: string
) {
  const supabase =
    getSupabase();

  const {
    data,
    error,
  } =
    await supabase
      .from(EMPLOYEES_TABLE)
      .select(
  "id, firm_id, full_name, job_title, registry_no, active, exit_date"
)
      .eq(
        "id",
        employeeId
      )
      .eq(
        "firm_id",
        firmId
      )
      .maybeSingle();

  return {
    employee:
      data || null,
    error,
  };
}

async function getScopedRepresentative(
  id: string,
  access: AccessContext
) {
  const supabase =
    getSupabase();

  let query =
    supabase
      .from(
        REPRESENTATIVES_TABLE
      )
      .select("*")
      .eq(
        "id",
        id
      )
      .eq(
        "is_deleted",
        false
      );

  if (
    access.companyScoped
  ) {
    query =
      query.eq(
        "firm_id",
        access.companyId
      );
  }

  const {
    data,
    error,
  } =
    await query.maybeSingle();

  return {
    representative:
      data || null,
    error,
  };
}

function mapRepresentative(
  row: UnknownRecord
) {
  const dutyEndDate =
    clean(
      row.duty_end_date
    );

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const endDate =
    dutyEndDate
      ? new Date(
          `${dutyEndDate}T00:00:00`
        )
      : null;

  const remainingDays =
    endDate &&
    !Number.isNaN(
      endDate.getTime()
    )
      ? Math.ceil(
          (
            endDate.getTime() -
            today.getTime()
          ) /
            86_400_000
        )
      : null;

  const storedStatus =
    normalizeStatus(
      row.status
    );

  const calculatedStatus =
    parseBoolean(
      row.is_deleted,
      false
    )
      ? "DELETED"
      : storedStatus ===
            "PASSIVE" ||
          storedStatus ===
            "CANCELLED"
        ? storedStatus
        : remainingDays !== null &&
            remainingDays < 0
          ? "EXPIRED"
          : remainingDays !== null &&
              remainingDays <= 30
            ? "EXPIRING_SOON"
            : "ACTIVE";

  return {
    id:
      clean(row.id),

    remoteId:
      clean(
        row.remote_id
      ),

    syncKey:
      clean(
        row.sync_key
      ),

    firmId:
      clean(
        row.firm_id
      ),

    localFirmId:
      row.local_firm_id == null
        ? null
        : Number(
            row.local_firm_id
          ),

    webFirmId:
      clean(
        row.web_firm_id
      ),

    employeeId:
      clean(
        row.employee_id
      ),

    employeeName:
      clean(
        row.employee_name
      ) || "",

    department:
      clean(
        row.department
      ),

    jobTitle:
      clean(
        row.job_title
      ),

    registryNo:
      clean(
        row.registry_no
      ),

    representativeType:
      normalizeRepresentativeType(
        row.representative_type
      ),

    determinationMethod:
      normalizeDeterminationMethod(
        row.determination_method
      ),

    isHeadRepresentative:
      parseBoolean(
        row.is_head_representative,
        false
      ),

    selectionDate:
      clean(
        row.selection_date
      ),

    dutyStartDate:
      clean(
        row.duty_start_date
      ),

    dutyEndDate,

    status:
      storedStatus,

    calculatedStatus,

    remainingDays,

    workplaceSection:
      clean(
        row.workplace_section
      ),

    shiftName:
      clean(
        row.shift_name
      ),

    unionName:
      clean(
        row.union_name
      ),

    electionReferenceNo:
      clean(
        row.election_reference_no
      ),

    appointmentReferenceNo:
      clean(
        row.appointment_reference_no
      ),

    note:
      clean(
        row.note
      ),

    source:
      clean(
        row.source
      ) || "WEB",

    version:
      Number(
        row.version ?? 1
      ),

    syncStatus:
      clean(
        row.sync_status
      ) || "SYNCED",

    lastSyncedAtMillis:
      row.last_synced_at_millis == null
        ? null
        : Number(
            row.last_synced_at_millis
          ),

    isDeleted:
      parseBoolean(
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

async function buildCompliance(
  firmId: string
) {
  const supabase =
    getSupabase();

  const [
    employeeResult,
    representativeResult,
  ] =
    await Promise.all([
      supabase
        .from(
          EMPLOYEES_TABLE
        )
        .select(
          "id, active",
          {
            count: "exact",
            head: false,
          }
        )
        .eq(
          "firm_id",
          firmId
        )
        .neq(
          "active",
          false
        ),

      supabase
        .from(
          REPRESENTATIVES_TABLE
        )
        .select(
          "id, employee_id, representative_type, is_head_representative, status, duty_end_date, is_deleted"
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

  if (
    employeeResult.error
  ) {
    throw new Error(
      employeeResult.error.message
    );
  }

  if (
    representativeResult.error
  ) {
    throw new Error(
      representativeResult.error.message
    );
  }

  const employees =
    employeeResult.data || [];

  const representatives =
    representativeResult.data || [];

  const employeeCount =
    employees.length;

  const requiredPrimaryCount =
    requiredRepresentativeCount(
      employeeCount
    );

  const now =
    new Date();

  now.setHours(
    0,
    0,
    0,
    0
  );

  const isCurrent =
    (
      row: UnknownRecord
    ) => {
      if (
        normalizeStatus(
          row.status
        ) !== "ACTIVE"
      ) {
        return false;
      }

      const endDateValue =
        clean(
          row.duty_end_date
        );

      if (!endDateValue) {
        return true;
      }

      const endDate =
        new Date(
          `${endDateValue}T00:00:00`
        );

      return (
        !Number.isNaN(
          endDate.getTime()
        ) &&
        endDate >= now
      );
    };

  const activePrimaryCount =
    representatives.filter(
      (row) =>
        normalizeRepresentativeType(
          row.representative_type
        ) === "PRIMARY" &&
        isCurrent(
          row as UnknownRecord
        )
    ).length;

  const activeSubstituteCount =
    representatives.filter(
      (row) =>
        normalizeRepresentativeType(
          row.representative_type
        ) === "SUBSTITUTE" &&
        isCurrent(
          row as UnknownRecord
        )
    ).length;

  const headRepresentativeCount =
    representatives.filter(
      (row) =>
        normalizeRepresentativeType(
          row.representative_type
        ) === "PRIMARY" &&
        parseBoolean(
          row.is_head_representative,
          false
        ) &&
        isCurrent(
          row as UnknownRecord
        )
    ).length;

  const expiredCount =
    representatives.filter(
      (row) => {
        if (
          normalizeStatus(
            row.status
          ) === "EXPIRED"
        ) {
          return true;
        }

        const value =
          clean(
            row.duty_end_date
          );

        if (!value) {
          return false;
        }

        const endDate =
          new Date(
            `${value}T00:00:00`
          );

        return (
          !Number.isNaN(
            endDate.getTime()
          ) &&
          endDate < now
        );
      }
    ).length;

  const expiringSoonCount =
    representatives.filter(
      (row) => {
        if (
          normalizeStatus(
            row.status
          ) !== "ACTIVE"
        ) {
          return false;
        }

        const value =
          clean(
            row.duty_end_date
          );

        if (!value) {
          return false;
        }

        const endDate =
          new Date(
            `${value}T00:00:00`
          );

        if (
          Number.isNaN(
            endDate.getTime()
          )
        ) {
          return false;
        }

        const days =
          Math.ceil(
            (
              endDate.getTime() -
              now.getTime()
            ) /
              86_400_000
          );

        return (
          days >= 0 &&
          days <= 30
        );
      }
    ).length;

  const missingPrimaryCount =
    Math.max(
      requiredPrimaryCount -
        activePrimaryCount,
      0
    );

  let complianceStatus =
    "COMPLIANT";

  let complianceMessage =
    "Çalışan temsilcisi sayısı mevzuat hesabına uygundur.";

  if (
    employeeCount < 2
  ) {
    complianceStatus =
      "NOT_REQUIRED";

    complianceMessage =
      "Çalışan sayısı iki kişinin altında olduğu için çalışan temsilcisi zorunluluğu doğmamaktadır.";
  } else if (
    activePrimaryCount === 0
  ) {
    complianceStatus =
      "CRITICAL";

    complianceMessage =
      `Bu işyerinde ${requiredPrimaryCount} asıl çalışan temsilcisi bulunmalıdır. Aktif asıl temsilci bulunmamaktadır.`;
  } else if (
    missingPrimaryCount > 0
  ) {
    complianceStatus =
      "MISSING";

    complianceMessage =
      `Bu işyerinde ${requiredPrimaryCount} asıl çalışan temsilcisi bulunmalıdır. ${missingPrimaryCount} temsilci eksiktir.`;
  } else if (
    requiredPrimaryCount > 1 &&
    headRepresentativeCount === 0
  ) {
    complianceStatus =
      "HEAD_MISSING";

    complianceMessage =
      "Birden fazla çalışan temsilcisi bulunduğu için baş temsilci belirlenmelidir.";
  } else if (
    expiredCount > 0 ||
    expiringSoonCount > 0
  ) {
    complianceStatus =
      "WARNING";

    complianceMessage =
      expiredCount > 0
        ? `${expiredCount} çalışan temsilcisinin görev süresi dolmuştur.`
        : `${expiringSoonCount} çalışan temsilcisinin görev süresi 30 gün içinde dolacaktır.`;
  }

  return {
    employeeCount,
    requiredPrimaryCount,
    activePrimaryCount,
    activeSubstituteCount,
    missingPrimaryCount,
    headRepresentativeCount,
    expiredCount,
    expiringSoonCount,
    complianceStatus,
    complianceMessage,
  };
}

function buildInsertPayload(
  body: UnknownRecord,
  firmId: string,
  employee: UnknownRecord
) {
  const now =
    nowMillis();

  const representativeType =
    normalizeRepresentativeType(
      body.representativeType ??
        body.representative_type
    );

  const isHeadRepresentative =
    representativeType ===
      "PRIMARY" &&
    parseBoolean(
      body.isHeadRepresentative ??
        body.is_head_representative,
      false
    );

  const dutyStartDate =
    toDateValue(
      body.dutyStartDate ??
        body.duty_start_date
    );

  if (!dutyStartDate) {
    throw new Error(
      "Görev başlangıç tarihi zorunludur."
    );
  }

  const dutyEndDate =
    toDateValue(
      body.dutyEndDate ??
        body.duty_end_date
    );

  if (
    dutyEndDate &&
    dutyEndDate <
      dutyStartDate
  ) {
    throw new Error(
      "Görev bitiş tarihi başlangıç tarihinden önce olamaz."
    );
  }

  const id =
    crypto.randomUUID();

  return {
    id,

    remote_id:
      id,

    sync_key:
      crypto.randomUUID(),

    firm_id:
      firmId,

    web_firm_id:
      firmId,

    local_firm_id:
      body.localFirmId ??
      body.local_firm_id ??
      null,

    employee_id:
      employee.id,

    employee_name:
      clean(
        employee.full_name
      ) || "",

    department:
  null,

    job_title:
      clean(
        employee.job_title
      ),

    registry_no:
      clean(
        employee.registry_no
      ),

    representative_type:
      representativeType,

    determination_method:
      normalizeDeterminationMethod(
        body.determinationMethod ??
          body.determination_method
      ),

    is_head_representative:
      isHeadRepresentative,

    selection_date:
      toDateValue(
        body.selectionDate ??
          body.selection_date
      ),

    duty_start_date:
      dutyStartDate,

    duty_end_date:
      dutyEndDate,

    status:
      normalizeStatus(
        body.status
      ),

    workplace_section:
      clean(
        body.workplaceSection ??
          body.workplace_section
      ),

    shift_name:
      clean(
        body.shiftName ??
          body.shift_name
      ),

    union_name:
      clean(
        body.unionName ??
          body.union_name
      ),

    election_reference_no:
      clean(
        body.electionReferenceNo ??
          body.election_reference_no
      ),

    appointment_reference_no:
      clean(
        body.appointmentReferenceNo ??
          body.appointment_reference_no
      ),

    note:
      clean(
        body.note
      ),

    source:
      "WEB",

    version:
      1,

    sync_status:
      "SYNCED",

    sync_error:
      null,

    last_synced_at_millis:
      now,

    is_deleted:
      false,

    deleted_at_millis:
      null,

    created_at_millis:
      now,

    updated_at_millis:
      now,
  };
}

function buildUpdatePayload(
  body: UnknownRecord,
  existing: UnknownRecord,
  employee?: UnknownRecord | null
) {
  const now =
    nowMillis();

  const representativeType =
    body.representativeType !==
      undefined ||
    body.representative_type !==
      undefined
      ? normalizeRepresentativeType(
          body.representativeType ??
            body.representative_type
        )
      : normalizeRepresentativeType(
          existing
            .representative_type
        );

  const currentHead =
    parseBoolean(
      existing
        .is_head_representative,
      false
    );

  const requestedHead =
    body.isHeadRepresentative !==
      undefined ||
    body.is_head_representative !==
      undefined
      ? parseBoolean(
          body.isHeadRepresentative ??
            body.is_head_representative,
          false
        )
      : currentHead;

  const payload:
    UnknownRecord = {
    representative_type:
      representativeType,

    is_head_representative:
      representativeType ===
      "PRIMARY"
        ? requestedHead
        : false,

    updated_at_millis:
      now,

    last_synced_at_millis:
      now,

    sync_status:
      "SYNCED",

    sync_error:
      null,

    source:
      "WEB",
  };

  if (
    body.determinationMethod !==
      undefined ||
    body.determination_method !==
      undefined
  ) {
    payload.determination_method =
      normalizeDeterminationMethod(
        body.determinationMethod ??
          body.determination_method
      );
  }

  if (
    body.selectionDate !==
      undefined ||
    body.selection_date !==
      undefined
  ) {
    payload.selection_date =
      toDateValue(
        body.selectionDate ??
          body.selection_date
      );
  }

  if (
    body.dutyStartDate !==
      undefined ||
    body.duty_start_date !==
      undefined
  ) {
    const value =
      toDateValue(
        body.dutyStartDate ??
          body.duty_start_date
      );

    if (!value) {
      throw new Error(
        "Görev başlangıç tarihi zorunludur."
      );
    }

    payload.duty_start_date =
      value;
  }

  if (
    body.dutyEndDate !==
      undefined ||
    body.duty_end_date !==
      undefined
  ) {
    payload.duty_end_date =
      toDateValue(
        body.dutyEndDate ??
          body.duty_end_date
      );
  }

  const nextStart =
    String(
      payload.duty_start_date ??
        existing
          .duty_start_date ??
        ""
    );

  const nextEnd =
    clean(
      payload.duty_end_date ??
        existing
          .duty_end_date
    );

  if (
    nextEnd &&
    nextStart &&
    nextEnd < nextStart
  ) {
    throw new Error(
      "Görev bitiş tarihi başlangıç tarihinden önce olamaz."
    );
  }

  if (
    body.status !==
    undefined
  ) {
    payload.status =
      normalizeStatus(
        body.status
      );
  }

  const optionalMappings:
    Array<{
      camel: string;
      snake: string;
      target: string;
    }> = [
      {
        camel:
          "workplaceSection",
        snake:
          "workplace_section",
        target:
          "workplace_section",
      },
      {
        camel:
          "shiftName",
        snake:
          "shift_name",
        target:
          "shift_name",
      },
      {
        camel:
          "unionName",
        snake:
          "union_name",
        target:
          "union_name",
      },
      {
        camel:
          "electionReferenceNo",
        snake:
          "election_reference_no",
        target:
          "election_reference_no",
      },
      {
        camel:
          "appointmentReferenceNo",
        snake:
          "appointment_reference_no",
        target:
          "appointment_reference_no",
      },
      {
        camel:
          "note",
        snake:
          "note",
        target:
          "note",
      },
    ];

  optionalMappings.forEach(
    ({
      camel,
      snake,
      target,
    }) => {
      if (
        body[camel] !==
          undefined ||
        body[snake] !==
          undefined
      ) {
        payload[target] =
          clean(
            body[camel] ??
              body[snake]
          );
      }
    }
  );

  if (employee) {
    payload.employee_id =
      employee.id;

    payload.employee_name =
      clean(
        employee.full_name
      ) || "";

    payload.department =
      null,

    payload.job_title =
      clean(
        employee.job_title
      );

    payload.registry_no =
      clean(
        employee.registry_no
      );
  }

  return payload;
}

// ======================================================
// GET — ÇALIŞAN TEMSİLCİSİ MERKEZİ
// ======================================================

export async function GET(
  request: NextRequest
) {
  try {
    const access =
      await getAccessContext();

    if (!access.allowed) {
      return jsonError(
        "Yetkisiz erişim veya firma bilgisi eksik.",
        401
      );
    }

    const requestedFirmId =
      request.nextUrl
        .searchParams
        .get("firmId");

    const firmId =
      resolveFirmId(
        access,
        requestedFirmId
      );

    const supabase =
      getSupabase();

    let companiesQuery =
      supabase
        .from(
          COMPANIES_TABLE
        )
        .select(
          "id, name"
        )
        .order(
          "name",
          {
            ascending: true,
          }
        );

    if (
      access.companyScoped
    ) {
      companiesQuery =
        companiesQuery.eq(
          "id",
          access.companyId
        );
    }

    const {
      data: companies,
      error:
        companiesError,
    } =
      await companiesQuery;

    if (companiesError) {
      return jsonError(
        "Firma bilgileri alınamadı.",
        500,
        companiesError.message
      );
    }

    if (!firmId) {
      return jsonSuccess({
        representatives:
          [],

        employees:
          [],

        companies:
          companies || [],

        compliance:
          null,

        scope: {
          role:
            access.role,

          companyId:
            null,

          readOnly:
            access.readOnly,
        },
      });
    }

    const [
      representativesResult,
      employeesResult,
      compliance,
    ] =
      await Promise.all([
        supabase
          .from(
            REPRESENTATIVES_TABLE
          )
          .select("*")
          .eq(
            "firm_id",
            firmId
          )
          .eq(
            "is_deleted",
            false
          )
          .order(
            "is_head_representative",
            {
              ascending: false,
            }
          )
          .order(
            "representative_type",
            {
              ascending: true,
            }
          )
          .order(
            "employee_name",
            {
              ascending: true,
            }
          ),

        supabase
          .from(
            EMPLOYEES_TABLE
          )
          .select(
  "id, firm_id, full_name, job_title, registry_no, active, exit_date"
)
          .eq(
            "firm_id",
            firmId
          )
          .neq(
            "active",
            false
          )
          .order(
            "full_name",
            {
              ascending: true,
            }
          ),

        buildCompliance(
          firmId
        ),
      ]);

    if (
      representativesResult.error
    ) {
      return jsonError(
        "Çalışan temsilcileri alınamadı.",
        500,
        representativesResult
          .error.message
      );
    }

    if (
      employeesResult.error
    ) {
      return jsonError(
        "Çalışan listesi alınamadı.",
        500,
        employeesResult
          .error.message
      );
    }

    const representatives =
      (
        representativesResult
          .data || []
      ).map(
        (row) =>
          mapRepresentative(
            row as UnknownRecord
          )
      );

    return jsonSuccess({
      representatives,

      data:
        representatives,

      employees:
        employeesResult.data ||
        [],

      companies:
        companies || [],

      compliance,

      scope: {
        role:
          access.role,

        companyId:
          firmId,

        readOnly:
          access.readOnly,
      },
    });
  } catch (
    errorValue: unknown
  ) {
    console.error(
      "employee representatives GET error:",
      errorValue
    );

    return jsonError(
      errorValue instanceof Error
        ? errorValue.message
        : "Çalışan temsilcisi verileri alınırken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

// ======================================================
// POST — ÇALIŞAN TEMSİLCİSİ EKLE
// ======================================================

export async function POST(
  request: NextRequest
) {
  try {
    const access =
      await getAccessContext();

    if (!access.allowed) {
      return jsonError(
        "Yetkisiz erişim.",
        401
      );
    }

    if (access.readOnly) {
      return jsonError(
        "Demo kullanıcısı çalışan temsilcisi ekleyemez.",
        403
      );
    }

    const body =
      (
        await request.json()
      ) as UnknownRecord;

    const firmId =
      resolveFirmId(
        access,
        body.firmId ??
          body.firm_id
      );

    const employeeId =
      clean(
        body.employeeId ??
          body.employee_id
      );

    if (!firmId) {
      return jsonError(
        "Firma bilgisi zorunludur.",
        400
      );
    }

    if (!employeeId) {
      return jsonError(
        "Çalışan seçimi zorunludur.",
        400
      );
    }

    const {
      employee,
      error:
        employeeError,
    } =
      await getScopedEmployee(
        employeeId,
        firmId
      );

    if (employeeError) {
      return jsonError(
        "Çalışan bilgisi kontrol edilemedi.",
        500,
        employeeError.message
      );
    }

    if (!employee) {
      return jsonError(
        "Seçilen çalışan bulunamadı veya bu firmaya ait değil.",
        404
      );
    }

    if (
      employee.active === false
    ) {
      return jsonError(
        "Pasif çalışan, çalışan temsilcisi olarak atanamaz.",
        409
      );
    }

    const supabase =
      getSupabase();

    const {
      data:
        existingActive,
      error:
        existingError,
    } =
      await supabase
        .from(
          REPRESENTATIVES_TABLE
        )
        .select(
          "id"
        )
        .eq(
          "firm_id",
          firmId
        )
        .eq(
          "employee_id",
          employeeId
        )
        .eq(
          "status",
          "ACTIVE"
        )
        .eq(
          "is_deleted",
          false
        )
        .maybeSingle();

    if (existingError) {
      return jsonError(
        "Mevcut temsilcilik kaydı kontrol edilemedi.",
        500,
        existingError.message
      );
    }

    if (existingActive) {
      return jsonError(
        "Bu çalışan için aktif bir temsilcilik kaydı zaten bulunmaktadır.",
        409
      );
    }

    const payload =
      buildInsertPayload(
        body,
        firmId,
        employee as UnknownRecord
      );

    if (
      payload
        .is_head_representative
    ) {
      const {
        data:
          existingHead,
        error:
          headError,
      } =
        await supabase
          .from(
            REPRESENTATIVES_TABLE
          )
          .select(
            "id, employee_name"
          )
          .eq(
            "firm_id",
            firmId
          )
          .eq(
            "is_head_representative",
            true
          )
          .eq(
            "status",
            "ACTIVE"
          )
          .eq(
            "is_deleted",
            false
          )
          .maybeSingle();

      if (headError) {
        return jsonError(
          "Baş temsilci kaydı kontrol edilemedi.",
          500,
          headError.message
        );
      }

      if (existingHead) {
        return jsonError(
          `Bu firmada ${existingHead.employee_name || "başka bir çalışan"} aktif baş temsilci olarak kayıtlıdır.`,
          409
        );
      }
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          REPRESENTATIVES_TABLE
        )
        .insert(
          payload
        )
        .select("*")
        .single();

    if (error) {
      console.error(
        "employee representative POST error:",
        error
      );

      if (
        error.code ===
        "23505"
      ) {
        return jsonError(
          "Bu çalışan için aktif temsilcilik veya aktif baş temsilci kaydı zaten bulunmaktadır.",
          409,
          error.message
        );
      }

      if (
        error.code ===
        "23514"
      ) {
        return jsonError(
          "Temsilci türü, belirlenme yöntemi, görev durumu veya tarih bilgileri geçersiz.",
          400,
          error.message
        );
      }

      return jsonError(
        "Çalışan temsilcisi kaydedilemedi.",
        500,
        error.message
      );
    }

    const compliance =
      await buildCompliance(
        firmId
      );

    return jsonSuccess(
      {
        representative:
          mapRepresentative(
            data as UnknownRecord
          ),

        data:
          mapRepresentative(
            data as UnknownRecord
          ),

        compliance,

        message:
          "Çalışan temsilcisi başarıyla kaydedildi.",
      },
      201
    );
  } catch (
    errorValue: unknown
  ) {
    console.error(
      "employee representative POST general error:",
      errorValue
    );

    return jsonError(
      errorValue instanceof Error
        ? errorValue.message
        : "Çalışan temsilcisi kaydedilirken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

// ======================================================
// PUT — ÇALIŞAN TEMSİLCİSİ GÜNCELLE
// ======================================================

export async function PUT(
  request: NextRequest
) {
  try {
    const access =
      await getAccessContext();

    if (!access.allowed) {
      return jsonError(
        "Yetkisiz erişim.",
        401
      );
    }

    if (access.readOnly) {
      return jsonError(
        "Demo kullanıcısı çalışan temsilcisi güncelleyemez.",
        403
      );
    }

    const body =
      (
        await request.json()
      ) as UnknownRecord;

    const id =
      clean(
        body.id
      );

    if (!id) {
      return jsonError(
        "Kayıt kimliği zorunludur.",
        400
      );
    }

    const {
      representative:
        existing,
      error:
        existingError,
    } =
      await getScopedRepresentative(
        id,
        access
      );

    if (existingError) {
      return jsonError(
        "Temsilci kaydı kontrol edilemedi.",
        500,
        existingError.message
      );
    }

    if (!existing) {
      return jsonError(
        "Çalışan temsilcisi kaydı bulunamadı veya bu firmaya ait değil.",
        404
      );
    }

    const firmId =
      clean(
        existing.firm_id
      );

    if (!firmId) {
      return jsonError(
        "Temsilci kaydının firma bilgisi bulunamadı.",
        409
      );
    }

    const nextEmployeeId =
      clean(
        body.employeeId ??
          body.employee_id
      );

    let nextEmployee:
      UnknownRecord | null =
      null;

    if (
      nextEmployeeId &&
      nextEmployeeId !==
        clean(
          existing.employee_id
        )
    ) {
      const employeeResult =
        await getScopedEmployee(
          nextEmployeeId,
          firmId
        );

      if (
        employeeResult.error
      ) {
        return jsonError(
          "Yeni çalışan bilgisi kontrol edilemedi.",
          500,
          employeeResult
            .error.message
        );
      }

      if (
        !employeeResult.employee
      ) {
        return jsonError(
          "Seçilen yeni çalışan bulunamadı veya bu firmaya ait değil.",
          404
        );
      }

      if (
        employeeResult
          .employee.active ===
        false
      ) {
        return jsonError(
          "Pasif çalışan, çalışan temsilcisi olarak atanamaz.",
          409
        );
      }

      nextEmployee =
        employeeResult.employee as UnknownRecord;
    }

    const payload =
      buildUpdatePayload(
        body,
        existing as UnknownRecord,
        nextEmployee
      );

    if (
      payload
        .is_head_representative ===
      true
    ) {
      const supabase =
        getSupabase();

      const {
        data:
          existingHeadRows,
        error:
          headError,
      } =
        await supabase
          .from(
            REPRESENTATIVES_TABLE
          )
          .select(
            "id, employee_name"
          )
          .eq(
            "firm_id",
            firmId
          )
          .eq(
            "is_head_representative",
            true
          )
          .eq(
            "status",
            "ACTIVE"
          )
          .eq(
            "is_deleted",
            false
          )
          .neq(
            "id",
            id
          )
          .limit(1);

      if (headError) {
        return jsonError(
          "Baş temsilci kaydı kontrol edilemedi.",
          500,
          headError.message
        );
      }

      const existingHead =
        existingHeadRows?.[0];

      if (existingHead) {
        return jsonError(
          `Bu firmada ${existingHead.employee_name || "başka bir çalışan"} aktif baş temsilci olarak kayıtlıdır.`,
          409
        );
      }
    }

    const supabase =
      getSupabase();

    let updateQuery =
      supabase
        .from(
          REPRESENTATIVES_TABLE
        )
        .update(
          payload
        )
        .eq(
          "id",
          id
        )
        .eq(
          "is_deleted",
          false
        );

    if (
      access.companyScoped
    ) {
      updateQuery =
        updateQuery.eq(
          "firm_id",
          access.companyId
        );
    }

    const {
      data,
      error,
    } =
      await updateQuery
        .select("*")
        .single();

    if (error) {
      console.error(
        "employee representative PUT error:",
        error
      );

      if (
        error.code ===
        "23505"
      ) {
        return jsonError(
          "Bu çalışan için aktif temsilcilik veya aktif baş temsilci kaydı zaten bulunmaktadır.",
          409,
          error.message
        );
      }

      if (
        error.code ===
        "23514"
      ) {
        return jsonError(
          "Temsilci türü, belirlenme yöntemi, görev durumu veya tarih bilgileri geçersiz.",
          400,
          error.message
        );
      }

      return jsonError(
        "Çalışan temsilcisi güncellenemedi.",
        500,
        error.message
      );
    }

    const compliance =
      await buildCompliance(
        firmId
      );

    return jsonSuccess({
      representative:
        mapRepresentative(
          data as UnknownRecord
        ),

      data:
        mapRepresentative(
          data as UnknownRecord
        ),

      compliance,

      message:
        "Çalışan temsilcisi başarıyla güncellendi.",
    });
  } catch (
    errorValue: unknown
  ) {
    console.error(
      "employee representative PUT general error:",
      errorValue
    );

    return jsonError(
      errorValue instanceof Error
        ? errorValue.message
        : "Çalışan temsilcisi güncellenirken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

// ======================================================
// DELETE — SOFT DELETE
// ======================================================

export async function DELETE(
  request: NextRequest
) {
  try {
    const access =
      await getAccessContext();

    if (!access.allowed) {
      return jsonError(
        "Yetkisiz erişim.",
        401
      );
    }

    if (access.readOnly) {
      return jsonError(
        "Demo kullanıcısı çalışan temsilcisi silemez.",
        403
      );
    }

    const id =
      clean(
        request.nextUrl
          .searchParams
          .get("id")
      );

    if (!id) {
      return jsonError(
        "Kayıt kimliği zorunludur.",
        400
      );
    }

    const {
      representative:
        existing,
      error:
        existingError,
    } =
      await getScopedRepresentative(
        id,
        access
      );

    if (existingError) {
      return jsonError(
        "Temsilci kaydı kontrol edilemedi.",
        500,
        existingError.message
      );
    }

    if (!existing) {
      return jsonError(
        "Çalışan temsilcisi kaydı bulunamadı veya bu firmaya ait değil.",
        404
      );
    }

    const firmId =
      clean(
        existing.firm_id
      );

    if (!firmId) {
      return jsonError(
        "Temsilci kaydının firma bilgisi bulunamadı.",
        409
      );
    }

    const now =
      nowMillis();

    const supabase =
      getSupabase();

    let deleteQuery =
      supabase
        .from(
          REPRESENTATIVES_TABLE
        )
        .update({
          is_deleted:
            true,

          deleted_at_millis:
            now,

          status:
            "PASSIVE",

          updated_at_millis:
            now,

          last_synced_at_millis:
            now,

          sync_status:
            "SYNCED",

          source:
            "WEB",
        })
        .eq(
          "id",
          id
        )
        .eq(
          "is_deleted",
          false
        );

    if (
      access.companyScoped
    ) {
      deleteQuery =
        deleteQuery.eq(
          "firm_id",
          access.companyId
        );
    }

    const {
      data,
      error,
    } =
      await deleteQuery
        .select(
          "id"
        )
        .single();

    if (error) {
      return jsonError(
        "Çalışan temsilcisi silinemedi.",
        500,
        error.message
      );
    }

    const compliance =
      await buildCompliance(
        firmId
      );

    return jsonSuccess({
      deleted:
        true,

      id:
        data.id,

      compliance,

      message:
        "Çalışan temsilcisi kaydı silindi.",
    });
  } catch (
    errorValue: unknown
  ) {
    console.error(
      "employee representative DELETE general error:",
      errorValue
    );

    return jsonError(
      errorValue instanceof Error
        ? errorValue.message
        : "Çalışan temsilcisi silinirken beklenmeyen bir hata oluştu.",
      500
    );
  }
}