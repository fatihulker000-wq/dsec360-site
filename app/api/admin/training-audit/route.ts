import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

  return createClient(url, key);
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

export async function GET(request: Request) {
  try {
    const store = await cookies();

    const auth =
      store.get("dsec_admin_auth")?.value;

    const role =
      store.get("dsec_admin_role")?.value;

    if (
      auth !== "ok" ||
      ![
        "super_admin",
        "company_admin",
      ].includes(String(role || ""))
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

    const { searchParams } =
      new URL(request.url);

    const trainingId = text(
      searchParams.get("trainingId")
    );

    const limit = Math.min(
      Math.max(
        Number(
          searchParams.get("limit") ||
            200
        ),
        1
      ),
      500
    );

    const supabase = client();

    let query = supabase
      .from("training_audit_events")
      .select("*")
      .order("occurred_at", {
        ascending: false,
      })
      .limit(limit);

    if (trainingId) {
      query = query.eq(
        "training_id",
        trainingId
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      return NextResponse.json(
        {
          error:
            "Audit olayları alınamadı.",
          detail: error.message,
        },
        {
          status: 500,
        }
      );
    }

    const events = data || [];

    const assignmentIds =
      Array.from(
        new Set(
          events
            .map((row: Row) =>
              text(
                row.assignment_id
              )
            )
            .filter(Boolean)
        )
      );

    const {
      data: assignments,
      error: assignmentError,
    } =
      assignmentIds.length > 0
        ? await supabase
            .from(
              "training_assignments"
            )
            .select("*")
            .in(
              "id",
              assignmentIds
            )
        : {
            data: [],
            error: null,
          };

    if (assignmentError) {
      throw new Error(
        assignmentError.message
      );
    }

    const assignmentMap =
      new Map<string, Row>();

    (assignments || []).forEach(
      (row: Row) => {
        assignmentMap.set(
          text(row.id),
          row
        );
      }
    );

    const grouped =
      new Map<string, Row[]>();

    events.forEach(
      (event: Row) => {
        const key =
          text(
            event.assignment_id
          ) ||
          `event:${event.id}`;

        grouped.set(key, [
          ...(grouped.get(key) ||
            []),
          event,
        ]);
      }
    );
        const records = Array.from(grouped.entries()).map(
      ([assignmentId, rows]) => {

        const assignment =
          assignmentMap.get(assignmentId) || {};

        const ordered = [...rows].sort(
          (a, b) =>
            new Date(
              b.occurred_at || 0
            ).getTime() -
            new Date(
              a.occurred_at || 0
            ).getTime()
        );

        const has = (type: string) =>
          ordered.some(
            (row) =>
              row.event_type === type
          );

        const evidenceChecks = [
          has("ASSIGNED"),
          has("STARTED"),
          has("WATCH_COMPLETED"),
          has("FINAL_EXAM_COMPLETED"),
          has("COMPLETED"),
          has("CERTIFICATE_CREATED"),

          ordered.every(
            (row) =>
              Boolean(
                row.payload_hash
              )
          ),
        ];

        return {

          assignment_id:
            assignmentId,

          training_id:
            text(
              ordered[0]
                ?.training_id
            ),

          training_title:
            text(
              ordered[0]
                ?.metadata
                ?.training_title
            ) || "Eğitim",

          employee_name:
            text(
              ordered[0]
                ?.metadata
                ?.employee_name
            ) || "Çalışan",

          email:
            text(
              ordered[0]
                ?.metadata
                ?.email
            ),

          company_name:
            text(
              ordered[0]
                ?.metadata
                ?.company_name
            ),

          status:
            assignment.completed_at
              ? "completed"
              : assignment.started_at
                ? "in_progress"
                : "assigned",

          created_at:
            assignment.created_at ||
            null,

          started_at:
            assignment.started_at ||
            null,

          completed_at:
            assignment.completed_at ||
            null,

          watch_seconds:
            Number(
              assignment.watch_seconds ||
              0
            ),

          max_watched_seconds:
            Number(
              assignment.max_watched_seconds ||
              0
            ),

          click_count:
            Number(
              assignment.click_count ||
              0
            ),

          watch_completed:
            assignment.watch_completed ===
            true,

          final_exam_score:
            assignment.final_exam_score ??
            null,

          final_exam_passed:
            assignment.final_exam_passed ??
            null,

          certificate_no:
            text(
              assignment.certificate_no
            ) || null,

          evidence_score:
            Math.round(
              (
                evidenceChecks.filter(
                  Boolean
                ).length /
                evidenceChecks.length
              ) *
                100
            ),

          events: ordered.map(
            (row) => ({
              id: row.id,

              type:
                row.event_type,

              label:
                row.event_label,

              occurred_at:
                row.occurred_at,

              status:
                row.event_status,

              detail:
                row.metadata?.score !=
                null
                  ? `${row.metadata.score} puan`
                  : row.metadata
                      ?.certificate_no
                    ? `Belge No: ${row.metadata.certificate_no}`
                    : null,

              payload_hash:
                row.payload_hash,
            })
          ),
        };
      }
    );
        const summary = {
      total: records.length,

      completed: records.filter(
        (row) => row.status === "completed"
      ).length,

      watched: records.filter(
        (row) => row.watch_completed
      ).length,

      passed: records.filter(
        (row) =>
          row.final_exam_passed === true
      ).length,

      certificated: records.filter(
        (row) =>
          Boolean(row.certificate_no)
      ).length,

      average_evidence_score:
        records.length > 0
          ? Math.round(
              records.reduce(
                (sum, row) =>
                  sum + row.evidence_score,
                0
              ) / records.length
            )
          : 0,

      event_count: events.length,

      hash_verified:
        events.filter(
          (row: Row) =>
            Boolean(row.payload_hash)
        ).length,

      started: records.filter(
        (row) =>
          row.status === "in_progress"
      ).length,

      assigned: records.filter(
        (row) =>
          row.status === "assigned"
      ).length,

      completion_rate:
        records.length > 0
          ? Math.round(
              (
                records.filter(
                  (row) =>
                    row.status ===
                    "completed"
                ).length /
                records.length
              ) * 100
            )
          : 0,

      certificate_rate:
        records.filter(
          (row) =>
            row.status === "completed"
        ).length > 0
          ? Math.round(
              (
                records.filter(
                  (row) =>
                    Boolean(
                      row.certificate_no
                    )
                ).length /
                records.filter(
                  (row) =>
                    row.status ===
                    "completed"
                ).length
              ) * 100
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
        "training_audit_events",
    });

  } catch (error: any) {

    console.error(
      "training audit route error:",
      error
    );
        return NextResponse.json(
      {
        error: "Sunucu hatası oluştu.",
        detail: error?.message || null,

        generated_at: new Date().toISOString(),

        source: "training_audit_events",
      },
      {
        status: 500,
      }
    );
  }
}