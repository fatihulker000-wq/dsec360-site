import type {
  ReportPdfExportOptions,
  ReportPdfExportResult,
} from "./types";

const DEFAULT_OPTIONS: Required<
  Pick<
    ReportPdfExportOptions,
    | "orientation"
    | "pageSize"
    | "marginTopMm"
    | "marginRightMm"
    | "marginBottomMm"
    | "marginLeftMm"
    | "scale"
    | "backgroundColor"
    | "showPageNumbers"
    | "pageNumberFormat"
  >
> = {
  orientation: "portrait",
  pageSize: "a4",

  marginTopMm: 14,
  marginRightMm: 12,
  marginBottomMm: 17,
  marginLeftMm: 12,

  scale: 1.5,

  backgroundColor: "#ffffff",

  showPageNumbers: true,

  pageNumberFormat:
    "Sayfa {page} / {total}",
};

export async function exportElementToProfessionalPdf(
  element: HTMLElement,
  options: ReportPdfExportOptions
): Promise<ReportPdfExportResult> {

  const settings = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  try {

    if (!element) {
      throw new Error(
        "PDF oluşturulacak rapor alanı bulunamadı."
      );
    }

    const [
      { default: jsPDF },
      { default: html2canvas },
    ] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);

    const canvas =
      await html2canvas(element, {

        scale:
          settings.scale,

        backgroundColor:
          settings.backgroundColor,

        useCORS: true,

        allowTaint: false,

        logging: false,

        windowWidth: Math.max(
          element.scrollWidth,
          element.clientWidth
        ),

        windowHeight: Math.max(
          element.scrollHeight,
          element.clientHeight
        ),

      });

    const pdf = new jsPDF({

      orientation:
        settings.orientation,

      unit: "mm",

      format:
        settings.pageSize,

      compress: true,

    });

    applyMetadata(
      pdf,
      settings.metadata
    );

    const pageWidth =
      pdf.internal.pageSize.getWidth();

    const pageHeight =
      pdf.internal.pageSize.getHeight();

    const contentWidth =

      pageWidth -

      settings.marginLeftMm -

      settings.marginRightMm;

    const contentHeight =

      pageHeight -

      settings.marginTopMm -

      settings.marginBottomMm;

    const imageData =
      canvas.toDataURL(
        "image/jpeg",
        0.94
      );

    const renderedImageHeight =

      (
        canvas.height *
        contentWidth
      ) / canvas.width;

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          renderedImageHeight /
          contentHeight
        )
      );
          // -------------------------------------------------
    // Sayfaları oluştur
    // -------------------------------------------------

    for (
      let pageIndex = 0;
      pageIndex < totalPages;
      pageIndex += 1
    ) {

      if (pageIndex > 0) {
        pdf.addPage();
      }

      const imageY =

        settings.marginTopMm -

        pageIndex *
          contentHeight;

      pdf.addImage(

        imageData,

        "JPEG",

        settings.marginLeftMm,

        imageY,

        contentWidth,

        renderedImageHeight,

        undefined,

        "FAST"

      );

      drawPageChrome(

        pdf,

        {

          pageIndex,

          totalPages,

          pageWidth,

          pageHeight,

          options: settings,

        }

      );

    }

    // -------------------------------------------------
    // PDF Kaydet
    // -------------------------------------------------

    pdf.save(

      normalizePdfFilename(

        settings.filename

      )

    );

    return {

      success: true,

      filename:

        normalizePdfFilename(

          settings.filename

        ),

      pageCount:

        totalPages,

      createdAt:

        new Date().toISOString(),

    };

  }

  catch (errorValue: unknown) {

    const message =

      errorValue instanceof Error

        ? errorValue.message

        : "PDF oluşturulamadı.";

    return {

      success: false,

      filename:

        normalizePdfFilename(

          options.filename

        ),

      pageCount: 0,

      createdAt:

        new Date().toISOString(),

      error: message,

    };

  }

}

// ------------------------------------------------------------

