import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface ReportPdfSectionOptions {
  filename: string;
  reportTitle?: string;
  reportNo?: string;
  verificationCode?: string;
}

function collectPdfSections(
  rootElement: HTMLElement
): HTMLElement[] {
  const sections: HTMLElement[] = [];

  Array.from(rootElement.children).forEach((child) => {
    if (!(child instanceof HTMLElement)) {
      return;
    }

    if (child.dataset.pdfSplitChildren === "true") {
      Array.from(child.children).forEach((nested) => {
        if (nested instanceof HTMLElement) {
          sections.push(nested);
        }
      });

      return;
    }

    sections.push(child);
  });

  return sections.length > 0
    ? sections
    : [rootElement];
}

export async function exportReportSectionsToPdf(
  rootElement: HTMLElement,
  options: ReportPdfSectionOptions
) {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth =
    pdf.internal.pageSize.getWidth();

  const pageHeight =
    pdf.internal.pageSize.getHeight();

  const marginLeft = 10;
  const marginRight = 10;
  const marginTop = 16;
  const marginBottom = 14;

  const printableWidth =
    pageWidth -
    marginLeft -
    marginRight;

  const printableHeight =
    pageHeight -
    marginTop -
    marginBottom;

  const sections =
    collectPdfSections(rootElement);

  let firstPage = true;

  for (const section of sections) {

    if (
      section.offsetWidth === 0 ||
      section.offsetHeight === 0
    ) {
      continue;
    }

    const canvas =
      await html2canvas(section, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        logging: false,
        windowWidth:
          Math.max(
            section.scrollWidth,
            section.offsetWidth
          ),
        windowHeight:
          Math.max(
            section.scrollHeight,
            section.offsetHeight
          ),
      });

    const image =
      canvas.toDataURL(
        "image/jpeg",
        0.94
      );

    const naturalHeight =
      (canvas.height * printableWidth) /
      canvas.width;

    const drawHeight =
      Math.min(
        naturalHeight,
        printableHeight
      );

    const drawWidth =
      naturalHeight >
      printableHeight
        ? (canvas.width * drawHeight) /
          canvas.height
        : printableWidth;

    if (!firstPage) {
      pdf.addPage();
    }

    firstPage = false;

    const x =
      marginLeft +
      (printableWidth - drawWidth) / 2;

    pdf.addImage(
      image,
      "JPEG",
      x,
      marginTop,
      drawWidth,
      drawHeight,
      undefined,
      "FAST"
    );
  }

  //--------------------------------------------------
  // Header / Footer
  //--------------------------------------------------

  const totalPages =
    pdf.getNumberOfPages();

  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {

    pdf.setPage(page);

    pdf.setFontSize(8);

    pdf.setTextColor(
      80,
      88,
      100
    );

    pdf.text(
      options.reportTitle ??
        "D-SEC Kurumsal İSG Yönetim Raporu",
      marginLeft,
      8
    );

    const footer = [

      options.reportNo
        ? `Rapor No: ${options.reportNo}`
        : "",

      options.verificationCode
        ? `Doğrulama: ${options.verificationCode}`
        : "",

      `Sayfa ${page}/${totalPages}`,

    ].filter(Boolean);

    pdf.text(
      footer.join("   |   "),
      pageWidth - marginRight,
      pageHeight - 5,
      {
        align: "right",
      }
    );
  }

  //--------------------------------------------------
  // Save
  //--------------------------------------------------

  const filename =
    String(
      options.filename || "rapor"
    )
      .trim()
      .replace(
        /[\\/:*?"<>|]+/g,
        "-"
      )
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  pdf.save(
    filename
      .toLowerCase()
      .endsWith(".pdf")
      ? filename
      : `${filename}.pdf`
  );
}