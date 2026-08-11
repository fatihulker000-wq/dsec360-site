import {
  NextRequest,
  NextResponse,
} from "next/server";

import * as XLSX from "xlsx";

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
  fallback = false
): boolean {
  if (
    value === undefined ||
    value === null ||
    value === ""
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
      .toLocaleLowerCase(
        "tr-TR"
      );

  return [
    "true",
    "1",
    "evet",
    "e",
    "yes",
    "x",
  ].includes(normalized);
}

function normalizeRiskLevel(
  value: unknown
): string {
  const raw =
    text(value)
      .toLocaleUpperCase(
        "tr-TR"
      )
      .replaceAll("İ", "I")
      .replaceAll("Ş", "S")
      .replaceAll("Ğ", "G")
      .replaceAll("Ü", "U")
      .replaceAll("Ö", "O")
      .replaceAll("Ç", "C")
      .replaceAll(" ", "_");

  if (
    raw === "DUSUK"
  ) {
    return "DUSUK";
  }

  if (
    raw === "YUKSEK"
  ) {
    return "YUKSEK";
  }

  if (
    raw === "KRITIK"
  ) {
    return "KRITIK";
  }

  return "ORTA";
}

function pick(
  row: Record<
    string,
    unknown
  >,
  ...keys: string[]
): unknown {
  for (
    const key of keys
  ) {
    if (
      row[key] !== undefined
    ) {
      return row[key];
    }
  }

  return undefined;
}

function createSyncKey(
  firmId: string,
  templateId: string,
  index: number
): string {
  return [
    "DORA",
    "AUDIT_QUESTION",
    "BULK",
    firmId,
    templateId,
    Date.now(),
    index,
    crypto.randomUUID(),
  ].join("-");
}

/* =========================================================
POST
DORA DENETİM MADDELERİ
EXCEL TOPLU AKTARIM
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const formData =
      await request.formData();

    const firmId =
      text(
        formData.get(
          "firmId"
        )
      );

    const templateId =
      text(
        formData.get(
          "templateId"
        )
      );

    const file =
      formData.get(
        "file"
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
            "DORA denetim şablonu ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Excel dosyası zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
    ŞABLON KONTROLÜ
    ===================================================== */

    const {
      data: template,
      error: templateError,
    } = await supabase
      .from(
        "dora_audit_templates"
      )
      .select(
        "id, firm_id, title"
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

    /* =====================================================
    EXCEL OKU
    ===================================================== */

    const bytes =
      await file.arrayBuffer();

    const workbook =
      XLSX.read(
        bytes,
        {
          type: "array",
        }
      );

    const sheetName =
      workbook.SheetNames[0];

    if (!sheetName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Excel çalışma sayfası bulunamadı.",
        },
        {
          status: 400,
        }
      );
    }

    const sheet =
      workbook.Sheets[
        sheetName
      ];

    const rows =
      XLSX.utils.sheet_to_json<
        Record<
          string,
          unknown
        >
      >(
        sheet,
        {
          defval: "",
          raw: true,
        }
      );

    if (
      rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Excel dosyasında aktarılacak madde bulunamadı.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
    MEVCUT EN YÜKSEK SIRA
    ===================================================== */

    const {
      data: lastQuestion,
      error: lastError,
    } = await supabase
      .from(
        "dora_audit_questions"
      )
      .select(
        "sort_order"
      )
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
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (lastError) {
      throw lastError;
    }

    const startingOrder =
      Number(
        lastQuestion
          ?.sort_order ??
          0
      );

    /* =====================================================
    SATIRLARI HAZIRLA
    ===================================================== */

    const inserts:
      Record<
        string,
        unknown
      >[] = [];

    const rowErrors:
      {
        row: number;
        error: string;
      }[] = [];

    rows.forEach(
      (
        row,
        index
      ) => {
        const excelRow =
          index + 2;

        const question =
          text(
            pick(
              row,
              "Soru",
              "Denetim Sorusu",
              "question",
              "Question"
            )
          );

        const title =
          text(
            pick(
              row,
              "Başlık",
              "Baslik",
              "Madde Başlığı",
              "Madde Basligi",
              "title"
            )
          ) ||
          question;

        if (!question) {
          rowErrors.push({
            row:
              excelRow,
            error:
              "Soru alanı boş.",
          });

          return;
        }

        const explicitOrder =
          nullableNumber(
            pick(
              row,
              "Sıra",
              "Sira",
              "Sıra No",
              "Sira No",
              "sort_order"
            )
          );

        inserts.push({
          firm_id:
            firmId,

          template_id:
            templateId,

          sync_key:
            createSyncKey(
              firmId,
              templateId,
              index
            ),

          app_local_id:
            null,

          source:
            "WEB",

          section_title:
            text(
              pick(
                row,
                "Bölüm",
                "Bolum",
                "Bölüm Başlığı",
                "Bolum Basligi",
                "section_title"
              )
            ),

          title,

          question,

          expected_condition:
            text(
              pick(
                row,
                "Beklenen Durum",
                "Beklenen",
                "expected_condition"
              )
            ),

          precaution:
            text(
              pick(
                row,
                "Önlem",
                "Onlem",
                "Tedbir",
                "precaution"
              )
            ),

          legal_basis:
            text(
              pick(
                row,
                "Mevzuat",
                "Mevzuat Dayanağı",
                "Mevzuat Dayanagi",
                "legal_basis"
              )
            ),

          risk_level:
            normalizeRiskLevel(
              pick(
                row,
                "Risk",
                "Risk Seviyesi",
                "risk_level"
              )
            ),

          photo_required:
            booleanValue(
              pick(
                row,
                "Fotoğraf",
                "Fotograf",
                "Fotoğraf Zorunlu",
                "Fotograf Zorunlu",
                "photo_required"
              ),
              false
            ),

          score:
            nullableNumber(
              pick(
                row,
                "Puan",
                "score"
              )
            ) ?? 0,

          weight:
            nullableNumber(
              pick(
                row,
                "Ağırlık",
                "Agirlik",
                "weight"
              )
            ) ?? 1,

          sort_order:
            explicitOrder ??
            startingOrder +
              index +
              1,

          is_active:
            true,

          note:
            text(
              pick(
                row,
                "Açıklama",
                "Aciklama",
                "Not",
                "note"
              )
            ),

          is_deleted:
            false,

          deleted_at_millis:
            null,
        });
      }
    );

    if (
      inserts.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Aktarılabilecek geçerli denetim maddesi bulunamadı.",
          rowErrors,
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
    TOPLU INSERT
    ===================================================== */

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_audit_questions"
      )
      .insert(
        inserts
      )
      .select(
        "id, title, question, sort_order"
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,

      template: {
        id:
          template.id,
        title:
          template.title,
      },

      inserted:
        data?.length ??
        0,

      skipped:
        rowErrors.length,

      rowErrors,

      questions:
        data ?? [],
    });
  } catch (error) {
    console.error(
      "DORA AUDIT QUESTIONS BULK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "DORA denetim maddeleri Excel'den aktarılamadı.",
      },
      {
        status: 500,
      }
    );
  }
}