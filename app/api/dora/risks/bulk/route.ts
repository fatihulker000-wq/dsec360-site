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

function numberValue(
  value: unknown,
  fallback = 1
): number {
  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function excelDateToMillis(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value === "number"
  ) {
    const date =
      XLSX.SSF.parse_date_code(
        value
      );

    if (!date) {
      return null;
    }

    return new Date(
      date.y,
      date.m - 1,
      date.d,
      12,
      0,
      0
    ).getTime();
  }

  const raw =
    String(value).trim();

  if (!raw) {
    return null;
  }

  const parts =
    raw.split(
      /[./-]/
    );

  if (
    parts.length === 3
  ) {
    const [
      a,
      b,
      c,
    ] = parts.map(Number);

    let year: number;
    let month: number;
    let day: number;

    if (
      a > 1900
    ) {
      year = a;
      month = b;
      day = c;
    } else {
      day = a;
      month = b;
      year = c;
    }

    const date =
      new Date(
        year,
        month - 1,
        day,
        12,
        0,
        0
      );

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date.getTime();
  }

  const date =
    new Date(raw);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date.getTime();
}

function createSyncKey(
  firmId: string,
  index: number
) {
  return [
    "DORA",
    "RISK",
    "BULK",
    firmId,
    Date.now(),
    index,
    crypto.randomUUID(),
  ].join("-");
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

/* =========================================================
POST
DORA FINE KINNEY EXCEL TOPLU AKTARIM
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const formData =
      await request.formData();

    const file =
      formData.get(
        "file"
      );

    const firmId =
      text(
        formData.get(
          "firmId"
        )
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

    const {
      data: firm,
      error: firmError,
    } = await supabase
      .from(
        "dora_firms"
      )
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

    const bytes =
      await file.arrayBuffer();

    const workbook =
      XLSX.read(
        bytes,
        {
          type:
            "array",
        }
      );

    const sheetName =
      workbook.SheetNames[0];

    if (!sheetName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Excel içinde çalışma sayfası bulunamadı.",
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
          defval:
            "",
          raw:
            true,
        }
      );

    if (
      rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Excel dosyasında aktarılacak kayıt yok.",
        },
        {
          status: 400,
        }
      );
    }

    const now =
      Date.now();

    const insertRows:
      Record<
        string,
        unknown
      >[] = [];

    const errors:
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

        const hazard =
          text(
            pick(
              row,
              "Tehlike",
              "tehlike",
              "Hazard",
              "hazard"
            )
          );

        if (!hazard) {
          errors.push({
            row:
              excelRow,
            error:
              "Tehlike alanı boş.",
          });

          return;
        }

        const probability =
          numberValue(
            pick(
              row,
              "Olasılık",
              "Olasilik",
              "O",
              "fk_probability"
            ),
            1
          );

        const frequency =
          numberValue(
            pick(
              row,
              "Frekans",
              "F",
              "fk_frequency"
            ),
            1
          );

        const severity =
          numberValue(
            pick(
              row,
              "Şiddet",
              "Siddet",
              "Ş",
              "S",
              "fk_severity"
            ),
            1
          );

        insertRows.push({
          firm_id:
            firmId,

          sync_key:
            createSyncKey(
              firmId,
              index
            ),

          title:
            text(
              pick(
                row,
                "Başlık",
                "Baslik",
                "title"
              )
            ),

          activity:
            text(
              pick(
                row,
                "Faaliyet",
                "activity"
              )
            ),

          department:
            text(
              pick(
                row,
                "Bölüm",
                "Bolum",
                "department"
              )
            ),

          location:
            text(
              pick(
                row,
                "Lokasyon",
                "location"
              )
            ),

          hazard,

          risk_source:
            text(
              pick(
                row,
                "Risk Kaynağı",
                "Risk Kaynagi",
                "risk_source"
              )
            ),

          risk_description:
            text(
              pick(
                row,
                "Risk Tanımı",
                "Risk Tanimi",
                "risk_description"
              )
            ),

          consequence:
            text(
              pick(
                row,
                "Olası Sonuç",
                "Olasi Sonuc",
                "consequence"
              )
            ),

          affected_persons:
            text(
              pick(
                row,
                "Etkilenen Kişiler",
                "Etkilenen Kisiler",
                "affected_persons"
              )
            ),

          existing_controls:
            text(
              pick(
                row,
                "Mevcut Önlem",
                "Mevcut Onlem",
                "existing_controls"
              )
            ),

          legal_basis:
            text(
              pick(
                row,
                "Mevzuat",
                "legal_basis"
              )
            ),

          fk_probability:
            probability,

          fk_frequency:
            frequency,

          fk_severity:
            severity,

          corrective_action:
            text(
              pick(
                row,
                "Düzeltici Faaliyet",
                "Duzeltici Faaliyet",
                "corrective_action"
              )
            ),

          responsible_person:
            text(
              pick(
                row,
                "Sorumlu",
                "responsible_person"
              )
            ),

          due_date_millis:
            excelDateToMillis(
              pick(
                row,
                "Termin Tarihi",
                "Termin",
                "due_date"
              )
            ),

          action_status:
            text(
              pick(
                row,
                "Aksiyon Durumu",
                "action_status"
              )
            ).toUpperCase() ||
            "ACIK",

          residual_probability:
            nullableNumber(
              pick(
                row,
                "Kalan Olasılık",
                "Kalan Olasilik",
                "residual_probability"
              )
            ),

          residual_frequency:
            nullableNumber(
              pick(
                row,
                "Kalan Frekans",
                "residual_frequency"
              )
            ),

          residual_severity:
            nullableNumber(
              pick(
                row,
                "Kalan Şiddet",
                "Kalan Siddet",
                "residual_severity"
              )
            ),

          note:
            text(
              pick(
                row,
                "Not",
                "note"
              )
            ),

          status:
            "ACIK",

          source:
            "WEB",

          is_deleted:
            false,

          deleted_at_millis:
            null,

          created_at_millis:
            now,

          updated_at_millis:
            now,
        });
      }
    );

    if (
      insertRows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Geçerli risk kaydı bulunamadı.",
          rowErrors:
            errors,
        },
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_risks"
      )
      .insert(
        insertRows
      )
      .select(
        "id, hazard, fk_score, fk_level"
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success:
        true,

      inserted:
        data?.length ??
        0,

      skipped:
        errors.length,

      rowErrors:
        errors,

      risks:
        data ?? [],
    });
  } catch (error) {
    console.error(
      "DORA RISKS BULK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error instanceof Error
            ? error.message
            : "DORA Fine Kinney Excel aktarımı yapılamadı.",
      },
      {
        status: 500,
      }
    );
  }
}