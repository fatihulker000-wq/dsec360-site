import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function nullableNumber(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function numberValue(
  value: unknown,
  fallback = 0
): number {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function booleanValue(
  value: unknown
): boolean {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
}

function normalizeStatus(
  value: unknown
) {
  const status =
    text(value).toUpperCase();

  switch (status) {
    case "AKTIF":
    case "REDDEDILDI":
    case "IPTAL":
    case "KAPATILDI":
    case "BEKLIYOR":
      return status;

    default:
      return "BEKLIYOR";
  }
}

function normalizeApprovalStatus(
  value: unknown
) {
  const status =
    text(value).toUpperCase();

  switch (status) {
    case "ONAYLANDI":
    case "REDDEDILDI":
    case "BEKLIYOR":
      return status;

    default:
      return "BEKLIYOR";
  }
}

/* =========================================================
   GET
   WEB -> APP
   ========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const firmId =
      text(searchParams.get("firmId"));

    const updatedAfter =
      numberValue(
        searchParams.get("updatedAfter"),
        0
      );

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error: "firmId zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    let query = supabase
      .from("subcontractor_work_permits")
      .select("*")
      .eq("firm_id", firmId)
      .order(
        "updated_at_millis",
        {
          ascending: true,
        }
      );

    if (updatedAfter > 0) {
      query = query.gt(
        "updated_at_millis",
        updatedAfter
      );
    }

    const { data, error } =
      await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      permits: data ?? [],
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error(
      "SUBCONTRACTOR WORK PERMIT GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "İş izinleri alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
   APP -> WEB
   ========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const firmId =
      text(body.firmId);

    const items =
      Array.isArray(body.items)
        ? body.items
        : [];

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error: "firmId zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const results: {
      appLocalId: number;
      remoteId?: string;
      success: boolean;
      error?: string;
    }[] = [];

    for (const item of items) {
      const appLocalId =
        numberValue(
          item.appLocalId,
          0
        );

      try {
        const syncKey =
          text(item.syncKey);

        if (!syncKey) {
          throw new Error(
            "syncKey zorunludur."
          );
        }

        const companyId =
          text(item.companyRemoteId);

        const employeeId =
          text(item.employeeRemoteId);

        if (!companyId) {
          throw new Error(
            "Taşeron firma remoteId eksik."
          );
        }

        if (!employeeId) {
          throw new Error(
            "Çalışan remoteId eksik."
          );
        }

        const now = Date.now();

        const isDeleted =
          booleanValue(
            item.isDeleted
          );

        /*
         * Önce aynı sync_key ile kayıt
         * var mı bakıyoruz.
         */
        const {
          data: existing,
          error: existingError,
        } = await supabase
          .from(
            "subcontractor_work_permits"
          )
          .select("id")
          .eq("sync_key", syncKey)
          .maybeSingle();

        if (existingError) {
          throw existingError;
        }

        const payload = {
          firm_id: firmId,

          company_id:
            companyId,

          employee_id:
            employeeId,

          app_local_id:
            appLocalId || null,

          app_company_local_id:
            numberValue(
              item.appCompanyLocalId,
              0
            ) || null,

          app_employee_local_id:
            numberValue(
              item.appEmployeeLocalId,
              0
            ) || null,

          sync_key:
            syncKey,

          permit_type:
            text(
              item.permitType
            ),

          work_title:
            text(
              item.workTitle
            ),

          work_area:
            text(
              item.workArea
            ),

          responsible_person:
            text(
              item.responsiblePerson
            ),

          precautions:
            text(
              item.precautions
            ),

          status:
            normalizeStatus(
              item.status
            ),

          approval_status:
            normalizeApprovalStatus(
              item.approvalStatus
            ),

          start_millis:
            numberValue(
              item.startMillis,
              now
            ),

          end_millis:
            nullableNumber(
              item.endMillis
            ),

          approved_at_millis:
            nullableNumber(
              item.approvedAtMillis
            ),

          approved_by:
            text(
              item.approvedBy
            ),

          closed_by:
            text(
              item.closedBy
            ),

          note:
            text(item.note),

          is_deleted:
            isDeleted,

          deleted_at_millis:
            isDeleted
              ? now
              : null,

          source:
            "APP",

          updated_at_millis:
            numberValue(
              item.updatedAtMillis,
              now
            ),

          created_at_millis:
            numberValue(
              item.createdAtMillis,
              now
            ),
        };

        let remoteId = "";

        if (existing?.id) {
          const {
            data,
            error,
          } = await supabase
            .from(
              "subcontractor_work_permits"
            )
            .update(payload)
            .eq(
              "id",
              existing.id
            )
            .select("id")
            .single();

          if (error) {
            throw error;
          }

          remoteId =
            String(data.id);
        } else {
          const {
            data,
            error,
          } = await supabase
            .from(
              "subcontractor_work_permits"
            )
            .insert(payload)
            .select("id")
            .single();

          if (error) {
            throw error;
          }

          remoteId =
            String(data.id);
        }

        results.push({
          appLocalId,
          remoteId,
          success: true,
        });
      } catch (error) {
        results.push({
          appLocalId,
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Kayıt senkronize edilemedi.",
        });
      }
    }

    return NextResponse.json({
      success:
        results.every(
          (item) => item.success
        ),

      results,

      serverTime: Date.now(),
    });
  } catch (error) {
    console.error(
      "SUBCONTRACTOR WORK PERMIT POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "İş izinleri senkronize edilemedi.",
      },
      {
        status: 500,
      }
    );
  }
}