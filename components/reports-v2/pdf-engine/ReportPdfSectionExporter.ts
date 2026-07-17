import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type ReportPdfSectionOptions = {
  filename: string;
  reportTitle?: string;
  reportNo?: string;
  verificationCode?: string;
};

type PdfSection = {
  element: HTMLElement;
  title?: string;
  noSlice?: boolean;
};

function getVisibleTopLevelSections(
  rootElement: HTMLElement
): PdfSection[] {
  const children =
    Array.from(rootElement.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement &&
        child.dataset.pdfExclude !== "true" &&
        child.offsetWidth > 0 &&
        child.offsetHeight > 0
    );

  const covers =
    children.filter(
      (element) =>
        element.dataset.pdfCover === "true"
    );

  const normal =
    children.filter(
      (element) =>
        element.dataset.pdfCover !== "true"
    );

  return [...covers, ...normal].map(
    (element) => ({
      element,
      title:
        element.dataset.pdfTitle,
      noSlice:
        element.dataset.pdfNoSlice === "true",
    })
  );
}

function hidePdfExcludedAndInteractive(
  rootElement: HTMLElement
): () => void {
  const elements =
    Array.from(
      rootElement.querySelectorAll<HTMLElement>(
        [
          '[data-pdf-exclude="true"]',
          "button",
          "input",
          "select",
          "textarea",
        ].join(",")
      )
    );

  const previous =
    elements.map((element) => ({
      element,
      display: element.style.display,
    }));

  elements.forEach((element) => {
    element.style.display = "none";
  });

  return () => {
    previous.forEach(
      ({ element, display }) => {
        element.style.display = display;
      }
    );
  };
}

async function renderSection(
  element: HTMLElement
): Promise<HTMLCanvasElement> {
  const original = {
    width: element.style.width,
    maxWidth: element.style.maxWidth,
    minWidth: element.style.minWidth,
    transform: element.style.transform,
    transformOrigin:
      element.style.transformOrigin,
    overflow: element.style.overflow,
  };

  const captureWidth = 1280;

  element.style.width =
    `${captureWidth}px`;

  element.style.maxWidth =
    `${captureWidth}px`;

  element.style.minWidth =
    `${captureWidth}px`;

  element.style.transform = "none";
  element.style.transformOrigin =
    "top left";

  element.style.overflow = "visible";

  try {
    return await html2canvas(
      element,
      {
        scale: 1.35,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        logging: false,
        removeContainer: true,
        width: captureWidth,
        windowWidth: captureWidth,
        windowHeight:
          Math.max(
            element.scrollHeight,
            element.offsetHeight
          ),
        scrollX: 0,
        scrollY: 0,
      }
    );
  } finally {
    element.style.width =
      original.width;

    element.style.maxWidth =
      original.maxWidth;

    element.style.minWidth =
      original.minWidth;

    element.style.transform =
      original.transform;

    element.style.transformOrigin =
      original.transformOrigin;

    element.style.overflow =
      original.overflow;
  }
}

function createCanvasSlice(
  source: HTMLCanvasElement,
  sourceY: number,
  sliceHeight: number
): HTMLCanvasElement {
  const canvas =
    document.createElement("canvas");

  canvas.width = source.width;
  canvas.height = sliceHeight;

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "PDF görüntü alanı oluşturulamadı."
    );
  }

  context.fillStyle = "#ffffff";
  context.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  context.drawImage(
    source,
    0,
    sourceY,
    source.width,
    sliceHeight,
    0,
    0,
    source.width,
    sliceHeight
  );

  return canvas;
}

function addHeaderAndFooter(
  pdf: jsPDF,
  pageNumber: number,
  totalPages: number,
  options: ReportPdfSectionOptions,
  sectionTitle?: string
) {
  const pageWidth =
    pdf.internal.pageSize.getWidth();

  const pageHeight =
    pdf.internal.pageSize.getHeight();

  pdf.setFontSize(8);
  pdf.setTextColor(75, 85, 99);

  pdf.text(
    sectionTitle ||
      options.reportTitle ||
      "D-SEC Kurumsal ISG Yönetim Raporu",
    12,
    8
  );

  const footer = [
    options.reportNo
      ? `Rapor No: ${options.reportNo}`
      : "",
    options.verificationCode
      ? `Dogrulama: ${options.verificationCode}`
      : "",
    `Sayfa ${pageNumber}/${totalPages}`,
  ]
    .filter(Boolean)
    .join(" | ");

  pdf.text(
    footer,
    pageWidth - 12,
    pageHeight - 5,
    {
      align: "right",
    }
  );
}

