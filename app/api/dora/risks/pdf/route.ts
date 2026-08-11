import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  PDFDocument,
  rgb,
} from "pdf-lib";

import fontkit from "@pdf-lib/fontkit";

import fs from "fs";
import path from "path";

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

function formatDate(
  millis?: number | null
): string {
  if (!millis) {
    return "-";
  }

  const date = new Date(millis);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "tr-TR"
  );
}

function levelLabel(
  level?: string | null
): string {
  switch (level) {
    case "KABUL_EDILEBILIR":
      return "Kabul Edilebilir";

    case "KESIN_RISK":
      return "Kesin Risk";

    case "ONEMLI_RISK":
      return "Önemli Risk";

    case "YUKSEK_RISK":
      return "Yüksek Risk";

    case "COK_YUKSEK_RISK":
      return "Çok Yüksek Risk";

    default:
      return "-";
  }
}

function wrapText(
  input: string,
  maxWidth: number,
  font: any,
  fontSize: number
): string[] {
  const result: string[] = [];

  for (
    const paragraph of
      String(input || "")
        .replace(/\r/g, "")
        .split("\n")
  ) {
    if (!paragraph.trim()) {
      result.push("");
      continue;
    }

    const words =
      paragraph.split(/\s+/);

    let line = "";

    for (const word of words) {
      const next =
        line
          ? `${line} ${word}`
          : word;

      const width =
        font.widthOfTextAtSize(
          next,
          fontSize
        );

      if (
        width <= maxWidth
      ) {
        line = next;
      } else {
        if (line) {
          result.push(line);
        }

        line = word;
      }
    }

    if (line) {
      result.push(line);
    }
  }

  return result;
}

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

    const {
      data: firm,
      error: firmError,
    } = await supabase
      .from("dora_firms")
      .select("*")
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

    const {
      data: risks,
      error: risksError,
    } = await supabase
      .from("dora_risks")
      .select("*")
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "is_deleted",
        false
      )
      .order(
        "fk_score",
        {
          ascending: false,
        }
      );

    if (risksError) {
      throw risksError;
    }

    const fontPath =
      path.join(
        process.cwd(),
        "public",
        "fonts",
        "NotoSans-Regular.ttf"
      );

    if (
      !fs.existsSync(
        fontPath
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "NotoSans-Regular.ttf bulunamadı.",
        },
        {
          status: 500,
        }
      );
    }

    const boldPath =
      path.join(
        process.cwd(),
        "public",
        "fonts",
        "NotoSans-Bold.ttf"
      );

    const regularBytes =
      fs.readFileSync(
        fontPath
      );

    const boldBytes =
      fs.existsSync(
        boldPath
      )
        ? fs.readFileSync(
            boldPath
          )
        : regularBytes;

    const pdf =
      await PDFDocument.create();

    pdf.registerFontkit(
      fontkit
    );

    /*
     * Noto Sans variable/subset sorunu yaşamamak için
     * fontun tamamını gömüyoruz.
     */
    const regular =
      await pdf.embedFont(
        regularBytes,
        {
          subset: false,
        }
      );

    const bold =
      await pdf.embedFont(
        boldBytes,
        {
          subset: false,
        }
      );

    const pageWidth = 841.89;
    const pageHeight = 595.28;

    const margin = 34;
    const bottom = 34;

    let page =
      pdf.addPage([
        pageWidth,
        pageHeight,
      ]);

    let pageNo = 1;

    function drawHeader() {
      page.drawText(
        firm.firm_name ||
          "DORA Firma",
        {
          x: margin,
          y:
            pageHeight -
            34,
          size: 11,
          font: bold,
          color: rgb(
            0.32,
            0.09,
            0.13
          ),
        }
      );

      page.drawText(
        "DORA Fine Kinney Risk Değerlendirme Raporu",
        {
          x: 280,
          y:
            pageHeight -
            34,
          size: 11,
          font: bold,
          color: rgb(
            0.12,
            0.14,
            0.18
          ),
        }
      );

      page.drawLine({
        start: {
          x: margin,
          y:
            pageHeight -
            45,
        },
        end: {
          x:
            pageWidth -
            margin,
          y:
            pageHeight -
            45,
        },
        thickness: 1.2,
        color: rgb(
          0.48,
          0.15,
          0.20
        ),
      });
    }

    function drawFooter() {
      page.drawLine({
        start: {
          x: margin,
          y: 24,
        },
        end: {
          x:
            pageWidth -
            margin,
          y: 24,
        },
        thickness: 0.5,
        color: rgb(
          0.82,
          0.84,
          0.86
        ),
      });

      page.drawText(
        `DORA bağımsız risk merkezi • ${new Date().toLocaleDateString(
          "tr-TR"
        )}`,
        {
          x: margin,
          y: 11,
          size: 7,
          font: regular,
          color: rgb(
            0.42,
            0.44,
            0.48
          ),
        }
      );

      page.drawText(
        `Sayfa ${pageNo}`,
        {
          x:
            pageWidth -
            margin -
            42,
          y: 11,
          size: 7,
          font: regular,
          color: rgb(
            0.42,
            0.44,
            0.48
          ),
        }
      );
    }

    function nextPage() {
      drawFooter();

      pageNo += 1;

      page =
        pdf.addPage([
          pageWidth,
          pageHeight,
        ]);

      drawHeader();
    }

    drawHeader();

    const allRisks =
      Array.isArray(risks)
        ? risks
        : [];

    const counts = {
      acceptable:
        allRisks.filter(
          (r) =>
            r.fk_level ===
            "KABUL_EDILEBILIR"
        ).length,

      definite:
        allRisks.filter(
          (r) =>
            r.fk_level ===
            "KESIN_RISK"
        ).length,

      important:
        allRisks.filter(
          (r) =>
            r.fk_level ===
            "ONEMLI_RISK"
        ).length,

      high:
        allRisks.filter(
          (r) =>
            r.fk_level ===
            "YUKSEK_RISK"
        ).length,

      veryHigh:
        allRisks.filter(
          (r) =>
            r.fk_level ===
            "COK_YUKSEK_RISK"
        ).length,
    };

    let y =
      pageHeight -
      76;

    page.drawText(
      `Toplam Risk: ${allRisks.length}   |   Kabul Edilebilir: ${counts.acceptable}   |   Kesin Risk: ${counts.definite}   |   Önemli Risk: ${counts.important}   |   Yüksek Risk: ${counts.high}   |   Çok Yüksek: ${counts.veryHigh}`,
      {
        x: margin,
        y,
        size: 8.5,
        font: bold,
        color: rgb(
          0.20,
          0.22,
          0.27
        ),
      }
    );

    y -= 26;

    if (
      allRisks.length === 0
    ) {
      page.drawText(
        "Bu DORA firması için kayıtlı Fine Kinney riski bulunmuyor.",
        {
          x: margin,
          y,
          size: 10,
          font: regular,
        }
      );
    }

    for (
      let i = 0;
      i <
      allRisks.length;
      i += 1
    ) {
      const risk =
        allRisks[i];

      const title =
        `${i + 1}. ${
          risk.hazard ||
          risk.title ||
          "Risk"
        }`;

      const description =
        risk.risk_description ||
        risk.consequence ||
        "";

      const action =
        risk.corrective_action ||
        "";

      const scoreText =
        `O: ${risk.fk_probability}   F: ${risk.fk_frequency}   Ş: ${risk.fk_severity}   Skor: ${risk.fk_score}   Seviye: ${levelLabel(
          risk.fk_level
        )}`;

      const bodyLines = [
        ...wrapText(
          title,
          pageWidth -
            margin * 2 -
            20,
          bold,
          9.5
        ),

        ...wrapText(
          scoreText,
          pageWidth -
            margin * 2 -
            20,
          regular,
          8
        ),

        ...wrapText(
          `Bölüm / Lokasyon: ${
            risk.department || "-"
          } / ${
            risk.location || "-"
          }`,
          pageWidth -
            margin * 2 -
            20,
          regular,
          8
        ),

        ...wrapText(
          `Risk Tanımı: ${
            description || "-"
          }`,
          pageWidth -
            margin * 2 -
            20,
          regular,
          8
        ),

        ...wrapText(
          `Mevcut Önlem: ${
            risk.existing_controls ||
            "-"
          }`,
          pageWidth -
            margin * 2 -
            20,
          regular,
          8
        ),

        ...wrapText(
          `Düzeltici Faaliyet: ${
            action || "-"
          }`,
          pageWidth -
            margin * 2 -
            20,
          regular,
          8
        ),

        ...wrapText(
          `Sorumlu / Termin: ${
            risk.responsible_person ||
            "-"
          } / ${formatDate(
            risk.due_date_millis
          )}`,
          pageWidth -
            margin * 2 -
            20,
          regular,
          8
        ),
      ];

      if (
        risk.residual_score != null
      ) {
        bodyLines.push(
          ...wrapText(
            `Kalan Risk: ${risk.residual_score} - ${levelLabel(
              risk.residual_level
            )}`,
            pageWidth -
              margin * 2 -
              20,
            bold,
            8
          )
        );
      }

      const needed =
        22 +
        bodyLines.length * 11;

      if (
        y - needed <
        bottom + 10
      ) {
        nextPage();

        y =
          pageHeight -
          70;
      }

      page.drawRectangle({
        x: margin,
        y:
          y -
          needed +
          6,
        width:
          pageWidth -
          margin * 2,
        height:
          needed,
        borderWidth: 0.6,
        borderColor: rgb(
          0.86,
          0.87,
          0.89
        ),
        color: rgb(
          0.995,
          0.995,
          0.997
        ),
      });

      let lineY =
        y - 10;

      bodyLines.forEach(
        (
          line,
          lineIndex
        ) => {
          page.drawText(
            line || " ",
            {
              x:
                margin +
                10,
              y:
                lineY,
              size:
                lineIndex === 0
                  ? 9.5
                  : 8,
              font:
                lineIndex === 0
                  ? bold
                  : regular,
              color: rgb(
                0.18,
                0.20,
                0.24
              ),
            }
          );

          lineY -= 11;
        }
      );

      y -=
        needed +
        10;
    }

    drawFooter();

    const bytes =
      await pdf.save();

    const safeName =
      String(
        firm.firm_name ||
        "dora-firma"
      )
        .toLocaleLowerCase(
          "tr-TR"
        )
        .replaceAll("ı", "i")
        .replaceAll("ğ", "g")
        .replaceAll("ü", "u")
        .replaceAll("ş", "s")
        .replaceAll("ö", "o")
        .replaceAll("ç", "c")
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        );

    return new NextResponse(
      new Uint8Array(
        bytes
      ),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="${safeName || "dora"}-fine-kinney-risk-raporu.pdf"`,

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "DORA RISKS PDF ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA Fine Kinney PDF raporu oluşturulamadı.",
      },
      {
        status: 500,
      }
    );
  }
}