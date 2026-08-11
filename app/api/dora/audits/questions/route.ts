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

function booleanValue(
  value: unknown,
  fallback: boolean
): boolean {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  if (
    normalized === "true" ||
    normalized === "1"
  ) {
    return true;
  }

  if (
    normalized === "false" ||
    normalized === "0"
  ) {
    return false;
  }

  return fallback;
}

function normalizeRiskLevel(
  value: unknown
): string {
  return text(value)
    .toUpperCase()
    .replaceAll(" ", "_");
}

const VALID_RISK_LEVELS =
  new Set([
    "DUSUK",
    "ORTA",
    "YUKSEK",
    "KRITIK",
  ]);

function createSyncKey(
  firmId: string,
  templateId: string
): string {
  return [
    "DORA",
    "AUDIT_QUESTION",
    firmId,
    templateId,
    Date.now(),
    crypto.randomUUID(),
  ].join("-");
}

/* =========================================================
GET
DORA DENETİM ŞABLON SORULARI
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

    const templateId =
      text(
        searchParams.get(
          "templateId"
        )
      );

    const id =
      text(
        searchParams.get(
          "id"
        )
      );

    if (
      !id &&
      (!firmId ||
        !templateId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID ve şablon ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (id) {
      let query = supabase
        .from(
          "dora_audit_questions"
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
        query =
          query.eq(
            "firm_id",
            firmId
          );
      }

      if (templateId) {
        query =
          query.eq(
            "template_id",
            templateId
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
              "DORA denetim sorusu bulunamadı.",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        question: data,
      });
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_audit_questions"
      )
      .select("*")
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "template_id",
        templateId
      )
      .eq(
        "is_deleted",
        false
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
      )
      .order(
        "created_at_millis",
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      questions:
        data ?? [],
    });
  } catch (error) {
    console.error(
      "DORA AUDIT QUESTIONS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetim soruları alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
POST
YENİ DORA DENETİM SORUSU
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

    const templateId =
      text(
        body.templateId ??
          body.template_id
      );

    const title =
      text(
        body.title
      );

    const question =
      text(
        body.question
      );

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

    if (!templateId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA şablon ID zorunludur.",
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
            "Madde başlığı zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Denetim sorusu zorunludur.",
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
      data: template,
      error: templateError,
    } = await supabase
      .from(
        "dora_audit_templates"
      )
      .select(
        "id, firm_id"
      )
      .eq(
        "id",
        templateId
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

    if (templateError) {
      throw templateError;
    }

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA denetim şablonu bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    const syncKey =
      text(
        body.syncKey ??
          body.sync_key
      ) ||
      createSyncKey(
        firmId,
        templateId
      );

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_audit_questions"
      )
      .insert({
        firm_id:
          firmId,

        template_id:
          templateId,

        sync_key:
          syncKey,

        app_local_id:
          nullableNumber(
            body.appLocalId ??
              body.app_local_id
          ),

        source:
          "WEB",

        section_title:
          text(
            body.sectionTitle ??
              body.section_title
          ),

        title,

        question,

        expected_condition:
          text(
            body.expectedCondition ??
              body.expected_condition
          ),

        precaution:
          text(
            body.precaution
          ),

        legal_basis:
          text(
            body.legalBasis ??
              body.legal_basis
          ),

        risk_level:
          riskLevel,

        photo_required:
          booleanValue(
            body.photoRequired ??
              body.photo_required,
            false
          ),

        score:
          nullableNumber(
            body.score
          ) ?? 0,

        weight:
          nullableNumber(
            body.weight
          ) ?? 1,

        sort_order:
          nullableNumber(
            body.sortOrder ??
              body.sort_order
          ) ?? 0,

        is_active:
          booleanValue(
            body.isActive ??
              body.is_active,
            true
          ),

        note:
          text(
            body.note
          ),

        is_deleted:
          false,

        deleted_at_millis:
          null,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      question: data,
    });
  } catch (error) {
    console.error(
      "DORA AUDIT QUESTIONS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetim sorusu oluşturulamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
PATCH
DORA DENETİM SORUSU GÜNCELLE
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
            "Denetim sorusu ID zorunludur.",
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
      > = {};

    if (
      body.sectionTitle !==
        undefined ||
      body.section_title !==
        undefined
    ) {
      updateData.section_title =
        text(
          body.sectionTitle ??
            body.section_title
        );
    }

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
              "Madde başlığı boş bırakılamaz.",
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
      body.question !==
      undefined
    ) {
      const question =
        text(
          body.question
        );

      if (!question) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Denetim sorusu boş bırakılamaz.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.question =
        question;
    }

    if (
      body.expectedCondition !==
        undefined ||
      body.expected_condition !==
        undefined
    ) {
      updateData.expected_condition =
        text(
          body.expectedCondition ??
            body.expected_condition
        );
    }

    if (
      body.precaution !==
      undefined
    ) {
      updateData.precaution =
        text(
          body.precaution
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
      body.photoRequired !==
        undefined ||
      body.photo_required !==
        undefined
    ) {
      updateData.photo_required =
        booleanValue(
          body.photoRequired ??
            body.photo_required,
          false
        );
    }

    if (
      body.score !==
      undefined
    ) {
      updateData.score =
        nullableNumber(
          body.score
        ) ?? 0;
    }

    if (
      body.weight !==
      undefined
    ) {
      updateData.weight =
        nullableNumber(
          body.weight
        ) ?? 1;
    }

    if (
      body.sortOrder !==
        undefined ||
      body.sort_order !==
        undefined
    ) {
      updateData.sort_order =
        nullableNumber(
          body.sortOrder ??
            body.sort_order
        ) ?? 0;
    }

    if (
      body.isActive !==
        undefined ||
      body.is_active !==
        undefined
    ) {
      updateData.is_active =
        booleanValue(
          body.isActive ??
            body.is_active,
          true
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
        "dora_audit_questions"
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
      question: data,
    });
  } catch (error) {
    console.error(
      "DORA AUDIT QUESTIONS PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetim sorusu güncellenemedi.",
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
            "Denetim sorusu ID zorunludur.",
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
        "dora_audit_questions"
      )
      .update({
        is_deleted:
          true,

        is_active:
          false,

        deleted_at_millis:
          now,
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
      "DORA AUDIT QUESTIONS DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetim sorusu silinemedi.",
      },
      {
        status: 500,
      }
    );
  }
}