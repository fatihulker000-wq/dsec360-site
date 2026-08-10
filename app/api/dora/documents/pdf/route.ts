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

  const date =
    new Date(millis);

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

function bodyTextFromContent(
  contentJson: unknown
): string {
  if (
    !contentJson ||
    typeof contentJson !== "object"
  ) {
    return "";
  }

  const content =
    contentJson as Record<
      string,
      unknown
    >;

  if (
    typeof content.body === "string"
  ) {
    return content.body;
  }

  if (
    Array.isArray(
      content.sections
    )
  ) {
    return content.sections
      .map((item) =>
        typeof item === "string"
          ? item
          : ""
      )
      .filter(Boolean)
      .join("\n\n");
  }

  return "";
}

function wrapText(
  input: string,
  maxWidth: number,
  font: any,
  fontSize: number
): string[] {
  const paragraphs =
    input.replace(/\r/g, "").split("\n");

  const lines: string[] = [];

  for (
    const paragraph of paragraphs
  ) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words =
      paragraph.split(/\s+/);

    let current = "";

    for (
      const word of words
    ) {
      const candidate =
        current
          ? `${current} ${word}`
          : word;

      const width =
        font.widthOfTextAtSize(
          candidate,
          fontSize
        );

      if (
        width <= maxWidth
      ) {
        current =
          candidate;
      } else {
        if (current) {
          lines.push(current);
        }

        current = word;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines;
}

export async function GET(
  request: NextRequest
) {
  try {
    const {
      searchParams,
    } = new URL(request.url);

    const id =
      text(
        searchParams.get("id")
      );

    const firmId =
      text(
        searchParams.get(
          "firmId"
        )
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA doküman ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    let query = supabase
      .from("dora_documents")
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
      data: document,
      error: documentError,
    } = await query.maybeSingle();

    if (documentError) {
      throw documentError;
    }

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA dokümanı bulunamadı.",
        },
        {
          status: 404,
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
        document.firm_id
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
            "DORA PDF font dosyası bulunamadı.",
        },
        {
          status: 500,
        }
      );
    }

    const fontBytes =
      fs.readFileSync(
        fontPath
      );

    if (
      fontBytes.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA PDF font dosyası boş.",
        },
        {
          status: 500,
        }
      );
    }

    const pdfDoc =
      await PDFDocument.create();

    pdfDoc.registerFontkit(
      fontkit
    );

    const font =
      await pdfDoc.embedFont(
        fontBytes,
        {
          subset: true,
        }
      );

    const pageWidth =
      595.28;

    const pageHeight =
      841.89;

    const marginX =
      46;

    const topMargin =
      54;

    const bottomMargin =
      58;

    const bodyFontSize =
      10.5;

    const lineHeight =
      15;

    const bodyWidth =
      pageWidth -
      marginX * 2;

    const bodyText =
      bodyTextFromContent(
        document.content_json
      ) ||
      "Doküman içeriği bulunamadı.";

    const lines =
      wrapText(
        bodyText,
        bodyWidth,
        font,
        bodyFontSize
      );

    let page =
      pdfDoc.addPage([
        pageWidth,
        pageHeight,
      ]);

    let pageNo = 1;

    function drawHeader() {
      page.drawText(
        firm.firm_name ||
          "DORA Firma",
        {
          x: marginX,
          y:
            pageHeight -
            topMargin,
          size: 11,
          font,
          color: rgb(
            0.32,
            0.09,
            0.13
          ),
        }
      );

      page.drawText(
        document.document_no ||
          "DORA",
        {
          x:
            pageWidth -
            marginX -
            140,
          y:
            pageHeight -
            topMargin,
          size: 9,
          font,
          color: rgb(
            0.38,
            0.38,
            0.42
          ),
        }
      );

      page.drawLine({
        start: {
          x: marginX,
          y:
            pageHeight -
            topMargin -
            12,
        },

        end: {
          x:
            pageWidth -
            marginX,
          y:
            pageHeight -
            topMargin -
            12,
        },

        thickness: 1.4,

        color: rgb(
          0.48,
          0.15,
          0.20
        ),
      });
    }

    function drawFooter() {
      const footerY =
        28;

      page.drawLine({
        start: {
          x: marginX,
          y: footerY + 12,
        },

        end: {
          x:
            pageWidth -
            marginX,
          y:
            footerY + 12,
        },

        thickness: 0.6,

        color: rgb(
          0.83,
          0.84,
          0.86
        ),
      });

      page.drawText(
        `Hazırlayan: ${
          document.prepared_by ||
          "-"
        }`,
        {
          x: marginX,
          y: footerY,
          size: 8,
          font,
          color: rgb(
            0.4,
            0.4,
            0.44
          ),
        }
      );

      page.drawText(
        `Onaylayan: ${
          document.approved_by ||
          "-"
        }`,
        {
          x:
            pageWidth / 2 -
            40,
          y: footerY,
          size: 8,
          font,
          color: rgb(
            0.4,
            0.4,
            0.44
          ),
        }
      );

      page.drawText(
        `Sayfa ${pageNo}`,
        {
          x:
            pageWidth -
            marginX -
            45,
          y: footerY,
          size: 8,
          font,
          color: rgb(
            0.4,
            0.4,
            0.44
          ),
        }
      );
    }

    function drawDocumentTitle() {
      const title =
        document.title ||
        "DORA Dokümanı";

      const titleSize =
        17;

      const titleWidth =
        font.widthOfTextAtSize(
          title,
          titleSize
        );

      page.drawText(
        title,
        {
          x:
            Math.max(
              marginX,
              (
                pageWidth -
                titleWidth
              ) / 2
            ),

          y:
            pageHeight -
            topMargin -
            52,

          size:
            titleSize,

          font,

          color: rgb(
            0.10,
            0.13,
            0.20
          ),
        }
      );

      const infoY =
        pageHeight -
        topMargin -
        82;

      page.drawText(
        `Doküman No: ${
          document.document_no ||
          "-"
        }`,
        {
          x: marginX,
          y: infoY,
          size: 8.5,
          font,
          color: rgb(
            0.38,
            0.38,
            0.42
          ),
        }
      );

      page.drawText(
        `Revizyon: ${
          document.revision_no ??
          0
        }`,
        {
          x:
            marginX + 190,
          y: infoY,
          size: 8.5,
          font,
          color: rgb(
            0.38,
            0.38,
            0.42
          ),
        }
      );

      page.drawText(
        `Yürürlük: ${formatDate(
          document.effective_date_millis
        )}`,
        {
          x:
            marginX + 330,
          y: infoY,
          size: 8.5,
          font,
          color: rgb(
            0.38,
            0.38,
            0.42
          ),
        }
      );
    }

    drawHeader();
    drawDocumentTitle();

    let y =
      pageHeight -
      topMargin -
      115;

    for (
      const line of lines
    ) {
      if (
        y <
        bottomMargin +
          24
      ) {
        drawFooter();

        pageNo += 1;

        page =
          pdfDoc.addPage([
            pageWidth,
            pageHeight,
          ]);

        drawHeader();

        y =
          pageHeight -
          topMargin -
          36;
      }

      if (!line) {
        y -=
          lineHeight * 0.7;

        continue;
      }

      page.drawText(
        line,
        {
          x: marginX,
          y,
          size:
            bodyFontSize,
          font,
          color: rgb(
            0.18,
            0.20,
            0.25
          ),
        }
      );

      y -= lineHeight;
    }

    drawFooter();

    const pdfBytes =
      await pdfDoc.save();

    const safeName =
      (
        document.title ||
        "dora-dokuman"
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
      Buffer.from(
        pdfBytes
      ),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="${safeName || "dora-dokuman"}.pdf"`,

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "DORA DOCUMENT PDF ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA PDF oluşturulamadı.",
      },
      {
        status: 500,
      }
    );
  }
}