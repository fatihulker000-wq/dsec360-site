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

function normalizeAnswerStatus(
  value: unknown
): string {
  return text(value)
    .toUpperCase()
    .replaceAll(" ", "_");
}

const VALID_ANSWER_STATUSES =
  new Set([
    "UYGUN",
    "KISMEN_UYGUN",
    "UYGUNSUZ",
    "UYGULANAMAZ",
  ]);

function answerScore(
  answerStatus: string,
  baseScore: number,
  weight: number
): number {
  const max =
    baseScore * weight;

  switch (answerStatus) {
    case "UYGUN":
      return max;

    case "KISMEN_UYGUN":
      return max * 0.5;

    case "UYGUNSUZ":
      return 0;

    case "UYGULANAMAZ":
      return 0;

    default:
      return 0;
  }
}

/* =========================================================
GET
DORA DENETİM CEVAPLARI
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

    const id =
      text(
        searchParams.get(
          "id"
        )
      );

    if (
      !id &&
      (!firmId ||
        !auditId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID ve denetim ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (id) {
      let query = supabase
        .from(
          "dora_audit_answers"
        )
        .select(`
          *,
          question:dora_audit_questions(
            id,
            section_title,
            title,
            question,
            expected_condition,
            precaution,
            legal_basis,
            risk_level,
            photo_required,
            score,
            weight,
            sort_order
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

      if (auditId) {
        query =
          query.eq(
            "audit_id",
            auditId
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
              "DORA denetim cevabı bulunamadı.",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        answer: data,
      });
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_audit_answers"
      )
      .select(`
        *,
        question:dora_audit_questions(
          id,
          section_title,
          title,
          question,
          expected_condition,
          precaution,
          legal_basis,
          risk_level,
          photo_required,
          score,
          weight,
          sort_order
        )
      `)
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
      .order(
        "question(sort_order)",
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      answers:
        data ?? [],
    });
  } catch (error) {
    console.error(
      "DORA AUDIT ANSWERS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetim cevapları alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
PATCH
DENETİM CEVABINI KAYDET
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

    const auditId =
      text(
        body.auditId ??
          body.audit_id
      );

    const answerStatus =
      normalizeAnswerStatus(
        body.answerStatus ??
          body.answer_status
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Denetim cevabı ID zorunludur.",
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

    if (
      !VALID_ANSWER_STATUSES.has(
        answerStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Geçersiz denetim cevap durumu.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: currentAnswer,
      error: currentAnswerError,
    } = await supabase
      .from(
        "dora_audit_answers"
      )
      .select(`
        id,
        audit_id,
        question_id,
        question:dora_audit_questions(
          id,
          score,
          weight,
          photo_required,
          risk_level
        )
      `)
      .eq(
        "id",
        id
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

    if (currentAnswerError) {
      throw currentAnswerError;
    }

    if (!currentAnswer) {
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

    const questionRaw =
      currentAnswer.question;

    const question =
      Array.isArray(
        questionRaw
      )
        ? questionRaw[0]
        : questionRaw;

    const baseScore =
      Number(
        question?.score ??
          0
      );

    const weight =
      Number(
        question?.weight ??
          1
      );

    const calculatedScore =
      answerScore(
        answerStatus,
        baseScore,
        weight
      );

    const updateData:
      Record<
        string,
        unknown
      > = {
      answer_status:
        answerStatus,

      score:
        calculatedScore,

      answered_at_millis:
        Date.now(),

      source:
        "WEB",
    };

    if (
      body.explanation !==
      undefined
    ) {
      updateData.explanation =
        text(
          body.explanation
        );
    }

    if (
      body.actionRequired !==
        undefined ||
      body.action_required !==
        undefined
    ) {
      updateData.action_required =
        booleanValue(
          body.actionRequired ??
            body.action_required,
          false
        );
    } else {
      updateData.action_required =
        answerStatus ===
          "UYGUNSUZ" ||
        answerStatus ===
          "KISMEN_UYGUN";
    }

    if (
      body.actionText !==
        undefined ||
      body.action_text !==
        undefined
    ) {
      updateData.action_text =
        text(
          body.actionText ??
            body.action_text
        );
    }

    if (
      body.answeredBy !==
        undefined ||
      body.answered_by !==
        undefined
    ) {
      updateData.answered_by =
        text(
          body.answeredBy ??
            body.answered_by
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
        "dora_audit_answers"
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
        "audit_id",
        auditId
      )
      .eq(
        "is_deleted",
        false
      )
      .select(`
        *,
        question:dora_audit_questions(
          id,
          section_title,
          title,
          question,
          expected_condition,
          precaution,
          legal_basis,
          risk_level,
          photo_required,
          score,
          weight,
          sort_order
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    /*
     * Denetim ilk kez cevaplanmaya
     * başladıysa durum DEVAM_EDIYOR olur.
     */
    await supabase
      .from(
        "dora_audits"
      )
      .update({
        status:
          "DEVAM_EDIYOR",
      })
      .eq(
        "id",
        auditId
      )
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "status",
        "PLANLANDI"
      )
      .eq(
        "is_deleted",
        false
      );

    /*
     * SQL trigger cevap değişikliğinden
     * sonra dora_audits özetini zaten
     * yeniden hesaplar.
     */

    const {
      data: auditSummary,
      error: summaryError,
    } = await supabase
      .from(
        "dora_audits"
      )
      .select(`
        id,
        status,
        total_questions,
        answered_questions,
        compliant_count,
        partial_count,
        non_compliant_count,
        not_applicable_count,
        total_score,
        max_score,
        compliance_percent
      `)
      .eq(
        "id",
        auditId
      )
      .eq(
        "firm_id",
        firmId
      )
      .maybeSingle();

    if (summaryError) {
      throw summaryError;
    }

    return NextResponse.json({
      success: true,
      answer: data,
      auditSummary,
    });
  } catch (error) {
    console.error(
      "DORA AUDIT ANSWERS PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetim cevabı kaydedilemedi.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
POST
TOPLU CEVAP KAYDI
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

    const answers =
      Array.isArray(
        body.answers
      )
        ? body.answers
        : [];

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

    if (
      answers.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Kaydedilecek denetim cevabı bulunamadı.",
        },
        {
          status: 400,
        }
      );
    }

    let updatedCount = 0;

    const rowErrors:
      {
        id: string;
        error: string;
      }[] = [];

    for (
      const item of answers
    ) {
      try {
        const id =
          text(
            item.id
          );

        const answerStatus =
          normalizeAnswerStatus(
            item.answerStatus ??
              item.answer_status
          );

        if (
          !id ||
          !VALID_ANSWER_STATUSES.has(
            answerStatus
          )
        ) {
          rowErrors.push({
            id:
              id ||
              "-",
            error:
              "Geçersiz cevap kaydı.",
          });

          continue;
        }

        const {
          data: answer,
          error: answerError,
        } = await supabase
          .from(
            "dora_audit_answers"
          )
          .select(`
            id,
            question:dora_audit_questions(
              score,
              weight
            )
          `)
          .eq(
            "id",
            id
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

        if (
          answerError
        ) {
          throw answerError;
        }

        if (!answer) {
          rowErrors.push({
            id,
            error:
              "Cevap kaydı bulunamadı.",
          });

          continue;
        }

        const questionRaw =
          answer.question;

        const question =
          Array.isArray(
            questionRaw
          )
            ? questionRaw[0]
            : questionRaw;

        const score =
          answerScore(
            answerStatus,
            Number(
              question?.score ??
                0
            ),
            Number(
              question?.weight ??
                1
            )
          );

        const {
          error,
        } = await supabase
          .from(
            "dora_audit_answers"
          )
          .update({
            answer_status:
              answerStatus,

            explanation:
              text(
                item.explanation
              ),

            action_required:
              item.actionRequired !==
                undefined
                ? booleanValue(
                    item.actionRequired,
                    false
                  )
                : answerStatus ===
                    "UYGUNSUZ" ||
                  answerStatus ===
                    "KISMEN_UYGUN",

            action_text:
              text(
                item.actionText ??
                  item.action_text
              ),

            score,

            answered_by:
              text(
                item.answeredBy ??
                  item.answered_by
              ),

            answered_at_millis:
              Date.now(),

            note:
              text(
                item.note
              ),

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
            "audit_id",
            auditId
          )
          .eq(
            "is_deleted",
            false
          );

        if (error) {
          throw error;
        }

        updatedCount +=
          1;
      } catch (error) {
        rowErrors.push({
          id:
            text(
              item.id
            ) ||
            "-",

          error:
            error instanceof Error
              ? error.message
              : "Cevap güncellenemedi.",
        });
      }
    }

    if (
      updatedCount > 0
    ) {
      await supabase
        .from(
          "dora_audits"
        )
        .update({
          status:
            "DEVAM_EDIYOR",
        })
        .eq(
          "id",
          auditId
        )
        .eq(
          "firm_id",
          firmId
        )
        .eq(
          "status",
          "PLANLANDI"
        )
        .eq(
          "is_deleted",
          false
        );

      await supabase.rpc(
        "dora_refresh_audit_summary",
        {
          p_audit_id:
            auditId,
        }
      );
    }

    const {
      data: auditSummary,
      error: summaryError,
    } = await supabase
      .from(
        "dora_audits"
      )
      .select(`
        id,
        status,
        total_questions,
        answered_questions,
        compliant_count,
        partial_count,
        non_compliant_count,
        not_applicable_count,
        total_score,
        max_score,
        compliance_percent
      `)
      .eq(
        "id",
        auditId
      )
      .eq(
        "firm_id",
        firmId
      )
      .maybeSingle();

    if (summaryError) {
      throw summaryError;
    }

    return NextResponse.json({
      success: true,
      updated:
        updatedCount,
      failed:
        rowErrors.length,
      rowErrors,
      auditSummary,
    });
  } catch (error) {
    console.error(
      "DORA AUDIT ANSWERS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetim cevapları toplu kaydedilemedi.",
      },
      {
        status: 500,
      }
    );
  }
}