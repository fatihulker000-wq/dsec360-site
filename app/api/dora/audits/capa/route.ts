import {
  NextRequest,
  NextResponse,
} from "next/server";

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

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function normalize(value: unknown): string {
  return text(value)
    .toUpperCase()
    .replaceAll(" ", "_");
}

function errorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    const message = String(
      (error as { message?: unknown }).message ?? ""
    ).trim();

    if (message) {
      return message;
    }
  }

  return fallback;
}


const VALID_STATUSES = new Set([
  "ACIK",
  "DEVAM_EDIYOR",
  "TAMAMLANDI",
  "KAPALI",
  "IPTAL",
]);

const VALID_PRIORITIES = new Set([
  "DUSUK",
  "ORTA",
  "YUKSEK",
  "KRITIK",
]);

function createSyncKey(
  firmId: string,
  findingId: string
): string {
  return [
    "DORA",
    "AUDIT_CAPA",
    firmId,
    findingId,
    Date.now(),
    crypto.randomUUID(),
  ].join("-");
}

/* =========================================================
GET
DORA DÖF KAYITLARI
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const firmId = text(
      searchParams.get("firmId")
    );

    const auditId = text(
      searchParams.get("auditId")
    );

    const findingId = text(
      searchParams.get("findingId")
    );

    const id = text(
      searchParams.get("id")
    );

    const status = normalize(
      searchParams.get("status")
    );

    if (!firmId && !id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID veya DÖF ID zorunludur.",
        },
        { status: 400 }
      );
    }

    /*
     * ÖNEMLİ:
     * dora_audit_capa -> finding/audit ilişkilerini
     * PostgREST nested select ile zorlamıyoruz.
     *
     * Böylece Supabase tarafında FK relationship cache
     * eksik olsa bile DÖF ekranı çalışmaya devam eder.
     */

    let query = supabase
      .from("dora_audit_capa")
      .select("*")
      .eq("is_deleted", false);

    if (id) {
      query = query.eq(
        "id",
        id
      );
    }

    if (firmId) {
      query = query.eq(
        "firm_id",
        firmId
      );
    }

    if (auditId) {
      query = query.eq(
        "audit_id",
        auditId
      );
    }

    if (findingId) {
      query = query.eq(
        "finding_id",
        findingId
      );
    }

    if (
      status &&
      VALID_STATUSES.has(status)
    ) {
      query = query.eq(
        "status",
        status
      );
    }

    const {
      data: capaRows,
      error: capaError,
    } = await query
      .order(
        "due_date_millis",
        {
          ascending: true,
          nullsFirst: false,
        }
      )
      .order(
        "created_at_millis",
        {
          ascending: false,
        }
      );

    if (capaError) {
      /*
       * Tablo henüz yoksa Şablonlar/Denetimler ekranını
       * bloklamıyoruz. DÖF sekmesi boş açılır.
       * POST sırasında gerçek kurulum hatası ayrıca görünür.
       */
      const code =
        text(
          (
            capaError as {
              code?: string;
            }
          ).code
        );

      if (
        code === "42P01" ||
        code === "PGRST205"
      ) {
        return NextResponse.json({
          success: true,
          capas: [],
          capa: null,
          setupRequired: true,
          warning:
            "dora_audit_capa tablosu henüz oluşturulmamış.",
        });
      }

      throw capaError;
    }

    const rows =
      Array.isArray(capaRows)
        ? capaRows
        : [];

    if (
      id &&
      rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA DÖF kaydı bulunamadı.",
        },
        { status: 404 }
      );
    }

    const findingIds =
      Array.from(
        new Set(
          rows
            .map(
              (
                item: Record<
                  string,
                  unknown
                >
              ) =>
                text(
                  item.finding_id
                )
            )
            .filter(Boolean)
        )
      );

    const auditIds =
      Array.from(
        new Set(
          rows
            .map(
              (
                item: Record<
                  string,
                  unknown
                >
              ) =>
                text(
                  item.audit_id
                )
            )
            .filter(Boolean)
        )
      );

    const findingMap =
      new Map<
        string,
        Record<string, unknown>
      >();

    const auditMap =
      new Map<
        string,
        Record<string, unknown>
      >();

    if (
      findingIds.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from(
          "dora_audit_findings"
        )
        .select(`
          id,
          title,
          description,
          finding_type,
          risk_level,
          legal_basis,
          recommendation,
          status
        `)
        .in(
          "id",
          findingIds
        )
        .eq(
          "is_deleted",
          false
        );

      if (error) {
        console.warn(
          "DORA CAPA FINDING ENRICH WARNING:",
          error
        );
      } else {
        for (
          const item of
          data ?? []
        ) {
          findingMap.set(
            text(item.id),
            item
          );
        }
      }
    }

    if (
      auditIds.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from(
          "dora_audits"
        )
        .select(`
          id,
          audit_no,
          title,
          audit_date_millis,
          status
        `)
        .in(
          "id",
          auditIds
        )
        .eq(
          "is_deleted",
          false
        );

      if (error) {
        console.warn(
          "DORA CAPA AUDIT ENRICH WARNING:",
          error
        );
      } else {
        for (
          const item of
          data ?? []
        ) {
          auditMap.set(
            text(item.id),
            item
          );
        }
      }
    }

    const enriched =
      rows.map(
        (
          item: Record<
            string,
            unknown
          >
        ) => ({
          ...item,

          finding:
            findingMap.get(
              text(
                item.finding_id
              )
            ) ??
            null,

          audit:
            auditMap.get(
              text(
                item.audit_id
              )
            ) ??
            null,
        })
      );

    if (id) {
      return NextResponse.json({
        success: true,
        capa:
          enriched[0] ??
          null,
      });
    }

    return NextResponse.json({
      success: true,
      capas:
        enriched,
    });
  } catch (error) {
    console.error(
      "DORA AUDIT CAPA GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          errorMessage(error, "DORA DÖF kayıtları alınamadı."),
      },
      { status: 500 }
    );
  }
}

