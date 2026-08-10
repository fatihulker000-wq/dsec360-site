import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  AlignmentType,
  Document,
  Footer,
  Header,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

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

function safeFileName(
  input: string
): string {
  return input
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

    const bodyText =
      bodyTextFromContent(
        document.content_json
      ) ||
      "Doküman içeriği bulunamadı.";

    const bodyParagraphs =
      bodyText
        .replace(/\r/g, "")
        .split("\n")
        .map(
          (
            line: string
          ) => {
            if (
              !line.trim()
            ) {
              return new Paragraph({
                text: "",
                spacing: {
                  after: 120,
                },
              });
            }

            return new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  size: 22,
                }),
              ],

              spacing: {
                after: 120,
                line: 300,
              },
            });
          }
        );

    const doc =
      new Document({
        sections: [
          {
            headers: {
              default:
                new Header({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text:
                            firm.firm_name ||
                            "DORA Firma",
                          bold: true,
                          size: 22,
                        }),

                        new TextRun({
                          text:
                            `    ${document.document_no || "DORA"}`,
                          size: 18,
                        }),
                      ],

                      alignment:
                        AlignmentType.LEFT,
                    }),
                  ],
                }),
            },

            footers: {
              default:
                new Footer({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text:
                            `Hazırlayan: ${document.prepared_by || "-"}`,
                          size: 16,
                        }),

                        new TextRun({
                          text:
                            `    Onaylayan: ${document.approved_by || "-"}`,
                          size: 16,
                        }),
                      ],

                      alignment:
                        AlignmentType.CENTER,
                    }),
                  ],
                }),
            },

            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      document.title ||
                      "DORA Dokümanı",
                    bold: true,
                    size: 34,
                  }),
                ],

                alignment:
                  AlignmentType.CENTER,

                spacing: {
                  after: 360,
                },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      `Doküman No: ${document.document_no || "-"}`,
                    size: 18,
                  }),

                  new TextRun({
                    text:
                      `    Revizyon: ${document.revision_no ?? 0}`,
                    size: 18,
                  }),

                  new TextRun({
                    text:
                      `    Yürürlük: ${formatDate(
                        document.effective_date_millis
                      )}`,
                    size: 18,
                  }),
                ],

                spacing: {
                  after: 280,
                },
              }),

              ...bodyParagraphs,

              new Paragraph({
                text: "",
                spacing: {
                  before: 300,
                },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      `Hazırlayan: ${document.prepared_by || "-"}`,
                    bold: true,
                    size: 20,
                  }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      `Onaylayan: ${document.approved_by || "-"}`,
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
            ],
          },
        ],
      });

    const buffer =
  await Packer.toBuffer(
    doc
  );

const body =
  new Uint8Array(
    buffer
  );

const fileName =
  safeFileName(
    document.title ||
      "dora-dokuman"
  ) ||
  "dora-dokuman";

return new NextResponse(
  body,
  {
    status: 200,

    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

      "Content-Disposition":
        `attachment; filename="${fileName}.docx"`,

      "Cache-Control":
        "no-store",
    },
  }
);
  } catch (error) {
    console.error(
      "DORA DOCUMENT WORD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "DORA Word dokümanı oluşturulamadı.",
      },
      {
        status: 500,
      }
    );
  }
}