export async function exportReportSectionsToPdf(
  rootElement: HTMLElement,
  options: ReportPdfSectionOptions
) {
  const restore =
    hidePdfExcludedAndInteractive(
      rootElement
    );

  try {
    const sections =
      getVisibleTopLevelSections(
        rootElement
      );

    if (!sections.length) {
      throw new Error(
        "PDF rapor bölümü bulunamadı."
      );
    }

    const rendered: Array<{
      canvas: HTMLCanvasElement;
      title?: string;
      noSlice?: boolean;
    }> = [];

    for (const section of sections) {
      rendered.push({
        canvas:
          await renderSection(
            section.element
          ),
        title: section.title,
        noSlice: section.noSlice,
      });
    }

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

    const marginLeft = 12;
    const marginRight = 12;
    const marginTop = 14;
    const marginBottom = 13;

    const printableWidth =
      pageWidth -
      marginLeft -
      marginRight;

    const printableHeight =
      pageHeight -
      marginTop -
      marginBottom;

    let pageCreated = false;
    const pageTitles: Array<
      string | undefined
    > = [];

    for (const item of rendered) {
      const {
        canvas,
        title,
        noSlice,
      } = item;

      const sourcePixelsPerMm =
        canvas.width /
        printableWidth;

      const pageSliceHeightPx =
        Math.max(
          1,
          Math.floor(
            printableHeight *
            sourcePixelsPerMm
          )
        );

      if (noSlice) {
        if (pageCreated) {
          pdf.addPage(
            "a4",
            "landscape"
          );
        }

        pageCreated = true;

        const scale =
          Math.min(
            printableWidth /
              canvas.width,
            printableHeight /
              canvas.height
          );

        const drawWidth =
          canvas.width * scale;

        const drawHeight =
          canvas.height * scale;

        const x =
          marginLeft +
          (
            printableWidth -
            drawWidth
          ) /
          2;

        const y =
          marginTop +
          (
            printableHeight -
            drawHeight
          ) /
          2;

        pdf.addImage(
          canvas.toDataURL(
            "image/jpeg",
            0.94
          ),
          "JPEG",
          x,
          y,
          drawWidth,
          drawHeight,
          undefined,
          "FAST"
        );

        pageTitles.push(title);
        continue;
      }

      let sourceY = 0;

      while (
        sourceY <
        canvas.height
      ) {
        const remaining =
          canvas.height -
          sourceY;

        const sliceHeight =
          Math.min(
            pageSliceHeightPx,
            remaining
          );

        const slice =
          createCanvasSlice(
            canvas,
            sourceY,
            sliceHeight
          );

        if (pageCreated) {
          pdf.addPage(
            "a4",
            "landscape"
          );
        }

        pageCreated = true;

        const drawHeight =
          slice.height /
          sourcePixelsPerMm;

        pdf.addImage(
          slice.toDataURL(
            "image/jpeg",
            0.94
          ),
          "JPEG",
          marginLeft,
          marginTop,
          printableWidth,
          drawHeight,
          undefined,
          "FAST"
        );

        pageTitles.push(title);
        sourceY += sliceHeight;
      }
    }

    const totalPages =
      pdf.getNumberOfPages();

    for (
      let pageNumber = 1;
      pageNumber <= totalPages;
      pageNumber++
    ) {
      pdf.setPage(pageNumber);

      addHeaderAndFooter(
        pdf,
        pageNumber,
        totalPages,
        options,
        pageTitles[
          pageNumber - 1
        ]
      );
    }

    const safeFilename =
      String(
        options.filename ||
        "dsec-rapor"
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
        );

    pdf.save(
      safeFilename
        .toLocaleLowerCase(
          "tr-TR"
        )
        .endsWith(".pdf")
        ? safeFilename
        : `${safeFilename}.pdf`
    );
  } finally {
    restore();
  }
}