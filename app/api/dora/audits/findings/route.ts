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

function normalizeFindingType(
  value: unknown
): string {
  return text(value)
    .toUpperCase()
    .replaceAll(" ", "_");
}

function normalizeRiskLevel(
  value: unknown
): string {
  return text(value)
    .toUpperCase()
    .replaceAll(" ", "_");
}

function normalizeStatus(
  value: unknown
): string {
  return text(value)
    .toUpperCase()
    .replaceAll(" ", "_");
}

const VALID_FINDING_TYPES =
  new Set([
    "UYGUNSUZLUK",
    "GOZLEM",
    "IYILESTIRME",
    "KRITIK_BULGU",
  ]);

const VALID_RISK_LEVELS =
  new Set([
    "DUSUK",
    "ORTA",
    "YUKSEK",
    "KRITIK",
  ]);

const VALID_STATUSES =
  new Set([
    "ACIK",
    "TAKIPTE",
    "KAPALI",
  ]);

function createSyncKey(
  firmId: string,
  auditId: string
): string {
  return [
    "DORA",
    "AUDIT_FINDING",
    firmId,
    auditId,
    Date.now(),
    crypto.randomUUID(),
  ].join("-");
}

/* =========================================================
GET
DORA DENETİM BULGULARI
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

    const auditId =
      text(
        searchParams.get(
          "auditId"
        )
      );

    const answerId =
      text(
        searchParams.get(
          "answerId"
        )
      );

    const id =
      text(
        searchParams.get(
          "id"
        )
      );

    const status =
      normalizeStatus(
        searchParams.get(
          "status"
        )
      );

    if (
      !firmId &&
      !id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID veya bulgu ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (id) {
      let query = supabase
        .from(
          "dora_audit_findings"
        )
        .select(`
          *,
          audit:dora_audits(
            id,
            audit_no,
            title,
            audit_date_millis,
            status
          ),
          answer:dora_audit_answers(
            id,
            answer_status,
            explanation,
            action_text
          ),
          question:dora_audit_questions(
            id,
            section_title,
            title,
            question,
            legal_basis,
            risk_level
          )
        `)
        .eq(
          "id",
          id
        )
        .eq(
          "is_deleted",
          false
        );

      if (firmId) {
        query =
          query.eq(
            "firm_id",
            firmId
          );
      }

      const {
        data,
        error,
      } = await query
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return NextResponse.json(
          {
            success: false,
            error:
              "DORA denetim bulgusu bulunamadı.",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        finding: data,
      });
    }

    let query = supabase
      .from(
        "dora_audit_findings"
      )
      .select(`
        *,
        audit:dora_audits(
          id,
          audit_no,
          title,
          audit_date_millis,
          status
        ),
        question:dora_audit_questions(
          id,
          section_title,
          title,
          question,
          legal_basis,
          risk_level
        )
      `)
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "is_deleted",
        false
      );

    if (auditId) {
      query =
        query.eq(
          "audit_id",
          auditId
        );
    }

    if (answerId) {
      query =
        query.eq(
          "answer_id",
          answerId
        );
    }

    if (
      status &&
      VALID_STATUSES.has(
        status
      )
    ) {
      query =
        query.eq(
          "status",
          status
        );
    }

    const {
      data,
      error,
    } = await query
      .order(
        "detected_at_millis",
        {
          ascending: false,
        }
      )
      .order(
        "created_at_millis",
        {
          ascending: false,
        }
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      findings:
        data ?? [],
    });
  } catch (error) {
    console.error(
      "DORA AUDIT FINDINGS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetim bulguları alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
POST
DORA BULGUSU OLUŞTUR
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

    const auditId =
      text(
        body.auditId ??
          body.audit_id
      );

    const answerId =
      text(
        body.answerId ??
          body.answer_id
      );

    const questionId =
      text(
        body.questionId ??
          body.question_id
      );

    const title =
      text(
        body.title
      );

    const findingType =
      normalizeFindingType(
        body.findingType ??
          body.finding_type
      ) ||
      "UYGUNSUZLUK";

    const riskLevel =
      normalizeRiskLevel(
        body.riskLevel ??
          body.risk_level
      ) ||
      "ORTA";

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

    if (!auditId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA denetim ID zorunludur.",
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
            "Bulgu başlığı zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !VALID_FINDING_TYPES.has(
        findingType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Geçersiz bulgu tipi.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !VALID_RISK_LEVELS.has(
        riskLevel
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Geçersiz risk seviyesi.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: audit,
      error: auditError,
    } = await supabase
      .from(
        "dora_audits"
      )
      .select(
        "id, firm_id"
      )
      .eq(
        "id",
        auditId
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

    if (auditError) {
      throw auditError;
    }

    if (!audit) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA denetimi bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    if (answerId) {
      const {
        data: answer,
        error: answerError,
      } = await supabase
        .from(
          "dora_audit_answers"
        )
        .select(`
          id,
          audit_id,
          question_id,
          answer_status
        `)
        .eq(
          "id",
          answerId
        )
        .eq(
          "firm_id",
          firmId
        )
        .eq(
          "audit_id",
          auditId
        )
        .eq(
          "is_deleted",
          false
        )
        .maybeSingle();

      if (answerError) {
        throw answerError;
      }

      if (!answer) {
        return NextResponse.json(
          {
            success: false,
            error:
              "DORA denetim cevabı bulunamadı.",
          },
          {
            status: 404,
          }
        );
      }

      if (
        answer.answer_status !==
          "UYGUNSUZ" &&
        answer.answer_status !==
          "KISMEN_UYGUN"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Bulgu yalnızca Uygunsuz veya Kısmen Uygun denetim maddesinden oluşturulabilir.",
          },
          {
            status: 409,
          }
        );
      }
    }

    const syncKey =
      text(
        body.syncKey ??
          body.sync_key
      ) ||
      createSyncKey(
        firmId,
        auditId
      );

    const now =
      Date.now();

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_audit_findings"
      )
      .insert({
        firm_id:
          firmId,

        audit_id:
          auditId,

        answer_id:
          answerId ||
          null,

        question_id:
          questionId ||
          null,

        sync_key:
          syncKey,

        app_local_id:
          nullableNumber(
            body.appLocalId ??
              body.app_local_id
          ),

        source:
          "WEB",

        title,

        description:
          text(
            body.description
          ),

        finding_type:
          findingType,

        risk_level:
          riskLevel,

        legal_basis:
          text(
            body.legalBasis ??
              body.legal_basis
          ),

        recommendation:
          text(
            body.recommendation
          ),

        status:
          "ACIK",

        detected_by:
          text(
            body.detectedBy ??
              body.detected_by
          ),

        detected_at_millis:
          nullableNumber(
            body.detectedAtMillis ??
              body.detected_at_millis
          ) ??
          now,

        closed_by:
          "",

        closed_at_millis:
          null,

        closure_note:
          "",

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
      finding: data,
    });
  } catch (error) {
    console.error(
      "DORA AUDIT FINDINGS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetim bulgusu oluşturulamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
PATCH
DORA BULGUSUNU GÜNCELLE
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
            "Bulgu ID zorunludur.",
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
    };

    if (
      body.title !==
      undefined
    ) {
      const value =
        text(
          body.title
        );

      if (!value) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Bulgu başlığı boş bırakılamaz.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.title =
        value;
    }

    if (
      body.description !==
      undefined
    ) {
      updateData.description =
        text(
          body.description
        );
    }

    if (
      body.findingType !==
        undefined ||
      body.finding_type !==
        undefined
    ) {
      const findingType =
        normalizeFindingType(
          body.findingType ??
            body.finding_type
        );

      if (
        !VALID_FINDING_TYPES.has(
          findingType
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Geçersiz bulgu tipi.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.finding_type =
        findingType;
    }

    if (
      body.riskLevel !==
        undefined ||
      body.risk_level !==
        undefined
    ) {
      const riskLevel =
        normalizeRiskLevel(
          body.riskLevel ??
            body.risk_level
        );

      if (
        !VALID_RISK_LEVELS.has(
          riskLevel
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Geçersiz risk seviyesi.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.risk_level =
        riskLevel;
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
      body.recommendation !==
      undefined
    ) {
      updateData.recommendation =
        text(
          body.recommendation
        );
    }

    if (
      body.detectedBy !==
        undefined ||
      body.detected_by !==
        undefined
    ) {
      updateData.detected_by =
        text(
          body.detectedBy ??
            body.detected_by
        );
    }

    if (
      body.status !==
      undefined
    ) {
      const status =
        normalizeStatus(
          body.status
        );

      if (
        !VALID_STATUSES.has(
          status
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Geçersiz bulgu durumu.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.status =
        status;

      if (
        status ===
        "KAPALI"
      ) {
        updateData.closed_by =
          text(
            body.closedBy ??
              body.closed_by
          );

        updateData.closure_note =
          text(
            body.closureNote ??
              body.closure_note
          );
      }
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
        "dora_audit_findings"
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
      finding: data,
    });
  } catch (error) {
    console.error(
      "DORA AUDIT FINDINGS PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetim bulgusu güncellenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
DELETE
DORA BULGUSU SOFT DELETE
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
            "Bulgu ID zorunludur.",
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

    /*
     * DORA bulgusu soft-delete edilir.
     * Ana D-SEC denetim / DÖF / aksiyon tablolarına
     * herhangi bir işlem yapılmaz.
     */
    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_audit_findings"
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
      id:
        data.id,
    });
  } catch (error) {
    console.error(
      "DORA AUDIT FINDINGS DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetim bulgusu silinemedi.",
      },
      {
        status: 500,
      }
    );
  }
}