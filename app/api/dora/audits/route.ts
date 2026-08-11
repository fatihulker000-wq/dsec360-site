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

function normalizeStatus(
  value: unknown
): string {
  return text(value)
    .toUpperCase()
    .replaceAll(" ", "_");
}

const VALID_STATUSES =
  new Set([
    "PLANLANDI",
    "DEVAM_EDIYOR",
    "TAMAMLANDI",
    "IPTAL",
  ]);

function createSyncKey(
  firmId: string,
  templateId: string
): string {
  return [
    "DORA",
    "AUDIT",
    firmId,
    templateId,
    Date.now(),
    crypto.randomUUID(),
  ].join("-");
}

function createAuditNo(): string {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  const suffix =
    String(
      Date.now()
    ).slice(
      -6
    );

  return `DORA-DNT-${year}${month}${day}-${suffix}`;
}

/* =========================================================
GET
DORA DENETİMLERİ
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

    const templateId =
      text(
        searchParams.get(
          "templateId"
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
            "DORA firma ID veya denetim ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (id) {
      let query = supabase
        .from(
          "dora_audits"
        )
        .select(`
          *,
          template:dora_audit_templates(
            id,
            title,
            code,
            category,
            audit_type,
            status
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
              "DORA denetimi bulunamadı.",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        audit: data,
      });
    }

    let query = supabase
      .from(
        "dora_audits"
      )
      .select(`
        *,
        template:dora_audit_templates(
          id,
          title,
          code,
          category,
          audit_type,
          status
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

    if (templateId) {
      query =
        query.eq(
          "template_id",
          templateId
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
        "audit_date_millis",
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
      audits:
        data ?? [],
    });
  } catch (error) {
    console.error(
      "DORA AUDITS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetimleri alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
POST
YENİ DORA DENETİMİ BAŞLAT
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

    const auditDateMillis =
      nullableNumber(
        body.auditDateMillis ??
          body.audit_date_millis
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

    if (!templateId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Denetim şablonu zorunludur.",
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
            "Denetim başlığı zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!auditDateMillis) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Denetim tarihi zorunludur.",
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
        "id, firm_id, title, status, is_active"
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

    if (
      template.status !==
        "YAYINLANDI" ||
      template.is_active ===
        false
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Denetim yalnızca yayınlanmış ve aktif şablondan başlatılabilir.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data: questions,
      error: questionsError,
    } = await supabase
      .from(
        "dora_audit_questions"
      )
      .select(`
        id,
        score,
        weight
      `)
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
      .eq(
        "is_active",
        true
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
      );

    if (questionsError) {
      throw questionsError;
    }

    const activeQuestions =
      Array.isArray(
        questions
      )
        ? questions
        : [];

    if (
      activeQuestions.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Seçilen şablonda aktif denetim maddesi bulunmuyor.",
        },
        {
          status: 409,
        }
      );
    }

    const now =
      Date.now();

    const auditNo =
      text(
        body.auditNo ??
          body.audit_no
      ) ||
      createAuditNo();

    const syncKey =
      text(
        body.syncKey ??
          body.sync_key
      ) ||
      createSyncKey(
        firmId,
        templateId
      );

    const maxScore =
      activeQuestions.reduce(
        (
          total,
          question
        ) => {
          const score =
            Number(
              question.score ??
                0
            );

          const weight =
            Number(
              question.weight ??
                1
            );

          return (
            total +
            score *
              weight
          );
        },
        0
      );

    const {
      data: audit,
      error: auditError,
    } = await supabase
      .from(
        "dora_audits"
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

        audit_no:
          auditNo,

        title,

        audit_date_millis:
          auditDateMillis,

        auditor_name:
          text(
            body.auditorName ??
              body.auditor_name
          ),

        auditor_title:
          text(
            body.auditorTitle ??
              body.auditor_title
          ),

        department:
          text(
            body.department
          ),

        location:
          text(
            body.location
          ),

        scope:
          text(
            body.scope
          ),

        note:
          text(
            body.note
          ),

        status:
          "PLANLANDI",

        total_questions:
          activeQuestions.length,

        answered_questions:
          0,

        compliant_count:
          0,

        partial_count:
          0,

        non_compliant_count:
          0,

        not_applicable_count:
          0,

        total_score:
          0,

        max_score:
          maxScore,

        compliance_percent:
          0,

        completed_at_millis:
          null,

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

    if (auditError) {
      throw auditError;
    }

    /*
     * Şablon maddeleri için cevap satırlarını
     * denetim başlatılırken oluşturuyoruz.
     *
     * Böylece denetim başladıktan sonra şablon
     * değişse bile o denetimin soru seti belli olur.
     */
    const answerRows =
      activeQuestions.map(
        (
          question,
          index
        ) => ({
          firm_id:
            firmId,

          audit_id:
            audit.id,

          question_id:
            question.id,

          sync_key:
            [
              "DORA",
              "AUDIT_ANSWER",
              audit.id,
              question.id,
              Date.now(),
              index,
              crypto.randomUUID(),
            ].join("-"),

          app_local_id:
            null,

          source:
            "WEB",

          answer_status:
            "UYGULANAMAZ",

          explanation:
            "",

          action_required:
            false,

          action_text:
            "",

          score:
            0,

          answered_by:
            "",

          answered_at_millis:
            null,

          note:
            "",

          is_deleted:
            false,

          deleted_at_millis:
            null,

          created_at_millis:
            now,

          updated_at_millis:
            now,
        })
      );

    const {
      error: answersError,
    } = await supabase
      .from(
        "dora_audit_answers"
      )
      .insert(
        answerRows
      );

    if (answersError) {
      /*
       * Cevap satırları oluşturulamazsa
       * yarım denetim bırakmıyoruz.
       */
      await supabase
        .from(
          "dora_audits"
        )
        .delete()
        .eq(
          "id",
          audit.id
        );

      throw answersError;
    }

    return NextResponse.json({
      success: true,
      audit,
      answerCount:
        answerRows.length,
    });
  } catch (error) {
    console.error(
      "DORA AUDITS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetimi başlatılamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
PATCH
DORA DENETİMİ GÜNCELLE
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
            "Denetim ID zorunludur.",
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
      const title =
        text(
          body.title
        );

      if (!title) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Denetim başlığı boş bırakılamaz.",
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
      body.auditDateMillis !==
        undefined ||
      body.audit_date_millis !==
        undefined
    ) {
      const value =
        nullableNumber(
          body.auditDateMillis ??
            body.audit_date_millis
        );

      if (!value) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Geçerli denetim tarihi girilmelidir.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.audit_date_millis =
        value;
    }

    if (
      body.auditorName !==
        undefined ||
      body.auditor_name !==
        undefined
    ) {
      updateData.auditor_name =
        text(
          body.auditorName ??
            body.auditor_name
        );
    }

    if (
      body.auditorTitle !==
        undefined ||
      body.auditor_title !==
        undefined
    ) {
      updateData.auditor_title =
        text(
          body.auditorTitle ??
            body.auditor_title
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
      body.scope !==
      undefined
    ) {
      updateData.scope =
        text(
          body.scope
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
              "Geçersiz denetim durumu.",
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
        "TAMAMLANDI"
      ) {
        updateData.completed_at_millis =
          Date.now();
      } else {
        updateData.completed_at_millis =
          null;
      }
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_audits"
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
      audit: data,
    });
  } catch (error) {
    console.error(
      "DORA AUDITS PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetimi güncellenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
DELETE
DORA DENETİMİ SOFT DELETE
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
            "Denetim ID zorunludur.",
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
     * Cevap, bulgu, DÖF ve fotoğraf kayıtları
     * fiziksel olarak silinmiyor.
     * Denetim soft-delete edilir.
     */

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_audits"
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
      "DORA AUDITS DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetimi silinemedi.",
      },
      {
        status: 500,
      }
    );
  }
}