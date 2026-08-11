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

function nullableText(
  value: unknown
): string | null {
  const result = text(value);

  return result || null;
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

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function numberValue(
  value: unknown,
  fallback = 1
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function createSyncKey(
  firmId: string
) {
  return [
    "DORA",
    "RISK",
    firmId,
    Date.now(),
    crypto.randomUUID(),
  ].join("-");
}

/* =========================================================
GET
DORA FINE KINNEY RİSKLERİNİ GETİR
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

    const id =
      text(
        searchParams.get(
          "id"
        )
      );

    const level =
      text(
        searchParams.get(
          "level"
        )
      ).toUpperCase();

    const status =
      text(
        searchParams.get(
          "status"
        )
      ).toUpperCase();

    if (!firmId && !id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID veya risk ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (id) {
      let query = supabase
        .from("dora_risks")
        .select("*")
        .eq("id", id)
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
              "DORA Fine Kinney risk kaydı bulunamadı.",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        risk: data,
      });
    }

    let query = supabase
      .from("dora_risks")
      .select("*")
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "is_deleted",
        false
      );

    if (level) {
      query = query.eq(
        "fk_level",
        level
      );
    }

    if (status) {
      query = query.eq(
        "action_status",
        status
      );
    }

    const {
      data,
      error,
    } = await query
      .order(
        "fk_score",
        {
          ascending: false,
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
      risks: data ?? [],
    });
  } catch (error) {
    console.error(
      "DORA RISKS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA Fine Kinney riskleri alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
POST
YENİ DORA FINE KINNEY RİSKİ
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

    const hazard =
      text(
        body.hazard
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

    if (!hazard) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tehlike alanı zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: firm,
      error: firmError,
    } = await supabase
      .from("dora_firms")
      .select("id")
      .eq(
        "id",
        firmId
      )
      .eq(
        "is_deleted",
        false
      )
      .maybeSingle();

    if (firmError) {
      throw firmError;
    }

    if (!firm) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firması bulunamadı.",
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
        firmId
      );

    const {
      data,
      error,
    } = await supabase
      .from("dora_risks")
      .insert({
        firm_id:
          firmId,

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

        title:
          text(
            body.title
          ),

        activity:
          text(
            body.activity
          ),

        department:
          text(
            body.department
          ),

        location:
          text(
            body.location
          ),

        hazard:
          hazard,

        risk_source:
          text(
            body.riskSource ??
              body.risk_source
          ),

        risk_description:
          text(
            body.riskDescription ??
              body.risk_description
          ),

        consequence:
          text(
            body.consequence
          ),

        affected_persons:
          text(
            body.affectedPersons ??
              body.affected_persons
          ),

        existing_controls:
          text(
            body.existingControls ??
              body.existing_controls
          ),

        legal_basis:
          text(
            body.legalBasis ??
              body.legal_basis
          ),

        fk_probability:
          numberValue(
            body.fkProbability ??
              body.fk_probability,
            1
          ),

        fk_frequency:
          numberValue(
            body.fkFrequency ??
              body.fk_frequency,
            1
          ),

        fk_severity:
          numberValue(
            body.fkSeverity ??
              body.fk_severity,
            1
          ),

        corrective_action:
          text(
            body.correctiveAction ??
              body.corrective_action
          ),

        responsible_person:
          text(
            body.responsiblePerson ??
              body.responsible_person
          ),

        due_date_millis:
          nullableNumber(
            body.dueDateMillis ??
              body.due_date_millis
          ),

        action_status:
          text(
            body.actionStatus ??
              body.action_status
          ).toUpperCase() ||
          "ACIK",

        action_completed_at_millis:
          nullableNumber(
            body.actionCompletedAtMillis ??
              body.action_completed_at_millis
          ),

        action_closed_by:
          text(
            body.actionClosedBy ??
              body.action_closed_by
          ),

        residual_probability:
          nullableNumber(
            body.residualProbability ??
              body.residual_probability
          ),

        residual_frequency:
          nullableNumber(
            body.residualFrequency ??
              body.residual_frequency
          ),

        residual_severity:
          nullableNumber(
            body.residualSeverity ??
              body.residual_severity
          ),

        photo_url:
          text(
            body.photoUrl ??
              body.photo_url
          ),

        status:
          text(
            body.status
          ).toUpperCase() ||
          "ACIK",

        note:
          text(
            body.note
          ),

        is_deleted:
          false,

        deleted_at_millis:
          null,

        source:
          "WEB",

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
      risk: data,
    });
  } catch (error) {
    console.error(
      "DORA RISKS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA Fine Kinney risk kaydı oluşturulamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
PATCH
DORA FINE KINNEY RİSKİNİ GÜNCELLE
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
            "DORA risk ID zorunludur.",
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
      updated_at_millis:
        Date.now(),

      source:
        "WEB",
    };

    if (
      body.title !==
      undefined
    ) {
      updateData.title =
        text(
          body.title
        );
    }

    if (
      body.activity !==
      undefined
    ) {
      updateData.activity =
        text(
          body.activity
        );
    }

    if (
      body.department !==
      undefined
    ) {
      updateData.department =
        text(
          body.department
        );
    }

    if (
      body.location !==
      undefined
    ) {
      updateData.location =
        text(
          body.location
        );
    }

    if (
      body.hazard !==
      undefined
    ) {
      const hazard =
        text(
          body.hazard
        );

      if (!hazard) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Tehlike alanı boş bırakılamaz.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.hazard =
        hazard;
    }

    if (
      body.riskSource !==
        undefined ||
      body.risk_source !==
        undefined
    ) {
      updateData.risk_source =
        text(
          body.riskSource ??
            body.risk_source
        );
    }

    if (
      body.riskDescription !==
        undefined ||
      body.risk_description !==
        undefined
    ) {
      updateData.risk_description =
        text(
          body.riskDescription ??
            body.risk_description
        );
    }

    if (
      body.consequence !==
      undefined
    ) {
      updateData.consequence =
        text(
          body.consequence
        );
    }

    if (
      body.affectedPersons !==
        undefined ||
      body.affected_persons !==
        undefined
    ) {
      updateData.affected_persons =
        text(
          body.affectedPersons ??
            body.affected_persons
        );
    }

    if (
      body.existingControls !==
        undefined ||
      body.existing_controls !==
        undefined
    ) {
      updateData.existing_controls =
        text(
          body.existingControls ??
            body.existing_controls
        );
    }

    if (
      body.legalBasis !==
        undefined ||
      body.legal_basis !==
        undefined
    ) {
      updateData.legal_basis =
        text(
          body.legalBasis ??
            body.legal_basis
        );
    }

    if (
      body.fkProbability !==
        undefined ||
      body.fk_probability !==
        undefined
    ) {
      updateData.fk_probability =
        numberValue(
          body.fkProbability ??
            body.fk_probability,
          1
        );
    }

    if (
      body.fkFrequency !==
        undefined ||
      body.fk_frequency !==
        undefined
    ) {
      updateData.fk_frequency =
        numberValue(
          body.fkFrequency ??
            body.fk_frequency,
          1
        );
    }

    if (
      body.fkSeverity !==
        undefined ||
      body.fk_severity !==
        undefined
    ) {
      updateData.fk_severity =
        numberValue(
          body.fkSeverity ??
            body.fk_severity,
          1
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
      body.dueDateMillis !==
        undefined ||
      body.due_date_millis !==
        undefined
    ) {
      updateData.due_date_millis =
        nullableNumber(
          body.dueDateMillis ??
            body.due_date_millis
        );
    }

    if (
      body.actionStatus !==
        undefined ||
      body.action_status !==
        undefined
    ) {
      const nextStatus =
        text(
          body.actionStatus ??
            body.action_status
        ).toUpperCase();

      updateData.action_status =
        nextStatus;

      if (
        nextStatus ===
          "TAMAMLANDI" &&
        !(
          body.actionCompletedAtMillis ??
          body.action_completed_at_millis
        )
      ) {
        updateData.action_completed_at_millis =
          Date.now();
      }
    }

    if (
      body.actionCompletedAtMillis !==
        undefined ||
      body.action_completed_at_millis !==
        undefined
    ) {
      updateData.action_completed_at_millis =
        nullableNumber(
          body.actionCompletedAtMillis ??
            body.action_completed_at_millis
        );
    }

    if (
      body.actionClosedBy !==
        undefined ||
      body.action_closed_by !==
        undefined
    ) {
      updateData.action_closed_by =
        text(
          body.actionClosedBy ??
            body.action_closed_by
        );
    }

    if (
      body.residualProbability !==
        undefined ||
      body.residual_probability !==
        undefined
    ) {
      updateData.residual_probability =
        nullableNumber(
          body.residualProbability ??
            body.residual_probability
        );
    }

    if (
      body.residualFrequency !==
        undefined ||
      body.residual_frequency !==
        undefined
    ) {
      updateData.residual_frequency =
        nullableNumber(
          body.residualFrequency ??
            body.residual_frequency
        );
    }

    if (
      body.residualSeverity !==
        undefined ||
      body.residual_severity !==
        undefined
    ) {
      updateData.residual_severity =
        nullableNumber(
          body.residualSeverity ??
            body.residual_severity
        );
    }

    if (
      body.photoUrl !==
        undefined ||
      body.photo_url !==
        undefined
    ) {
      updateData.photo_url =
        text(
          body.photoUrl ??
            body.photo_url
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
      .from("dora_risks")
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
      risk: data,
    });
  } catch (error) {
    console.error(
      "DORA RISKS PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA Fine Kinney risk kaydı güncellenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
DELETE
DORA FINE KINNEY RİSKİ SOFT DELETE
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
            "DORA risk ID zorunludur.",
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
      .from("dora_risks")
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
      "DORA RISKS DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA Fine Kinney risk kaydı silinemedi.",
      },
      {
        status: 500,
      }
    );
  }
}