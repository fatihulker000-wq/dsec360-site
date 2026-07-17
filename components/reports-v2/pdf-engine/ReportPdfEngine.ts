import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

  scale: 2,

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

  if (!element) {

    throw new Error(
      "PDF oluşturulacak alan bulunamadı."
    );

  }

  const canvas =
    await html2canvas(element, {

      scale:
        settings.scale,

      backgroundColor:
        settings.backgroundColor,

      useCORS: true,

      allowTaint: false,

      logging: false,

      windowWidth:
        element.scrollWidth,

      windowHeight:
        element.scrollHeight,

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

  const printableWidth =

    pageWidth -

    settings.marginLeftMm -

    settings.marginRightMm;

  const printableHeight =

    pageHeight -

    settings.marginTopMm -

    settings.marginBottomMm;

  const imageData =
    canvas.toDataURL(
      "image/jpeg",
      0.96
    );

  const imageHeight =

    (
      canvas.height *
      printableWidth
    ) / canvas.width;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        imageHeight /
          printableHeight
      )
    );
      // -------------------------------------------------
  // Çok Sayfalı PDF Oluştur
  // -------------------------------------------------

  for (
    let pageIndex = 0;
    pageIndex < totalPages;
    pageIndex++
  ) {

    if (pageIndex > 0) {
      pdf.addPage();
    }

    const imageY =

      settings.marginTopMm -

      pageIndex *
      printableHeight;

    pdf.addImage(

      imageData,

      "JPEG",

      settings.marginLeftMm,

      imageY,

      printableWidth,

      imageHeight,

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

// ------------------------------------------------------------

function drawPageChrome(

  pdf: jsPDF,

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
      230,
      233,
      238
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
  // Doğrulama Bilgileri
  // -------------------------------------------------

  drawVerificationInfo(

    pdf,

    options,

    pageWidth,

    pageHeight

  );

  // -------------------------------------------------
  // Son Sayfaya İmza
  // -------------------------------------------------

  if (
    pageIndex ===
    totalPages - 1
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

  pdf: jsPDF,

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
  pdf: jsPDF,
  options: ReportPdfExportOptions,
  pageWidth: number,
  pageHeight: number
) {
  const signature =
    options.signature;

  if (!signature) {
    return;
  }

  // -------------------------------------------------
  // Strict TypeScript düzeltmesi
  // -------------------------------------------------

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

  // -------------------------------------------------
  // Hazırlayan
  // -------------------------------------------------

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

  // -------------------------------------------------
  // Onaylayan
  // -------------------------------------------------

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
  pdf: jsPDF,
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

    String(
      value || "dsec-rapor"
    )

      .trim()

      .replace(
        /[\\/:*?"<>|]+/g,
        "-"
      )

      .replace(
        /\s+/g,
        "-"
      )

      .replace(
        /-+/g,
        "-"
      )

      .replace(
        /^-|-$/g,
        ""
      );

  return safe

    .toLocaleLowerCase("tr-TR")

    .endsWith(".pdf")

      ? safe

      : `${safe}.pdf`;

}

// ------------------------------------------------------------

export default {

  exportElementToProfessionalPdf,

};