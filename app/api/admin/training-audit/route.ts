import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, any>;

function client() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase ortam değişkenleri eksik."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(
  value: unknown,
  fallback = 0
) {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? numeric
    : fallback;
}

function booleanValue(value: unknown) {
  if (value === true) return true;
  if (value === false) return false;

  const raw = text(value).toLowerCase();

  return [
    "1",
    "true",
    "yes",
    "evet",
    "completed",
    "passed",
  ].includes(raw);
}

function firstDate(
  ...values: unknown[]
) {
  for (const value of values) {
    const raw = text(value);
    if (!raw) continue;

    const date = new Date(raw);

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return null;
}

function normalizeStatus(
  assignment: Row
) {
  if (
    assignment.completed_at ||
    assignment.completed_at_millis ||
    assignment.completedAt ||
    assignment.status === "completed"
  ) {
    return "completed";
  }

  if (
    assignment.started_at ||
    assignment.started_at_millis ||
    assignment.startedAt ||
    assignment.status === "in_progress"
  ) {
    return "in_progress";
  }

  return "assigned";
}

function eventStatus(
  eventType: string
): "success" | "info" | "warning" {
  const type = eventType.toUpperCase();

  if (
    [
      "WATCH_COMPLETED",
      "VIDEO_CHAIN_COMPLETED",
      "PRE_EXAM_COMPLETED",
      "FINAL_EXAM_COMPLETED",
      "COMPLETED",
      "CERTIFICATE_CREATED",
    ].includes(type)
  ) {
    return "success";
  }

  if (
    [
      "FAILED",
      "EXAM_FAILED",
      "CHECKPOINT_FAILED",
    ].includes(type)
  ) {
    return "warning";
  }

  return "info";
}

function eventLabel(type: string) {
  const labels: Record<string, string> = {
    ASSIGNED: "Eğitim atandı",
    STARTED: "Eğitim başlatıldı",
    VIDEO_STARTED: "Video başladı",
    VIDEO_PROGRESS: "Video ilerlemesi kaydedildi",
    CHECKPOINT_CONFIRMED: "Ekran kontrolü onaylandı",
    WATCH_COMPLETED: "Video izleme tamamlandı",
    VIDEO_CHAIN_COMPLETED: "Alt konu video zinciri tamamlandı",
    PRE_EXAM_COMPLETED: "Ön sınav tamamlandı",
    FINAL_EXAM_COMPLETED: "Final sınavı tamamlandı",
    COMPLETED: "Eğitim tamamlandı",
    CERTIFICATE_CREATED: "Sertifika oluşturuldu",
  };

  return labels[type] || type;
}

export async function GET(request: Request) {
  try {
    const store = await cookies();

    const auth =
      store.get("dsec_admin_auth")?.value;

    const role =
      store.get("dsec_admin_role")?.value;

    const companyId = text(
      store.get("dsec_company_id")?.value
    );

    if (
      auth !== "ok" ||
      ![
        "super_admin",
        "company_admin",
      ].includes(String(role || ""))
    ) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    if (
      role === "company_admin" &&
      !companyId
    ) {
      return NextResponse.json(
        {
          error:
            "Firma yöneticisi için firma bilgisi bulunamadı.",
        },
        { status: 403 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const trainingId = text(
      searchParams.get("trainingId")
    );

    const limit = Math.min(
      Math.max(
        Number(
          searchParams.get("limit") || 200
        ),
        1
      ),
      500
    );

    const supabase = client();

    let assignmentQuery = supabase
      .from("training_assignments")
      .select("*")
      .order("created_at", {
        ascending: false,
      })
      .limit(limit);

    if (trainingId) {
      assignmentQuery =
        assignmentQuery.eq(
          "training_id",
          trainingId
        );
    }

    const {
      data: rawAssignments,
      error: assignmentError,
    } = await assignmentQuery;

    if (assignmentError) {
      return NextResponse.json(
        {
          error:
            "Eğitim atamaları alınamadı.",
          detail:
            assignmentError.message,
        },
        { status: 500 }
      );
    }

    let assignments =
      (rawAssignments || []) as Row[];

    const allUserIds = Array.from(
      new Set(
        assignments
          .map((row) =>
            text(
              row.user_id ??
                row.userId
            )
          )
          .filter(Boolean)
      )
    );

    let users: Row[] = [];

    if (allUserIds.length > 0) {
      let userQuery = supabase
        .from("users")
        .select("*")
        .in("id", allUserIds);

      if (
        role === "company_admin"
      ) {
        userQuery = userQuery.eq(
          "company_id",
          companyId
        );
      }

      const {
        data,
        error,
      } = await userQuery;

      if (error) {
        return NextResponse.json(
          {
            error:
              "Kullanıcı detayları alınamadı.",
            detail: error.message,
          },
          { status: 500 }
        );
      }

      users = (data || []) as Row[];
    }

    const userMap =
      new Map<string, Row>();

    users.forEach((row) => {
      userMap.set(
        text(row.id),
        row
      );
    });

    const allowedUserIds =
      new Set(userMap.keys());

    assignments =
      assignments.filter(
        (row) =>
          allowedUserIds.has(
            text(
              row.user_id ??
                row.userId
            )
          )
      );

    const trainingIds = Array.from(
      new Set(
        assignments
          .map((row) =>
            text(
              row.training_id ??
                row.trainingId
            )
          )
          .filter(Boolean)
      )
    );

    let trainings: Row[] = [];

    if (trainingIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from("trainings")
        .select("*")
        .in("id", trainingIds);

      if (error) {
        return NextResponse.json(
          {
            error:
              "Eğitim detayları alınamadı.",
            detail: error.message,
          },
          { status: 500 }
        );
      }

      trainings =
        (data || []) as Row[];
    }

    const trainingMap =
      new Map<string, Row>();

    trainings.forEach((row) => {
      trainingMap.set(
        text(row.id),
        row
      );
    });

    const companyIds = Array.from(
      new Set(
        users
          .map((row) =>
            text(
              row.company_id ??
                row.companyId
            )
          )
          .filter(Boolean)
      )
    );

    let companies: Row[] = [];

    if (companyIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from("companies")
        .select("*")
        .in("id", companyIds);

      if (!error) {
        companies =
          (data || []) as Row[];
      }
    }

    const companyMap =
      new Map<string, Row>();

    companies.forEach((row) => {
      companyMap.set(
        text(row.id),
        row
      );
    });

    const assignmentIds =
      assignments
        .map((row) =>
          text(row.id)
        )
        .filter(Boolean);

    let events: Row[] = [];

    if (assignmentIds.length > 0) {
      let eventQuery = supabase
        .from(
          "training_audit_events"
        )
        .select("*")
        .in(
          "assignment_id",
          assignmentIds
        )
        .order("occurred_at", {
          ascending: false,
        })
        .limit(
          Math.min(
            2000,
            limit * 20
          )
        );

      if (trainingId) {
        eventQuery =
          eventQuery.eq(
            "training_id",
            trainingId
          );
      }

      const {
        data,
        error,
      } = await eventQuery;

      if (error) {
        return NextResponse.json(
          {
            error:
              "Audit olayları alınamadı.",
            detail: error.message,
          },
          { status: 500 }
        );
      }

      events =
        (data || []) as Row[];
    }

    const eventMap =
      new Map<string, Row[]>();

    events.forEach((event) => {
      const assignmentId =
        text(
          event.assignment_id
        );

      if (!assignmentId) return;

      const list =
        eventMap.get(
          assignmentId
        ) || [];

      list.push(event);

      eventMap.set(
        assignmentId,
        list
      );
    });

    const records =
      assignments.map(
        (assignment) => {
          const assignmentId =
            text(
              assignment.id
            );

          const trainingIdValue =
            text(
              assignment.training_id ??
                assignment.trainingId
            );

          const userId =
            text(
              assignment.user_id ??
                assignment.userId
            );

          const user =
            userMap.get(userId) || {};

          const training =
            trainingMap.get(
              trainingIdValue
            ) || {};

          const rawCompanyId =
            text(
              user.company_id ??
                user.companyId
            );

          const company =
            companyMap.get(
              rawCompanyId
            ) || {};

          const rawEvents =
            eventMap.get(
              assignmentId
            ) || [];

          const orderedEvents =
            [...rawEvents].sort(
              (a, b) =>
                new Date(
                  b.occurred_at ||
                    b.created_at ||
                    0
                ).getTime() -
                new Date(
                  a.occurred_at ||
                    a.created_at ||
                    0
                ).getTime()
            );

          const hasEvent = (
            ...types: string[]
          ) =>
            orderedEvents.some(
              (row) =>
                types.includes(
                  text(
                    row.event_type
                  ).toUpperCase()
                )
            );

          const createdAt =
            firstDate(
              assignment.created_at,
              assignment.assigned_at,
              assignment.createdAt
            );

          const startedAt =
            firstDate(
              assignment.started_at,
              assignment.startedAt,
              assignment.started_at_millis,
              assignment.startedAtMillis
            );

          const completedAt =
            firstDate(
              assignment.completed_at,
              assignment.completedAt,
              assignment.completed_at_millis,
              assignment.completedAtMillis
            );

          const watchCompleted =
            booleanValue(
              assignment.video_chain_completed ??
                assignment.watch_completed ??
                assignment.watchCompleted
            );

          const preExamScore =
            assignment.pre_exam_score ??
            assignment.preExamScore ??
            null;

          const preExamPassed =
            assignment.pre_exam_passed ??
            assignment.preExamPassed ??
            null;

          const finalExamScore =
            assignment.final_exam_score ??
            assignment.finalExamScore ??
            null;

          const finalExamPassed =
            assignment.final_exam_passed ??
            assignment.finalExamPassed ??
            null;

          const certificateNo =
            text(
              assignment.certificate_no ??
                assignment.certificateNo
            ) || null;

          const certificateIssuedAt =
            firstDate(
              assignment.certificate_issued_at,
              assignment.certificateIssuedAt,
              assignment.certificate_created_at
            );

          const verificationCode =
            text(
              assignment.verification_code ??
                assignment.verificationCode
            ) || null;

          const status =
            normalizeStatus(
              assignment
            );

          const evidenceChecks = [
            Boolean(assignmentId),
            Boolean(
              startedAt ||
                hasEvent("STARTED")
            ),
            Boolean(
              watchCompleted ||
                hasEvent(
                  "WATCH_COMPLETED",
                  "VIDEO_CHAIN_COMPLETED"
                )
            ),
            Boolean(
              finalExamScore != null ||
                finalExamPassed === true ||
                hasEvent(
                  "FINAL_EXAM_COMPLETED"
                )
            ),
            Boolean(
              status ===
                "completed" ||
                hasEvent(
                  "COMPLETED"
                )
            ),
            Boolean(
              certificateNo ||
                hasEvent(
                  "CERTIFICATE_CREATED"
                )
            ),
          ];

          const hashEligibleEvents =
            orderedEvents.filter(
              (row) =>
                text(
                  row.event_type
                )
            );

          if (
            hashEligibleEvents.length > 0
          ) {
            evidenceChecks.push(
              hashEligibleEvents.every(
                (row) =>
                  Boolean(
                    row.payload_hash
                  )
              )
            );
          }

          const evidenceScore =
            Math.round(
              (
                evidenceChecks.filter(
                  Boolean
                ).length /
                evidenceChecks.length
              ) *
                100
            );

          const timeline =
            orderedEvents.length > 0
              ? orderedEvents.map(
                  (row) => {
                    const type =
                      text(
                        row.event_type
                      ).toUpperCase();

                    return {
                      id:
                        row.id ||
                        `${assignmentId}-${type}-${row.occurred_at}`,

                      type,

                      label:
                        text(
                          row.event_label
                        ) ||
                        eventLabel(type),

                      occurred_at:
                        firstDate(
                          row.occurred_at,
                          row.created_at
                        ),

                      status:
                        text(
                          row.event_status
                        ) ||
                        eventStatus(type),

                      detail:
                        row.metadata?.score !=
                        null
                          ? `${row.metadata.score} puan`
                          : row.metadata
                                ?.certificate_no
                            ? `Belge No: ${row.metadata.certificate_no}`
                            : null,

                      payload_hash:
                        row.payload_hash ||
                        null,
                    };
                  }
                )
              : [
                  createdAt
                    ? {
                        id:
                          `${assignmentId}-ASSIGNED`,
                        type:
                          "ASSIGNED",
                        label:
                          "Eğitim atandı",
                        occurred_at:
                          createdAt,
                        status:
                          "info" as const,
                        detail: null,
                        payload_hash:
                          null,
                      }
                    : null,

                  startedAt
                    ? {
                        id:
                          `${assignmentId}-STARTED`,
                        type:
                          "STARTED",
                        label:
                          "Eğitim başlatıldı",
                        occurred_at:
                          startedAt,
                        status:
                          "info" as const,
                        detail: null,
                        payload_hash:
                          null,
                      }
                    : null,

                  watchCompleted
                    ? {
                        id:
                          `${assignmentId}-WATCH_COMPLETED`,
                        type:
                          "WATCH_COMPLETED",
                        label:
                          "İçerik izleme tamamlandı",
                        occurred_at:
                          completedAt ||
                          startedAt ||
                          createdAt,
                        status:
                          "success" as const,
                        detail: null,
                        payload_hash:
                          null,
                      }
                    : null,

                  finalExamScore !=
                    null
                    ? {
                        id:
                          `${assignmentId}-FINAL_EXAM_COMPLETED`,
                        type:
                          "FINAL_EXAM_COMPLETED",
                        label:
                          "Final sınavı tamamlandı",
                        occurred_at:
                          completedAt ||
                          startedAt ||
                          createdAt,
                        status:
                          finalExamPassed ===
                          false
                            ? "warning" as const
                            : "success" as const,
                        detail:
                          `${finalExamScore} puan`,
                        payload_hash:
                          null,
                      }
                    : null,

                  completedAt ||
                  status ===
                    "completed"
                    ? {
                        id:
                          `${assignmentId}-COMPLETED`,
                        type:
                          "COMPLETED",
                        label:
                          "Eğitim tamamlandı",
                        occurred_at:
                          completedAt ||
                          createdAt,
                        status:
                          "success" as const,
                        detail: null,
                        payload_hash:
                          null,
                      }
                    : null,

                  certificateNo
                    ? {
                        id:
                          `${assignmentId}-CERTIFICATE_CREATED`,
                        type:
                          "CERTIFICATE_CREATED",
                        label:
                          "Sertifika oluşturuldu",
                        occurred_at:
                          certificateIssuedAt ||
                          completedAt ||
                          createdAt,
                        status:
                          "success" as const,
                        detail:
                          `Belge No: ${certificateNo}`,
                        payload_hash:
                          null,
                      }
                    : null,
                ].filter(Boolean);

          return {
            assignment_id:
              assignmentId,

            training_id:
              trainingIdValue,

            training_title:
              text(
                training.title
              ) ||
              text(
                orderedEvents[0]
                  ?.metadata
                  ?.training_title
              ) ||
              "Eğitim",

            training_type:
              text(
                training.type
              ),

            employee_name:
              text(
                user.full_name ??
                  user.name
              ) ||
              text(
                orderedEvents[0]
                  ?.metadata
                  ?.employee_name
              ) ||
              text(
                user.email
              ) ||
              "Çalışan",

            employee_id:
              text(
                user.employee_id ??
                  user.employeeId
              ) ||
              userId,

            email:
              text(
                user.email
              ) ||
              text(
                orderedEvents[0]
                  ?.metadata
                  ?.email
              ),

            company_name:
              text(
                company.name ??
                  company.company_name
              ) ||
              text(
                orderedEvents[0]
                  ?.metadata
                  ?.company_name
              ) ||
              "Firma Yok",

            status,
            created_at:
              createdAt,
            started_at:
              startedAt,
            completed_at:
              completedAt,

            watch_seconds:
              numberValue(
                assignment.watch_seconds ??
                  assignment.watchSeconds
              ),

            max_watched_seconds:
              numberValue(
                assignment.max_watched_seconds ??
                  assignment.maxWatchedSeconds
              ),

            click_count:
              numberValue(
                assignment.click_count ??
                  assignment.clickCount
              ),

            watch_completed:
              watchCompleted,

            pre_exam_score:
              preExamScore,

            pre_exam_passed:
              preExamPassed,

            final_exam_score:
              finalExamScore,

            final_exam_passed:
              finalExamPassed,

            certificate_no:
              certificateNo,

            certificate_issued_at:
              certificateIssuedAt,

            verification_code:
              verificationCode,

            evidence_score:
              evidenceScore,

            events: timeline,
          };
        }
      );

    const completedRecords =
      records.filter(
        (row) =>
          row.status === "completed"
      );

    const summary = {
      total: records.length,

      completed:
        completedRecords.length,

      watched:
        records.filter(
          (row) =>
            row.watch_completed
        ).length,

      passed:
        records.filter(
          (row) =>
            row.final_exam_passed ===
            true
        ).length,

      certificated:
        records.filter(
          (row) =>
            Boolean(
              row.certificate_no
            )
        ).length,

      average_evidence_score:
        records.length > 0
          ? Math.round(
              records.reduce(
                (sum, row) =>
                  sum +
                  row.evidence_score,
                0
              ) /
                records.length
            )
          : 0,

      event_count:
        events.length,

      hash_verified:
        events.filter(
          (row) =>
            Boolean(
              row.payload_hash
            )
        ).length,

      started:
        records.filter(
          (row) =>
            row.status ===
            "in_progress"
        ).length,

      assigned:
        records.filter(
          (row) =>
            row.status ===
            "assigned"
        ).length,

      completion_rate:
        records.length > 0
          ? Math.round(
              (
                completedRecords.length /
                records.length
              ) *
                100
            )
          : 0,

      certificate_rate:
        completedRecords.length >
        0
          ? Math.round(
              (
                records.filter(
                  (row) =>
                    Boolean(
                      row.certificate_no
                    )
                ).length /
                completedRecords.length
              ) *
                100
            )
          : 0,
    };

    return NextResponse.json({
      success: true,
      summary,
      data: records,
      generated_at:
        new Date().toISOString(),
      source:
        events.length > 0
          ? "training_audit_events+training_assignments"
          : "training_assignments_derived",
    });
  } catch (error: any) {
    console.error(
      "training audit route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Sunucu hatası oluştu.",
        detail:
          error?.message || null,
        generated_at:
          new Date().toISOString(),
        source:
          "training_audit_events",
      },
      { status: 500 }
    );
  }
}