/* =========================================================
POST
BULGUDAN DORA DÖF OLUŞTUR
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const firmId = text(
      body.firmId ??
        body.firm_id
    );

    const auditId = text(
      body.auditId ??
        body.audit_id
    );

    const findingId = text(
      body.findingId ??
        body.finding_id
    );

    const title = text(
      body.title
    );

    const priority =
      normalize(
        body.priority
      ) || "ORTA";

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID zorunludur.",
        },
        { status: 400 }
      );
    }

    if (!auditId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA denetim ID zorunludur.",
        },
        { status: 400 }
      );
    }

    if (!findingId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA bulgu ID zorunludur.",
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DÖF başlığı zorunludur.",
        },
        { status: 400 }
      );
    }

    if (
      !VALID_PRIORITIES.has(
        priority
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Geçersiz DÖF önceliği.",
        },
        { status: 400 }
      );
    }

    /*
     * KRİTİK KURAL:
     *
     * Bu route SADECE
     * dora_audit_capa tablosuna yazar.
     *
     * Ana D-SEC DÖF, aksiyon, ajanda,
     * risk veya denetim tablolarına
     * hiçbir kayıt gönderilmez.
     */

    const {
      data: finding,
      error: findingError,
    } = await supabase
      .from(
        "dora_audit_findings"
      )
      .select(`
        id,
        firm_id,
        audit_id,
        title,
        risk_level,
        status
      `)
      .eq(
        "id",
        findingId
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

    if (findingError) {
      throw findingError;
    }

    if (!finding) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA bulgusu bulunamadı.",
        },
        { status: 404 }
      );
    }

    /*
     * Aynı bulguya yanlışlıkla
     * birden fazla aktif DÖF açılmasını
     * engelliyoruz.
     */
    const {
      data: existing,
      error: existingError,
    } = await supabase
      .from(
        "dora_audit_capa"
      )
      .select("id, status")
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "finding_id",
        findingId
      )
      .eq(
        "is_deleted",
        false
      )
      .neq(
        "status",
        "IPTAL"
      )
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bu DORA bulgusu için zaten DÖF kaydı bulunmaktadır.",
          capaId:
            existing.id,
        },
        { status: 409 }
      );
    }

    const now =
      Date.now();

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_audit_capa"
      )
      .insert({
        firm_id:
          firmId,

        audit_id:
          auditId,

        finding_id:
          findingId,

        sync_key:
          createSyncKey(
            firmId,
            findingId
          ),

        source:
          "WEB",

        title,

        description:
          text(
            body.description
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

        responsible_department:
          text(
            body.responsibleDepartment ??
              body.responsible_department
          ),

        priority,

        due_date_millis:
          nullableNumber(
            body.dueDateMillis ??
              body.due_date_millis
          ),

        status:
          "ACIK",

        completion_note:
          "",

        completed_by:
          "",

        completed_at_millis:
          null,

        effectiveness_result:
          "",

        effectiveness_note:
          "",

        effectiveness_checked_by:
          "",

        effectiveness_checked_at_millis:
          null,

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

    /*
     * Bu güncelleme de yalnızca
     * DORA'nın kendi bulgu tablosundadır.
     */
    await supabase
      .from(
        "dora_audit_findings"
      )
      .update({
        status:
          "TAKIPTE",
        updated_at_millis:
          now,
        source:
          "WEB",
      })
      .eq(
        "id",
        findingId
      )
      .eq(
        "firm_id",
        firmId
      );

    return NextResponse.json({
      success: true,
      capa: data,
    });
  } catch (error) {
    console.error(
      "DORA AUDIT CAPA POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          errorMessage(error, "DORA DÖF oluşturulamadı."),
      },
      { status: 500 }
    );
  }
}

