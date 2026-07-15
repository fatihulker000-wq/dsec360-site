import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, any>;

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase ortam değişkenleri eksik.");
  }

  return createClient(url, key);
}

function toText(value: unknown) {
  return String(value ?? "").trim();
}

function toBoolean(value: unknown) {
  return value === true;
}

function toNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeStatus(row: AnyRow) {
  const status = toText(row.status).toLowerCase();

  if (
    row.final_exam_passed === true &&
    row.watch_completed === true
  ) {
    return "completed";
  }

  if (
    status === "completed" ||
    status === "in_progress" ||
    status === "assigned" ||
    status === "not_started"
  ) {
    return status;
  }

  if (row.started_at) {
    return "in_progress";
  }

  return "assigned";
}

function buildEvidenceScore(row: AnyRow) {
  const checks = [
    Boolean(row.created_at),
    Boolean(row.started_at),
    toBoolean(row.watch_completed),
    toNumber(row.watch_seconds) > 0,
    toBoolean(row.final_exam_passed),
    Boolean(row.completed_at),
    Boolean(row.certificate_no),
    Boolean(row.verification_code),
  ];

  return Math.round(
    (checks.filter(Boolean).length / checks.length) * 100
  );
}

function buildEvents(row: AnyRow) {
  const events: Array<{
    type: string;
    label: string;
    occurred_at: string | null;
    status: "success" | "info" | "warning";
    detail?: string | null;
  }> = [];

  events.push({
    type: "ASSIGNED",
    label: "Eğitim atandı",
    occurred_at: row.created_at || null,
    status: "info",
  });

  if (row.started_at) {
    events.push({
      type: "STARTED",
      label: "Eğitim başlatıldı",
      occurred_at: row.started_at,
      status: "info",
    });
  }

  if (
    toNumber(row.watch_seconds) > 0 ||
    toNumber(row.max_watched_seconds) > 0
  ) {
    events.push({
      type: "WATCH_PROGRESS",
      label: "İzleme ilerlemesi kaydedildi",
      occurred_at:
        row.watch_completed_at ||
        row.completed_at ||
        row.started_at ||
        null,
      status: row.watch_completed ? "success" : "info",
      detail: `${Math.max(
        toNumber(row.watch_seconds),
        toNumber(row.max_watched_seconds)
      )} saniye`,
    });
  }

  if (row.watch_completed) {
    events.push({
      type: "WATCH_COMPLETED",
      label: "Zorunlu içerik tamamlandı",
      occurred_at:
        row.watch_completed_at ||
        row.completed_at ||
        null,
      status: "success",
    });
  }

  if (
    row.pre_exam_score != null ||
    row.pre_exam_passed != null
  ) {
    events.push({
      type: "PRE_EXAM",
      label: "Ön sınav sonucu kaydedildi",
      occurred_at:
        row.pre_exam_completed_at ||
        row.updated_at ||
        row.completed_at ||
        null,
      status: row.pre_exam_passed ? "success" : "warning",
      detail:
        row.pre_exam_score != null
          ? `${toNumber(row.pre_exam_score)} puan`
          : null,
    });
  }
    if (
    row.final_exam_score != null ||
    row.final_exam_passed != null
  ) {
    events.push({
      type: "FINAL_EXAM",
      label: "Final sınavı sonucu kaydedildi",
      occurred_at:
        row.final_exam_completed_at ||
        row.completed_at ||
        row.updated_at ||
        null,
      status: row.final_exam_passed ? "success" : "warning",
      detail:
        row.final_exam_score != null
          ? `${toNumber(row.final_exam_score)} puan`
          : null,
    });
  }

  if (row.completed_at) {
    events.push({
      type: "COMPLETED",
      label: "Eğitim tamamlandı",
      occurred_at: row.completed_at,
      status: "success",
    });
  }

  if (
    row.certificate_no ||
    row.certificate_issued_at ||
    row.verification_code
  ) {
    events.push({
      type: "CERTIFICATE",
      label: "Sertifika kaydı oluşturuldu",
      occurred_at:
        row.certificate_issued_at ||
        row.completed_at ||
        null,
      status: "success",
      detail: row.certificate_no
        ? `Belge No: ${row.certificate_no}`
        : null,
    });
  }

  return events
    .filter((event) => event.occurred_at)
    .sort(
      (first, second) =>
        new Date(second.occurred_at || 0).getTime() -
        new Date(first.occurred_at || 0).getTime()
    );
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();

    const adminAuth =
      cookieStore.get("dsec_admin_auth")?.value;

    const adminRole =
      cookieStore.get("dsec_admin_role")?.value;

    if (
      adminAuth !== "ok" ||
      !["super_admin", "company_admin"].includes(
        String(adminRole || "")
      )
    ) {
      return NextResponse.json(
        {
          error: "Yetkisiz erişim.",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } = new URL(request.url);

    const trainingId = toText(
      searchParams.get("trainingId")
    );

    const requestedLimit = Math.min(
      Math.max(
        toNumber(searchParams.get("limit")) || 100,
        1
      ),
      500
    );

    const supabase = getSupabase();

    let assignmentQuery = supabase
      .from("training_assignments")
      .select("*")
      .order("created_at", {
        ascending: false,
      })
      .limit(requestedLimit);

    if (trainingId) {
      assignmentQuery = assignmentQuery.eq(
        "training_id",
        trainingId
      );
    }

    const {
      data: assignmentRows,
      error: assignmentError,
    } = await assignmentQuery;

    if (assignmentError) {
      return NextResponse.json(
        {
          error: "Eğitim kayıtları alınamadı.",
          detail: assignmentError.message,
        },
        {
          status: 500,
        }
      );
    }

    const assignments = assignmentRows || [];

    const trainingIds = Array.from(
      new Set(
        assignments
          .map((row: AnyRow) =>
            toText(row.training_id)
          )
          .filter(Boolean)
      )
    );

    const userIds = Array.from(
      new Set(
        assignments
          .map((row: AnyRow) =>
            toText(row.user_id)
          )
          .filter(Boolean)
      )
    );

    const [trainingResult, userResult] =
      await Promise.all([
        trainingIds.length > 0
          ? supabase
              .from("trainings")
              .select(
                "id,title,type,duration_minutes"
              )
              .in("id", trainingIds)
          : Promise.resolve({
              data: [],
              error: null,
            }),

        userIds.length > 0
          ? supabase
              .from("users")
              .select(
                "id,employee_id,full_name,email,company,company_id"
              )
              .in("id", userIds)
          : Promise.resolve({
              data: [],
              error: null,
            }),
      ]);

    if (trainingResult.error) {
      return NextResponse.json(
        {
          error:
            "Eğitim bilgileri alınamadı.",
          detail:
            trainingResult.error.message,
        },
        {
          status: 500,
        }
      );
    }

    if (userResult.error) {
      return NextResponse.json(
        {
          error:
            "Kullanıcı bilgileri alınamadı.",
          detail:
            userResult.error.message,
        },
        {
          status: 500,
        }
      );
    }

    const trainingMap = new Map<
      string,
      AnyRow
    >();

    const userMap = new Map<
      string,
      AnyRow
    >();

    (trainingResult.data || []).forEach(
      (row: AnyRow) => {
        trainingMap.set(
          toText(row.id),
          row
        );
      }
    );

    (userResult.data || []).forEach(
      (row: AnyRow) => {
        userMap.set(
          toText(row.id),
          row
        );
      }
    );

    const records = assignments.map(
      (row: AnyRow) => {
        const training =
          trainingMap.get(
            toText(row.training_id)
          ) || {};

        const user =
          userMap.get(
            toText(row.user_id)
          ) || {};

        const events = buildEvents(row);
                return {
          assignment_id: toText(row.id),

          training_id: toText(row.training_id),
          training_title:
            toText(training.title) ||
            "Adsız Eğitim",
          training_type:
            toText(training.type) ||
            "training",
          duration_minutes: toNumber(
            training.duration_minutes
          ),

          user_id: toText(row.user_id),
          employee_id: toText(
            user.employee_id
          ),
          employee_name:
            toText(user.full_name) ||
            "Adsız Çalışan",
          email: toText(user.email),
          company_name: toText(
            user.company
          ),
          company_id: toText(
            user.company_id
          ),

          status: normalizeStatus(row),

          created_at:
            row.created_at || null,
          started_at:
            row.started_at || null,
          completed_at:
            row.completed_at || null,

          watch_seconds: toNumber(
            row.watch_seconds
          ),
          max_watched_seconds: toNumber(
            row.max_watched_seconds
          ),
          click_count: toNumber(
            row.click_count
          ),

          watch_completed:
            toBoolean(
              row.watch_completed
            ),

          watch_completed_at:
            row.watch_completed_at ||
            null,

          pre_exam_score:
            row.pre_exam_score == null
              ? null
              : toNumber(
                  row.pre_exam_score
                ),

          pre_exam_passed:
            row.pre_exam_passed == null
              ? null
              : toBoolean(
                  row.pre_exam_passed
                ),

          final_exam_score:
            row.final_exam_score == null
              ? null
              : toNumber(
                  row.final_exam_score
                ),

          final_exam_passed:
            row.final_exam_passed == null
              ? null
              : toBoolean(
                  row.final_exam_passed
                ),

          certificate_no:
            toText(
              row.certificate_no
            ) || null,

          certificate_issued_at:
            row.certificate_issued_at ||
            null,

          verification_code:
            toText(
              row.verification_code
            ) || null,

          evidence_score:
            buildEvidenceScore(row),

          events,
        };
      }
    );

    const summary = {
      total: records.length,

      completed: records.filter(
        (record) =>
          record.status ===
          "completed"
      ).length,

      watched: records.filter(
        (record) =>
          record.watch_completed
      ).length,

      passed: records.filter(
        (record) =>
          record.final_exam_passed ===
          true
      ).length,

      certificated:
        records.filter(
          (record) =>
            Boolean(
              record.certificate_no
            )
        ).length,

      average_evidence_score:
        records.length > 0
          ? Math.round(
              records.reduce(
                (
                  total,
                  record
                ) =>
                  total +
                  record.evidence_score,
                0
              ) / records.length
            )
          : 0,
    };

    return NextResponse.json({
      success: true,

      summary,

      data: records,

      generated_at:
        new Date().toISOString(),

      note:
        "Bu görünüm mevcut training_assignments kayıtlarından oluşturulan kanıt özetidir.",
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
          error?.message ||
          null,
      },
      {
        status: 500,
      }
    );
  }
}