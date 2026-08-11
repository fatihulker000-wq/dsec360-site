import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function text(
  value: unknown
): string {
  return String(value ?? "").trim();
}

function nullableNumber(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function createSyncKey(
  firmId: string,
  riskId: string
) {
  return [
    "DORA",
    "RISK_DOF",
    firmId,
    riskId,
    Date.now(),
    crypto.randomUUID(),
  ].join("-");
}

/* =========================================================
GET
DORA RİSK DÖF KAYITLARI
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const {
      searchParams,
    } = new URL(request.url);

    const firmId =
      text(
        searchParams.get(
          "firmId"
        )
      );

    const riskId =
      text(
        searchParams.get(
          "riskId"
        )
      );

    const id =
      text(
        searchParams.get(
          "id"
        )
      );

    const status =
      text(
        searchParams.get(
          "status"
        )
      ).toUpperCase();

    if (
      !firmId &&
      !riskId &&
      !id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Firma ID, risk ID veya DÖF ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (id) {
      let query = supabase
        .from(
          "dora_risk_dofs"
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

      if (firmId) {
        query = query.eq(
          "firm_id",
          firmId
        );
      }

      const {
        data,
        error,
      } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return NextResponse.json(
          {
            success: false,
            error:
              "DORA DÖF kaydı bulunamadı.",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        dof: data,
      });
    }

    let query = supabase
      .from(
        "dora_risk_dofs"
      )
      .select("*")
      .eq(
        "is_deleted",
        false
      );

    if (firmId) {
      query = query.eq(
        "firm_id",
        firmId
      );
    }

    if (riskId) {
      query = query.eq(
        "risk_id",
        riskId
      );
    }

    if (status) {
      query = query.eq(
        "status",
        status
      );
    }

    const {
      data,
      error,
    } = await query
      .order(
        "target_date_millis",
        {
          ascending: true,
          nullsFirst: false,
        }
      )
      .order(
        "updated_at_millis",
        {
          ascending: false,
        }
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      dofs:
        data ?? [],
    });
  } catch (error) {
    console.error(
      "DORA RISK DOFS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA DÖF kayıtları alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
POST
YENİ DORA DÖF
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const firmId =
      text(
        body.firmId ??
          body.firm_id
      );

    const riskId =
      text(
        body.riskId ??
          body.risk_id
      );

    const title =
      text(
        body.title
      );

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!riskId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA risk ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DÖF başlığı zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: risk,
      error: riskError,
    } = await supabase
      .from(
        "dora_risks"
      )
      .select(
        "id, firm_id"
      )
      .eq(
        "id",
        riskId
      )
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "is_deleted",
        false
      )
      .maybeSingle();

    if (riskError) {
      throw riskError;
    }

    if (!risk) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA risk kaydı bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    const now =
      Date.now();

    const syncKey =
      text(
        body.syncKey ??
          body.sync_key
      ) ||
      createSyncKey(
        firmId,
        riskId
      );

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_risk_dofs"
      )
      .insert({
        firm_id:
          firmId,

        risk_id:
          riskId,

        sync_key:
          syncKey,

        app_local_id:
          nullableNumber(
            body.appLocalId ??
              body.app_local_id
          ),

        app_firm_local_id:
          nullableNumber(
            body.appFirmLocalId ??
              body.app_firm_local_id
          ),

        source:
          "WEB",

        title,

        finding:
          text(
            body.finding
          ),

        root_cause:
          text(
            body.rootCause ??
              body.root_cause
          ),

        corrective_action:
          text(
            body.correctiveAction ??
              body.corrective_action
          ),

        preventive_action:
          text(
            body.preventiveAction ??
              body.preventive_action
          ),

        responsible_person:
          text(
            body.responsiblePerson ??
              body.responsible_person
          ),

        opened_by:
          text(
            body.openedBy ??
              body.opened_by
          ),

        opened_at_millis:
          nullableNumber(
            body.openedAtMillis ??
              body.opened_at_millis
          ) ??
          now,

        target_date_millis:
          nullableNumber(
            body.targetDateMillis ??
              body.target_date_millis
          ),

        status:
          text(
            body.status
          ).toUpperCase() ||
          "ACIK",

        closure_note:
          text(
            body.closureNote ??
              body.closure_note
          ),

        closed_by:
          text(
            body.closedBy ??
              body.closed_by
          ),

        closed_at_millis:
          nullableNumber(
            body.closedAtMillis ??
              body.closed_at_millis
          ),

        effectiveness_status:
          text(
            body.effectivenessStatus ??
              body.effectiveness_status
          ).toUpperCase() ||
          "BEKLIYOR",

        effectiveness_note:
          text(
            body.effectivenessNote ??
              body.effectiveness_note
          ),

        verified_by:
          text(
            body.verifiedBy ??
              body.verified_by
          ),

        verified_at_millis:
          nullableNumber(
            body.verifiedAtMillis ??
              body.verified_at_millis
          ),

        note:
          text(
            body.note
          ),

        is_deleted:
          false,

        deleted_at_millis:
          null,

        created_at_millis:
          now,

        updated_at_millis:
          now,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      dof: data,
    });
  } catch (error) {
    console.error(
      "DORA RISK DOFS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA DÖF kaydı oluşturulamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
PATCH
DORA DÖF GÜNCELLE
========================================================= */

export async function PATCH(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const id =
      text(
        body.id
      );

    const firmId =
      text(
        body.firmId ??
          body.firm_id
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DÖF ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const updateData:
      Record<
        string,
        unknown
      > = {
      source:
        "WEB",

      updated_at_millis:
        Date.now(),
    };

    if (
      body.title !==
      undefined
    ) {
      const title =
        text(
          body.title
        );

      if (!title) {
        return NextResponse.json(
          {
            success: false,
            error:
              "DÖF başlığı boş bırakılamaz.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.title =
        title;
    }

    if (
      body.finding !==
      undefined
    ) {
      updateData.finding =
        text(
          body.finding
        );
    }

    if (
      body.rootCause !==
        undefined ||
      body.root_cause !==
        undefined
    ) {
      updateData.root_cause =
        text(
          body.rootCause ??
            body.root_cause
        );
    }

    if (
      body.correctiveAction !==
        undefined ||
      body.corrective_action !==
        undefined
    ) {
      updateData.corrective_action =
        text(
          body.correctiveAction ??
            body.corrective_action
        );
    }

    if (
      body.preventiveAction !==
        undefined ||
      body.preventive_action !==
        undefined
    ) {
      updateData.preventive_action =
        text(
          body.preventiveAction ??
            body.preventive_action
        );
    }

    if (
      body.responsiblePerson !==
        undefined ||
      body.responsible_person !==
        undefined
    ) {
      updateData.responsible_person =
        text(
          body.responsiblePerson ??
            body.responsible_person
        );
    }

    if (
      body.openedBy !==
        undefined ||
      body.opened_by !==
        undefined
    ) {
      updateData.opened_by =
        text(
          body.openedBy ??
            body.opened_by
        );
    }

    if (
      body.targetDateMillis !==
        undefined ||
      body.target_date_millis !==
        undefined
    ) {
      updateData.target_date_millis =
        nullableNumber(
          body.targetDateMillis ??
            body.target_date_millis
        );
    }

    if (
      body.status !==
      undefined
    ) {
      updateData.status =
        text(
          body.status
        ).toUpperCase();
    }

    if (
      body.closureNote !==
        undefined ||
      body.closure_note !==
        undefined
    ) {
      updateData.closure_note =
        text(
          body.closureNote ??
            body.closure_note
        );
    }

    if (
      body.closedBy !==
        undefined ||
      body.closed_by !==
        undefined
    ) {
      updateData.closed_by =
        text(
          body.closedBy ??
            body.closed_by
        );
    }

    if (
      body.effectivenessStatus !==
        undefined ||
      body.effectiveness_status !==
        undefined
    ) {
      updateData.effectiveness_status =
        text(
          body.effectivenessStatus ??
            body.effectiveness_status
        ).toUpperCase();
    }

    if (
      body.effectivenessNote !==
        undefined ||
      body.effectiveness_note !==
        undefined
    ) {
      updateData.effectiveness_note =
        text(
          body.effectivenessNote ??
            body.effectiveness_note
        );
    }

    if (
      body.verifiedBy !==
        undefined ||
      body.verified_by !==
        undefined
    ) {
      updateData.verified_by =
        text(
          body.verifiedBy ??
            body.verified_by
        );
    }

    if (
      body.verifiedAtMillis !==
        undefined ||
      body.verified_at_millis !==
        undefined
    ) {
      updateData.verified_at_millis =
        nullableNumber(
          body.verifiedAtMillis ??
            body.verified_at_millis
        );
    }

    if (
      body.note !==
      undefined
    ) {
      updateData.note =
        text(
          body.note
        );
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_risk_dofs"
      )
      .update(
        updateData
      )
      .eq(
        "id",
        id
      )
      .eq(
        "firm_id",
        firmId
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
      dof: data,
    });
  } catch (error) {
    console.error(
      "DORA RISK DOFS PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA DÖF kaydı güncellenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
DELETE
SOFT DELETE
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const id =
      text(
        body.id
      );

    const firmId =
      text(
        body.firmId ??
          body.firm_id
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DÖF ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const now =
      Date.now();

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_risk_dofs"
      )
      .update({
        is_deleted:
          true,

        deleted_at_millis:
          now,

        updated_at_millis:
          now,

        source:
          "WEB",
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
        "is_deleted",
        false
      )
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      id: data.id,
    });
  } catch (error) {
    console.error(
      "DORA RISK DOFS DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA DÖF kaydı silinemedi.",
      },
      {
        status: 500,
      }
    );
  }
}