"use client";

import { ArrowLeft, Download, Eye } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { FormTemplateRecord } from "./types";

type Props = {
  record: FormTemplateRecord;
  children: ReactNode;
  formId: string;
  badge: string;
  description: string;
  mode?: string;
};

function fileTitle(record: FormTemplateRecord): string {
  return record.title
    .replace(/[^\\p{L}\\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "");
}

export default function FormTemplateLayout({
  record,
  children,
  formId,
  badge,
  description,
  mode = "",
}: Props) {
  const router = useRouter();

  const previewOnly =
    mode === "preview" ||
    mode === "download";

  const printForm = () => {
    const source =
      document.getElementById(formId);

    if (!source) {
      return;
    }

    const title =
      fileTitle(record);

    const formHtml =
      source.innerHTML;

    /*
     * Görünür ikinci pencere açmıyoruz.
     * Formu görünmeyen bir iframe içine taşıyıp
     * yalnızca tarayıcının yazdır/PDF ekranını açıyoruz.
     */
    const iframe =
      document.createElement("iframe");

    iframe.setAttribute(
      "aria-hidden",
      "true"
    );

    iframe.style.position =
      "fixed";
    iframe.style.right =
      "0";
    iframe.style.bottom =
      "0";
    iframe.style.width =
      "0";
    iframe.style.height =
      "0";
    iframe.style.border =
      "0";
    iframe.style.opacity =
      "0";
    iframe.style.pointerEvents =
      "none";

    document.body.appendChild(
      iframe
    );

    const printDocument =
      iframe.contentDocument ||
      iframe.contentWindow?.document;

    if (!printDocument) {
      iframe.remove();
      return;
    }

    printDocument.open();

    printDocument.write(`
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  />
  <title>${title}</title>

  <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111111;
    }

    body {
      font-family:
        "Times New Roman",
        Times,
        serif;
    }

    .printRoot {
      width: 100%;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    .standardPaper {
      width: 100%;
      min-height: 0;
      height: auto;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111111;
      box-shadow: none;
      font-family:
        "Times New Roman",
        Times,
        serif;
      font-size: 8.4pt;
    }

    .formTitle {
      margin: 0 0 5px;
      text-align: center;
      font-size: 13.5pt;
      line-height: 1.08;
      font-weight: 700;
    }

    .formSubTitle {
      margin: -2px 0 6px;
      text-align: center;
      font-size: 8pt;
      line-height: 1.1;
    }

    .formTable {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin: 0 0 4px;
    }

    .formTable th,
    .formTable td {
      border: 1px solid #222222;
      padding: 2.5px 4px;
      vertical-align: middle;
      height: 21px;
      line-height: 1.08;
      overflow-wrap: anywhere;
    }

    .formTable th {
      background: #f1f5f9;
      font-weight: 700;
      text-align: left;
    }

    .sectionTitle {
      background: #e2e8f0 !important;
      text-align: center !important;
      font-size: 9pt;
      font-weight: 700;
    }

    .labelCell {
      width: 27%;
      font-weight: 700;
    }

    .blankCell {
      height: 25px !important;
    }

    .largeBlank {
      height: 38px !important;
    }

    .xLargeBlank {
      height: 52px !important;
    }

    .center {
      text-align: center !important;
    }

    .check {
      font-family:
        Arial,
        Helvetica,
        sans-serif;
      font-size: 7.7pt;
      white-space: normal;
    }

    .signatureBox {
      height: 46px !important;
      vertical-align: top !important;
    }

    .smallText {
      font-size: 7.5pt;
      line-height: 1.25;
    }

    .footerNote {
      margin: 3px 0 0;
      font-size: 7pt;
      line-height: 1.2;
    }

    .formTable tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    @page {
      size: A4 portrait;
      margin: 6mm;
    }

    @media print {
      html,
      body {
        width: auto !important;
        height: auto !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
      }

      .printRoot,
      .standardPaper {
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        box-shadow: none !important;
      }

      .standardPaper {
        break-after: auto !important;
        page-break-after: auto !important;
      }
    }
  </style>
</head>

<body>
  <main class="printRoot">
    ${formHtml}
  </main>
</body>
</html>
    `);

    printDocument.close();

    const cleanup = () => {
      window.setTimeout(() => {
        iframe.remove();
      }, 500);
    };

    const runPrint = () => {
      const frameWindow =
        iframe.contentWindow;

      if (!frameWindow) {
        cleanup();
        return;
      }

      frameWindow.focus();
      frameWindow.print();
      cleanup();
    };

    /*
     * iframe içeriği hazır olduktan sonra
     * yalnızca sistem yazdırma/PDF penceresi açılır.
     */
    if (
      printDocument.readyState ===
      "complete"
    ) {
      window.setTimeout(
        runPrint,
        120
      );
    } else {
      iframe.onload = () => {
        window.setTimeout(
          runPrint,
          120
        );
      };
    }
  };

  useEffect(() => {
    if (mode !== "download") {
      return;
    }

    const timer =
      window.setTimeout(
        printForm,
        500
      );

    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    record.id,
    formId,
  ]);

  return (
    <main className="templatePage">
      <div className="templateToolbar noPrint">
        <button
          type="button"
          className="secondaryButton"
          onClick={() =>
            router.push(
              "/admin/documentation/form-templates"
            )
          }
        >
          <ArrowLeft size={17} />
          Form Şablonları
        </button>

        <div className="toolbarActions">
          <button
            type="button"
            className="secondaryButton"
            onClick={() =>
              document
                .getElementById(
                  formId
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
            }
          >
            <Eye size={17} />
            Görüntüle
          </button>

          <button
            type="button"
            className="primaryButton"
            onClick={printForm}
          >
            <Download size={17} />
            Boş Formu İndir
          </button>
        </div>
      </div>

      {!previewOnly ? (
        <section className="templateIntro noPrint">
          <div>
            <span className="introBadge">
              {badge}
            </span>

            <h1>
              {record.title}
            </h1>

            <p>
              {description}
            </p>
          </div>

          <div className="introMeta">
            <span>
              {record.template_code}
            </span>

            <span>
              v{record.version_no}
            </span>

            <span>
              Rev. {record.revision_no}
            </span>
          </div>
        </section>
      ) : null}

      <section
        id={formId}
        className="formCanvas"
      >
        {children}
      </section>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        .templatePage {
          min-height: 100vh;
          width: 100%;
          padding: 18px;
          overflow-x: hidden;
          background:
            linear-gradient(
              180deg,
              #f8fafc 0%,
              #eef2f7 100%
            );
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .templateToolbar {
          display: flex;
          flex-wrap: wrap;
          justify-content:
            space-between;
          gap: 10px;
          margin-bottom: 15px;
        }

        .toolbarActions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .primaryButton,
        .secondaryButton {
          min-height: 42px;
          border-radius: 11px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          cursor: pointer;
        }

        .primaryButton {
          border: 0;
          background: #6b1020;
          color: #ffffff;
        }

        .secondaryButton {
          border: 1px solid #dbe3ec;
          background: #ffffff;
          color: #475569;
        }

        .templateIntro {
          padding: 22px;
          margin-bottom: 16px;
          border-radius: 22px;
          color: #ffffff;
          background:
            linear-gradient(
              135deg,
              #4c0d1a 0%,
              #9f1239 52%,
              #ea580c 100%
            );
          display: flex;
          flex-wrap: wrap;
          justify-content:
            space-between;
          gap: 18px;
        }

        .templateIntro h1 {
          margin: 14px 0 7px;
          font-size:
            clamp(
              25px,
              3vw,
              38px
            );
          line-height: 1.08;
        }

        .templateIntro p {
          max-width: 820px;
          margin: 0;
          color:
            rgba(
              255,
              255,
              255,
              0.86
            );
          line-height: 1.6;
        }

        .introBadge,
        .introMeta span {
          display: inline-flex;
          border-radius: 999px;
          background:
            rgba(
              255,
              255,
              255,
              0.14
            );
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 900;
        }

        .introMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          align-content: flex-start;
        }

        .formCanvas {
          width: 100%;
          overflow-x: auto;
          padding: 18px;
          border: 1px solid #cbd5e1;
          border-radius: 18px;
          background: #d7dce2;
        }

        .standardPaper {
          width: 210mm;
          min-height: 296mm;
          margin: 0 auto;
          padding: 11mm 10mm;
          background: #ffffff;
          color: #111111;
          box-shadow:
            0 18px 48px
            rgba(
              15,
              23,
              42,
              0.2
            );
          font-family:
            "Times New Roman",
            Times,
            serif;
          font-size: 10pt;
        }

        .formTitle {
          margin: 0 0 8px;
          text-align: center;
          font-size: 16pt;
          font-weight: 700;
        }

        .formSubTitle {
          margin: -3px 0 12px;
          text-align: center;
          font-size: 9pt;
        }

        .formTable {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          margin: 0 0 8px;
        }

        .formTable th,
        .formTable td {
          border: 1px solid #222222;
          padding: 5px 6px;
          vertical-align: middle;
          height: 27px;
        }

        .formTable th {
          background: #f1f5f9;
          font-weight: 700;
          text-align: left;
        }

        .sectionTitle {
          background:
            #e2e8f0 !important;
          text-align:
            center !important;
          font-size: 10.5pt;
        }

        .labelCell {
          width: 27%;
          font-weight: 700;
        }

        .blankCell {
          height: 35px;
        }

        .largeBlank {
          height: 72px !important;
        }

        .xLargeBlank {
          height: 110px !important;
        }

        .center {
          text-align:
            center !important;
        }

        .check {
          font-family:
            Arial,
            sans-serif;
          white-space: normal;
        }

        .signatureBox {
          height: 75px !important;
          vertical-align:
            top !important;
        }

        .smallText {
          font-size: 8.5pt;
          line-height: 1.35;
        }

        .footerNote {
          margin-top: 8px;
          font-size: 8pt;
          line-height: 1.35;
        }

        @media (max-width: 850px) {
          .templatePage {
            padding: 10px;
          }

          .formCanvas {
            padding: 8px;
          }
        }
      `}</style>
    </main>
  );
}