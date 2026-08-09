import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function db() {
  if (
    !supabaseUrl ||
    !supabaseServiceRoleKey
  ) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function text(v: unknown) {
  return String(v ?? "").trim();
}

function num(
  v: unknown
): number | null {
  if (
    v === null ||
    v === undefined ||
    v === ""
  ) {
    return null;
  }

  const n = Number(v);

  return Number.isFinite(n)
    ? n
    : null;
}

/* =========================================================
   POST
   Yeni iş izni
========================================================= */

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

    const firmId =
      text(body.firmId);

    const companyId =
      text(body.companyId);

    const employeeId =
      text(body.employeeId);

    const permitType =
      text(body.permitType);

    const workTitle =
      text(body.workTitle);

    const startMillis =
      num(body.startMillis);

    if (
      !firmId ||
      !companyId ||
      !employeeId ||
      !permitType ||
      !workTitle ||
      !startMillis
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Firma, çalışan, izin türü, iş başlığı ve başlangıç tarihi zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const now = Date.now();

    const syncKey =
      text(body.syncKey) ||
      `WEB-WP-${companyId}-${employeeId}-${now}`;

    const status =
      text(body.status) ||
      "BEKLIYOR";

    const approvalStatus =
      text(body.approvalStatus) ||
      "BEKLIYOR";

    const approvedAtMillis =
      approvalStatus === "ONAYLANDI"
        ? now
        : null;

    const supabase = db();

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "subcontractor_work_permits"
        )
        .insert({
          firm_id: firmId,

          company_id: companyId,

          employee_id: employeeId,

          sync_key: syncKey,

          permit_type: permitType,

          work_title: workTitle,

          work_area:
            text(body.workArea),

          responsible_person:
            text(
              body.responsiblePerson
            ),

          precautions:
            text(body.precautions),

          status,

          approval_status:
            approvalStatus,

          start_millis:
            startMillis,

          end_millis:
            num(body.endMillis),

          approved_at_millis:
            approvedAtMillis,

          approved_by:
            text(body.approvedBy),

          closed_by:
            text(body.closedBy),

          note:
            text(body.note),

          is_deleted: false,

          source: "WEB",

          created_at_millis: now,

          updated_at_millis: now,
        })
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "work permit POST error",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "İş izni oluşturulamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH
   İş izni düzenle / onayla / reddet / iptal et
========================================================= */

export async function PATCH(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

    const id =
      text(body.id);

    const firmId =
      text(body.firmId);

    const companyId =
      text(body.companyId);

    if (
      !id ||
      !firmId ||
      !companyId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "id, firmId ve companyId zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const now = Date.now();

    const payload:
      Record<string, unknown> = {
        updated_at_millis: now,
        source: "WEB",
      };

    if (
      body.employeeId !== undefined
    ) {
      payload.employee_id =
        text(body.employeeId);
    }

    if (
      body.permitType !== undefined
    ) {
      payload.permit_type =
        text(body.permitType);
    }

    if (
      body.workTitle !== undefined
    ) {
      payload.work_title =
        text(body.workTitle);
    }

    if (
      body.workArea !== undefined
    ) {
      payload.work_area =
        text(body.workArea);
    }

    if (
      body.responsiblePerson !==
      undefined
    ) {
      payload.responsible_person =
        text(
          body.responsiblePerson
        );
    }

    if (
      body.precautions !== undefined
    ) {
      payload.precautions =
        text(body.precautions);
    }

    if (
      body.status !== undefined
    ) {
      payload.status =
        text(body.status);
    }

    if (
      body.approvalStatus !==
      undefined
    ) {
      const approvalStatus =
        text(
          body.approvalStatus
        );

      payload.approval_status =
        approvalStatus;

      if (
        approvalStatus ===
        "ONAYLANDI"
      ) {
        payload.approved_at_millis =
          now;
      }
    }

    if (
      body.startMillis !== undefined
    ) {
      payload.start_millis =
        num(body.startMillis);
    }

    if (
      body.endMillis !== undefined
    ) {
      payload.end_millis =
        num(body.endMillis);
    }

    if (
      body.approvedBy !== undefined
    ) {
      payload.approved_by =
        text(body.approvedBy);
    }

    if (
      body.closedBy !== undefined
    ) {
      payload.closed_by =
        text(body.closedBy);
    }

    if (
      body.note !== undefined
    ) {
      payload.note =
        text(body.note);
    }

    const supabase = db();

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "subcontractor_work_permits"
        )
        .update(payload)
        .eq(
          "id",
          id
        )
        .eq(
          "firm_id",
          firmId
        )
        .eq(
          "company_id",
          companyId
        )
        .eq(
          "is_deleted",
          false
        )
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "work permit PATCH error",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "İş izni güncellenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE
   Soft delete
========================================================= */

export async function DELETE(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

    const id =
      text(body.id);

    const firmId =
      text(body.firmId);

    const companyId =
      text(body.companyId);

    if (
      !id ||
      !firmId ||
      !companyId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "id, firmId ve companyId zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const now =
      Date.now();

    const supabase =
      db();

    const {
      error,
    } =
      await supabase
        .from(
          "subcontractor_work_permits"
        )
        .update({
          is_deleted: true,

          deleted_at_millis:
            now,

          updated_at_millis:
            now,

          source: "WEB",
        })
        .eq(
          "id",
          id
        )
        .eq(
          "firm_id",
          firmId
        )
        .eq(
          "company_id",
          companyId
        );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "work permit DELETE error",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "İş izni silinemedi.",
      },
      {
        status: 500,
      }
    );
  }
}