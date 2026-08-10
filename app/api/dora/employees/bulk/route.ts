import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";
import {
  read,
  utils,
} from "xlsx";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function text(
  value: unknown
): string {
  return String(value ?? "").trim();
}

function normalizedHeader(
  value: unknown
): string {
  return text(value)
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]+/g, "");
}

function cell(
  row: Record<string, unknown>,
  aliases: string[]
): string {
  const entries =
    Object.entries(row);

  for (const [
    key,
    value,
  ] of entries) {
    const normalized =
      normalizedHeader(key);

    if (
      aliases.some(
        (alias) =>
          normalized ===
          normalizedHeader(alias)
      )
    ) {
      return text(value);
    }
  }

  return "";
}

function booleanCell(
  value: unknown,
  fallback = true
): boolean {
  const normalized =
    text(value)
      .toLocaleLowerCase(
        "tr-TR"
      );

  if (!normalized) {
    return fallback;
  }

  if (
    [
      "evet",
      "e",
      "true",
      "1",
      "aktif",
      "yes",
    ].includes(normalized)
  ) {
    return true;
  }

  if (
    [
      "hayır",
      "hayir",
      "h",
      "false",
      "0",
      "pasif",
      "no",
    ].includes(normalized)
  ) {
    return false;
  }

  return fallback;
}

function createSyncKey(
  firmId: string,
  index: number
) {
  return [
    "DORA",
    "EMPLOYEE",
    firmId,
    Date.now(),
    index,
    crypto.randomUUID(),
  ].join("-");
}

export async function POST(
  request: NextRequest
) {
  try {
    const formData =
      await request.formData();

    const firmId =
      text(
        formData.get("firmId")
      );

    const file =
      formData.get("file");

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

    const lowerName =
      file.name
        .toLocaleLowerCase(
          "tr-TR"
        );

    if (
      !lowerName.endsWith(
        ".xlsx"
      ) &&
      !lowerName.endsWith(
        ".xls"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Yalnızca .xlsx veya .xls dosyaları yüklenebilir.",
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
      .eq("id", firmId)
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
      read(bytes);

    const firstSheetName =
      workbook.SheetNames[0];

    if (!firstSheetName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Excel dosyasında çalışma sayfası bulunamadı.",
        },
        {
          status: 400,
        }
      );
    }

    const worksheet =
      workbook.Sheets[
        firstSheetName
      ];

    const rows =
      utils.sheet_to_json<
        Record<string, unknown>
      >(
        worksheet,
        {
          defval: "",
          raw: false,
        }
      );

    if (
      rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Excel dosyasında aktarılacak çalışan bulunamadı.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: existingEmployees,
      error:
        existingEmployeesError,
    } = await supabase
      .from("dora_employees")
      .select(
        "id, tc_no, full_name"
      )
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "is_deleted",
        false
      );

    if (
      existingEmployeesError
    ) {
      throw existingEmployeesError;
    }

    const existingTc =
      new Set(
        (
          existingEmployees ?? []
        )
          .map((employee) =>
            text(
              employee.tc_no
            )
          )
          .filter(Boolean)
      );

    const fileTc =
      new Set<string>();

    const insertRows:
      Record<
        string,
        unknown
      >[] = [];

    const rowErrors:
      string[] = [];

    let skipped = 0;

    rows.forEach(
      (
        row,
        index
      ) => {
        const excelRow =
          index + 2;

        const fullName =
          cell(
            row,
            [
              "Ad Soyad *",
              "Ad Soyad",
              "AdSoyad",
              "Full Name",
              "FullName",
            ]
          );

        const tcNo =
          cell(
            row,
            [
              "TC Kimlik No",
              "T.C. Kimlik No",
              "TC No",
              "TCKN",
              "tc_no",
            ]
          );

        if (!fullName) {
          rowErrors.push(
            `${excelRow}. satır: Ad Soyad boş.`
          );
          skipped += 1;
          return;
        }

        if (
          tcNo &&
          (
            existingTc.has(
              tcNo
            ) ||
            fileTc.has(
              tcNo
            )
          )
        ) {
          skipped += 1;
          return;
        }

        if (tcNo) {
          fileTc.add(tcNo);
        }

        const activeRaw =
          cell(
            row,
            [
              "Aktif",
              "Durum",
              "Is Active",
              "is_active",
            ]
          );

        insertRows.push({
          firm_id:
            firmId,

          sync_key:
            createSyncKey(
              firmId,
              index
            ),

          app_local_id:
            null,

          app_firm_local_id:
            null,

          full_name:
            fullName,

          tc_no:
            tcNo,

          position:
            cell(
              row,
              [
                "Pozisyon",
                "Görev",
                "Position",
              ]
            ),

          department:
            cell(
              row,
              [
                "Departman",
                "Bölüm",
                "Department",
              ]
            ),

          phone:
            cell(
              row,
              [
                "Telefon",
                "Phone",
              ]
            ),

          email:
            cell(
              row,
              [
                "E-posta",
                "Eposta",
                "Email",
              ]
            ),

          special_group:
            cell(
              row,
              [
                "Özel Grup",
                "Ozel Grup",
                "Special Group",
              ]
            )
              .toUpperCase(),

          is_active:
            booleanCell(
              activeRaw,
              true
            ),

          note:
            cell(
              row,
              [
                "Not",
                "Açıklama",
                "Aciklama",
                "Note",
              ]
            ),

          is_deleted:
            false,

          deleted_at_millis:
            null,

          source:
            "WEB_EXCEL",

          created_at_millis:
            Date.now(),

          updated_at_millis:
            Date.now(),
        });
      }
    );

    if (
      insertRows.length === 0
    ) {
      return NextResponse.json({
        success: true,
        inserted: 0,
        skipped,
        errors:
          rowErrors.slice(
            0,
            50
          ),
        message:
          "Yeni çalışan eklenmedi.",
      });
    }

    const {
      data,
      error,
    } = await supabase
      .from("dora_employees")
      .insert(
        insertRows
      )
      .select("id");

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,

      inserted:
        data?.length ??
        insertRows.length,

      skipped,

      errors:
        rowErrors.slice(
          0,
          50
        ),

      message:
        `${data?.length ?? insertRows.length} çalışan aktarıldı.`,
    });
  } catch (error) {
    console.error(
      "DORA EMPLOYEES BULK IMPORT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Excel toplu aktarımı başarısız.",
      },
      {
        status: 500,
      }
    );
  }
}