/* =========================================================
PATCH
DORA DÖF GÜNCELLE / TAMAMLA / KAPAT
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

    if (!id || !firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DÖF ID ve DORA firma ID zorunludur.",
        },
        { status: 400 }
      );
    }

    const {
      data: current,
      error: currentError,
    } = await supabase
      .from(
        "dora_audit_capa"
      )
      .select(
        "id, finding_id, status"
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
      .maybeSingle();

    if (currentError) {
      throw currentError;
    }

    if (!current) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA DÖF kaydı bulunamadı.",
        },
        { status: 404 }
      );
    }

    const updateData:
      Record<string, unknown> = {
        source:
          "WEB",
        updated_at_millis:
          Date.now(),
      };

    const fields: Array<
      [
        string,
        string,
      ]
    > = [
      ["title", "title"],
      ["description", "description"],
      ["rootCause", "root_cause"],
      ["correctiveAction", "corrective_action"],
      ["preventiveAction", "preventive_action"],
      ["responsiblePerson", "responsible_person"],
      ["responsibleDepartment", "responsible_department"],
      ["completionNote", "completion_note"],
      ["completedBy", "completed_by"],
      ["effectivenessResult", "effectiveness_result"],
      ["effectivenessNote", "effectiveness_note"],
      ["effectivenessCheckedBy", "effectiveness_checked_by"],
      ["closedBy", "closed_by"],
      ["closureNote", "closure_note"],
      ["note", "note"],
    ];

    for (
      const [input, column]
      of fields
    ) {
      if (
        body[input] !==
        undefined
      ) {
        updateData[column] =
          text(
            body[input]
          );
      }
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
      body.priority !==
      undefined
    ) {
      const priority =
        normalize(
          body.priority
        );

      if (
        !VALID_PRIORITIES.has(
          priority
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Geçersiz DÖF önceliği.",
          },
          { status: 400 }
        );
      }

      updateData.priority =
        priority;
    }

    if (
      body.status !==
      undefined
    ) {
      const status =
        normalize(
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
              "Geçersiz DÖF durumu.",
          },
          { status: 400 }
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

        updateData.completed_by =
          text(
            body.completedBy ??
              body.completed_by
          );

        updateData.completion_note =
          text(
            body.completionNote ??
              body.completion_note
          );
      }

      if (
        status ===
        "KAPALI"
      ) {
        /*
         * Kapatma aşamasında
         * etkinlik kontrolü zorunlu.
         */
        const effectiveness =
          text(
            body.effectivenessResult ??
              body.effectiveness_result
          );

        if (!effectiveness) {
          return NextResponse.json(
            {
              success: false,
              error:
                "DÖF kapatılmadan önce etkinlik sonucu girilmelidir.",
            },
            { status: 400 }
          );
        }

        updateData.effectiveness_result =
          effectiveness;

        updateData.effectiveness_note =
          text(
            body.effectivenessNote ??
              body.effectiveness_note
          );

        updateData.effectiveness_checked_by =
          text(
            body.effectivenessCheckedBy ??
              body.effectiveness_checked_by
          );

        updateData.effectiveness_checked_at_millis =
          Date.now();

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

        updateData.closed_at_millis =
          Date.now();
      }
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_audit_capa"
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

    /*
     * DÖF kapandıysa yalnızca
     * DORA bulgusunu kapat.
     */
    if (
      updateData.status ===
        "KAPALI" &&
      current.finding_id
    ) {
      await supabase
        .from(
          "dora_audit_findings"
        )
        .update({
          status:
            "KAPALI",
          closed_by:
            text(
              body.closedBy ??
                body.closed_by
            ),
          closed_at_millis:
            Date.now(),
          closure_note:
            text(
              body.closureNote ??
                body.closure_note
            ),
          updated_at_millis:
            Date.now(),
          source:
            "WEB",
        })
        .eq(
          "id",
          current.finding_id
        )
        .eq(
          "firm_id",
          firmId
        );
    }

    return NextResponse.json({
      success: true,
      capa: data,
    });
  } catch (error) {
    console.error(
      "DORA AUDIT CAPA PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          errorMessage(error, "DORA DÖF güncellenemedi."),
      },
      { status: 500 }
    );
  }
}

/* =========================================================
DELETE
DORA DÖF SOFT DELETE
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

    if (!id || !firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DÖF ID ve DORA firma ID zorunludur.",
        },
        { status: 400 }
      );
    }

    const now =
      Date.now();

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_audit_capa"
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
      "DORA AUDIT CAPA DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          errorMessage(error, "DORA DÖF silinemedi."),
      },
      { status: 500 }
    );
  }
}