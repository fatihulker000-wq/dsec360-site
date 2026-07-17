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
  orientation: "portrait" | "landscape";
};

function visibleChildren(
  element: HTMLElement
): HTMLElement[] {
  return Array.from(element.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      child.dataset.pdfExclude !== "true" &&
      child.offsetWidth > 0 &&
      child.offsetHeight > 0
  );
}

function splitSmartSection(
  element: HTMLElement,
  inheritedTitle?: string
): PdfSection[] {
  const title =
    element.dataset.pdfTitle ||
    inheritedTitle;

  const children =
    visibleChildren(element);

  const shouldSplit =
    element.dataset.pdfSmartSplit ===
      "true" &&
    children.length > 0;

  if (!shouldSplit) {
    return [
      {
        element,
        title,
        orientation:
          element.dataset.pdfWide ===
          "true"
            ? "landscape"
            : detectOrientation(element),
      },
    ];
  }

  return children.flatMap((child) => {
    const nestedChildren =
      visibleChildren(child);

    const childIsLarge =
      child.scrollHeight >
      child.scrollWidth * 1.15;

    if (
      nestedChildren.length > 1 &&
      childIsLarge
    ) {
      return splitSmartSection(
        child,
        title
      );
    }

    return [
      {
        element: child,
        title,
        orientation:
          child.dataset.pdfWide ===
          "true"
            ? "landscape"
            : detectOrientation(child),
      },
    ];
  });
}

function detectOrientation(
  element: HTMLElement
): "portrait" | "landscape" {
  const width =
    Math.max(
      element.scrollWidth,
      element.offsetWidth
    );

  const height =
    Math.max(
      element.scrollHeight,
      element.offsetHeight
    );

  return width / Math.max(height, 1) >
    1.15
    ? "landscape"
    : "portrait";
}

function collectSections(
  rootElement: HTMLElement
): PdfSection[] {
  const topLevel =
    visibleChildren(rootElement);

  const coverElements =
    topLevel.filter(
      (element) =>
        element.dataset.pdfCover ===
        "true"
    );

  const normalElements =
    topLevel.filter(
      (element) =>
        element.dataset.pdfCover !==
        "true"
    );

  return [
    ...coverElements,
    ...normalElements,
  ].flatMap((element) =>
    splitSmartSection(element)
  );
}

function temporarilyHideInteractiveElements(
  rootElement: HTMLElement
): () => void {
  const selectors = [
    "button",
    "input",
    "select",
    "textarea",
    '[data-pdf-exclude="true"]',
  ];

  const elements =
    Array.from(
      rootElement.querySelectorAll<HTMLElement>(
        selectors.join(",")
      )
    );

  const previous =
    elements.map((element) => ({
      element,
      display:
        element.style.display,
    }));

  elements.forEach((element) => {
    element.style.display = "none";
  });

  return () => {
    previous.forEach(
      ({ element, display }) => {
        element.style.display =
          display;
      }
    );
  };
}

async function renderElement(
  element: HTMLElement
) {
  const originalWidth =
    element.style.width;

  const originalMaxWidth =
    element.style.maxWidth;

  const originalTransform =
    element.style.transform;

  const originalTransformOrigin =
    element.style.transformOrigin;

  element.style.width =
    `${Math.max(
      element.scrollWidth,
      element.offsetWidth
    )}px`;

  element.style.maxWidth = "none";
  element.style.transform = "none";
  element.style.transformOrigin =
    "top left";

  try {
    return await html2canvas(
      element,
      {
        scale: 1.65,
        backgroundColor:
          "#ffffff",
        useCORS: true,
        allowTaint: false,
        logging: false,
        removeContainer: true,
        windowWidth:
          Math.max(
            element.scrollWidth,
            element.offsetWidth
          ),
        windowHeight:
          Math.max(
            element.scrollHeight,
            element.offsetHeight
          ),
      }
    );
  } finally {
    element.style.width =
      originalWidth;

    element.style.maxWidth =
      originalMaxWidth;

    element.style.transform =
      originalTransform;

    element.style.transformOrigin =
      originalTransformOrigin;
  }
}

export async function exportReportSectionsToPdf(
  rootElement: HTMLElement,
  options: ReportPdfSectionOptions
) {
  const restoreInteractive =
    temporarilyHideInteractiveElements(
      rootElement
    );

  try {
    const sections =
      collectSections(rootElement);

    if (!sections.length) {
      throw new Error(
        "PDF için rapor bölümü bulunamadı."
      );
    }

    let pdf: jsPDF | null = null;

    for (
      let index = 0;
      index < sections.length;
      index++
    ) {
      const section =
        sections[index];

      const canvas =
        await renderElement(
          section.element
        );

      const orientation =
        section.orientation;

      if (!pdf) {
        pdf = new jsPDF({
          orientation,
          unit: "mm",
          format: "a4",
          compress: true,
        });
      } else {
        pdf.addPage(
          "a4",
          orientation
        );
      }

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const marginLeft = 12;
      const marginRight = 12;
      const marginTop = 18;
      const marginBottom = 14;

      const printableWidth =
        pageWidth -
        marginLeft -
        marginRight;

      const printableHeight =
        pageHeight -
        marginTop -
        marginBottom;

      const widthRatio =
        printableWidth /
        canvas.width;

      const heightRatio =
        printableHeight /
        canvas.height;

      const scale =
        Math.min(
          widthRatio,
          heightRatio
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

      const imageData =
        canvas.toDataURL(
          "image/jpeg",
          0.93
        );

      pdf.addImage(
        imageData,
        "JPEG",
        x,
        y,
        drawWidth,
        drawHeight,
        undefined,
        "FAST"
      );

      if (section.title) {
        pdf.setFontSize(8);
        pdf.setTextColor(
          90,
          98,
          110
        );

        pdf.text(
          section.title,
          marginLeft,
          11
        );
      }
    }

    if (!pdf) {
      throw new Error(
        "PDF oluşturulamadı."
      );
    }

    const totalPages =
      pdf.getNumberOfPages();

    for (
      let pageNumber = 1;
      pageNumber <= totalPages;
      pageNumber++
    ) {
      pdf.setPage(pageNumber);

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      pdf.setFontSize(7.5);
      pdf.setTextColor(
        80,
        88,
        100
      );

      pdf.text(
        options.reportTitle ||
          "D-SEC Kurumsal ISG Yönetim Raporu",
        12,
        8
      );

      const footerParts = [
        options.reportNo
          ? `Rapor No: ${options.reportNo}`
          : "",
        options.verificationCode
          ? `Dogrulama: ${options.verificationCode}`
          : "",
        `Sayfa ${pageNumber}/${totalPages}`,
      ].filter(Boolean);

      pdf.text(
        footerParts.join(" | "),
        pageWidth - 12,
        pageHeight - 5,
        {
          align: "right",
        }
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
    restoreInteractive();
  }
}