function drawPageChrome(

  pdf: any,

  args: {

    pageIndex: number;

    totalPages: number;

    pageWidth: number;

    pageHeight: number;

    options:
      ReportPdfExportOptions &
      typeof DEFAULT_OPTIONS;

  }

) {

  const {

    pageIndex,

    totalPages,

    pageWidth,

    pageHeight,

    options,

  } = args;

  pdf.setDrawColor(
    220,
    224,
    230
  );

  pdf.setLineWidth(
    0.25
  );

  // Üst çizgi

  pdf.line(

    options.marginLeftMm,

    options.marginTopMm - 4,

    pageWidth -
      options.marginRightMm,

    options.marginTopMm - 4

  );

  // Alt çizgi

  pdf.line(

    options.marginLeftMm,

    pageHeight -
      options.marginBottomMm +
      4,

    pageWidth -
      options.marginRightMm,

    pageHeight -
      options.marginBottomMm +
      4

  );
    // -------------------------------------------------
  // Header
  // -------------------------------------------------

  if (options.headerText) {

    pdf.setFontSize(8);

    pdf.setTextColor(
      90,
      98,
      110
    );

    pdf.text(
      options.headerText,
      options.marginLeftMm,
      options.marginTopMm - 6
    );

  }

  // -------------------------------------------------
  // Footer
  // -------------------------------------------------

  if (options.footerText) {

    pdf.setFontSize(8);

    pdf.setTextColor(
      90,
      98,
      110
    );

    pdf.text(

      options.footerText,

      options.marginLeftMm,

      pageHeight -
        options.marginBottomMm +
        9

    );

  }

  // -------------------------------------------------
  // Sayfa Numarası
  // -------------------------------------------------

  if (options.showPageNumbers) {

    const pageText =
      options.pageNumberFormat

        .replace(
          "{page}",
          String(pageIndex + 1)
        )

        .replace(
          "{total}",
          String(totalPages)
        );

    pdf.setFontSize(8);

    pdf.setTextColor(
      90,
      98,
      110
    );

    pdf.text(

      pageText,

      pageWidth -
        options.marginRightMm,

      pageHeight -
        options.marginBottomMm +
        9,

      {
        align: "right",
      }

    );

  }

  // -------------------------------------------------
  // Filigran
  // -------------------------------------------------

  if (options.watermark) {

    pdf.saveGraphicsState?.();

    pdf.setFontSize(34);

    pdf.setTextColor(
      225,
      228,
      234
    );

    pdf.text(

      options.watermark,

      pageWidth / 2,

      pageHeight / 2,

      {

        align: "center",

        angle: 35,

      }

    );

    pdf.restoreGraphicsState?.();

  }

  // -------------------------------------------------
  // Rapor Doğrulama
  // -------------------------------------------------

  drawVerificationInfo(

    pdf,

    options,

    pageWidth,

    pageHeight

  );

  // -------------------------------------------------
  // Son Sayfa İmza
  // -------------------------------------------------

  if (
    pageIndex === totalPages - 1
  ) {

    drawSignatureBlock(

      pdf,

      options,

      pageWidth,

      pageHeight

    );

  }

}

// ------------------------------------------------------------

function drawVerificationInfo(

  pdf: any,

  options: ReportPdfExportOptions,

  pageWidth: number,

  pageHeight: number

) {

  const details = [

    options.reportNo
      ? `Rapor No: ${options.reportNo}`
      : "",

    options.revisionNo
      ? `Rev: ${options.revisionNo}`
      : "",

    options.verificationCode
      ? `Doğrulama: ${options.verificationCode}`
      : "",

  ].filter(Boolean);

  if (!details.length) {

    return;

  }

  pdf.setFontSize(7);

  pdf.setTextColor(
    110,
    118,
    130
  );

  pdf.text(

    details.join("  |  "),

    pageWidth / 2,

    pageHeight - 3.5,

    {

      align: "center",

    }

  );

}
// ------------------------------------------------------------


function drawSignatureBlock(
  pdf: any,
  options: ReportPdfExportOptions,
  pageWidth: number,
  pageHeight: number
) {
  const signature =
    options.signature;

  if (!signature) {
    return;
  }

  // BURAYA EKLE
  const marginBottom =
    options.marginBottomMm ?? 17;

  const marginLeft =
    options.marginLeftMm ?? 12;

  const marginRight =
    options.marginRightMm ?? 12;

  const blockY =
    pageHeight -
    marginBottom -
    21;

 const leftX =
  marginLeft;

  const rightX =
  pageWidth -
  marginRight -
  62;

  pdf.setFontSize(8);
  pdf.setTextColor(
    60,
    68,
    78
  );

  // ------------------------
  // Hazırlayan
  // ------------------------

  pdf.text(
    "Hazırlayan",
    leftX,
    blockY
  );

  pdf.text(
    signature.preparedBy || "-",
    leftX,
    blockY + 5
  );

  pdf.text(
    signature.preparedTitle || "",
    leftX,
    blockY + 9
  );

  if (signature.preparedAt) {
    pdf.text(
      signature.preparedAt,
      leftX,
      blockY + 13
    );
  }

  pdf.line(
    leftX,
    blockY + 17,
    leftX + 62,
    blockY + 17
  );

  // ------------------------
  // Onaylayan
  // ------------------------

  pdf.text(
    "Onaylayan",
    rightX,
    blockY
  );

  pdf.text(
    signature.approvedBy || "-",
    rightX,
    blockY + 5
  );

  pdf.text(
    signature.approvedTitle || "",
    rightX,
    blockY + 9
  );

  if (signature.approvedAt) {
    pdf.text(
      signature.approvedAt,
      rightX,
      blockY + 13
    );
  }

  pdf.line(
    rightX,
    blockY + 17,
    rightX + 62,
    blockY + 17
  );
}

// ------------------------------------------------------------

function applyMetadata(
  pdf: any,
  metadata?: ReportPdfExportOptions["metadata"]
) {
  if (!metadata) {
    return;
  }

  pdf.setProperties({
    title:
      metadata.title,

    subject:
      metadata.subject || "",

    author:
      metadata.author || "",

    creator:
      metadata.creator || "D-SEC",

    keywords:
      (metadata.keywords || [])
        .join(", "),
  });
}

// ------------------------------------------------------------

function normalizePdfFilename(
  value: string
) {
  const safe =
    String(value || "dsec-rapor")
      .trim()
      .replace(
        /[\\/:*?"<>|]+/g,
        "-"
      )
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  return safe
    .toLocaleLowerCase("tr-TR")
    .endsWith(".pdf")
      ? safe
      : `${safe}.pdf`;
}