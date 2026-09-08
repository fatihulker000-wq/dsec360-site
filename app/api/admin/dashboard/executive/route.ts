import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

import { calculateHsePerformance } from "@/app/admin/dashboard/lib/hse-performance-engine";
import { buildPriorityActions } from "@/app/admin/dashboard/lib/priority-action-engine";

import type { ScoreInput } from "@/app/admin/dashboard/lib/executive-dashboard-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =========================================================
   CONSTANTS
========================================================= */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DAY = 24 * 60 * 60 * 1000;

/* =========================================================
   BASIC HELPERS
========================================================= */

const clean = (value: unknown) =>
  String(value ?? "").trim();

const lower = (value: unknown) =>
  clean(value).toLocaleLowerCase("tr-TR");

const upper = (value: unknown) =>
  clean(value).toLocaleUpperCase("tr-TR");

const validUuid = (value: unknown) =>
  UUID_RE.test(clean(value))
    ? clean(value)
    : "";

const num = (value: unknown) => {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : 0;
};

const clampScore = (value: number) =>
  Math.max(
    0,
    Math.min(
      100,
      Math.round(value)
    )
  );

/* =========================================================
   SUPABASE
========================================================= */

function db() {
  const url =
    process.env.SUPABASE_URL;

  const key =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase yapılandırması eksik."
    );
  }

  return createClient(
    url,
    key,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/* =========================================================
   SESSION
========================================================= */

async function session() {
  const cookieStore =
    await cookies();

  const auth = clean(
    cookieStore.get(
      "dsec_admin_auth"
    )?.value ||
      cookieStore.get(
        "dsec_user_auth"
      )?.value
  );

  const role = clean(
    cookieStore.get(
      "dsec_admin_role"
    )?.value ||
      cookieStore.get(
        "dsec_user_role"
      )?.value
  ).toLowerCase();

  const firmId = validUuid(
    cookieStore.get(
      "dsec_company_id"
    )?.value
  );

  if (
    auth !== "ok" ||
    ![
      "super_admin",
      "company_admin",
      "demo_user",
    ].includes(role) ||
    !firmId
  ) {
    return null;
  }

  return {
    role,
    firmId,
  };
}

/* =========================================================
   STATUS HELPERS
========================================================= */

const isClosed = (
  value: unknown
) =>
  [
    "closed",
    "resolved",
    "rejected",
    "duplicate",
    "cancelled",
    "tamamlandi",
    "tamamlandı",
    "closed_ok",
    "completed",
  ].includes(lower(value));

/* =========================================================
   PERIOD
========================================================= */

function parsePeriod(
  request: Request
) {
  const raw =
    new URL(
      request.url
    ).searchParams.get(
      "period"
    ) || "30d";

  const allowed = new Set([
    "7d",
    "30d",
    "90d",
    "180d",
    "365d",
  ]);

  const key = allowed.has(raw)
    ? raw
    : "30d";

  const days =
    key === "7d"
      ? 7
      : key === "90d"
        ? 90
        : key === "180d"
          ? 180
          : key === "365d"
            ? 365
            : 30;

  const to = Date.now();

  const from =
    to -
    days * DAY;

  return {
    key,
    days,
    from,
    to,
  };
}

/* =========================================================
   DATE HELPERS
========================================================= */

function toMillis(
  raw: any
): number | null {
  if (
    raw == null ||
    raw === ""
  ) {
    return null;
  }

  const numeric =
    Number(raw);

  if (
    Number.isFinite(numeric)
  ) {
    if (
      numeric >
      1e11
    ) {
      return numeric;
    }

    if (
      numeric >
      1e9
    ) {
      return numeric * 1000;
    }
  }

  const parsed =
    new Date(
      raw
    ).getTime();

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
}

function inWindowMillis(
  millis: number | null,
  from: number,
  to: number
) {
  return (
    millis != null &&
    millis >= from &&
    millis <= to
  );
}

function riskCreatedAt(
  row: any
) {
  return toMillis(
    row?.created_at_millis ??
      row?.created_at ??
      row?.inserted_at ??
      row?.createdAtMillis ??
      row?.createdAt ??
      row?.risk_date_millis ??
      row?.risk_date ??
      null
  );
}

function riskDofCreatedAt(
  row: any
) {
  return toMillis(
    row?.dof_created_at_millis ??
      row?.dof_created_at ??
      row?.dofCreatedAtMillis ??
      row?.dofCreatedAt ??
      row?.corrective_action_created_at ??
      row?.capa_created_at ??
      row?.action_created_at ??
      riskCreatedAt(row)
  );
}

/* =========================================================
   TRAINING
========================================================= */

const isTrainingCompleted = (
  row: any
) => {
  const status = upper(
    row?.status
  );

  return (
    [
      "COMPLETED",
      "TAMAMLANDI",
      "BAŞARILI",
      "BASARILI",
      "PASSED",
    ].includes(status) ||
    Boolean(
      row?.completed_at
    ) ||
    (
      row?.watch_completed ===
        true &&
      row?.final_exam_passed ===
        true
    )
  );
};

function completionDate(
  row: any
) {
  const raw =
    row?.completed_at ||
    row?.started_at ||
    row?.created_at ||
    null;

  if (!raw) {
    return null;
  }

  const date =
    new Date(raw);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function normalizeHazard(
  value: unknown
) {
  return clean(value)
    .toLocaleUpperCase(
      "tr-TR"
    )
    .replace(
      /\s+/g,
      " "
    );
}

function trainingRule(
  value: unknown
) {
  const hazard =
    normalizeHazard(
      value
    );

  /*
   * SIRALAMA ÖNEMLİ:
   * Çok Tehlikeli
   * Az Tehlikeli
   * Tehlikeli
   */

  if (
    hazard.includes(
      "ÇOK TEHLİKELİ"
    ) ||
    hazard.includes(
      "COK TEHLIKELI"
    )
  ) {
    return {
      minutes: 960,
      years: 1,
      label:
        "Çok Tehlikeli",
    };
  }

  if (
    hazard.includes(
      "AZ TEHLİKELİ"
    ) ||
    hazard.includes(
      "AZ TEHLIKELI"
    )
  ) {
    return {
      minutes: 480,
      years: 3,
      label:
        "Az Tehlikeli",
    };
  }

  if (
    hazard.includes(
      "TEHLİKELİ"
    ) ||
    hazard.includes(
      "TEHLIKELI"
    )
  ) {
    return {
      minutes: 720,
      years: 2,
      label:
        "Tehlikeli",
    };
  }

  return {
    minutes: 0,
    years: 0,
    label:
      "Belirsiz",
  };
}

function legallyValid(
  row: any,
  years: number,
  now: Date
) {
  if (
    !isTrainingCompleted(
      row
    ) ||
    years <= 0
  ) {
    return false;
  }

  const completed =
    completionDate(row);

  if (!completed) {
    return false;
  }

  const validUntil =
    new Date(
      completed
    );

  validUntil.setFullYear(
    validUntil.getFullYear() +
      years
  );

  return (
    validUntil >= now
  );
}

/* =========================================================
   RISK
========================================================= */

type CanonicalRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "VERY_HIGH"
  | "INTOLERABLE";

function matrixLevel(
  score: number
): CanonicalRiskLevel {
  if (score >= 25) {
    return "INTOLERABLE";
  }

  if (score >= 20) {
    return "VERY_HIGH";
  }

  if (score >= 15) {
    return "HIGH";
  }

  if (score >= 8) {
    return "MEDIUM";
  }

  return "LOW";
}

function fineKinneyLevel(
  score: number
): CanonicalRiskLevel {
  if (score >= 400) {
    return "INTOLERABLE";
  }

  if (score >= 200) {
    return "VERY_HIGH";
  }

  if (score >= 70) {
    return "HIGH";
  }

  if (score >= 20) {
    return "MEDIUM";
  }

  return "LOW";
}

function matrixRowLevel(
  row: any
) {
  const score =
    num(row?.score) ||
    num(
      row?.probability
    ) *
      num(
        row?.severity
      );

  return matrixLevel(
    score
  );
}

function kinneyRowLevel(
  row: any
) {
  const score =
    num(row?.score) ||
    num(
      row?.probability_value
    ) *
      num(
        row?.frequency_value
      ) *
      num(
        row?.severity_value
      );

  return fineKinneyLevel(
    score
  );
}

/* =========================================================
   DÖF
========================================================= */

function resultRequiresDof(
  raw: unknown
) {
  const value =
    upper(raw);

  if (
    [
      "UYGUNSUZ",
      "KISMEN",
      "KISMEN UYGUN",
      "KISMEN_UYGUN",
      "KISMEN UYGUNDUR",
      "KISMEN UYGUN DEĞİL",
      "KISMEN UYGUN DEGIL",
    ].includes(value)
  ) {
    return true;
  }

  if (
    value.includes(
      "YETERSİZ"
    ) ||
    value.includes(
      "YETERSIZ"
    ) ||
    value.includes(
      "EKSİK"
    ) ||
    value.includes(
      "EKSIK"
    )
  ) {
    return true;
  }

  if (
    value.startsWith(
      "SCORE:"
    )
  ) {
    const score =
      Number(
        value.replace(
          "SCORE:",
          ""
        )
      );

    return (
      Number.isFinite(
        score
      ) &&
      score < 100
    );
  }

  if (
    value.startsWith(
      "ELMERI:"
    )
  ) {
    const parts =
      value.split(":");

    const wrong =
      Number(
        parts[2] || 0
      );

    return (
      Number.isFinite(
        wrong
      ) &&
      wrong > 0
    );
  }

  return false;
}

function inspectionDofStatus(
  row: any
) {
  const status =
    upper(
      row?.dof_status ??
        row?.dofStatus
    );

  if (
    [
      "CLOSED",
      "KAPALI",
      "TAMAMLANDI",
      "COMPLETED",
      "DONE",
    ].includes(status)
  ) {
    return "CLOSED";
  }

  if (
    [
      "OPEN",
      "IN_PROGRESS",
      "AÇIK",
      "ACIK",
      "DEVAM_EDIYOR",
      "DEVAM EDİYOR",
    ].includes(status)
  ) {
    return "OPEN";
  }

  return resultRequiresDof(
    row?.result
  )
    ? "OPEN"
    : "NONE";
}

function riskHasDof(
  row: any
) {
  const status =
    clean(
      row?.dof_status
    );

  const due =
    row?.dof_due_date_millis ??
    row?.dof_due_date ??
    row?.dof_due_at ??
    row?.corrective_action_due_date ??
    row?.action_due_date ??
    row?.capa_due_date ??
    null;

  const action =
    clean(
      row?.corrective_action
    ) ||
    clean(
      row?.action_plan
    ) ||
    clean(
      row?.dof_action
    ) ||
    clean(
      row?.capa_action
    ) ||
    clean(
      row?.measure
    ) ||
    clean(
      row?.onlem
    );

  return Boolean(
    status ||
      due ||
      action
  );
}

function riskDofStatus(
  row: any
) {
  if (
    !riskHasDof(row)
  ) {
    return "NONE";
  }

  const status =
    upper(
      row?.dof_status
    );

  if (
    [
      "CLOSED",
      "KAPALI",
      "TAMAMLANDI",
      "COMPLETED",
      "DONE",
    ].includes(status)
  ) {
    return "CLOSED";
  }

  return "OPEN";
}

function dofDueOf(
  row: any
) {
  return (
    row?.dof_due_date_millis ??
    row?.dof_due_date ??
    row?.dof_due_at ??
    row?.corrective_action_due_date ??
    row?.action_due_date ??
    row?.capa_due_date ??
    null
  );
}

/* =========================================================
   GENERIC
========================================================= */

async function safe<T>(
  promise: PromiseLike<{
    data: T | null;
    error: any;
  }>
): Promise<T | null> {
  try {
    const result =
      await promise;

    if (result.error) {
      console.error(
        "Executive dashboard source error:",
        result.error
      );

      return null;
    }

    return result.data;
  } catch (error) {
    console.error(
      "Executive dashboard source exception:",
      error
    );

    return null;
  }
}

function uniqueById(
  rows: any[]
) {
  const map =
    new Map<
      string,
      any
    >();

  for (
    const row of rows || []
  ) {
    const id =
      clean(
        row?.id
      );

    if (id) {
      map.set(
        id,
        row
      );
    }
  }

  return [
    ...map.values(),
  ];
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  request: Request
) {
  try {
    /* =====================================================
       AUTH / TENANT
    ====================================================== */

    const auth =
      await session();

    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Aktif firma oturumu bulunamadı veya yetkisiz erişim.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    /*
     * İstemci firmId yalnız doğrulama içindir.
     * Tenant kaynağı cookie UUID'sidir.
     */

    const requestedFirmId =
      validUuid(
        new URL(
          request.url
        ).searchParams.get(
          "firmId"
        )
      );

    if (
      requestedFirmId &&
      requestedFirmId !==
        auth.firmId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Firma doğrulama hatası: İstenen firma aktif oturum firmasıyla eşleşmiyor.",
        },
        {
          status: 409,
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const supabase =
      db();

    const firmId =
      auth.firmId;

    const now =
      Date.now();

    const nowDate =
      new Date();

    const period =
      parsePeriod(
        request
      );

    /* =====================================================
       COMPANY + EMPLOYEE
    ====================================================== */

    const [
      company,
      employeesAll,
    ] =
      await Promise.all([
        safe<any>(
          supabase
            .from(
              "companies"
            )
            .select(
              "id,name,local_firm_id,tehlike_sinifi"
            )
            .eq(
              "id",
              firmId
            )
            .maybeSingle()
        ),

        safe<any[]>(
          supabase
            .from(
              "employees"
            )
            .select(
              "id,active"
            )
            .eq(
              "firm_id",
              firmId
            )
        ),
      ]);

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Aktif firma bulunamadı.",
        },
        {
          status: 404,
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const localFirmId =
      company.local_firm_id ==
      null
        ? ""
        : clean(
            company.local_firm_id
          );

    const employees = (
      employeesAll || []
    ).filter(
      (row) =>
        row.active !== false
    );

    const employeeIds =
      employees
        .map(
          (row) =>
            clean(row.id)
        )
        .filter(Boolean);

    /* =====================================================
       USER MAPPING
    ====================================================== */

    const usersPromise =
      employeeIds.length
        ? safe<any[]>(
            supabase
              .from(
                "users"
              )
              .select(
                "id,employee_id,company_id"
              )
              .eq(
                "company_id",
                firmId
              )
              .in(
                "employee_id",
                employeeIds
              )
          )
        : Promise.resolve(
            []
          );

    /* =====================================================
       PARALLEL SOURCES
    ====================================================== */

    const independentPromise =
      Promise.all([
        /*
         * Risk:
         * full rows because canonical
         * level + DÖF + tarih lazım.
         */

        safe<any[]>(
          supabase
            .from(
              "risk_items"
            )
            .select("*")
            .eq(
              "company_id",
              firmId
            )
            .eq(
              "is_deleted",
              false
            )
        ),

        safe<any[]>(
          supabase
            .from(
              "fine_kinney_risks"
            )
            .select("*")
            .eq(
              "company_id",
              firmId
            )
            .eq(
              "is_deleted",
              false
            )
        ),

        /* DENETİM */

        safe<any[]>(
          supabase
            .from(
              "denetim_runs"
            )
            .select(
              "id,firm_id,status,inserted_at"
            )
            .eq(
              "firm_id",
              firmId
            )
        ),

        localFirmId
          ? safe<any[]>(
              supabase
                .from(
                  "denetim_runs"
                )
                .select(
                  "id,firm_id,status,inserted_at"
                )
                .eq(
                  "firm_id",
                  localFirmId
                )
            )
          : Promise.resolve(
              []
            ),

        /* HEALTH */

        employeeIds.length
          ? safe<any[]>(
              supabase
                .from(
                  "health_examinations"
                )
                .select(
                  "id,employee_id,exam_date,next_exam_date,is_deleted"
                )
                .eq(
                  "company_id",
                  firmId
                )
                .eq(
                  "is_deleted",
                  false
                )
                .in(
                  "employee_id",
                  employeeIds
                )
            )
          : Promise.resolve(
              []
            ),

        employeeIds.length
          ? safe<any[]>(
              supabase
                .from(
                  "health_ek2_forms"
                )
                .select(
                  "id,employee_id,examination_id,form_type,status,exam_date,next_exam_date,is_active,created_at"
                )
                .eq(
                  "company_id",
                  firmId
                )
                .or(
                  "is_active.is.null,is_active.eq.true"
                )
                .in(
                  "employee_id",
                  employeeIds
                )
            )
          : Promise.resolve(
              []
            ),

        /* PERIODIC */

        safe<any[]>(
          supabase
            .from(
              "periodic_control_equipments"
            )
            .select(
              "id,firm_id,next_due_millis,status,deleted"
            )
            .eq(
              "firm_id",
              firmId
            )
            .eq(
              "deleted",
              false
            )
        ),

        /* ENVIRONMENT */

        safe<any[]>(
          supabase
            .from(
              "environment_measurements"
            )
            .select(
              "id,firm_id,next_due_millis,status,deleted"
            )
            .eq(
              "firm_id",
              firmId
            )
            .eq(
              "deleted",
              false
            )
        ),

        /* CBS */

        safe<any[]>(
          supabase
            .from(
              "cbs_forms"
            )
            .select(
              "id,firm_id,status,priority,sla_due_at"
            )
            .eq(
              "firm_id",
              firmId
            )
        ),

        /* ACCIDENT WEB UUID */

        safe<any[]>(
          supabase
            .from(
              "accident_records"
            )
            .select(
              "id,web_firm_id,firm_id,event_date,lost_work_days,is_active,is_deleted,created_at"
            )
            .eq(
              "web_firm_id",
              firmId
            )
            .or(
              "is_deleted.is.null,is_deleted.eq.false,is_deleted.eq.0"
            )
        ),

        /* ACCIDENT LOCAL FIRM */

        localFirmId
          ? safe<any[]>(
              supabase
                .from(
                  "accident_records"
                )
                .select(
                  "id,web_firm_id,firm_id,event_date,lost_work_days,is_active,is_deleted,created_at"
                )
                .eq(
                  "firm_id",
                  localFirmId
                )
                .or(
                  "is_deleted.is.null,is_deleted.eq.false,is_deleted.eq.0"
                )
            )
          : Promise.resolve(
              []
            ),
      ]);

    const [
      independent,
      usersRaw,
    ] =
      await Promise.all([
        independentPromise,
        usersPromise,
      ]);

    const [
      matrixRisksRaw,
      kinneyRisksRaw,
      inspectionRunsRemote,
      inspectionRunsLocal,
      healthExams,
      healthEk2,
      periodic,
      environment,
      cbs,
      accidentsWeb,
      accidentsLocal,
    ] =
      independent;

    /* =====================================================
       USERS
    ====================================================== */

    const users =
      usersRaw ?? [];

    const userIds =
      users
        .map(
          (row: any) =>
            clean(row.id)
        )
        .filter(Boolean);

    const userToEmployee =
      new Map<
        string,
        string
      >(
        users
          .map(
            (
              row: any
            ): [
              string,
              string,
            ] => [
              clean(row.id),
              clean(
                row.employee_id
              ),
            ]
          )
          .filter(
            ([
              userId,
              employeeId,
            ]) =>
              Boolean(
                userId &&
                  employeeId
              )
          )
      );

    /* =====================================================
       TRAINING ASSIGNMENTS
    ====================================================== */

    const trainingAssignments =
      userIds.length
        ? (
            (await safe<any[]>(
              supabase
                .from(
                  "training_assignments"
                )
                .select(
                  "id,user_id,training_id,status,watch_completed,final_exam_passed,started_at,completed_at,created_at"
                )
                .in(
                  "user_id",
                  userIds
                )
            )) ?? []
          )
        : [];

    /* =====================================================
       DENETİM RUN
    ====================================================== */

    const inspectionRuns =
      uniqueById([
        ...(
          inspectionRunsRemote ||
          []
        ),

        ...(
          inspectionRunsLocal ||
          []
        ),
      ]);

    /*
     * Seçili dönem:
     * 7 / 30 / 90 / 180 / 365
     */

    const activeRuns =
      inspectionRuns.filter(
        (row) => {
          const time =
            toMillis(
              row.inserted_at
            );

          return inWindowMillis(
            time,
            period.from,
            period.to
          );
        }
      );

    const runIds =
      activeRuns
        .map(
          (row) =>
            clean(row.id)
        )
        .filter(Boolean);

    /* =====================================================
       TRAINING DEFINITIONS
    ====================================================== */

    const trainingIds =
      Array.from(
        new Set(
          trainingAssignments
            .map(
              (row: any) =>
                clean(
                  row.training_id
                )
            )
            .filter(Boolean)
        )
      );

    const trainingDefsPromise =
      trainingIds.length
        ? safe<any[]>(
            supabase
              .from(
                "trainings"
              )
              .select(
                "id,duration_minutes,title,type,created_at"
              )
              .in(
                "id",
                trainingIds
              )
          )
        : Promise.resolve(
            []
          );

    /* =====================================================
       INSPECTION ANSWERS
    ====================================================== */

    const inspectionAnswersPromise =
      (async () => {
        if (
          !runIds.length
        ) {
          return [];
        }

        const [
          byRemote,
          byLocal,
        ] =
          await Promise.all([
            safe<any[]>(
              supabase
                .from(
                  "denetim_answers"
                )
                .select("*")
                .in(
                  "run_remote_id",
                  runIds
                )
            ),

            safe<any[]>(
              supabase
                .from(
                  "denetim_answers"
                )
                .select("*")
                .in(
                  "run_id",
                  runIds
                )
            ),
          ]);

        return uniqueById([
          ...(byRemote ||
            []),

          ...(byLocal ||
            []),
        ]);
      })();

    const [
      trainingDefs,
      inspectionAnswers,
    ] =
      await Promise.all([
        trainingDefsPromise,
        inspectionAnswersPromise,
      ]);

    const trainingMap =
      new Map<
        string,
        any
      >(
        (
          trainingDefs ||
          []
        ).map(
          (
            row: any
          ): [
            string,
            any,
          ] => [
            clean(row.id),
            row,
          ]
        )
      );

    /* =====================================================
       RISK
       DÖNEM BAZLI
    ====================================================== */

    const matrixRisks =
      (
        matrixRisksRaw ||
        []
      )
        .map((row) => ({
          row,
          level:
            matrixRowLevel(
              row
            ),
          createdAt:
            riskCreatedAt(
              row
            ),
        }))
        .filter((entry) =>
          inWindowMillis(
            entry.createdAt,
            period.from,
            period.to
          )
        );

    const kinneyRisks =
      (
        kinneyRisksRaw ||
        []
      )
        .map((row) => ({
          row,
          level:
            kinneyRowLevel(
              row
            ),
          createdAt:
            riskCreatedAt(
              row
            ),
        }))
        .filter((entry) =>
          inWindowMillis(
            entry.createdAt,
            period.from,
            period.to
          )
        );

    const riskEntries = [
      ...matrixRisks,
      ...kinneyRisks,
    ];

    const riskLevels = {
      intolerable: 0,
      veryHigh: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (
      const entry of
      riskEntries
    ) {
      switch (
        entry.level
      ) {
        case "INTOLERABLE":
          riskLevels.intolerable++;
          break;

        case "VERY_HIGH":
          riskLevels.veryHigh++;
          break;

        case "HIGH":
          riskLevels.high++;
          break;

        case "MEDIUM":
          riskLevels.medium++;
          break;

        case "LOW":
          riskLevels.low++;
          break;
      }
    }

    const riskTotal =
      riskEntries.length;

    /* =====================================================
       KRİTİK RİSK
       
       YENİ KURAL:
       
       SADECE DÖF'Ü AÇIK OLAN:
       HIGH
       + VERY_HIGH
       + INTOLERABLE
    ====================================================== */

    const openHigh =
      riskEntries.filter(
        ({ row, level }) =>
          level ===
            "HIGH" &&
          riskDofStatus(
            row
          ) === "OPEN"
      ).length;

    const openVeryHigh =
      riskEntries.filter(
        ({ row, level }) =>
          level ===
            "VERY_HIGH" &&
          riskDofStatus(
            row
          ) === "OPEN"
      ).length;

    const openIntolerable =
      riskEntries.filter(
        ({ row, level }) =>
          level ===
            "INTOLERABLE" &&
          riskDofStatus(
            row
          ) === "OPEN"
      ).length;

    const riskCritical =
      openHigh +
      openVeryHigh +
      openIntolerable;

    /*
     * Dashboard istemcisine gönderilecek zengin Risk modeli.
     */

    const riskModule =
      riskTotal > 0
        ? {
            total:
              riskTotal,

            critical:
              riskCritical,

            intolerable:
              riskLevels.intolerable,

            veryHigh:
              riskLevels.veryHigh,

            high:
              riskLevels.high,

            medium:
              riskLevels.medium,

            low:
              riskLevels.low,

            openHigh,

            openVeryHigh,

            openIntolerable,
          }
        : undefined;

    /* =====================================================
       DENETİM UYUMU
       
       UYGUN /
       DEĞERLENDİRİLEN MADDE
       
       N/A / BOŞ HARİÇ
    ====================================================== */

    const answers =
      inspectionAnswers ||
      [];

    const suitable =
      answers.filter(
        (row) =>
          upper(
            row?.result
          ) === "UYGUN"
      ).length;

    const partial =
      answers.filter(
        (row) =>
          [
            "KISMEN",
            "KISMEN UYGUN",
            "KISMEN_UYGUN",
          ].includes(
            upper(
              row?.result
            )
          )
      ).length;

    const nonCompliant =
      answers.filter(
        (row) =>
          upper(
            row?.result
          ) ===
          "UYGUNSUZ"
      ).length;

    /*
     * Sadece gerçekten değerlendirilen maddeler.
     *
     * UYGUN
     * KISMEN
     * UYGUNSUZ
     */

    const evaluatedTotal =
      suitable +
      partial +
      nonCompliant;

    const inspectionComplianceScore =
      evaluatedTotal > 0
        ? clampScore(
            (
              suitable /
              evaluatedTotal
            ) * 100
          )
        : null;

    const inspectionModule =
      evaluatedTotal > 0
        ? {
            total:
              evaluatedTotal,

            evaluatedTotal,

            compliant:
              suitable,

            partial,

            nonCompliant,

            complianceScore:
              inspectionComplianceScore,
          }
        : undefined;

    /* =====================================================
       DÖF
       
       RİSK + DENETİM
       
       SEÇİLİ DÖNEM
    ====================================================== */

    /*
     * Risk DÖF:
     *
     * DÖF oluşturulma tarihi
     * yoksa risk oluşturulma tarihi
     * fallback edilir.
     */

    const allRiskEntries =
      [
        ...(
          matrixRisksRaw ||
          []
        ).map(
          (row) => ({
            row,
            level:
              matrixRowLevel(
                row
              ),
          })
        ),

        ...(
          kinneyRisksRaw ||
          []
        ).map(
          (row) => ({
            row,
            level:
              kinneyRowLevel(
                row
              ),
          })
        ),
      ];

    const periodRiskDofRows =
      allRiskEntries
        .filter(
          ({ row }) =>
            riskHasDof(
              row
            )
        )
        .filter(
          ({ row }) =>
            inWindowMillis(
              riskDofCreatedAt(
                row
              ),
              period.from,
              period.to
            )
        );

    const riskDofTotal =
      periodRiskDofRows.length;

    const riskDofClosed =
      periodRiskDofRows.filter(
        ({ row }) =>
          riskDofStatus(
            row
          ) === "CLOSED"
      ).length;

    const riskDofOpen =
      periodRiskDofRows.filter(
        ({ row }) =>
          riskDofStatus(
            row
          ) === "OPEN"
      ).length;

    /*
     * Denetim cevapları zaten seçilen run döneminden geliyor.
     */

    const inspectionDofRows =
      answers.filter(
        (row) =>
          inspectionDofStatus(
            row
          ) !== "NONE"
      );

    const inspectionDofClosed =
      inspectionDofRows.filter(
        (row) =>
          inspectionDofStatus(
            row
          ) === "CLOSED"
      ).length;

    const inspectionDofOpen =
      inspectionDofRows.filter(
        (row) =>
          inspectionDofStatus(
            row
          ) === "OPEN"
      ).length;

    const dofTotal =
      riskDofTotal +
      inspectionDofRows.length;

    const dofClosed =
      riskDofClosed +
      inspectionDofClosed;

    const dofOpen =
      riskDofOpen +
      inspectionDofOpen;

    /*
     * Geciken açık DÖF
     */

    const dofOverdue =
      [
        ...periodRiskDofRows.map(
          ({ row }) => ({
            row,
            status:
              riskDofStatus(
                row
              ),
          })
        ),

        ...inspectionDofRows.map(
          (row) => ({
            row,
            status:
              inspectionDofStatus(
                row
              ),
          })
        ),
      ].filter(
        ({
          row,
          status,
        }) => {
          if (
            status !==
            "OPEN"
          ) {
            return false;
          }

          const due =
            toMillis(
              dofDueOf(row)
            );

          return (
            due != null &&
            due < now
          );
        }
      ).length;

    const dofModule =
      dofTotal > 0
        ? {
            total:
              dofTotal,

            open:
              dofOpen,

            closed:
              dofClosed,

            overdue:
              dofOverdue,

            riskTotal:
              riskDofTotal,

            riskOpen:
              riskDofOpen,

            riskClosed:
              riskDofClosed,

            inspectionTotal:
              inspectionDofRows.length,

            inspectionOpen:
              inspectionDofOpen,

            inspectionClosed:
              inspectionDofClosed,
          }
        : undefined;

    /* =====================================================
       LEGAL TRAINING
    ====================================================== */

    const rule =
      trainingRule(
        company.tehlike_sinifi
      );

    const employeeTrainingMinutes =
      new Map<
        string,
        number
      >();

    if (
      rule.minutes > 0
    ) {
      for (
        const assignment of
        trainingAssignments
      ) {
        const employeeId =
          userToEmployee.get(
            clean(
              assignment.user_id
            )
          );

        if (!employeeId) {
          continue;
        }

        const definition =
          trainingMap.get(
            clean(
              assignment.training_id
            )
          );

        const enriched = {
          ...assignment,

          duration_minutes:
            num(
              definition?.duration_minutes
            ),
        };

        /*
         * Yalnız mevzuat açısından halen geçerli eğitimler.
         */

        if (
          !legallyValid(
            enriched,
            rule.years,
            nowDate
          )
        ) {
          continue;
        }

        const previous =
          employeeTrainingMinutes.get(
            employeeId
          ) || 0;

        employeeTrainingMinutes.set(
          employeeId,
          previous +
            Math.max(
              0,
              num(
                definition?.duration_minutes
              )
            )
        );
      }
    }

    /*
     * Tam mevzuat uyumlu çalışan:
     * gerekli dakikayı tamamlamış.
     */

    const trainingCompliant =
      rule.minutes > 0
        ? employeeIds.filter(
            (employeeId) =>
              (
                employeeTrainingMinutes.get(
                  employeeId
                ) || 0
              ) >=
              rule.minutes
          ).length
        : 0;

    const trainingMissing =
      rule.minutes > 0
        ? Math.max(
            0,
            employeeIds.length -
              trainingCompliant
          )
        : 0;

    /*
     * =====================================================
     * EĞİTİM UYGUNLUK SKORU
     *
     * Her çalışanın:
     *
     * geçerli eğitim dakikası /
     * gerekli yasal dakika
     *
     * oranı alınır.
     *
     * Her kişi maksimum %100.
     *
     * Sonra firma ortalaması hesaplanır.
     *
     * Örnek:
     * 12 saat gerekli
     * çalışan 6 saat tamamladı
     * firma skoruna %50 katkı sağlar.
     * =====================================================
     */

    let trainingComplianceScore:
      | number
      | null = null;

    if (
      employeeIds.length >
        0 &&
      rule.minutes > 0
    ) {
      let earnedMinutes =
        0;

      const maximumMinutes =
        employeeIds.length *
        rule.minutes;

      for (
        const employeeId of
        employeeIds
      ) {
        const completed =
          employeeTrainingMinutes.get(
            employeeId
          ) || 0;

        earnedMinutes +=
          Math.min(
            completed,
            rule.minutes
          );
      }

      trainingComplianceScore =
        maximumMinutes > 0
          ? clampScore(
              (
                earnedMinutes /
                maximumMinutes
              ) * 100
            )
          : null;
    }

    const trainingModule =
      employeeIds.length >
        0 &&
      rule.minutes > 0
        ? {
            totalEmployees:
              employeeIds.length,

            compliantEmployees:
              trainingCompliant,

            nonCompliantEmployees:
              trainingMissing,

            requiredMinutes:
              rule.minutes,

            hazardClass:
              rule.label,

            complianceScore:
              trainingComplianceScore,
          }
        : undefined;

    /* =====================================================
       HEALTH
       SNAPSHOT
    ====================================================== */

    const latestHealth =
      new Map<
        string,
        {
          examAt: number;
          dueAt:
            | number
            | null;
        }
      >();

    const putHealth = (
      employeeIdRaw: any,
      examRaw: any,
      dueRaw: any
    ) => {
      const employeeId =
        clean(
          employeeIdRaw
        );

      if (!employeeId) {
        return;
      }

      const examAt =
        examRaw
          ? new Date(
              examRaw
            ).getTime()
          : 0;

      const dueAt =
        dueRaw
          ? new Date(
              dueRaw
            ).getTime()
          : NaN;

      const normalizedExam =
        Number.isFinite(
          examAt
        )
          ? examAt
          : 0;

      const normalizedDue =
        Number.isFinite(
          dueAt
        )
          ? dueAt
          : null;

      const old =
        latestHealth.get(
          employeeId
        );

      if (
        !old ||
        normalizedExam >=
          old.examAt
      ) {
        latestHealth.set(
          employeeId,
          {
            examAt:
              normalizedExam,
            dueAt:
              normalizedDue,
          }
        );
      }
    };

    for (
      const exam of
      healthExams || []
    ) {
      putHealth(
        exam.employee_id,
        exam.exam_date,
        exam.next_exam_date
      );
    }

    for (
      const form of
      healthEk2 || []
    ) {
      putHealth(
        form.employee_id,
        form.exam_date ||
          form.created_at,
        form.next_exam_date
      );
    }

    let healthValid = 0;
    let healthOverdue = 0;
    let healthApproaching = 0;
    let healthMissing = 0;

    for (
      const employeeId of
      employeeIds
    ) {
      const health =
        latestHealth.get(
          employeeId
        );

      if (
        !health ||
        health.dueAt ==
          null
      ) {
        healthMissing++;
        continue;
      }

      if (
        health.dueAt <
        now
      ) {
        healthOverdue++;
        continue;
      }

      healthValid++;

      if (
        health.dueAt -
          now <=
        30 * DAY
      ) {
        healthApproaching++;
      }
    }

    const ek2Employees =
      new Set(
        (
          healthEk2 || []
        )
          .map((row) =>
            clean(
              row.employee_id
            )
          )
          .filter(Boolean)
      ).size;

    const healthModule =
      employeeIds.length > 0
        ? {
            totalEmployees:
              employeeIds.length,

            valid:
              healthValid,

            approaching:
              healthApproaching,

            overdue:
              healthOverdue,

            missing:
              healthMissing,

            ek2Employees,
          }
        : undefined;

    /* =====================================================
       ACCIDENT / INCIDENT
       DÖNEM BAZLI
    ====================================================== */

    const allAccidents =
      uniqueById([
        ...(
          accidentsWeb ||
          []
        ),

        ...(
          accidentsLocal ||
          []
        ),
      ]).filter(
        (row) =>
          row.is_active !==
          false
      );

    const accidentRows =
      allAccidents.filter(
        (row) =>
          inWindowMillis(
            toMillis(
              row.event_date ||
                row.created_at
            ),
            period.from,
            period.to
          )
      );

    const lostTime =
      accidentRows.filter(
        (row) =>
          num(
            row.lost_work_days
          ) > 0
      ).length;

    const openInvestigations =
      0;

    const incidentModule =
      accidentRows.length > 0
        ? {
            total:
              accidentRows.length,

            lostTime,

            openInvestigations,
          }
        : undefined;

    /* =====================================================
       PERIODIC / ENVIRONMENT
       SNAPSHOT
    ====================================================== */

    const summarizeDue = (
      rows:
        | any[]
        | null
    ) => {
      const all =
        rows || [];

      let valid = 0;
      let approaching = 0;
      let overdue = 0;

      for (
        const row of all
      ) {
        const due =
          num(
            row.next_due_millis
          );

        if (due > 0) {
          if (
            due < now
          ) {
            overdue++;
          } else if (
            due -
              now <=
            30 * DAY
          ) {
            approaching++;
          } else {
            valid++;
          }

          continue;
        }

        const status =
          lower(
            row.status
          );

        if (
          [
            "overdue",
            "expired",
            "gecikmis",
            "gecikmiş",
            "suresi_gecmis",
            "süresi geçmiş",
          ].includes(
            status
          )
        ) {
          overdue++;
        } else if (
          [
            "approaching",
            "yaklasiyor",
            "yaklaşıyor",
            "due_soon",
          ].includes(
            status
          )
        ) {
          approaching++;
        } else if (
          [
            "valid",
            "uygun",
            "ok",
            "gecerli",
            "geçerli",
          ].includes(
            status
          )
        ) {
          valid++;
        }
      }

      return {
        total:
          all.length,

        valid,

        approaching,

        overdue,
      };
    };

    const periodicSummary =
      summarizeDue(
        periodic
      );

    const environmentSummary =
      summarizeDue(
        environment
      );

    /* =====================================================
       CBS
       SNAPSHOT
    ====================================================== */

    const cbsRows =
      cbs || [];

    const cbsOpen =
      cbsRows.filter(
        (row) =>
          !isClosed(
            row.status
          )
      ).length;

    const cbsCritical =
      cbsRows.filter(
        (row) =>
          !isClosed(
            row.status
          ) &&
          lower(
            row.priority
          ) ===
            "critical"
      ).length;

    const cbsSla =
      cbsRows.filter(
        (row) => {
          if (
            isClosed(
              row.status
            ) ||
            !row.sla_due_at
          ) {
            return false;
          }

          const time =
            new Date(
              row.sla_due_at
            ).getTime();

          return (
            Number.isFinite(
              time
            ) &&
            time < now
          );
        }
      ).length;

    const cbsActionRequired =
      new Set(
        cbsRows
          .filter(
            (row) => {
              if (
                isClosed(
                  row.status
                )
              ) {
                return false;
              }

              const critical =
                lower(
                  row.priority
                ) ===
                "critical";

              const due =
                row.sla_due_at
                  ? new Date(
                      row.sla_due_at
                    ).getTime()
                  : NaN;

              return (
                critical ||
                (
                  Number.isFinite(
                    due
                  ) &&
                  due < now
                )
              );
            }
          )
          .map((row) =>
            clean(row.id)
          )
      ).size;

    const cbsModule =
      cbsRows.length > 0
        ? {
            total:
              cbsRows.length,

            open:
              cbsOpen,

            critical:
              cbsCritical,

            slaExceeded:
              cbsSla,

            actionRequired:
              cbsActionRequired,
          }
        : undefined;

    /* =====================================================
       SCORE INPUT
    ====================================================== */

    /*
     * complianceScore / evaluatedTotal alanları
     * mevcut ScoreInput tipi henüz bilmese bile
     * API ve yeni engine kullanımına hazır.
     */

    const scoreInput: ScoreInput =
      {
        risk:
          riskModule
            ? ({
                total:
                  riskModule.total,

                critical:
                  riskModule.critical,

                intolerable:
                  riskModule.intolerable,

                veryHigh:
                  riskModule.veryHigh,

                high:
                  riskModule.high,

                medium:
                  riskModule.medium,

                low:
                  riskModule.low,

                openHigh:
                  riskModule.openHigh,

                openVeryHigh:
                  riskModule.openVeryHigh,

                openIntolerable:
                  riskModule.openIntolerable,
              } as any)
            : undefined,

        inspection:
          inspectionModule
            ? ({
                total:
                  inspectionModule.total,

                compliant:
                  inspectionModule.compliant,

                partial:
                  inspectionModule.partial,

                nonCompliant:
                  inspectionModule.nonCompliant,

                evaluatedTotal:
                  inspectionModule.evaluatedTotal,

                complianceScore:
                  inspectionModule.complianceScore,
              } as any)
            : undefined,

        training:
          trainingModule
            ? ({
                totalEmployees:
                  trainingModule.totalEmployees,

                compliantEmployees:
                  trainingModule.compliantEmployees,

                nonCompliantEmployees:
                  trainingModule.nonCompliantEmployees,

                requiredMinutes:
                  trainingModule.requiredMinutes,

                hazardClass:
                  trainingModule.hazardClass,

                complianceScore:
                  trainingModule.complianceScore,
              } as any)
            : undefined,

        dof:
          dofModule,

        incident:
          incidentModule,

        health:
          healthModule,

        periodic:
          periodicSummary.total >
          0
            ? periodicSummary
            : undefined,

        environment:
          environmentSummary.total >
          0
            ? environmentSummary
            : undefined,

        cbs:
          cbsModule,
      };

    /* =====================================================
       REAL TREND
    ====================================================== */

    const previousFrom =
      period.from -
      period.days *
        DAY;

    const previousTo =
      period.from;

    const currentRunCount =
      activeRuns.length;

    const previousRunCount =
      inspectionRuns.filter(
        (row) =>
          inWindowMillis(
            toMillis(
              row.inserted_at
            ),
            previousFrom,
            previousTo
          )
      ).length;

    const currentIncidentCount =
      accidentRows.length;

    const previousIncidentCount =
      allAccidents.filter(
        (row) =>
          inWindowMillis(
            toMillis(
              row.event_date ||
                row.created_at
            ),
            previousFrom,
            previousTo
          )
      ).length;

    const trend = {
      periodDays:
        period.days,

      inspection: {
        current:
          currentRunCount,

        previous:
          previousRunCount,

        delta:
          currentRunCount -
          previousRunCount,
      },

      incident: {
        current:
          currentIncidentCount,

        previous:
          previousIncidentCount,

        delta:
          currentIncidentCount -
          previousIncidentCount,
      },
    };

    /* =====================================================
       PERFORMANCE + ACTIONS
    ====================================================== */

    const performance =
      calculateHsePerformance(
        scoreInput
      );

    const priorityActions =
      buildPriorityActions(
        scoreInput
      );

    /* =====================================================
       RESPONSE
    ====================================================== */

    return NextResponse.json(
      {
        success: true,

        firmId,

        firm: {
          id:
            firmId,

          name:
            clean(
              company.name
            ) ||
            "Aktif Firma",

          localFirmId:
            company.local_firm_id ??
            null,

          hazardClass:
            rule.label,
        },

        generatedAt:
          new Date().toISOString(),

        period: {
          key:
            period.key,

          days:
            period.days,
        },

        /*
         * Artık Risk + DÖF de dönem bazlı.
         *
         * Training / Health / Periodic / Environment / CBS
         * bugünkü geçerlilik durumunu gösteren snapshot KPI'lardır.
         */

        scope: {
          periodBased: [
            "risk",
            "dof",
            "inspection",
            "incident",
          ],

          snapshot: [
            "training",
            "health",
            "periodic",
            "environment",
            "cbs",
          ],
        },

        performance,

        priorityActions,

        trend,

        modules: {
          risk:
            riskModule ??
            null,

          inspection:
            inspectionModule ??
            null,

          dof:
            dofModule ??
            null,

          training:
            trainingModule ??
            null,

          incident:
            incidentModule ??
            null,

          health:
            healthModule ??
            null,

          periodic:
            periodicSummary.total >
            0
              ? periodicSummary
              : null,

          environment:
            environmentSummary.total >
            0
              ? environmentSummary
              : null,

          cbs:
            cbsModule ??
            null,
        },

        integrity: {
          tenant:
            "ACTIVE_REMOTE_UUID",

          tenantVerified:
            true,

          strictFirmIsolation:
            true,

          syntheticTrend:
            false,

          syntheticRiskMatrix:
            false,

          sensitiveHealthData:
            false,

          doraIncluded:
            false,
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Executive dashboard error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Executive Dashboard oluşturulamadı.",
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}

/* =========================================================
   OPTIONS
========================================================= */

export async function OPTIONS() {
  return new Response(
    null,
    {
      status: 204,

      headers: {
        Allow:
          "GET, OPTIONS",

        "Cache-Control":
          "no-store",
      },
    }
  );
}